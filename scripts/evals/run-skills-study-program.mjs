#!/usr/bin/env node
import { request as httpsRequest } from 'node:https';
import { mkdir, readFile, writeFile, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { materializeCondition } from '../../src/skills/materialize.ts';
import { conditionsForTask, deterministicConditionOrder } from '../../src/skills/conditions.ts';
import { evaluateAdherence } from '../../src/skills/adherence.ts';
import { blindOutputId } from '../../src/skills/blinding.ts';
import { makeTrace } from '../../src/skills/trace.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const PRIMARY_MODEL = 'gpt-5.4-mini';
const ARBITRATION_MODEL = 'gpt-5.4';
const ALL_CONDITIONS = ['no_skill', 'metadata_only', 'full_skill', 'composition'];
const PRIMARY_DVS = ['substantiveFailureDetection', 'escalationCorrectness', 'claimBoundaryObedience'];
const SCORE_KEYS = [
  'substantiveFailureDetection',
  'escalationCorrectness',
  'claimBoundaryObedience',
  'explanationFaithfulness',
  'omissionCatch',
  'fairnessContestabilityCatch',
  'protocolDriftCatch',
  'artifactTraceLegibility',
];

const generatedOutputSchema = z.object({
  taskId: z.string().min(1),
  decision: z.enum(['use_skill', 'do_not_use', 'escalate', 'abstain', 'package_evidence']),
  selectedSkill: z.string(),
  selectedComposition: z.string().nullable(),
  escalation: z.boolean(),
  detectedFailures: z.array(z.string()),
  rejectedClaims: z.array(z.string()),
  producedArtifacts: z.array(z.string()),
  rationale: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const scoreSchema = z.object(Object.fromEntries(SCORE_KEYS.map((key) => [key, z.number().min(0).max(1)])));

const adjudicationSchema = z.object({
  blindId: z.string().min(1),
  finalStatus: z.enum(['pass', 'review', 'fail']),
  scores: scoreSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  uncertaintyNotes: z.array(z.string()),
  disagreementNotes: z.array(z.string()),
});

function parseArgs(argv) {
  const [phase = 'all', ...rest] = argv;
  const flags = {
    'out-root': path.join('artifacts', 'evals', 'skills'),
    config: path.join('evals', 'skills', 'studies', 'v3-study-program.json'),
    model: PRIMARY_MODEL,
    'max-budget-usd': '18',
    'dry-run': 'false',
    'reuse-existing': 'false',
    'max-arbitrations': '18',
  };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = rest[index + 1] && !rest[index + 1].startsWith('--') ? rest[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }
  return {
    phase,
    outRoot: path.resolve(repoRoot, flags['out-root']),
    configPath: path.resolve(repoRoot, flags.config),
    model: flags.model,
    maxBudgetUsd: Number(flags['max-budget-usd']),
    maxArbitrations: Number(flags['max-arbitrations']),
    dryRun: flags['dry-run'] === 'true',
    reuseExisting: flags['reuse-existing'] === 'true',
  };
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJsonFile(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

async function callOpenAiJson(apiKey, model, system, promptPayload, maxOutputTokens) {
  const response = await postJson(
    new URL('https://api.openai.com/v1/responses'),
    { authorization: `Bearer ${apiKey}` },
    {
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(promptPayload) },
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: maxOutputTokens,
    },
    30000,
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`OpenAI provider failed with HTTP ${response.status}: ${response.body.slice(0, 240)}`);
  }
  const payload = JSON.parse(response.body);
  const text = extractText(payload);
  if (!text) throw new Error('OpenAI provider returned no JSON text.');
  const parsed = JSON.parse(stripJson(text));
  const usage = payload.usage ?? {};
  const inputTokens = usage.input_tokens ?? estimateTokens(promptPayload);
  const outputTokens = usage.output_tokens ?? estimateTokens(parsed);
  return {
    parsed,
    usage: {
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCostUsd(model, inputTokens, outputTokens),
    },
    latencyMs: response.latencyMs,
  };
}

async function loadStudyConfig(configPath) {
  return readJsonFile(configPath);
}

async function loadTaskPools(config) {
  const pools = new Map();
  const sourceFiles = new Set([...(config.studyA.sourceFiles ?? []), ...(config.studyD.sourceFiles ?? [])]);
  for (const relativePath of sourceFiles) {
    const tasks = await readJsonFile(path.join(repoRoot, relativePath));
    for (const task of tasks) pools.set(task.id, { ...task, sourceFile: relativePath });
  }
  return pools;
}

async function selectTasks(config, studyKey) {
  const pools = await loadTaskPools(config);
  return config[studyKey].caseIds.map((caseId) => {
    const task = pools.get(caseId);
    if (!task) throw new Error(`Missing study task ${caseId}`);
    return task;
  });
}

function buildGenerationPrompt(material) {
  return {
    role: 'ACP Skills V3 behavioral intervention generator',
    instruction: [
      'Generate the output for the assigned condition.',
      'Gold labels, expected skills, expected signals, and scoring keys are intentionally hidden.',
      'Return one strict JSON object only.',
      'Preserve uncertainty and reject overclaims explicitly when warranted.',
    ],
    outputSchema: {
      taskId: 'string',
      decision: 'use_skill | do_not_use | escalate | abstain | package_evidence',
      selectedSkill: 'string',
      selectedComposition: 'string or null',
      escalation: 'boolean',
      detectedFailures: 'string[]',
      rejectedClaims: 'string[]',
      producedArtifacts: 'string[]',
      rationale: 'string',
      confidence: 'number between 0 and 1',
    },
    input: material,
  };
}

function dryRunOutput(task, condition) {
  const expectedEscalation = Boolean(task.expectedEscalation);
  return {
    taskId: task.id,
    decision: condition === 'no_skill' ? 'package_evidence' : expectedEscalation ? 'escalate' : 'use_skill',
    selectedSkill: condition === 'no_skill' ? 'none' : task.expectedSkill === 'none' ? 'none' : task.expectedSkill,
    selectedComposition: condition === 'composition' ? task.expectedComposition : null,
    escalation: condition === 'no_skill' ? false : expectedEscalation,
    detectedFailures: condition === 'no_skill' ? [] : (task.failureModes ?? []),
    rejectedClaims: condition === 'no_skill' ? [] : (task.forbiddenClaims ?? []),
    producedArtifacts: condition === 'no_skill' ? ['brief_note'] : (task.artifactExpectations ?? ['trace']),
    rationale: `Dry-run output for ${condition}.`,
    confidence: condition === 'no_skill' ? 0.55 : 0.83,
  };
}

function generationConditions(task, requestedConditions, noSkillCaseIds = []) {
  const requested = [...requestedConditions];
  if (noSkillCaseIds.includes(task.id) && !requested.includes('no_skill')) requested.unshift('no_skill');
  return deterministicConditionOrder(task.id, conditionsForTask(task, requested));
}

async function runGenerationStudy({ studyName, design, tasks, outDir, requestedConditions, noSkillCaseIds = [], model, maxBudgetUsd, dryRun }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) throw new Error('OPENAI_API_KEY is required for live study generation.');
  const costs = emptyCosts(maxBudgetUsd, dryRun);
  const planned = [];
  const conditionOrderByCase = {};
  for (const task of tasks) {
    const orderedConditions = generationConditions(task, requestedConditions, noSkillCaseIds);
    conditionOrderByCase[task.id] = orderedConditions;
    for (const condition of orderedConditions) {
      const material = await materializeCondition(task, condition, repoRoot);
      const promptPayload = buildGenerationPrompt(material);
      costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + estimateCostUsd(model, estimateTokens(promptPayload), 900)).toFixed(6));
      planned.push({ task, condition, material, promptPayload });
    }
  }
  if (costs.projectedEstimatedCostUsd > maxBudgetUsd) {
    throw new Error(`Projected ${studyName} generation cost $${costs.projectedEstimatedCostUsd} exceeds cap $${maxBudgetUsd}.`);
  }

  const rawDir = path.join(outDir, 'raw-outputs');
  const traceDir = path.join(outDir, 'traces');
  await mkdir(rawDir, { recursive: true });
  await mkdir(traceDir, { recursive: true });

  const results = [];
  for (const item of planned) {
    const outputId = `${item.task.id}--${item.condition}`;
    const projectedInputTokens = estimateTokens(item.promptPayload);
    const fallbackUsage = {
      inputTokens: projectedInputTokens,
      outputTokens: dryRun ? estimateTokens(dryRunOutput(item.task, item.condition)) : 0,
      estimatedCostUsd: 0,
    };
    const failures = [];
    let parsedOutput = null;
    let rawOutput = null;
    let usage = fallbackUsage;
    let latencyMs = 0;
    try {
      const providerResult = dryRun
        ? {
          parsed: dryRunOutput(item.task, item.condition),
          usage: { ...fallbackUsage, estimatedCostUsd: estimateCostUsd(model, fallbackUsage.inputTokens, fallbackUsage.outputTokens) },
          latencyMs: 0,
        }
        : await callOpenAiJson(
          apiKey,
          model,
          'Return one strict JSON object for ACP Skills V3 behavioral study generation. No prose outside JSON.',
          item.promptPayload,
          900,
        );
      rawOutput = providerResult.parsed;
      parsedOutput = generatedOutputSchema.parse(providerResult.parsed);
      usage = providerResult.usage;
      latencyMs = providerResult.latencyMs;
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    addCost(costs, model, usage);
    const result = {
      outputId,
      caseId: item.task.id,
      family: item.task.family,
      caseType: item.task.caseType,
      assignedCondition: item.condition,
      model,
      status: failures.length ? 'fail' : 'generated',
      failures,
      usage,
      latencyMs,
      output: parsedOutput,
      rawOutputPath: path.join('raw-outputs', `${outputId}.json`),
    };
    results.push(result);
    const trace = makeTrace({
      study: studyName,
      caseId: item.task.id,
      condition: item.condition,
      model,
      latencyMs,
      usage,
      artifacts: parsedOutput?.producedArtifacts ?? [],
    });
    await writeJsonFile(path.join(rawDir, `${outputId}.json`), {
      generatedAt: new Date().toISOString(),
      outputId,
      studyName,
      assignedCondition: item.condition,
      generationPromptVisibleToModel: item.material,
      expectedLabelsHiddenFromGeneration: true,
      conditionOrderForCase: conditionOrderByCase[item.task.id],
      rawOutput,
      result,
    });
    await writeJsonFile(path.join(traceDir, `${outputId}.json`), trace);
  }

  const byCondition = aggregateByCondition(results, (row) => row.status === 'generated' ? 1 : 0);
  const summary = {
    generatedAt: new Date().toISOString(),
    status: results.some((result) => result.status === 'fail') ? 'review' : 'pass',
    studyName,
    design,
    provider: dryRun ? 'dry-run' : 'openai',
    model,
    totalCases: tasks.length,
    totalOutputs: results.length,
    generatedOutputs: results.filter((result) => result.status === 'generated').length,
    failedOutputs: results.filter((result) => result.status !== 'generated').length,
    familiesCovered: [...new Set(tasks.map((task) => task.family))].sort(),
    conditions: [...new Set(results.map((result) => result.assignedCondition))],
    conditionOrderByCase,
    byCondition,
    costs,
    boundary: 'Measured generation only. Comparative claims require blinded adjudication.',
    results,
  };
  const manifest = {
    generatedAt: summary.generatedAt,
    studyName,
    design,
    cases: tasks.map((task) => ({
      id: task.id,
      family: task.family,
      caseType: task.caseType,
      sourceFile: task.sourceFile,
      conditionOrder: conditionOrderByCase[task.id],
    })),
    primaryEndpoints: PRIMARY_DVS,
    secondaryEndpoints: SCORE_KEYS.filter((key) => !PRIMARY_DVS.includes(key)),
  };

  await writeJsonFile(path.join(outDir, 'generation-summary.json'), summary);
  await writeJsonFile(path.join(outDir, 'summary.json'), summary);
  await writeJsonFile(path.join(outDir, 'run-manifest.json'), manifest);
  await writeJsonFile(path.join(outDir, 'costs.json'), costs);
  await writeFile(path.join(outDir, 'generation-results.csv'), generationCsv(results), 'utf8');
  await writeFile(path.join(outDir, 'report.md'), renderGenerationReport(summary), 'utf8');
  return summary;
}

function aggregateByCondition(rows, scoreFn) {
  const byCondition = {};
  for (const row of rows) {
    const condition = row.assignedCondition ?? row.condition;
    byCondition[condition] ??= { outputs: 0, generated: 0, failed: 0, mean: 0, estimatedCostUsd: 0, averageLatencyMs: 0 };
    const item = byCondition[condition];
    item.outputs += 1;
    if (row.status === 'generated' || row.finalStatus) item.generated += 1;
    if (row.status === 'fail') item.failed += 1;
    item.mean += scoreFn(row);
    item.estimatedCostUsd = Number((item.estimatedCostUsd + (row.usage?.estimatedCostUsd ?? row.costUsd ?? 0)).toFixed(6));
    item.averageLatencyMs += row.latencyMs ?? 0;
  }
  for (const item of Object.values(byCondition)) {
    item.mean = Number((item.mean / item.outputs).toFixed(4));
    item.averageLatencyMs = Math.round(item.averageLatencyMs / item.outputs);
  }
  return byCondition;
}

function generationCsv(results) {
  const headers = ['output_id', 'case_id', 'family', 'case_type', 'assigned_condition', 'model', 'status', 'decision', 'selected_skill', 'selected_composition', 'escalation', 'confidence', 'estimated_cost_usd', 'latency_ms'];
  const lines = [headers.join(',')];
  for (const result of results) {
    lines.push([
      result.outputId,
      result.caseId,
      result.family,
      result.caseType,
      result.assignedCondition,
      result.model,
      result.status,
      result.output?.decision ?? 'none',
      result.output?.selectedSkill ?? 'none',
      result.output?.selectedComposition ?? 'none',
      result.output?.escalation ?? false,
      result.output?.confidence ?? 0,
      result.usage.estimatedCostUsd.toFixed(6),
      result.latencyMs,
    ].map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderGenerationReport(summary) {
  const rows = Object.entries(summary.byCondition)
    .map(([condition, item]) => `| ${condition} | ${item.outputs} | ${item.generated} | ${item.failed} | $${item.estimatedCostUsd.toFixed(6)} | ${item.averageLatencyMs} |`)
    .join('\n');
  return `# ${summary.studyName} Generation

Generated: ${summary.generatedAt}

Status: ${summary.status}

Design: ${summary.design}

| Condition | Outputs | Generated | Failed | Cost | Avg latency ms |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows}

Gold labels were hidden from generation. Condition order was randomized deterministically per case.
`;
}

function buildJudgeInput(task, result, blindId, judgeId) {
  return {
    blindId,
    judgeId,
    instruction: [
      'Adjudicate this output without using assigned condition identity.',
      'Assigned condition is intentionally hidden.',
      'Use the evaluation key only to judge output quality.',
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

function scoreValue(rawScores, camel, snake, fallback) {
  const value = rawScores?.[camel] ?? rawScores?.[snake];
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function normalizeConfidence(parsed) {
  const value = parsed.confidence ?? parsed.adjudicationConfidence ?? parsed.adjudication_confidence;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(1, value));
  const scores = parsed.scores && typeof parsed.scores === 'object' ? Object.values(parsed.scores).filter((score) => typeof score === 'number') : [];
  if (scores.length) return Number(Math.max(0.5, Math.min(0.85, scores.reduce((sum, score) => sum + score, 0) / scores.length)).toFixed(2));
  return 0.5;
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
  const finalStatus = normalizeStatus(parsed.finalStatus ?? parsed.final_status ?? parsed.status ?? parsed.verdict ?? parsed.decision);
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

async function callJudge(apiKey, model, judgeId, judgeInput) {
  const providerResult = await callOpenAiJson(
    apiKey,
    model,
    `Return one strict JSON object for ACP Skills V3 blinded adjudication as ${judgeId}. Do not mention or infer assigned condition identity.`,
    judgeInput,
    900,
  );
  const normalized = normalizeAdjudication(providerResult.parsed, judgeInput);
  let judgment;
  try {
    judgment = adjudicationSchema.parse(normalized);
  } catch (error) {
    judgment = fallbackAdjudication(judgeInput, providerResult.parsed, error);
  }
  return {
    judgment,
    rawJudgment: providerResult.parsed,
    usage: providerResult.usage,
    latencyMs: providerResult.latencyMs,
  };
}

function dryRunJudgment(blindId, task, result, judgeId) {
  const selectedSkill = result.output?.selectedSkill;
  const expectedSkillMatch = selectedSkill === task.expectedSkill || (task.expectedSkill === 'none' && ['none', '', undefined].includes(selectedSkill));
  const escalationMatch = result.output?.escalation === task.expectedEscalation;
  const rejected = (result.output?.rejectedClaims ?? []).join(' ').toLowerCase();
  const claimOk = (task.forbiddenClaims ?? []).every((claim) => rejected.includes(String(claim).toLowerCase().slice(0, 10)));
  const base = expectedSkillMatch && escalationMatch && claimOk ? (judgeId === 'judge_b' ? 0.86 : 0.9) : 0.48;
  return {
    blindId,
    finalStatus: base >= 0.8 ? 'pass' : 'review',
    scores: Object.fromEntries(SCORE_KEYS.map((key) => [key, key === 'escalationCorrectness' ? (escalationMatch ? 1 : 0.35) : key === 'claimBoundaryObedience' ? (claimOk ? 1 : 0.4) : base])),
    confidence: judgeId === 'judge_b' ? 0.76 : 0.8,
    rationale: `Dry-run adjudication from ${judgeId}.`,
    uncertaintyNotes: [],
    disagreementNotes: [],
  };
}

function overallScore(scores) {
  return SCORE_KEYS.reduce((sum, key) => sum + scores[key], 0) / SCORE_KEYS.length;
}

function primaryScore(scores) {
  return PRIMARY_DVS.reduce((sum, key) => sum + scores[key], 0) / PRIMARY_DVS.length;
}

function shouldArbitrate(row, maxArbitrations, arbitrationCount) {
  if (arbitrationCount >= maxArbitrations) return false;
  if (row.judgeA.finalStatus !== row.judgeB.finalStatus) return true;
  if (Math.abs(primaryScore(row.judgeA.scores) - primaryScore(row.judgeB.scores)) >= 0.2) return true;
  if (row.judgeA.confidence < 0.72 || row.judgeB.confidence < 0.72) return true;
  if (['false_consensus', 'tokenistic_bridge', 'schema_gap', 'scale_overclaim', 'conflicting_critics'].includes(row.caseType)) return true;
  return false;
}

function combineJudges(judgeA, judgeB) {
  const scores = {};
  for (const key of SCORE_KEYS) scores[key] = Number(((judgeA.scores[key] + judgeB.scores[key]) / 2).toFixed(4));
  return {
    blindId: judgeA.blindId,
    finalStatus: judgeA.finalStatus === judgeB.finalStatus ? judgeA.finalStatus : 'review',
    scores,
    confidence: Number(((judgeA.confidence + judgeB.confidence) / 2).toFixed(4)),
    rationale: 'Judge A and Judge B combined without full-model arbitration.',
    uncertaintyNotes: [...(judgeA.uncertaintyNotes ?? []), ...(judgeB.uncertaintyNotes ?? [])],
    disagreementNotes: [...(judgeA.disagreementNotes ?? []), ...(judgeB.disagreementNotes ?? [])],
  };
}

async function runAdjudicationStudy({ studyName, sourceDir, outDir, maxBudgetUsd, maxArbitrations, dryRun }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) throw new Error('OPENAI_API_KEY is required for study adjudication.');
  const source = await readJsonFile(path.join(sourceDir, 'generation-summary.json'));
  const manifest = await readJsonFile(path.join(sourceDir, 'run-manifest.json'));
  const config = await loadStudyConfig(path.join(repoRoot, 'evals', 'skills', 'studies', 'v3-study-program.json'));
  const pools = await loadTaskPools(config);
  const tasksById = new Map([...pools.entries()]);
  const candidates = source.results.filter((result) => result.status === 'generated' && result.output);
  const costs = emptyCosts(maxBudgetUsd, dryRun);
  const planned = candidates.map((result) => {
    const task = tasksById.get(result.caseId);
    const blindId = blindOutputId(`${studyName}:${result.outputId}`);
    const judgeInput = buildJudgeInput(task, result, blindId, 'judge_a');
    costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + 2 * estimateCostUsd(PRIMARY_MODEL, estimateTokens(judgeInput), 900)).toFixed(6));
    return { result, task, blindId, judgeInput };
  });
  costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + maxArbitrations * estimateCostUsd(ARBITRATION_MODEL, 3000, 900)).toFixed(6));
  if (costs.projectedEstimatedCostUsd > maxBudgetUsd) {
    throw new Error(`Projected ${studyName} adjudication cost $${costs.projectedEstimatedCostUsd} exceeds cap $${maxBudgetUsd}.`);
  }

  const judgmentDir = path.join(outDir, 'raw-judgments');
  const blindInputDir = path.join(outDir, 'blinded-inputs');
  await mkdir(judgmentDir, { recursive: true });
  await mkdir(blindInputDir, { recursive: true });

  const rows = [];
  const blindingMap = [];
  let arbitrationCount = 0;
  for (const item of planned) {
    await writeJsonFile(path.join(blindInputDir, `${item.blindId}.json`), item.judgeInput);
    const judgeA = dryRun
      ? {
        judgment: dryRunJudgment(item.blindId, item.task, item.result, 'judge_a'),
        rawJudgment: dryRunJudgment(item.blindId, item.task, item.result, 'judge_a'),
        usage: { inputTokens: estimateTokens(item.judgeInput), outputTokens: 220, estimatedCostUsd: estimateCostUsd(PRIMARY_MODEL, estimateTokens(item.judgeInput), 220) },
        latencyMs: 0,
      }
      : await callJudge(apiKey, PRIMARY_MODEL, 'judge_a', item.judgeInput);
    addCost(costs, PRIMARY_MODEL, judgeA.usage);
    const judgeBInput = { ...item.judgeInput, judgeId: 'judge_b', judgeInstruction: 'Use an independent skeptical protocol-review perspective.' };
    const judgeB = dryRun
      ? {
        judgment: dryRunJudgment(item.blindId, item.task, item.result, 'judge_b'),
        rawJudgment: dryRunJudgment(item.blindId, item.task, item.result, 'judge_b'),
        usage: { inputTokens: estimateTokens(judgeBInput), outputTokens: 220, estimatedCostUsd: estimateCostUsd(PRIMARY_MODEL, estimateTokens(judgeBInput), 220) },
        latencyMs: 0,
      }
      : await callJudge(apiKey, PRIMARY_MODEL, 'judge_b', judgeBInput);
    addCost(costs, PRIMARY_MODEL, judgeB.usage);

    const provisional = {
      caseType: item.result.caseType,
      judgeA: judgeA.judgment,
      judgeB: judgeB.judgment,
    };
    let arbitration = null;
    if (shouldArbitrate(provisional, maxArbitrations, arbitrationCount)) {
      arbitrationCount += 1;
      const arbitrationInput = {
        ...item.judgeInput,
        judgeA: judgeA.judgment,
        judgeB: judgeB.judgment,
        arbitrationReason: 'Judge disagreement, low confidence, or flagship hard case.',
      };
      arbitration = dryRun
        ? {
          judgment: { ...combineJudges(judgeA.judgment, judgeB.judgment), confidence: 0.88, rationale: 'Dry-run full-model arbitration.' },
          rawJudgment: { dryRun: true },
          usage: { inputTokens: estimateTokens(arbitrationInput), outputTokens: 260, estimatedCostUsd: estimateCostUsd(ARBITRATION_MODEL, estimateTokens(arbitrationInput), 260) },
          latencyMs: 0,
        }
        : await callJudge(apiKey, ARBITRATION_MODEL, 'arbitration_judge', arbitrationInput);
      addCost(costs, ARBITRATION_MODEL, arbitration.usage);
    }
    const finalJudgment = arbitration?.judgment ?? combineJudges(judgeA.judgment, judgeB.judgment);
    const agreement = judgeA.judgment.finalStatus === judgeB.judgment.finalStatus && Math.abs(primaryScore(judgeA.judgment.scores) - primaryScore(judgeB.judgment.scores)) < 0.2;
    const row = {
      outputId: item.result.outputId,
      caseId: item.result.caseId,
      family: item.result.family,
      caseType: item.result.caseType,
      assignedCondition: item.result.assignedCondition,
      blindId: item.blindId,
      finalStatus: finalJudgment.finalStatus,
      scores: finalJudgment.scores,
      overallScore: Number(overallScore(finalJudgment.scores).toFixed(4)),
      primaryScore: Number(primaryScore(finalJudgment.scores).toFixed(4)),
      confidence: finalJudgment.confidence,
      rationale: finalJudgment.rationale,
      uncertaintyNotes: finalJudgment.uncertaintyNotes ?? [],
      disagreementNotes: finalJudgment.disagreementNotes ?? [],
      judgeAgreement: agreement,
      arbitrationUsed: Boolean(arbitration),
      judgeA: judgeA.judgment,
      judgeB: judgeB.judgment,
      arbitrationJudgment: arbitration?.judgment ?? null,
      rawJudgments: {
        judgeA: judgeA.rawJudgment,
        judgeB: judgeB.rawJudgment,
        arbitration: arbitration?.rawJudgment ?? null,
      },
      usage: {
        judgeA: judgeA.usage,
        judgeB: judgeB.usage,
        arbitration: arbitration?.usage ?? null,
      },
      latencyMs: {
        judgeA: judgeA.latencyMs,
        judgeB: judgeB.latencyMs,
        arbitration: arbitration?.latencyMs ?? 0,
      },
    };
    rows.push(row);
    blindingMap.push({
      blindId: item.blindId,
      outputId: item.result.outputId,
      caseId: item.result.caseId,
      assignedCondition: item.result.assignedCondition,
      assignedConditionHiddenFromJudgePrompt: true,
    });
    await writeJsonFile(path.join(judgmentDir, `${item.blindId}.json`), row);
  }

  const byCondition = aggregateAdjudication(rows, 'assignedCondition');
  const byFamily = aggregateAdjudication(rows, 'family');
  const agreementRate = Number((rows.filter((row) => row.judgeAgreement).length / rows.length).toFixed(4));
  const summary = {
    generatedAt: new Date().toISOString(),
    status: rows.some((row) => row.finalStatus === 'fail' || row.finalStatus === 'review') ? 'review' : 'pass',
    studyName,
    mode: 'dual_blinded_surrogate_adjudication',
    sourceGeneration: path.relative(repoRoot, sourceDir),
    totalCases: source.totalCases,
    totalOutputs: rows.length,
    agreementRate,
    disagreementRate: Number((1 - agreementRate).toFixed(4)),
    byCondition,
    byFamily,
    costs,
    arbitration: {
      judgeAModel: PRIMARY_MODEL,
      judgeBModel: PRIMARY_MODEL,
      arbitrationModel: ARBITRATION_MODEL,
      maxArbitrations,
      arbitrationUsed: rows.filter((row) => row.arbitrationUsed).length,
    },
    boundary: 'Dual surrogate adjudication only; not human operator review.',
    manifest,
    rows,
  };

  await writeJsonFile(path.join(outDir, 'summary.json'), summary);
  await writeJsonFile(path.join(outDir, 'blinding-map.json'), blindingMap);
  await writeJsonFile(path.join(outDir, 'costs.json'), costs);
  await writeFile(path.join(outDir, 'results-table.csv'), adjudicationCsv(rows), 'utf8');
  await writeFile(path.join(outDir, 'reliability-summary.md'), renderReliabilitySummary(summary), 'utf8');
  await writeFile(path.join(outDir, 'disagreement-log.md'), renderDisagreementLog(summary), 'utf8');
  await writeFile(path.join(outDir, 'uncertainty-notes.md'), renderUncertaintyNotes(summary), 'utf8');
  return summary;
}

function aggregateAdjudication(rows, key) {
  const aggregate = {};
  for (const row of rows) {
    const bucket = row[key];
    aggregate[bucket] ??= {
      outputs: 0,
      pass: 0,
      review: 0,
      fail: 0,
      averagePrimaryScore: 0,
      averageOverallScore: 0,
      substantiveFailureDetection: 0,
      escalationCorrectness: 0,
      claimBoundaryObedience: 0,
      artifactTraceLegibility: 0,
      agreementRate: 0,
      arbitrationRate: 0,
    };
    const item = aggregate[bucket];
    item.outputs += 1;
    item[row.finalStatus] += 1;
    item.averagePrimaryScore += row.primaryScore;
    item.averageOverallScore += row.overallScore;
    item.substantiveFailureDetection += row.scores.substantiveFailureDetection;
    item.escalationCorrectness += row.scores.escalationCorrectness;
    item.claimBoundaryObedience += row.scores.claimBoundaryObedience;
    item.artifactTraceLegibility += row.scores.artifactTraceLegibility;
    item.agreementRate += row.judgeAgreement ? 1 : 0;
    item.arbitrationRate += row.arbitrationUsed ? 1 : 0;
  }
  for (const item of Object.values(aggregate)) {
    for (const metric of ['averagePrimaryScore', 'averageOverallScore', 'substantiveFailureDetection', 'escalationCorrectness', 'claimBoundaryObedience', 'artifactTraceLegibility', 'agreementRate', 'arbitrationRate']) {
      item[metric] = Number((item[metric] / item.outputs).toFixed(4));
    }
  }
  return aggregate;
}

function adjudicationCsv(rows) {
  const headers = ['output_id', 'case_id', 'family', 'case_type', 'assigned_condition', 'blind_id', 'final_status', 'primary_score', 'overall_score', 'substantive_failure_detection', 'escalation_correctness', 'claim_boundary_obedience', 'artifact_trace_legibility', 'confidence', 'judge_agreement', 'arbitration_used'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([
      row.outputId,
      row.caseId,
      row.family,
      row.caseType,
      row.assignedCondition,
      row.blindId,
      row.finalStatus,
      row.primaryScore.toFixed(4),
      row.overallScore.toFixed(4),
      row.scores.substantiveFailureDetection.toFixed(4),
      row.scores.escalationCorrectness.toFixed(4),
      row.scores.claimBoundaryObedience.toFixed(4),
      row.scores.artifactTraceLegibility.toFixed(4),
      row.confidence.toFixed(4),
      row.judgeAgreement,
      row.arbitrationUsed,
    ].map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderReliabilitySummary(summary) {
  const familyRows = Object.entries(summary.byFamily)
    .map(([family, item]) => `| ${family} | ${item.outputs} | ${item.agreementRate.toFixed(4)} | ${item.arbitrationRate.toFixed(4)} | ${item.averagePrimaryScore.toFixed(4)} |`)
    .join('\n');
  return `# ${summary.studyName} Adjudication Reliability

Generated: ${summary.generatedAt}

Agreement rate: ${summary.agreementRate.toFixed(4)}

Arbitrations used: ${summary.arbitration.arbitrationUsed}

| Family | Outputs | Judge agreement | Arbitration rate | Primary endpoint score |
| --- | ---: | ---: | ---: | ---: |
${familyRows}

This is surrogate adjudication, not human review.
`;
}

function renderDisagreementLog(summary) {
  const rows = summary.rows
    .filter((row) => !row.judgeAgreement || row.arbitrationUsed || row.finalStatus !== 'pass')
    .map((row) => `| ${row.caseId} | ${row.assignedCondition} | ${row.finalStatus} | ${row.judgeAgreement} | ${row.arbitrationUsed} | ${row.rationale.replace(/\|/g, '/')} |`)
    .join('\n');
  return `# ${summary.studyName} Disagreement Log

| Case | Condition | Final status | Judge agreement | Arbitration used | Notes |
| --- | --- | --- | --- | --- | --- |
${rows || '| none | none | pass | true | false | no disagreements |'}
`;
}

function renderUncertaintyNotes(summary) {
  const uncertain = summary.rows.filter((row) => row.finalStatus !== 'pass' || row.confidence < 0.75);
  return `# ${summary.studyName} Uncertainty Notes

- Uncertain/review outputs: ${uncertain.length}
- Arbitration burden: ${summary.arbitration.arbitrationUsed}/${summary.totalOutputs}

${uncertain.map((row) => `- ${row.caseId} / ${row.assignedCondition}: ${row.finalStatus}, confidence ${row.confidence.toFixed(2)}; ${row.uncertaintyNotes.join('; ') || row.rationale}`).join('\n') || 'No uncertain outputs.'}

Surrogate uncertainty remains distinct from human reviewer disagreement.
`;
}

async function runAdherenceStudy({ outRoot }) {
  const outDir = path.join(outRoot, 'study-c-adherence');
  const [generation, adjudication, config] = await Promise.all([
    readJsonFile(path.join(outRoot, 'study-a-experimental', 'generation-summary.json')),
    readJsonFile(path.join(outRoot, 'study-b-adjudication', 'summary.json')),
    loadStudyConfig(path.join(repoRoot, 'evals', 'skills', 'studies', 'v3-study-program.json')),
  ]);
  const pools = await loadTaskPools(config);
  const tasksById = new Map([...pools.entries()]);
  const adjudicationByOutput = new Map(adjudication.rows.map((row) => [row.outputId, row]));
  const rows = generation.results.map((result) => {
    const task = tasksById.get(result.caseId);
    const adherence = evaluateAdherence(task, result);
    const judgment = adjudicationByOutput.get(result.outputId);
    return {
      ...adherence,
      caseId: result.caseId,
      family: result.family,
      finalStatus: judgment?.finalStatus ?? 'missing',
      primaryScore: judgment?.primaryScore ?? 0,
      substantiveFailureDetection: judgment?.scores?.substantiveFailureDetection ?? 0,
      escalationCorrectness: judgment?.scores?.escalationCorrectness ?? 0,
      claimBoundaryObedience: judgment?.scores?.claimBoundaryObedience ?? 0,
    };
  });
  const ittByCondition = aggregateScoreRows(rows, () => true);
  const perProtocolByCondition = aggregateScoreRows(rows, (row) => row.conditionAdhered);
  const summary = {
    generatedAt: new Date().toISOString(),
    status: 'pass',
    totalOutputs: rows.length,
    adheredOutputs: rows.filter((row) => row.conditionAdhered).length,
    adherenceRate: Number((rows.filter((row) => row.conditionAdhered).length / rows.length).toFixed(4)),
    prohibitedLeakageCount: rows.filter((row) => row.prohibitedSkillLeakage).length,
    expectedArtifactProductionRate: Number((rows.filter((row) => row.expectedArtifactProduced).length / rows.length).toFixed(4)),
    ittByCondition,
    perProtocolByCondition,
    rows,
  };
  await mkdir(outDir, { recursive: true });
  await writeJsonFile(path.join(outDir, 'summary.json'), summary);
  await writeFile(path.join(outDir, 'adherence-table.csv'), adherenceCsv(rows), 'utf8');
  await writeFile(path.join(outDir, 'per-protocol-vs-itt.md'), renderAdherenceReport(summary), 'utf8');
  return summary;
}

function aggregateScoreRows(rows, predicate) {
  const aggregate = {};
  for (const row of rows.filter(predicate)) {
    const condition = row.assignedCondition;
    aggregate[condition] ??= { outputs: 0, primaryScore: 0, substantiveFailureDetection: 0, escalationCorrectness: 0, claimBoundaryObedience: 0 };
    const item = aggregate[condition];
    item.outputs += 1;
    item.primaryScore += row.primaryScore;
    item.substantiveFailureDetection += row.substantiveFailureDetection;
    item.escalationCorrectness += row.escalationCorrectness;
    item.claimBoundaryObedience += row.claimBoundaryObedience;
  }
  for (const item of Object.values(aggregate)) {
    for (const key of ['primaryScore', 'substantiveFailureDetection', 'escalationCorrectness', 'claimBoundaryObedience']) {
      item[key] = Number((item[key] / item.outputs).toFixed(4));
    }
  }
  return aggregate;
}

function adherenceCsv(rows) {
  const headers = ['output_id', 'case_id', 'family', 'assigned_condition', 'received_condition', 'selected_skill', 'selected_composition', 'condition_adhered', 'prohibited_skill_leakage', 'expected_artifact_produced', 'primary_score', 'deviation_reasons'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([
      row.outputId,
      row.caseId,
      row.family,
      row.assignedCondition,
      row.receivedCondition,
      row.selectedSkill,
      row.selectedComposition ?? 'none',
      row.conditionAdhered,
      row.prohibitedSkillLeakage,
      row.expectedArtifactProduced,
      row.primaryScore.toFixed(4),
      row.deviationReasons.join('; '),
    ].map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderAdherenceReport(summary) {
  return `# ACP Skills V3 Treatment Fidelity

Generated: ${summary.generatedAt}

- Outputs: ${summary.totalOutputs}
- Adherence rate: ${summary.adherenceRate.toFixed(4)}
- Prohibited leakage count: ${summary.prohibitedLeakageCount}
- Expected artifact production rate: ${summary.expectedArtifactProductionRate.toFixed(4)}

## Intention-To-Treat

${conditionScoreTable(summary.ittByCondition)}

## Per-Protocol

${conditionScoreTable(summary.perProtocolByCondition)}

Operator utility remains unmeasured. This analysis only reports treatment fidelity and surrogate-adjudicated endpoints.
`;
}

function conditionScoreTable(byCondition) {
  const rows = Object.entries(byCondition)
    .map(([condition, item]) => `| ${condition} | ${item.outputs} | ${item.primaryScore.toFixed(4)} | ${item.substantiveFailureDetection.toFixed(4)} | ${item.escalationCorrectness.toFixed(4)} | ${item.claimBoundaryObedience.toFixed(4)} |`)
    .join('\n');
  return `| Condition | Outputs | Primary score | Failure detection | Escalation | Claim boundary |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows || '| none | 0 | 0 | 0 | 0 | 0 |'}`;
}

function classifyDivergence(row) {
  if (row.finalStatus === 'pass') return 'none';
  if (row.scores.substantiveFailureDetection < 0.55 || row.scores.claimBoundaryObedience < 0.55) return 'substantive_miss';
  if (row.scores.escalationCorrectness < 0.65 && row.scores.claimBoundaryObedience >= 0.8) return 'label_or_escalation_mismatch';
  return 'acceptable_bounded_divergence';
}

async function runLiveStudy({ config, outRoot, model, maxBudgetUsd, maxArbitrations, dryRun }) {
  const outDir = path.join(outRoot, 'study-d-live');
  const tasks = await selectTasks(config, 'studyD');
  const generation = await runGenerationStudy({
    studyName: 'study-d-live',
    design: config.studyD.design,
    tasks,
    outDir,
    requestedConditions: config.studyD.conditions,
    noSkillCaseIds: config.studyD.noSkillCaseIds ?? [],
    model,
    maxBudgetUsd,
    dryRun,
  });
  const adjudication = await runAdjudicationStudy({
    studyName: 'study-d-live',
    sourceDir: outDir,
    outDir: path.join(outDir, 'adjudication'),
    maxBudgetUsd,
    maxArbitrations,
    dryRun,
  });
  const divergenceCounts = {};
  const rows = adjudication.rows.map((row) => {
    const divergenceType = classifyDivergence(row);
    divergenceCounts[divergenceType] = (divergenceCounts[divergenceType] ?? 0) + 1;
    return { ...row, divergenceType };
  });
  const combinedCosts = combineCosts(generation.costs, adjudication.costs, maxBudgetUsd, dryRun);
  const summary = {
    generatedAt: new Date().toISOString(),
    status: rows.some((row) => row.divergenceType === 'substantive_miss') ? 'review' : 'pass',
    design: config.studyD.design,
    totalCases: generation.totalCases,
    totalOutputs: generation.totalOutputs,
    generation: {
      generatedOutputs: generation.generatedOutputs,
      failedOutputs: generation.failedOutputs,
      byCondition: generation.byCondition,
    },
    adjudication: {
      agreementRate: adjudication.agreementRate,
      arbitrationUsed: adjudication.arbitration.arbitrationUsed,
      byCondition: adjudication.byCondition,
    },
    divergenceCounts,
    costs: combinedCosts,
    boundary: 'Pragmatic live cohort only; not broad comparative superiority or field efficacy.',
    rows,
  };
  await writeJsonFile(path.join(outDir, 'summary.json'), summary);
  await writeJsonFile(path.join(outDir, 'costs.json'), combinedCosts);
  await writeFile(path.join(outDir, 'results-table.csv'), liveResultsCsv(rows), 'utf8');
  await writeFile(path.join(outDir, 'divergence-taxonomy.md'), renderLiveDivergenceTaxonomy(summary), 'utf8');
  await writeFile(path.join(outDir, 'arbitration-summary.md'), renderLiveArbitrationSummary(summary), 'utf8');
  return summary;
}

function combineCosts(left, right, maxBudgetUsd, dryRun) {
  const combined = emptyCosts(maxBudgetUsd, dryRun);
  combined.actualEstimatedCostUsd = Number(((left.actualEstimatedCostUsd ?? 0) + (right.actualEstimatedCostUsd ?? 0)).toFixed(6));
  combined.projectedEstimatedCostUsd = Number(((left.projectedEstimatedCostUsd ?? 0) + (right.projectedEstimatedCostUsd ?? 0)).toFixed(6));
  for (const source of [left, right]) {
    for (const [model, item] of Object.entries(source.modelSplit ?? {})) {
      combined.modelSplit[model] ??= { calls: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 };
      combined.modelSplit[model].calls += item.calls;
      combined.modelSplit[model].inputTokens += item.inputTokens;
      combined.modelSplit[model].outputTokens += item.outputTokens;
      combined.modelSplit[model].estimatedCostUsd = Number((combined.modelSplit[model].estimatedCostUsd + item.estimatedCostUsd).toFixed(6));
    }
  }
  return combined;
}

function liveResultsCsv(rows) {
  const headers = ['case_id', 'family', 'condition', 'final_status', 'divergence_type', 'primary_score', 'latency_judge_a_ms', 'arbitration_used'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([
      row.caseId,
      row.family,
      row.assignedCondition,
      row.finalStatus,
      row.divergenceType,
      row.primaryScore.toFixed(4),
      row.latencyMs.judgeA,
      row.arbitrationUsed,
    ].map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderLiveDivergenceTaxonomy(summary) {
  const rows = Object.entries(summary.divergenceCounts)
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join('\n');
  return `# ACP Skills V3 Study D Live Divergence Taxonomy

Generated: ${summary.generatedAt}

| Divergence type | Count |
| --- | ---: |
${rows}

Study D is pragmatic portability evidence, not field efficacy.
`;
}

function renderLiveArbitrationSummary(summary) {
  const rows = Object.entries(summary.adjudication.byCondition)
    .map(([condition, item]) => `| ${condition} | ${item.outputs} | ${item.agreementRate.toFixed(4)} | ${item.arbitrationRate.toFixed(4)} | ${item.averagePrimaryScore.toFixed(4)} |`)
    .join('\n');
  return `# ACP Skills V3 Study D Arbitration Summary

| Condition | Outputs | Judge agreement | Arbitration rate | Primary endpoint score |
| --- | ---: | ---: | ---: | ---: |
${rows}
`;
}

async function runClaimsStudy({ outRoot }) {
  const finalDir = path.join(outRoot, 'final');
  const [studyA, studyB, studyC, studyD] = await Promise.all([
    readJsonFile(path.join(outRoot, 'study-a-experimental', 'generation-summary.json')),
    readJsonFile(path.join(outRoot, 'study-b-adjudication', 'summary.json')),
    readJsonFile(path.join(outRoot, 'study-c-adherence', 'summary.json')),
    readJsonFile(path.join(outRoot, 'study-d-live', 'summary.json')),
  ]);
  await mkdir(finalDir, { recursive: true });
  await writeFile(path.join(finalDir, 'skills-v3-claims-memo.md'), renderStudyClaimsMemo(studyA, studyB, studyC, studyD), 'utf8');
  await writeFile(path.join(finalDir, 'skills-v3-results-overview.md'), renderStudyResultsOverview(studyA, studyB, studyC, studyD), 'utf8');
  await writeFile(path.join(finalDir, 'skills-v3-results-table.csv'), renderStudyResultsCsv(studyA, studyB, studyC, studyD), 'utf8');
  await writeFile(path.join(finalDir, 'skills-v3-failure-taxonomy.md'), renderStudyFailureTaxonomy(studyB, studyD), 'utf8');
  await writeFile(path.join(finalDir, 'skills-v3-casebook.md'), renderStudyCasebook(studyB, studyD), 'utf8');
  await writeFile(path.join(finalDir, 'skills-v3-non-claims.md'), renderStudyNonClaims(), 'utf8');
  await writeFile(path.join(finalDir, 'reviewer-start-here.md'), renderStudyStartHere(), 'utf8');
  return {
    generatedAt: new Date().toISOString(),
    status: 'pass',
    outDir: path.relative(repoRoot, finalDir),
    studies: {
      studyA: { cases: studyA.totalCases, outputs: studyA.totalOutputs },
      studyB: { agreementRate: studyB.agreementRate, arbitrations: studyB.arbitration.arbitrationUsed },
      studyC: { adherenceRate: studyC.adherenceRate },
      studyD: { cases: studyD.totalCases, outputs: studyD.totalOutputs, status: studyD.status },
    },
  };
}

function renderStudyClaimsMemo(studyA, studyB, studyC, studyD) {
  const bestCondition = Object.entries(studyB.byCondition).sort((a, b) => b[1].averagePrimaryScore - a[1].averagePrimaryScore)[0];
  return `# ACP Skills V3 Claims Memo

Generated: ${new Date().toISOString()}

## Claim ACP Can Support Now

ACP Skills V3 now has a behavioral intervention study layer: a measured within-case crossover generation study, dual blinded surrogate adjudication, adherence/fidelity analysis, and a pragmatic live cohort. The strongest current result is condition-specific, not generic: ${bestCondition?.[0] ?? 'unknown'} has the highest surrogate-adjudicated primary endpoint score in Study B.

## Evidence Basis

- Study A: ${studyA.totalCases} cases and ${studyA.totalOutputs} measured case-condition outputs.
- Study B: dual mini-judge adjudication with agreement rate ${studyB.agreementRate.toFixed(4)} and ${studyB.arbitration.arbitrationUsed} full-model arbitrations.
- Study C: adherence rate ${studyC.adherenceRate.toFixed(4)} with intention-to-treat and per-protocol summaries.
- Study D: ${studyD.totalCases} enriched live cases and ${studyD.totalOutputs} live outputs, status ${studyD.status}.

## Paper-Safe Interpretation

The evidence supports bounded claims about procedural intervention behavior, treatment fidelity, adjudication reliability, and live portability. It does not prove human operator utility, real-world civic efficacy, fairness solved, institutional legitimacy, or field readiness.
`;
}

function renderStudyResultsOverview(studyA, studyB, studyC, studyD) {
  return `# ACP Skills V3 Results Overview

Generated: ${new Date().toISOString()}

## Table 1: Experimental Measured Crossover

${conditionEndpointTable(studyB.byCondition)}

## Table 2: Adjudication Reliability

${familyReliabilityTable(studyB.byFamily)}

## Table 3: Pragmatic Live Cohort

${conditionEndpointTable(studyD.adjudication.byCondition)}

## Table 4: Adherence / Fidelity

${conditionEndpointTable(studyC.ittByCondition)}

## Interpretation

Study A/B provide the main measured experimental evidence. Study C separates assigned treatment from actual received treatment. Study D tests live portability on enriched hard cases. The operator endpoint remains missing until human review is collected.
`;
}

function conditionEndpointTable(byCondition) {
  const rows = Object.entries(byCondition)
    .map(([condition, item]) => `| ${condition} | ${item.outputs} | ${(item.averagePrimaryScore ?? item.primaryScore ?? 0).toFixed(4)} | ${(item.substantiveFailureDetection ?? 0).toFixed(4)} | ${(item.escalationCorrectness ?? 0).toFixed(4)} | ${(item.claimBoundaryObedience ?? 0).toFixed(4)} |`)
    .join('\n');
  return `| Condition | Outputs | Primary score | Failure detection | Escalation | Claim boundary |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows}`;
}

function familyReliabilityTable(byFamily) {
  const rows = Object.entries(byFamily)
    .map(([family, item]) => `| ${family} | ${item.outputs} | ${item.agreementRate.toFixed(4)} | ${item.arbitrationRate.toFixed(4)} | ${item.averagePrimaryScore.toFixed(4)} |`)
    .join('\n');
  return `| Family | Outputs | Agreement | Arbitration | Primary score |
| --- | ---: | ---: | ---: | ---: |
${rows}`;
}

function renderStudyResultsCsv(studyA, studyB, studyC, studyD) {
  const rows = [['table', 'scope', 'metric', 'value', 'notes']];
  for (const [condition, item] of Object.entries(studyB.byCondition)) {
    rows.push(['experimental_measured_crossover', condition, 'primary_score', item.averagePrimaryScore.toFixed(4), 'Study A generation plus Study B adjudication']);
    rows.push(['experimental_measured_crossover', condition, 'claim_boundary_obedience', item.claimBoundaryObedience.toFixed(4), 'surrogate adjudication']);
  }
  rows.push(['adjudication_reliability', 'all', 'agreement_rate', studyB.agreementRate.toFixed(4), 'Judge A/B agreement']);
  rows.push(['adjudication_reliability', 'all', 'arbitration_count', studyB.arbitration.arbitrationUsed, 'gpt-5.4 arbitration']);
  for (const [condition, item] of Object.entries(studyC.ittByCondition)) {
    rows.push(['adherence_itt', condition, 'primary_score', item.primaryScore.toFixed(4), 'intention-to-treat']);
  }
  for (const [condition, item] of Object.entries(studyC.perProtocolByCondition)) {
    rows.push(['adherence_per_protocol', condition, 'primary_score', item.primaryScore.toFixed(4), 'condition-adhered outputs']);
  }
  for (const [kind, count] of Object.entries(studyD.divergenceCounts)) {
    rows.push(['pragmatic_live_cohort', kind, 'divergence_count', count, 'Study D live']);
  }
  rows.push(['generation', 'study_a', 'outputs', studyA.totalOutputs, 'measured generated outputs']);
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function renderStudyFailureTaxonomy(studyB, studyD) {
  const reviewRows = Object.entries(studyB.byFamily)
    .map(([family, item]) => `| ${family} | ${item.review} | ${item.fail} | ${item.arbitrationRate.toFixed(4)} |`)
    .join('\n');
  const liveRows = Object.entries(studyD.divergenceCounts)
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join('\n');
  return `# ACP Skills V3 Failure Taxonomy

## Study B Review/Failure Burden

| Family | Review | Fail | Arbitration rate |
| --- | ---: | ---: | ---: |
${reviewRows}

## Study D Live Divergence

| Divergence type | Count |
| --- | ---: |
${liveRows}
`;
}

function renderStudyCasebook(studyB, studyD) {
  const hardRows = [...studyB.rows, ...studyD.rows]
    .filter((row) => row.arbitrationUsed || row.finalStatus !== 'pass')
    .slice(0, 16)
    .map((row) => `## ${row.caseId} / ${row.assignedCondition}

- Family: ${row.family}
- Status: ${row.finalStatus}
- Primary score: ${row.primaryScore.toFixed(4)}
- Arbitration used: ${row.arbitrationUsed}
- Rationale: ${row.rationale}
`)
    .join('\n');
  return `# ACP Skills V3 Casebook

${hardRows || 'No review cases.'}
`;
}

function renderStudyNonClaims() {
  return `# ACP Skills V3 Non-Claims

ACP should not claim:

- human operator utility
- real-world civic efficacy
- fairness solved
- institutional legitimacy
- legal adequacy for public hearings
- field readiness
- broad superiority outside the tested task families

Surrogate adjudication is a surrogate endpoint. Human review remains missing.
`;
}

function renderStudyStartHere() {
  return `# ACP Skills V3 Reviewer Start Here

Read in this order:

1. \`skills-v3-claims-memo.md\`
2. \`skills-v3-results-overview.md\`
3. \`skills-v3-results-table.csv\`
4. \`skills-v3-failure-taxonomy.md\`
5. \`skills-v3-casebook.md\`
6. \`skills-v3-non-claims.md\`

The core evidence is now a behavioral intervention study, not only an eval-script package. It remains surrogate-adjudicated and does not replace human review.
`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

async function runExperimental({ config, outRoot, model, maxBudgetUsd, dryRun }) {
  const tasks = await selectTasks(config, 'studyA');
  return runGenerationStudy({
    studyName: 'study-a-experimental',
    design: config.studyA.design,
    tasks,
    outDir: path.join(outRoot, 'study-a-experimental'),
    requestedConditions: ALL_CONDITIONS,
    model,
    maxBudgetUsd,
    dryRun,
  });
}

async function runAdjudication({ outRoot, maxBudgetUsd, maxArbitrations, dryRun }) {
  return runAdjudicationStudy({
    studyName: 'study-b-adjudication',
    sourceDir: path.join(outRoot, 'study-a-experimental'),
    outDir: path.join(outRoot, 'study-b-adjudication'),
    maxBudgetUsd,
    maxArbitrations,
    dryRun,
  });
}

async function ensurePhaseArtifacts(phase, opts) {
  const paths = {
    experimental: path.join(opts.outRoot, 'study-a-experimental', 'generation-summary.json'),
    adjudication: path.join(opts.outRoot, 'study-b-adjudication', 'summary.json'),
    adherence: path.join(opts.outRoot, 'study-c-adherence', 'summary.json'),
    live: path.join(opts.outRoot, 'study-d-live', 'summary.json'),
    claims: path.join(opts.outRoot, 'final', 'skills-v3-claims-memo.md'),
  };
  if (opts.reuseExisting && await exists(paths[phase])) {
    return true;
  }
  return false;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(opts.maxBudgetUsd) || opts.maxBudgetUsd <= 0) throw new Error('--max-budget-usd must be positive.');
  if (!Number.isInteger(opts.maxArbitrations) || opts.maxArbitrations < 0) throw new Error('--max-arbitrations must be a nonnegative integer.');
  const config = await loadStudyConfig(opts.configPath);
  const results = {};

  async function runPhase(phase) {
    if (await ensurePhaseArtifacts(phase, opts)) {
      results[phase] = { status: 'reused_existing' };
      return;
    }
    if (phase === 'experimental') results[phase] = await runExperimental({ config, ...opts });
    if (phase === 'adjudication') results[phase] = await runAdjudication(opts);
    if (phase === 'adherence') results[phase] = await runAdherenceStudy(opts);
    if (phase === 'live') results[phase] = await runLiveStudy({ config, ...opts });
    if (phase === 'claims') results[phase] = await runClaimsStudy(opts);
  }

  if (opts.phase === 'all') {
    for (const phase of ['experimental', 'adjudication', 'adherence', 'live', 'claims']) await runPhase(phase);
  } else {
    await runPhase(opts.phase);
  }
  process.stdout.write(`${JSON.stringify({
    generatedAt: new Date().toISOString(),
    phase: opts.phase,
    outRoot: path.relative(repoRoot, opts.outRoot),
    dryRun: opts.dryRun,
    reuseExisting: opts.reuseExisting,
    results,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
