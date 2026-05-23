#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { request as httpsRequest } from 'node:https';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const PRIMARY_MODEL = 'gpt-5.4-mini';
const ARBITRATION_MODEL = 'gpt-5.4';
const ARBITRATE_LIVE_CASES = new Set(['lp-routing-003', 'lp-protocol-review-001']);

const liveAdjudicationSchema = z.object({
  blindId: z.string().min(1),
  finalDivergenceType: z.enum(['label_mismatch', 'acceptable_bounded_divergence', 'substantive_miss', 'unresolved_arbitration_needed']),
  finalStatus: z.enum(['pass', 'review', 'fail']),
  substantiveFailure: z.boolean(),
  scores: z.object({
    substantiveFailureDetection: z.number().min(0).max(1),
    escalationCorrectness: z.number().min(0).max(1),
    claimBoundaryObedience: z.number().min(0).max(1),
    traceLegibility: z.number().min(0).max(1),
  }),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  uncertaintyNotes: z.array(z.string()),
});

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function asText(value, fallback) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && value.length) return value.map((item) => String(item)).join('; ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return fallback;
}

function normalizeStatus(value) {
  const raw = String(value ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'pass' || raw === 'passed') return 'pass';
  if (raw === 'review' || raw === 'needs_review' || raw === 'requires_review' || raw === 'uncertain') return 'review';
  if (raw === 'fail' || raw === 'failed' || raw === 'substantive_miss') return 'fail';
  if (raw.includes('fail')) return 'fail';
  if (raw.includes('review') || raw.includes('uncertain') || raw.includes('partial') || raw.includes('mixed') || raw.includes('revision')) return 'review';
  if (raw.includes('pass')) return 'pass';
  return 'review';
}

function normalizeConfidence(parsed) {
  const value = parsed.confidence ?? parsed.adjudicationConfidence ?? parsed.adjudication_confidence ?? parsed.scoreConfidence ?? parsed.score_confidence;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(1, value));
  const scores = parsed.scores && typeof parsed.scores === 'object' ? Object.values(parsed.scores).filter((score) => typeof score === 'number') : [];
  if (scores.length) return Number(Math.max(0.5, Math.min(0.85, scores.reduce((sum, score) => sum + score, 0) / scores.length)).toFixed(2));
  return 0.5;
}

function scoreValue(rawScores, camel, snake, fallback) {
  const value = rawScores?.[camel] ?? rawScores?.[snake];
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function normalizeScores(parsed, finalStatus) {
  const rawScores = parsed.scores ?? parsed.dimensionScores ?? parsed.dimension_scores ?? parsed.scoreBreakdown ?? parsed.score_breakdown ?? {};
  const fallback = finalStatus === 'pass' ? 0.8 : finalStatus === 'fail' ? 0.35 : 0.5;
  return {
    substantiveFailureDetection: scoreValue(rawScores, 'substantiveFailureDetection', 'substantive_failure_detection', fallback),
    escalationCorrectness: scoreValue(rawScores, 'escalationCorrectness', 'escalation_correctness', fallback),
    claimBoundaryObedience: scoreValue(rawScores, 'claimBoundaryObedience', 'claim_boundary_obedience', fallback),
    traceLegibility: scoreValue(rawScores, 'traceLegibility', 'trace_legibility', fallback),
  };
}

function normalizeDivergenceType(value) {
  const raw = String(value ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'label_mismatch' || raw === 'action_label_mismatch') return 'label_mismatch';
  if (raw === 'acceptable_bounded_divergence' || raw === 'bounded_divergence' || raw === 'acceptable_divergence') return 'acceptable_bounded_divergence';
  if (raw === 'substantive_miss' || raw === 'substantive_failure' || raw === 'true_miss') return 'substantive_miss';
  if (raw === 'unresolved_arbitration_needed' || raw === 'unresolved' || raw === 'needs_arbitration') return 'unresolved_arbitration_needed';
  return value;
}

function normalizeLiveAdjudication(parsed, promptPayload) {
  const finalStatus = normalizeStatus(parsed.finalStatus ?? parsed.final_status ?? parsed.status);
  return {
    blindId: parsed.blindId ?? parsed.blind_id ?? promptPayload.blindId,
    finalDivergenceType: normalizeDivergenceType(parsed.finalDivergenceType ?? parsed.final_divergence_type ?? parsed.divergenceType ?? parsed.divergence_type),
    finalStatus,
    substantiveFailure: Boolean(parsed.substantiveFailure ?? parsed.substantive_failure ?? parsed.isSubstantiveFailure ?? false),
    scores: normalizeScores(parsed, finalStatus),
    confidence: normalizeConfidence(parsed),
    rationale: asText(parsed.rationale ?? parsed.justification ?? parsed.reasoning ?? parsed.summary, 'No rationale field returned; raw judgment preserved.'),
    uncertaintyNotes: asArray(parsed.uncertaintyNotes ?? parsed.uncertainty_notes ?? parsed.uncertainties),
  };
}

function fallbackLiveAdjudication(promptPayload, parsed, error) {
  return {
    blindId: promptPayload.blindId,
    finalDivergenceType: 'unresolved_arbitration_needed',
    finalStatus: 'review',
    substantiveFailure: false,
    scores: normalizeScores(parsed ?? {}, 'review'),
    confidence: normalizeConfidence(parsed ?? {}),
    rationale: 'Schema normalization failed; raw judgment preserved and case marked unresolved.',
    uncertaintyNotes: [error instanceof Error ? error.message : String(error)],
  };
}

function parseArgs(argv) {
  const flags = {
    source: path.join('artifacts', 'evals', 'skills', 'live-provider', 'portability-summary.json'),
    pilot: path.join('artifacts', 'evals', 'skills', 'live-provider', 'pilot-summary.json'),
    out: path.join('artifacts', 'evals', 'skills', 'live-provider'),
    'max-budget-usd': '4',
    'dry-run': 'false',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }
  const maxBudgetUsd = Number(flags['max-budget-usd']);
  if (!Number.isFinite(maxBudgetUsd) || maxBudgetUsd <= 0) throw new Error('--max-budget-usd must be a positive number');
  return {
    sourcePath: path.resolve(repoRoot, flags.source),
    pilotPath: path.resolve(repoRoot, flags.pilot),
    outDir: path.resolve(repoRoot, flags.out),
    maxBudgetUsd,
    dryRun: flags['dry-run'] === 'true',
  };
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readJson(relativePath) {
  return readJsonFile(path.join(repoRoot, relativePath));
}

function envNumber(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function priceForModel(model) {
  if (model === 'gpt-5.4-mini') {
    return {
      inputUsdPerMillion: envNumber('ACP_GPT54_MINI_INPUT_USD_PER_1M', 3),
      outputUsdPerMillion: envNumber('ACP_GPT54_MINI_OUTPUT_USD_PER_1M', 12),
    };
  }
  if (model === 'gpt-5.4') {
    return {
      inputUsdPerMillion: envNumber('ACP_GPT54_INPUT_USD_PER_1M', 25),
      outputUsdPerMillion: envNumber('ACP_GPT54_OUTPUT_USD_PER_1M', 100),
    };
  }
  return {
    inputUsdPerMillion: envNumber('ACP_MODEL_INPUT_USD_PER_1M', 25),
    outputUsdPerMillion: envNumber('ACP_MODEL_OUTPUT_USD_PER_1M', 100),
  };
}

function estimateCostUsd(model, inputTokens, outputTokens) {
  const price = priceForModel(model);
  return Number(((inputTokens / 1_000_000) * price.inputUsdPerMillion + (outputTokens / 1_000_000) * price.outputUsdPerMillion).toFixed(6));
}

function estimateTokens(value) {
  return Math.ceil(JSON.stringify(value).length / 4);
}

function postJson(url, headers, body, timeoutMs) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = httpsRequest(
      url,
      {
        method: 'POST',
        headers: {
          ...headers,
          'content-type': 'application/json',
          'content-length': String(Buffer.byteLength(payload)),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), latencyMs: Date.now() - startedAt }));
      },
    );
    req.on('timeout', () => req.destroy(new Error(`OpenAI request timed out after ${timeoutMs}ms`)));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function extractText(payload) {
  if (payload.output_text) return payload.output_text;
  const content = payload.output?.flatMap((item) => item.content ?? []) ?? [];
  const textItem = content.find((item) => typeof item.text === 'string');
  return textItem?.text;
}

function stripJson(text) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
}

function blindIdFor(caseId) {
  return `live-blind-${createHash('sha256').update(caseId).digest('hex').slice(0, 12)}`;
}

function buildJudgeInput(caseItem, portabilityRow, pilotResult, blindId) {
  return {
    blindId,
    instruction: [
      'Adjudicate this live-provider review divergence without treating the previous rescoring as final.',
      'Baseline identity is not relevant; focus on output quality, escalation, claim boundary, and trace legibility.',
      'Return strict JSON only.',
    ],
    task: {
      id: caseItem.id,
      family: caseItem.family,
      caseType: caseItem.caseType,
      prompt: caseItem.task,
    },
    expected: {
      expectedDecision: caseItem.expectedDecision,
      expectedEscalation: caseItem.expectedEscalation,
      forbiddenClaims: caseItem.forbiddenClaims ?? [],
    },
    priorPortabilityAssessment: {
      divergenceType: portabilityRow.divergenceType,
      observedDecision: portabilityRow.observedDecision,
      observedEscalation: portabilityRow.observedEscalation,
      notes: portabilityRow.notes ?? [],
    },
    liveModelOutput: pilotResult.output,
    taxonomy: {
      label_mismatch: 'Action label differs, but escalation, claim boundary, and substantive failure detection are adequate.',
      acceptable_bounded_divergence: 'Action differs from expectation but remains bounded and safe for review.',
      substantive_miss: 'The output misses the failure mode, fails claim boundary, or wrongly releases a risky case.',
      unresolved_arbitration_needed: 'The adjudicator cannot decide confidently.',
    },
  };
}

function dryRunJudgment(blindId, row) {
  return {
    blindId,
    finalDivergenceType: row.divergenceType === 'acceptable_bounded_divergence' ? 'acceptable_bounded_divergence' : 'label_mismatch',
    finalStatus: 'review',
    substantiveFailure: false,
    scores: {
      substantiveFailureDetection: 0.84,
      escalationCorrectness: row.expectedEscalation === row.observedEscalation ? 0.9 : 0.45,
      claimBoundaryObedience: 0.9,
      traceLegibility: 0.85,
    },
    confidence: 0.78,
    rationale: 'Dry-run live divergence adjudication.',
    uncertaintyNotes: [],
  };
}

async function callOpenAi(apiKey, model, promptPayload) {
  const response = await postJson(
    new URL('https://api.openai.com/v1/responses'),
    { authorization: `Bearer ${apiKey}` },
    {
      model,
      input: [
        {
          role: 'system',
          content: 'Return one strict JSON object for ACP Skills V3 live-portability adjudication.',
        },
        {
          role: 'user',
          content: JSON.stringify(promptPayload),
        },
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 800,
    },
    30000,
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`OpenAI provider failed with HTTP ${response.status}`);
  }
  const payload = JSON.parse(response.body);
  const text = extractText(payload);
  if (!text) throw new Error('OpenAI provider returned no JSON text.');
  const parsed = JSON.parse(stripJson(text));
  const normalized = normalizeLiveAdjudication(parsed, promptPayload);
  const usage = payload.usage ?? {};
  const inputTokens = usage.input_tokens ?? estimateTokens(promptPayload);
  const outputTokens = usage.output_tokens ?? estimateTokens(parsed);
  let judgment;
  try {
    judgment = liveAdjudicationSchema.parse(normalized);
  } catch (error) {
    judgment = fallbackLiveAdjudication(promptPayload, parsed, error);
  }
  return {
    judgment,
    rawJudgment: parsed,
    usage: {
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCostUsd(model, inputTokens, outputTokens),
    },
    latencyMs: response.latencyMs,
  };
}

function emptyCosts(maxBudgetUsd, dryRun) {
  return {
    maxBudgetUsd,
    dryRun,
    actualEstimatedCostUsd: 0,
    projectedEstimatedCostUsd: 0,
    modelSplit: {},
  };
}

function addCost(costs, model, usage) {
  costs.actualEstimatedCostUsd = Number((costs.actualEstimatedCostUsd + usage.estimatedCostUsd).toFixed(6));
  costs.modelSplit[model] ??= { calls: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 };
  costs.modelSplit[model].calls += 1;
  costs.modelSplit[model].inputTokens += usage.inputTokens;
  costs.modelSplit[model].outputTokens += usage.outputTokens;
  costs.modelSplit[model].estimatedCostUsd = Number((costs.modelSplit[model].estimatedCostUsd + usage.estimatedCostUsd).toFixed(6));
}

function renderAdjudicationLog(summary) {
  const rows = summary.rows
    .map((row) => `| ${row.caseId} | ${row.priorDivergenceType} | ${row.finalDivergenceType} | ${row.finalStatus} | ${row.substantiveFailure} | ${row.arbitrationUsed} | ${row.confidence.toFixed(2)} | ${row.rationale.replace(/\|/g, '/')} |`)
    .join('\n');
  return `# ACP Skills V3 Live-Provider Adjudication Log

Generated: ${summary.generatedAt}

This log rejudges the live-provider review divergences with a separated surrogate adjudicator. It is not human review.

| Case | Prior divergence | Final divergence | Final status | Substantive miss | Arbitration used | Confidence | Rationale |
| --- | --- | --- | --- | --- | --- | ---: | --- |
${rows}
`;
}

function renderUncertaintyNotes(summary) {
  const uncertain = summary.rows.filter((row) => row.finalDivergenceType === 'unresolved_arbitration_needed' || row.confidence < 0.72 || row.finalStatus !== 'pass');
  return `# ACP Skills V3 Live-Provider Uncertainty Notes

- Review divergences adjudicated: ${summary.rows.length}
- Final label mismatches: ${summary.adjudicatedDivergenceCounts.label_mismatch ?? 0}
- Acceptable bounded divergences: ${summary.adjudicatedDivergenceCounts.acceptable_bounded_divergence ?? 0}
- Substantive misses: ${summary.adjudicatedDivergenceCounts.substantive_miss ?? 0}
- Unresolved / arbitration-needed: ${summary.adjudicatedDivergenceCounts.unresolved_arbitration_needed ?? 0}

## Case Notes

${uncertain.length ? uncertain.map((row) => `- ${row.caseId}: ${row.finalDivergenceType}, status ${row.finalStatus}, confidence ${row.confidence.toFixed(2)}; ${row.uncertaintyNotes.join('; ') || row.rationale}`).join('\n') : 'No unresolved live-provider adjudication cases.'}

## Boundary

This strengthens portability interpretation, but it is still surrogate adjudication rather than human operator review.
`;
}

function renderDivergenceTaxonomy(summary) {
  const rows = Object.entries(summary.divergenceCounts)
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join('\n');
  const adjudicatedRows = Object.entries(summary.adjudicatedDivergenceCounts ?? {})
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join('\n');
  return `# ACP Skills V3 Live-Provider Divergence Taxonomy

Generated: ${summary.generatedAt}

## Original Rescoring Counts

| Divergence type | Count |
| --- | ---: |
${rows}

## Surrogate-Adjudicated Review Counts

| Final divergence type | Count |
| --- | ---: |
${adjudicatedRows || '| none | 0 |'}

## Interpretation

The live-provider pilot remains portability evidence. The review divergences are now separately adjudicated, but they are not human-reviewed operator-utility evidence.
`;
}

async function main() {
  const { sourcePath, pilotPath, outDir, maxBudgetUsd, dryRun } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) throw new Error('OPENAI_API_KEY is required for live portability adjudication.');

  const [summary, pilot, cases] = await Promise.all([
    readJsonFile(sourcePath),
    readJsonFile(pilotPath),
    readJson('evals/skills/live-provider/pilot-cases.json'),
  ]);
  const casesById = new Map(cases.map((caseItem) => [caseItem.id, caseItem]));
  const pilotById = new Map((pilot.results ?? []).map((result) => [result.taskId, result]));
  const reviewRows = (summary.rows ?? []).filter((row) => row.portabilityStatus === 'review');
  const costs = emptyCosts(maxBudgetUsd, dryRun);
  const planned = reviewRows.map((row) => {
    const caseItem = casesById.get(row.caseId);
    const pilotResult = pilotById.get(row.caseId);
    const blindId = blindIdFor(row.caseId);
    const judgeInput = buildJudgeInput(caseItem, row, pilotResult, blindId);
    costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + estimateCostUsd(PRIMARY_MODEL, estimateTokens(judgeInput), 800)).toFixed(6));
    if (ARBITRATE_LIVE_CASES.has(row.caseId)) {
      costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + estimateCostUsd(ARBITRATION_MODEL, estimateTokens(judgeInput), 800)).toFixed(6));
    }
    return { row, caseItem, pilotResult, blindId, judgeInput };
  });
  if (costs.projectedEstimatedCostUsd > maxBudgetUsd) {
    throw new Error(`Projected live adjudication cost $${costs.projectedEstimatedCostUsd} exceeds cap $${maxBudgetUsd}.`);
  }

  const adjudicationDir = path.join(outDir, 'adjudication');
  await mkdir(adjudicationDir, { recursive: true });
  const rows = [];
  for (const item of planned) {
    const primary = dryRun
      ? {
        judgment: dryRunJudgment(item.blindId, item.row),
        usage: { inputTokens: estimateTokens(item.judgeInput), outputTokens: 160, estimatedCostUsd: estimateCostUsd(PRIMARY_MODEL, estimateTokens(item.judgeInput), 160) },
        latencyMs: 0,
      }
      : await callOpenAi(apiKey, PRIMARY_MODEL, item.judgeInput);
    addCost(costs, PRIMARY_MODEL, primary.usage);

    let arbitration = null;
    if (ARBITRATE_LIVE_CASES.has(item.row.caseId) || primary.judgment.confidence < 0.72) {
      const arbitrationInput = {
        ...item.judgeInput,
        primaryJudgment: primary.judgment,
        arbitrationReason: 'Live-provider review divergence with potential claim-boundary impact.',
      };
      arbitration = dryRun
        ? {
          judgment: { ...primary.judgment, confidence: Math.min(0.9, primary.judgment.confidence + 0.07), rationale: 'Dry-run live arbitration judgment.' },
          usage: { inputTokens: estimateTokens(arbitrationInput), outputTokens: 180, estimatedCostUsd: estimateCostUsd(ARBITRATION_MODEL, estimateTokens(arbitrationInput), 180) },
          latencyMs: 0,
        }
        : await callOpenAi(apiKey, ARBITRATION_MODEL, arbitrationInput);
      addCost(costs, ARBITRATION_MODEL, arbitration.usage);
    }
    const finalJudgment = arbitration?.judgment ?? primary.judgment;
    const adjudicated = {
      caseId: item.row.caseId,
      blindId: item.blindId,
      family: item.row.family,
      model: item.row.model,
      priorDivergenceType: item.row.divergenceType,
      finalDivergenceType: finalJudgment.finalDivergenceType,
      finalStatus: finalJudgment.finalStatus,
      substantiveFailure: finalJudgment.substantiveFailure,
      scores: finalJudgment.scores,
      confidence: finalJudgment.confidence,
      rationale: finalJudgment.rationale,
      uncertaintyNotes: finalJudgment.uncertaintyNotes ?? [],
      arbitrationUsed: Boolean(arbitration),
      primaryJudgment: primary.judgment,
      primaryRawJudgment: primary.rawJudgment ?? primary.judgment,
      arbitrationJudgment: arbitration?.judgment ?? null,
      arbitrationRawJudgment: arbitration?.rawJudgment ?? arbitration?.judgment ?? null,
    };
    rows.push(adjudicated);
    await writeFile(path.join(adjudicationDir, `${item.row.caseId}.json`), `${JSON.stringify(adjudicated, null, 2)}\n`, 'utf8');
  }

  const adjudicatedDivergenceCounts = {};
  for (const row of rows) adjudicatedDivergenceCounts[row.finalDivergenceType] = (adjudicatedDivergenceCounts[row.finalDivergenceType] ?? 0) + 1;
  const updated = {
    ...summary,
    generatedAt: new Date().toISOString(),
    surrogateAdjudication: {
      generatedAt: new Date().toISOString(),
      status: rows.some((row) => row.finalDivergenceType === 'substantive_miss') || rows.some((row) => row.finalStatus === 'review') ? 'review' : 'pass',
      method: 'separated surrogate adjudication of review divergences; not human review',
      primaryModel: PRIMARY_MODEL,
      arbitrationModel: ARBITRATION_MODEL,
      reviewCasesAdjudicated: rows.length,
      arbitrationUsed: rows.filter((row) => row.arbitrationUsed).length,
      costs,
      rows,
    },
    adjudicatedDivergenceCounts,
  };
  await writeFile(path.join(outDir, 'portability-summary.json'), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'adjudication-log.md'), renderAdjudicationLog(updated.surrogateAdjudication), 'utf8');
  await writeFile(path.join(outDir, 'uncertainty-notes.md'), renderUncertaintyNotes({ ...updated.surrogateAdjudication, adjudicatedDivergenceCounts }), 'utf8');
  await writeFile(path.join(outDir, 'divergence-taxonomy.md'), renderDivergenceTaxonomy(updated), 'utf8');
  process.stdout.write(`${JSON.stringify(updated.surrogateAdjudication, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
