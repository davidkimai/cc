#!/usr/bin/env node
import { request as httpsRequest } from 'node:https';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { renderLivePilotFailures, renderLivePilotSummary } from './render-skills-live-provider-report.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const outputSchema = z.object({
  taskId: z.string().min(1),
  selectedSkill: z.string().min(1),
  decision: z.enum(['use_skill', 'do_not_use', 'escalate', 'abstain', 'package_evidence']),
  escalation: z.boolean(),
  caughtFailures: z.array(z.string()),
  allowedClaim: z.string().min(1),
  disallowedClaimsRejected: z.array(z.string()),
  traceNotes: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

function parseArgs(argv) {
  const flags = {
    out: path.join('artifacts', 'evals', 'skills', 'live-provider'),
    'max-budget-usd': '15',
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
    outDir: path.resolve(repoRoot, flags.out),
    maxBudgetUsd,
    dryRun: flags['dry-run'] === 'true',
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
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

async function loadSkillContext(skillName) {
  const registry = await readJson('skills/registry.json');
  const item = registry.packages.find((pkg) => pkg.name === skillName);
  if (!item) throw new Error(`skill not found in registry: ${skillName}`);
  const manifest = await readJson(item.manifest);
  const skillText = await readFile(path.join(repoRoot, manifest.skillFile), 'utf8');
  return {
    manifestPath: item.manifest,
    skillFile: manifest.skillFile,
    summary: manifest.summary,
    useWhen: manifest.useWhen,
    dontUseWhen: manifest.dontUseWhen,
    excerpt: skillText.slice(0, 5000),
  };
}

function buildPrompt(caseItem, skillContext) {
  return {
    role: 'ACP Skills V3 live-provider pilot executor',
    instruction: 'Use the supplied ACP skill context to execute the task. Return JSON only. Do not claim field efficacy, full comparative superiority, fairness solved, or field readiness.',
    outputSchema: {
      taskId: 'string',
      selectedSkill: 'string',
      decision: 'use_skill | do_not_use | escalate | abstain | package_evidence',
      escalation: 'boolean',
      caughtFailures: 'string[]',
      allowedClaim: 'string',
      disallowedClaimsRejected: 'string[]',
      traceNotes: 'string[]',
      confidence: 'number between 0 and 1',
    },
    case: {
      id: caseItem.id,
      family: caseItem.family,
      caseType: caseItem.caseType,
      skill: caseItem.skill,
      task: caseItem.task,
      forbiddenClaims: caseItem.forbiddenClaims,
    },
    skillContext,
  };
}

function dryRunOutput(caseItem) {
  return {
    taskId: caseItem.id,
    selectedSkill: caseItem.skill,
    decision: caseItem.expectedDecision,
    escalation: caseItem.expectedEscalation,
    caughtFailures: caseItem.expectedEscalation ? ['review_required'] : [],
    allowedClaim: 'Fixture-level or pilot-level evidence only.',
    disallowedClaimsRejected: caseItem.forbiddenClaims,
    traceNotes: ['dry-run structured output for budget and artifact verification'],
    confidence: caseItem.expectedEscalation ? 0.74 : 0.86,
  };
}

async function callOpenAi(apiKey, caseItem, promptPayload) {
  const response = await postJson(
    new URL('https://api.openai.com/v1/responses'),
    { authorization: `Bearer ${apiKey}` },
    {
      model: caseItem.model,
      input: [
        {
          role: 'system',
          content: 'Return one strict JSON object for the ACP Skills V3 live pilot. No prose outside JSON.',
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
  return {
    output: parsed,
    usage: {
      inputTokens: usage.input_tokens ?? estimateTokens(promptPayload),
      outputTokens: usage.output_tokens ?? estimateTokens(parsed),
      estimatedCostUsd: estimateCostUsd(caseItem.model, usage.input_tokens ?? estimateTokens(promptPayload), usage.output_tokens ?? estimateTokens(parsed)),
    },
    latencyMs: response.latencyMs,
  };
}

function score(caseItem, output) {
  const failures = [];
  if (output.taskId !== caseItem.id) failures.push(`taskId ${output.taskId} did not match ${caseItem.id}`);
  if (output.selectedSkill !== caseItem.skill) failures.push(`selectedSkill ${output.selectedSkill} did not match ${caseItem.skill}`);
  if (output.decision !== caseItem.expectedDecision) failures.push(`decision ${output.decision} did not match ${caseItem.expectedDecision}`);
  if (output.escalation !== caseItem.expectedEscalation) failures.push(`escalation ${output.escalation} did not match ${caseItem.expectedEscalation}`);
  for (const claim of caseItem.forbiddenClaims) {
    if (!output.disallowedClaimsRejected.some((item) => item.toLowerCase().includes(claim.toLowerCase().slice(0, 18)))) {
      failures.push(`forbidden claim not explicitly rejected: ${claim}`);
    }
  }
  return failures;
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

async function writeBlockedArtifacts(outDir, reason, costs) {
  await mkdir(path.join(outDir, 'traces'), { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    status: 'blocked',
    provider: 'openai',
    totalCases: 0,
    passingCases: 0,
    failedCases: 0,
    costs,
    recommendation: reason,
    results: [],
  };
  await writeFile(path.join(outDir, 'pilot-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'pilot-summary.md'), renderLivePilotSummary(summary), 'utf8');
  await writeFile(path.join(outDir, 'costs.json'), `${JSON.stringify(costs, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'failures.md'), `# ACP Skills V3 Live-Provider Pilot Failures\n\n${reason}\n`, 'utf8');
}

async function main() {
  const { outDir, maxBudgetUsd, dryRun } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) throw new Error('OPENAI_API_KEY is required for the live-provider pilot.');

  const cases = await readJson('evals/skills/live-provider/pilot-cases.json');
  const costs = emptyCosts(maxBudgetUsd, dryRun);
  const promptPayloads = [];
  for (const caseItem of cases) {
    const skillContext = await loadSkillContext(caseItem.skill);
    const promptPayload = buildPrompt(caseItem, skillContext);
    const projectedInputTokens = estimateTokens(promptPayload);
    const projectedOutputTokens = 900;
    costs.projectedEstimatedCostUsd = Number((costs.projectedEstimatedCostUsd + estimateCostUsd(caseItem.model, projectedInputTokens, projectedOutputTokens)).toFixed(6));
    promptPayloads.push({ caseItem, skillContext, promptPayload, projectedInputTokens, projectedOutputTokens });
  }
  if (costs.projectedEstimatedCostUsd > maxBudgetUsd) {
    await writeBlockedArtifacts(outDir, `Projected cost $${costs.projectedEstimatedCostUsd} exceeds cap $${maxBudgetUsd}.`, costs);
    process.exitCode = 1;
    return;
  }

  const tracesDir = path.join(outDir, 'traces');
  await mkdir(tracesDir, { recursive: true });
  const results = [];
  for (const item of promptPayloads) {
    const startedAt = new Date().toISOString();
    const failures = [];
    let parsedOutput = null;
    let usage = {
      inputTokens: item.projectedInputTokens,
      outputTokens: dryRun ? estimateTokens(dryRunOutput(item.caseItem)) : 0,
      estimatedCostUsd: 0,
    };
    let latencyMs = 0;
    try {
      const providerResult = dryRun
        ? { output: dryRunOutput(item.caseItem), usage: { ...usage, estimatedCostUsd: estimateCostUsd(item.caseItem.model, usage.inputTokens, usage.outputTokens) }, latencyMs: 0 }
        : await callOpenAi(apiKey, item.caseItem, item.promptPayload);
      const validated = outputSchema.parse(providerResult.output);
      parsedOutput = validated;
      usage = providerResult.usage;
      latencyMs = providerResult.latencyMs;
      failures.push(...score(item.caseItem, validated));
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    addCost(costs, item.caseItem.model, usage);
    const result = {
      taskId: item.caseItem.id,
      family: item.caseItem.family,
      caseType: item.caseItem.caseType,
      skill: item.caseItem.skill,
      model: item.caseItem.model,
      status: failures.length ? 'fail' : 'pass',
      failures,
      output: parsedOutput,
      usage,
      latencyMs,
    };
    results.push(result);
    await writeFile(path.join(tracesDir, `${item.caseItem.id}.json`), `${JSON.stringify({
      startedAt,
      endedAt: new Date().toISOString(),
      dryRun,
      task: item.caseItem,
      skillContextPaths: {
        manifest: item.skillContext.manifestPath,
        skillFile: item.skillContext.skillFile,
      },
      projected: {
        inputTokens: item.projectedInputTokens,
        outputTokens: item.projectedOutputTokens,
      },
      result,
    }, null, 2)}\n`, 'utf8');
    if (costs.actualEstimatedCostUsd > maxBudgetUsd) {
      results.push({
        taskId: 'budget-stop',
        family: 'budget',
        caseType: 'budget_stop',
        skill: 'none',
        model: 'none',
        status: 'fail',
        failures: [`Actual estimated cost $${costs.actualEstimatedCostUsd} exceeded cap $${maxBudgetUsd}.`],
        output: null,
        usage: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
        latencyMs: 0,
      });
      break;
    }
  }

  const failedCases = results.filter((result) => result.status !== 'pass').length;
  const passingCases = results.filter((result) => result.status === 'pass').length;
  const status = passingCases === 0 ? 'fail' : failedCases ? 'review' : 'pass';
  const summary = {
    generatedAt: new Date().toISOString(),
    status,
    provider: dryRun ? 'dry-run' : 'openai',
    totalCases: cases.length,
    passingCases,
    failedCases,
    costs,
    recommendation: failedCases
      ? 'Review live-pilot failures before any broader live-provider wave.'
      : 'Proceed to deterministic comparative harness expansion before broad live-provider evaluation.',
    results,
  };
  await writeFile(path.join(outDir, 'pilot-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'pilot-summary.md'), renderLivePilotSummary(summary), 'utf8');
  await writeFile(path.join(outDir, 'costs.json'), `${JSON.stringify(costs, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'failures.md'), renderLivePilotFailures(summary), 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.status === 'fail') process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
