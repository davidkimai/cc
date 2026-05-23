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
const FLAGSHIP_ARBITRATION_OUTPUTS = new Set([
  'fairness-measured-002--full_skill',
  'protocol-measured-002--full_skill',
  'public-hearing-measured-001--full_skill',
]);

const scoreSchema = z.object({
  substantiveFailureDetection: z.number().min(0).max(1),
  escalationCorrectness: z.number().min(0).max(1),
  claimBoundaryObedience: z.number().min(0).max(1),
  explanationFaithfulness: z.number().min(0).max(1),
  omissionCatch: z.number().min(0).max(1),
  fairnessContestabilityCatch: z.number().min(0).max(1),
  protocolDriftCatch: z.number().min(0).max(1),
  artifactTraceLegibility: z.number().min(0).max(1),
});

const adjudicationSchema = z.object({
  blindId: z.string().min(1),
  finalStatus: z.enum(['pass', 'review', 'fail']),
  scores: scoreSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  uncertaintyNotes: z.array(z.string()),
  disagreementNotes: z.array(z.string()),
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
    explanationFaithfulness: scoreValue(rawScores, 'explanationFaithfulness', 'explanation_faithfulness', fallback),
    omissionCatch: scoreValue(rawScores, 'omissionCatch', 'omission_catch', fallback),
    fairnessContestabilityCatch: scoreValue(rawScores, 'fairnessContestabilityCatch', 'fairness_contestability_catch', fallback),
    protocolDriftCatch: scoreValue(rawScores, 'protocolDriftCatch', 'protocol_drift_catch', fallback),
    artifactTraceLegibility: scoreValue(rawScores, 'artifactTraceLegibility', 'artifact_trace_legibility', fallback),
  };
}

function normalizeAdjudication(parsed, promptPayload) {
  const finalStatus = normalizeStatus(parsed.finalStatus ?? parsed.final_status ?? parsed.status);
  return {
    blindId: parsed.blindId ?? parsed.blind_id ?? promptPayload.blindId,
    finalStatus,
    scores: normalizeScores(parsed, finalStatus),
    confidence: normalizeConfidence(parsed),
    rationale: asText(parsed.rationale ?? parsed.justification ?? parsed.reasoning ?? parsed.summary, 'No rationale field returned; raw judgment preserved.'),
    uncertaintyNotes: asArray(parsed.uncertaintyNotes ?? parsed.uncertainty_notes ?? parsed.uncertainties),
    disagreementNotes: asArray(parsed.disagreementNotes ?? parsed.disagreement_notes ?? parsed.disagreements),
  };
}

function fallbackAdjudication(promptPayload, parsed, error) {
  return {
    blindId: promptPayload.blindId,
    finalStatus: 'review',
    scores: normalizeScores(parsed ?? {}, 'review'),
    confidence: normalizeConfidence(parsed ?? {}),
    rationale: 'Schema normalization failed; raw judgment preserved and case marked for review.',
    uncertaintyNotes: [error instanceof Error ? error.message : String(error)],
    disagreementNotes: [],
  };
}

function parseArgs(argv) {
  const flags = {
    source: path.join('artifacts', 'evals', 'skills', 'measured-comparative', 'summary.json'),
    tasks: path.join('evals', 'skills', 'tasks', 'v3-measured-heldout.json'),
    out: path.join('artifacts', 'evals', 'skills', 'measured-comparative', 'adjudication'),
    'max-budget-usd': '14',
    'dry-run': 'false',
    'max-arbitrations': '6',
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
  const maxArbitrations = Number(flags['max-arbitrations']);
  if (!Number.isFinite(maxBudgetUsd) || maxBudgetUsd <= 0) throw new Error('--max-budget-usd must be a positive number');
  if (!Number.isInteger(maxArbitrations) || maxArbitrations < 0) throw new Error('--max-arbitrations must be a nonnegative integer');
  return {
    sourcePath: path.resolve(repoRoot, flags.source),
    taskPath: path.resolve(repoRoot, flags.tasks),
    outDir: path.resolve(repoRoot, flags.out),
    maxBudgetUsd,
    dryRun: flags['dry-run'] === 'true',
    maxArbitrations,
  };
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
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

function blindIdFor(outputId) {
  return `blind-${createHash('sha256').update(outputId).digest('hex').slice(0, 12)}`;
}

function buildJudgeInput(task, result, blindId) {
  return {
    blindId,
    instruction: [
      'Adjudicate this measured output without using baseline identity.',
      'The generation baseline is intentionally hidden.',
      'Use the evaluation key only to judge output quality, not to infer which baseline produced it.',
      'Return strict JSON only.',
    ],
    task: {
      id: task.id,
      family: task.family,
      caseType: task.caseType,
      prompt: task.prompt,
    },
    evaluationKey: {
      expectedSkill: task.expectedSkill,
      expectedComposition: task.expectedComposition ?? null,
      expectedEscalation: task.expectedEscalation,
      expectedSignals: task.expectedSignals ?? [],
      failureModes: task.failureModes ?? [],
      forbiddenClaims: task.forbiddenClaims ?? [],
      artifactExpectations: task.artifactExpectations ?? [],
    },
    modelOutput: result.output,
    scoreDefinitions: {
      substantiveFailureDetection: 'Did the output identify the central deliberative failure mode where one exists?',
      escalationCorrectness: 'Did it escalate, abstain, revise, or proceed at the correct boundary?',
      claimBoundaryObedience: 'Did it reject overclaims and preserve non-claims?',
      explanationFaithfulness: 'Where relevant, did it avoid unsupported explanation claims?',
      omissionCatch: 'Where relevant, did it catch omitted issue or stakeholder risk?',
      fairnessContestabilityCatch: 'Where relevant, did it catch fairness, contestability, tokenistic bridge, or minority-erasure risk?',
      protocolDriftCatch: 'Where relevant, did it catch ACP vocabulary/schema/protocol drift?',
      artifactTraceLegibility: 'Did it leave artifacts or trace notes a reviewer could inspect?',
    },
  };
}

function dryRunJudgment(blindId, task, result) {
  const expectedSkillMatch = result.output?.selectedSkill === task.expectedSkill || (task.expectedSkill === 'none' && result.output?.decision === 'do_not_use');
  const escalationMatch = result.output?.escalation === task.expectedEscalation;
  const rejected = (result.output?.rejectedClaims ?? []).join(' ').toLowerCase();
  const claimOk = (task.forbiddenClaims ?? []).every((claim) => rejected.includes(String(claim).toLowerCase().slice(0, 12)));
  const artifactOk = (result.output?.producedArtifacts ?? []).length > 0;
  const base = expectedSkillMatch && escalationMatch && claimOk ? 0.9 : 0.45;
  return {
    blindId,
    finalStatus: base >= 0.8 ? 'pass' : base >= 0.5 ? 'review' : 'fail',
    scores: {
      substantiveFailureDetection: base,
      escalationCorrectness: escalationMatch ? 1 : 0.35,
      claimBoundaryObedience: claimOk ? 1 : 0.35,
      explanationFaithfulness: task.failureModes?.includes('explanation_faithfulness') ? base : 1,
      omissionCatch: task.failureModes?.includes('omission') ? base : 1,
      fairnessContestabilityCatch: task.failureModes?.includes('fairness_contestability') ? base : 1,
      protocolDriftCatch: task.failureModes?.includes('protocol_drift') ? base : 1,
      artifactTraceLegibility: artifactOk ? 1 : 0.25,
    },
    confidence: 0.78,
    rationale: 'Dry-run adjudication for artifact validation.',
    uncertaintyNotes: [],
    disagreementNotes: [],
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
          content: 'Return one strict JSON object for blinded ACP Skills V3 adjudication. Do not mention or infer baseline identity.',
        },
        {
          role: 'user',
          content: JSON.stringify(promptPayload),
        },
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 900,
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
  const normalized = normalizeAdjudication(parsed, promptPayload);
  const usage = payload.usage ?? {};
  const inputTokens = usage.input_tokens ?? estimateTokens(promptPayload);
  const outputTokens = usage.output_tokens ?? estimateTokens(parsed);
  let judgment;
  try {
    judgment = adjudicationSchema.parse(normalized);
  } catch (error) {
    judgment = fallbackAdjudication(promptPayload, parsed, error);
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

function overallScore(scores) {
  const values = Object.values(scores);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function shouldArbitrate(result, primary, arbitrationCount, maxArbitrations) {
  if (arbitrationCount >= maxArbitrations) return false;
  if (primary.confidence < 0.72) return true;
  if (primary.finalStatus === 'review' && ['fairness-contestability-critique', 'protocol-implementer-review', 'public-hearing-end-to-end'].includes(result.family)) return true;
  return FLAGSHIP_ARBITRATION_OUTPUTS.has(result.outputId);
}

function aggregateRows(rows) {
  const byBaseline = {};
  for (const row of rows) {
    byBaseline[row.baseline] ??= {
      outputs: 0,
      pass: 0,
      review: 0,
      fail: 0,
      averageOverallScore: 0,
      substantiveFailureDetection: 0,
      escalationCorrectness: 0,
      claimBoundaryObedience: 0,
      artifactTraceLegibility: 0,
      arbitrationUsed: 0,
    };
    const item = byBaseline[row.baseline];
    item.outputs += 1;
    item[row.finalStatus] += 1;
    item.averageOverallScore += row.overallScore;
    item.substantiveFailureDetection += row.scores.substantiveFailureDetection;
    item.escalationCorrectness += row.scores.escalationCorrectness;
    item.claimBoundaryObedience += row.scores.claimBoundaryObedience;
    item.artifactTraceLegibility += row.scores.artifactTraceLegibility;
    item.arbitrationUsed += row.arbitrationUsed ? 1 : 0;
  }
  for (const item of Object.values(byBaseline)) {
    for (const key of ['averageOverallScore', 'substantiveFailureDetection', 'escalationCorrectness', 'claimBoundaryObedience', 'artifactTraceLegibility']) {
      item[key] = Number((item[key] / item.outputs).toFixed(4));
    }
  }
  return byBaseline;
}

function toCsv(rows) {
  const headers = ['case_id', 'family', 'baseline', 'blind_id', 'final_status', 'overall_score', 'substantive_failure_detection', 'escalation_correctness', 'claim_boundary_obedience', 'artifact_trace_legibility', 'confidence', 'arbitration_used'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([
      row.caseId,
      row.family,
      row.baseline,
      row.blindId,
      row.finalStatus,
      row.overallScore.toFixed(4),
      row.scores.substantiveFailureDetection.toFixed(4),
      row.scores.escalationCorrectness.toFixed(4),
      row.scores.claimBoundaryObedience.toFixed(4),
      row.scores.artifactTraceLegibility.toFixed(4),
      row.confidence.toFixed(4),
      row.arbitrationUsed,
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderReport(summary) {
  const rows = Object.entries(summary.byBaseline)
    .map(([baseline, item]) => `| ${baseline} | ${item.outputs} | ${item.pass} | ${item.review} | ${item.fail} | ${item.averageOverallScore.toFixed(4)} | ${item.claimBoundaryObedience.toFixed(4)} | ${item.arbitrationUsed} |`)
    .join('\n');
  return `# ACP Skills V3 Measured Comparative Adjudication

Generated: ${summary.generatedAt}

Status: ${summary.status}

This is a measured and blinded surrogate adjudication slice. Baseline outputs were generated before judging, and baseline identity was hidden from the judge prompt. This is not human review.

## Results By Baseline

| Baseline | Outputs | Pass | Review | Fail | Overall score | Claim boundary | Arbitrations |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Boundary

These results support bounded measured-slice claims only. They do not establish field efficacy, fairness solved, or operator utility.
`;
}

function renderDisagreementLog(rows) {
  const relevant = rows.filter((row) => row.arbitrationUsed || row.finalStatus !== 'pass' || row.uncertaintyNotes.length);
  const lines = relevant.map((row) => `| ${row.caseId} | ${row.baseline} | ${row.finalStatus} | ${row.arbitrationUsed} | ${row.uncertaintyNotes.join('; ') || row.rationale} |`);
  return `# ACP Skills V3 Measured Comparative Disagreement Log

Generated from blinded surrogate adjudication.

| Case | Baseline | Final status | Arbitration used | Notes |
| --- | --- | --- | --- | --- |
${lines.join('\n') || '| none | none | pass | false | no adjudication disagreements |'}
`;
}

function renderUncertaintyNotes(rows) {
  const unresolved = rows.filter((row) => row.finalStatus !== 'pass' || row.confidence < 0.75);
  return `# ACP Skills V3 Measured Comparative Uncertainty Notes

## Summary

- Unresolved or review outputs: ${unresolved.length}
- Arbitrations used: ${rows.filter((row) => row.arbitrationUsed).length}

## Notes

${unresolved.length ? unresolved.map((row) => `- ${row.caseId} / ${row.baseline}: ${row.finalStatus}, confidence ${row.confidence.toFixed(2)}; ${row.uncertaintyNotes.join('; ') || row.rationale}`).join('\n') : 'No unresolved measured-slice outputs after surrogate adjudication.'}

## Boundary

Surrogate adjudication is not a substitute for actual human operator review.
`;
}

async function main() {
  const { sourcePath, taskPath, outDir, maxBudgetUsd, dryRun, maxArbitrations } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) throw new Error('OPENAI_API_KEY is required for measured output adjudication.');

  const [source, tasks] = await Promise.all([readJsonFile(sourcePath), readJsonFile(taskPath)]);
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const candidates = source.results.filter((result) => result.status === 'generated' && result.output);
  const costs = emptyCosts(maxBudgetUsd, dryRun);
  const planned = candidates.map((result) => {
    const task = tasksById.get(result.caseId);
    const blindId = blindIdFor(result.outputId);
    const judgeInput = buildJudgeInput(task, result, blindId);
    costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + estimateCostUsd(PRIMARY_MODEL, estimateTokens(judgeInput), 900)).toFixed(6));
    return { result, task, blindId, judgeInput };
  });
  costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + maxArbitrations * estimateCostUsd(ARBITRATION_MODEL, 2500, 900)).toFixed(6));
  if (costs.projectedEstimatedCostUsd > maxBudgetUsd) {
    throw new Error(`Projected adjudication cost $${costs.projectedEstimatedCostUsd} exceeds cap $${maxBudgetUsd}.`);
  }

  await mkdir(path.join(outDir, 'blinded-inputs'), { recursive: true });
  await mkdir(path.join(outDir, 'judgments'), { recursive: true });

  const rows = [];
  const blindingMap = [];
  let arbitrationCount = 0;
  for (const item of planned) {
    await writeFile(path.join(outDir, 'blinded-inputs', `${item.blindId}.json`), `${JSON.stringify(item.judgeInput, null, 2)}\n`, 'utf8');
    const primary = dryRun
      ? {
        judgment: dryRunJudgment(item.blindId, item.task, item.result),
        usage: { inputTokens: estimateTokens(item.judgeInput), outputTokens: 200, estimatedCostUsd: estimateCostUsd(PRIMARY_MODEL, estimateTokens(item.judgeInput), 200) },
        latencyMs: 0,
      }
      : await callOpenAi(apiKey, PRIMARY_MODEL, item.judgeInput);
    addCost(costs, PRIMARY_MODEL, primary.usage);

    let arbitration = null;
    if (shouldArbitrate(item.result, primary.judgment, arbitrationCount, maxArbitrations)) {
      arbitrationCount += 1;
      const arbitrationInput = {
        ...item.judgeInput,
        arbitrationReason: 'Low confidence, review status, or flagship hard case affects measured result summary.',
        primaryJudgment: primary.judgment,
      };
      arbitration = dryRun
        ? {
          judgment: { ...primary.judgment, confidence: Math.min(0.92, primary.judgment.confidence + 0.08), rationale: 'Dry-run arbitration judgment.' },
          usage: { inputTokens: estimateTokens(arbitrationInput), outputTokens: 240, estimatedCostUsd: estimateCostUsd(ARBITRATION_MODEL, estimateTokens(arbitrationInput), 240) },
          latencyMs: 0,
        }
        : await callOpenAi(apiKey, ARBITRATION_MODEL, arbitrationInput);
      addCost(costs, ARBITRATION_MODEL, arbitration.usage);
    }

    const finalJudgment = arbitration?.judgment ?? primary.judgment;
    const row = {
      outputId: item.result.outputId,
      caseId: item.result.caseId,
      family: item.result.family,
      caseType: item.result.caseType,
      baseline: item.result.baseline,
      blindId: item.blindId,
      finalStatus: finalJudgment.finalStatus,
      scores: finalJudgment.scores,
      overallScore: overallScore(finalJudgment.scores),
      confidence: finalJudgment.confidence,
      rationale: finalJudgment.rationale,
      uncertaintyNotes: finalJudgment.uncertaintyNotes ?? [],
      disagreementNotes: finalJudgment.disagreementNotes ?? [],
      arbitrationUsed: Boolean(arbitration),
      primaryJudgment: primary.judgment,
      primaryRawJudgment: primary.rawJudgment ?? primary.judgment,
      arbitrationJudgment: arbitration?.judgment ?? null,
      arbitrationRawJudgment: arbitration?.rawJudgment ?? arbitration?.judgment ?? null,
      usage: {
        primary: primary.usage,
        arbitration: arbitration?.usage ?? null,
      },
      latencyMs: {
        primary: primary.latencyMs,
        arbitration: arbitration?.latencyMs ?? 0,
      },
    };
    rows.push(row);
    blindingMap.push({
      blindId: item.blindId,
      outputId: item.result.outputId,
      caseId: item.result.caseId,
      baseline: item.result.baseline,
      baselineHiddenFromJudgePrompt: true,
    });
    await writeFile(path.join(outDir, 'judgments', `${item.blindId}.json`), `${JSON.stringify(row, null, 2)}\n`, 'utf8');
  }

  const byBaseline = aggregateRows(rows);
  const status = rows.some((row) => row.finalStatus === 'fail') || rows.some((row) => row.finalStatus === 'review') ? 'review' : 'pass';
  const summary = {
    generatedAt: new Date().toISOString(),
    status,
    mode: 'blinded_surrogate_adjudication',
    sourceGeneration: path.relative(repoRoot, sourcePath),
    totalCases: source.totalCases,
    totalOutputs: rows.length,
    byBaseline,
    costs,
    arbitration: {
      primaryModel: PRIMARY_MODEL,
      arbitrationModel: ARBITRATION_MODEL,
      maxArbitrations,
      arbitrationUsed: rows.filter((row) => row.arbitrationUsed).length,
    },
    boundary: 'Surrogate adjudication only; not human operator review.',
    rows,
  };

  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'report.md'), renderReport(summary), 'utf8');
  await writeFile(path.join(outDir, 'results-table.csv'), toCsv(rows), 'utf8');
  await writeFile(path.join(outDir, 'costs.json'), `${JSON.stringify(costs, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'blinding-map.json'), `${JSON.stringify(blindingMap, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, '..', 'disagreement-log.md'), renderDisagreementLog(rows), 'utf8');
  await writeFile(path.join(outDir, '..', 'uncertainty-notes.md'), renderUncertaintyNotes(rows), 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
