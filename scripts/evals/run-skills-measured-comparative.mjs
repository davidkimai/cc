#!/usr/bin/env node
import { request as httpsRequest } from 'node:https';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const BASELINES = ['no_skill', 'metadata_only', 'full_skill', 'composition'];
const DEFAULT_MODEL = 'gpt-5.4-mini';

const measuredOutputSchema = z.object({
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

function parseArgs(argv) {
  const flags = {
    tasks: path.join('evals', 'skills', 'tasks', 'v3-measured-heldout.json'),
    out: path.join('artifacts', 'evals', 'skills', 'measured-comparative'),
    model: DEFAULT_MODEL,
    'max-budget-usd': '12',
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
    taskPath: path.resolve(repoRoot, flags.tasks),
    outDir: path.resolve(repoRoot, flags.out),
    model: flags.model,
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

async function loadSkillMetadata(skillNames) {
  const registry = await readJson('skills/registry.json');
  const packagesByName = new Map(registry.packages.map((pkg) => [pkg.name, pkg]));
  const metadata = [];
  for (const skillName of skillNames) {
    const item = packagesByName.get(skillName);
    if (!item) continue;
    const manifest = await readJson(item.manifest);
    metadata.push({
      name: skillName,
      category: item.category,
      maturity: item.maturity,
      summary: manifest.summary,
      useWhen: manifest.useWhen,
      dontUseWhen: manifest.dontUseWhen,
    });
  }
  return metadata;
}

async function loadSkillContexts(skillNames) {
  const registry = await readJson('skills/registry.json');
  const packagesByName = new Map(registry.packages.map((pkg) => [pkg.name, pkg]));
  const contexts = [];
  for (const skillName of skillNames) {
    const item = packagesByName.get(skillName);
    if (!item) continue;
    const manifest = await readJson(item.manifest);
    const skillText = await readFile(path.join(repoRoot, manifest.skillFile), 'utf8');
    contexts.push({
      name: skillName,
      maturity: item.maturity,
      manifestPath: item.manifest,
      skillFile: manifest.skillFile,
      summary: manifest.summary,
      useWhen: manifest.useWhen,
      dontUseWhen: manifest.dontUseWhen,
      excerpt: skillText.slice(0, 6500),
    });
  }
  return contexts;
}

async function loadCompositionContext(compositionName) {
  if (!compositionName) return null;
  const compositionRoot = path.join(repoRoot, 'skills', 'compositions', compositionName);
  const [readme, yaml] = await Promise.all([
    readFile(path.join(compositionRoot, 'README.md'), 'utf8'),
    readFile(path.join(compositionRoot, 'composition.yaml'), 'utf8'),
  ]);
  return {
    name: compositionName,
    readme: readme.slice(0, 5000),
    yaml: yaml.slice(0, 5000),
  };
}

function baselinesFor(task) {
  return BASELINES.filter((baseline) => baseline !== 'composition' || task.expectedComposition);
}

async function buildGenerationInput(task, baseline) {
  const base = {
    taskId: task.id,
    family: task.family,
    caseType: task.caseType,
    prompt: task.prompt,
    availableCandidateNames: task.candidateSkills ?? [],
    nonClaimBoundary: [
      'Do not claim real-world civic efficacy.',
      'Do not claim fairness solved.',
      'Do not claim institutional legitimacy.',
      'Do not claim field readiness.',
    ],
  };
  if (baseline === 'no_skill') {
    return {
      baselineInstruction: 'No ACP skill documentation is available. Solve the task using only general reasoning and the task prompt.',
      task: base,
      context: {},
    };
  }
  if (baseline === 'metadata_only') {
    return {
      baselineInstruction: 'Only skill metadata is available. Do not assume access to skill procedures, examples, checklists, or evaluation hooks.',
      task: base,
      context: {
        skillMetadata: await loadSkillMetadata(task.candidateSkills ?? []),
      },
    };
  }
  if (baseline === 'full_skill') {
    return {
      baselineInstruction: 'Full candidate skill documentation is available. Use it if relevant, and reject it if this is a negative-control task.',
      task: base,
      context: {
        skillContexts: await loadSkillContexts(task.candidateSkills ?? []),
      },
    };
  }
  return {
    baselineInstruction: 'A composition workflow is available for this task. Use the composition to coordinate skills and evidence surfaces.',
    task: base,
    context: {
      composition: await loadCompositionContext(task.expectedComposition),
      skillContexts: await loadSkillContexts(task.candidateSkills ?? []),
    },
  };
}

function buildPrompt(input) {
  return {
    role: 'ACP Skills V3 measured comparative generator',
    instruction: [
      'Generate the actual output for this baseline condition.',
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
    input,
  };
}

function dryRunOutput(task, baseline) {
  return {
    taskId: task.id,
    decision: baseline === 'no_skill' ? 'package_evidence' : task.expectedEscalation ? 'escalate' : 'use_skill',
    selectedSkill: baseline === 'no_skill' ? 'none' : task.candidateSkills?.[0] ?? 'none',
    selectedComposition: baseline === 'composition' ? task.expectedComposition : null,
    escalation: baseline === 'no_skill' ? false : Boolean(task.expectedEscalation),
    detectedFailures: baseline === 'no_skill' ? [] : (task.failureModes ?? []),
    rejectedClaims: baseline === 'no_skill' ? [] : (task.forbiddenClaims ?? []),
    producedArtifacts: baseline === 'no_skill' ? ['brief_note'] : (task.artifactExpectations ?? ['trace']),
    rationale: `Dry-run measured output for ${baseline}.`,
    confidence: baseline === 'no_skill' ? 0.54 : 0.82,
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
          content: 'Return one strict JSON object for the ACP Skills V3 measured comparative generator. No prose outside JSON.',
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
  const usage = payload.usage ?? {};
  const inputTokens = usage.input_tokens ?? estimateTokens(promptPayload);
  const outputTokens = usage.output_tokens ?? estimateTokens(parsed);
  return {
    output: parsed,
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

function toCsv(results) {
  const headers = ['output_id', 'case_id', 'family', 'case_type', 'baseline', 'model', 'status', 'decision', 'selected_skill', 'selected_composition', 'escalation', 'confidence', 'estimated_cost_usd', 'latency_ms'];
  const lines = [headers.join(',')];
  for (const result of results) {
    lines.push([
      result.outputId,
      result.caseId,
      result.family,
      result.caseType,
      result.baseline,
      result.model,
      result.status,
      result.output?.decision ?? 'none',
      result.output?.selectedSkill ?? 'none',
      result.output?.selectedComposition ?? 'none',
      result.output?.escalation ?? false,
      result.output?.confidence ?? 0,
      result.usage.estimatedCostUsd.toFixed(6),
      result.latencyMs,
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderReport(summary) {
  const rows = Object.entries(summary.byBaseline)
    .map(([baseline, item]) => `| ${baseline} | ${item.outputs} | ${item.generated} | ${item.failed} | $${item.estimatedCostUsd.toFixed(6)} |`)
    .join('\n');
  return `# ACP Skills V3 Measured Comparative Generation

Generated: ${summary.generatedAt}

Status: ${summary.status}

This is measured generation, not simulated comparative scoring. Gold labels, expected skills, expected signals, and scoring keys were hidden from the generation prompts.

## Slice

- Cases: ${summary.totalCases}
- Outputs requested: ${summary.totalOutputs}
- Outputs generated: ${summary.generatedOutputs}
- Failed outputs: ${summary.failedOutputs}
- Families covered: ${summary.familiesCovered.join(', ')}
- Baselines: ${summary.baselines.join(', ')}

## Baseline Generation

| Baseline | Outputs | Generated | Failed | Estimated cost |
| --- | ---: | ---: | ---: | ---: |
${rows}

## Boundary

These are raw measured outputs. Comparative claims require the separated blinded adjudication in \`adjudication/\`.
`;
}

async function writeBlockedArtifacts(outDir, reason, costs) {
  await mkdir(path.join(outDir, 'raw-outputs'), { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    status: 'blocked',
    totalCases: 0,
    totalOutputs: 0,
    generatedOutputs: 0,
    failedOutputs: 0,
    costs,
    recommendation: reason,
    results: [],
  };
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'report.md'), renderReport({ ...summary, byBaseline: {}, baselines: [], familiesCovered: [] }), 'utf8');
  await writeFile(path.join(outDir, 'results-table.csv'), 'output_id,case_id,family,case_type,baseline,model,status,decision,selected_skill,selected_composition,escalation,confidence,estimated_cost_usd,latency_ms\n', 'utf8');
  await writeFile(path.join(outDir, 'costs.json'), `${JSON.stringify(costs, null, 2)}\n`, 'utf8');
}

async function main() {
  const { taskPath, outDir, model, maxBudgetUsd, dryRun } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) throw new Error('OPENAI_API_KEY is required for measured comparative generation.');

  const tasks = await readJsonFile(taskPath);
  const costs = emptyCosts(maxBudgetUsd, dryRun);
  const planned = [];
  for (const task of tasks) {
    for (const baseline of baselinesFor(task)) {
      const generationInput = await buildGenerationInput(task, baseline);
      const promptPayload = buildPrompt(generationInput);
      const projectedInputTokens = estimateTokens(promptPayload);
      const projectedOutputTokens = 900;
      costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + estimateCostUsd(model, projectedInputTokens, projectedOutputTokens)).toFixed(6));
      planned.push({ task, baseline, generationInput, promptPayload, projectedInputTokens, projectedOutputTokens });
    }
  }
  if (costs.projectedEstimatedCostUsd > maxBudgetUsd) {
    await writeBlockedArtifacts(outDir, `Projected cost $${costs.projectedEstimatedCostUsd} exceeds cap $${maxBudgetUsd}.`, costs);
    process.exitCode = 1;
    return;
  }

  const rawDir = path.join(outDir, 'raw-outputs');
  await mkdir(rawDir, { recursive: true });
  const results = [];
  for (const item of planned) {
    const outputId = `${item.task.id}--${item.baseline}`;
    const failures = [];
    let parsedOutput = null;
    let usage = {
      inputTokens: item.projectedInputTokens,
      outputTokens: dryRun ? estimateTokens(dryRunOutput(item.task, item.baseline)) : 0,
      estimatedCostUsd: 0,
    };
    let latencyMs = 0;
    try {
      const providerResult = dryRun
        ? { output: dryRunOutput(item.task, item.baseline), usage: { ...usage, estimatedCostUsd: estimateCostUsd(model, usage.inputTokens, usage.outputTokens) }, latencyMs: 0 }
        : await callOpenAi(apiKey, model, item.promptPayload);
      parsedOutput = measuredOutputSchema.parse(providerResult.output);
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
      baseline: item.baseline,
      model,
      status: failures.length ? 'fail' : 'generated',
      failures,
      usage,
      latencyMs,
      output: parsedOutput,
      rawOutputPath: path.join('raw-outputs', `${outputId}.json`),
    };
    results.push(result);
    await writeFile(path.join(rawDir, `${outputId}.json`), `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      outputId,
      taskInput: item.generationInput.task,
      baseline: item.baseline,
      generationPromptVisibleToModel: item.generationInput,
      expectedLabelsHiddenFromGeneration: true,
      result,
    }, null, 2)}\n`, 'utf8');
  }

  const byBaseline = {};
  for (const result of results) {
    byBaseline[result.baseline] ??= { outputs: 0, generated: 0, failed: 0, estimatedCostUsd: 0 };
    byBaseline[result.baseline].outputs += 1;
    byBaseline[result.baseline][result.status === 'generated' ? 'generated' : 'failed'] += 1;
    byBaseline[result.baseline].estimatedCostUsd = Number((byBaseline[result.baseline].estimatedCostUsd + result.usage.estimatedCostUsd).toFixed(6));
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    status: results.some((result) => result.status === 'fail') ? 'review' : 'pass',
    mode: 'measured_comparative_generation',
    provider: dryRun ? 'dry-run' : 'openai',
    model,
    taskSource: path.relative(repoRoot, taskPath),
    totalCases: tasks.length,
    totalOutputs: results.length,
    generatedOutputs: results.filter((result) => result.status === 'generated').length,
    failedOutputs: results.filter((result) => result.status !== 'generated').length,
    baselines: [...new Set(results.map((result) => result.baseline))],
    familiesCovered: [...new Set(tasks.map((task) => task.family))].sort(),
    byBaseline,
    costs,
    boundary: 'Measured generation only. Comparative scoring is performed by separated blinded adjudication.',
    results,
  };

  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'report.md'), renderReport(summary), 'utf8');
  await writeFile(path.join(outDir, 'results-table.csv'), toCsv(results), 'utf8');
  await writeFile(path.join(outDir, 'costs.json'), `${JSON.stringify(costs, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.status === 'blocked') process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
