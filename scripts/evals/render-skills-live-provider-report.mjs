#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function renderLivePilotSummary(summary) {
  const modelRows = Object.entries(summary.costs.modelSplit)
    .map(([model, item]) => `| ${model} | ${item.calls} | ${item.inputTokens} | ${item.outputTokens} | ${item.estimatedCostUsd.toFixed(6)} |`)
    .join('\n');
  return `# ACP Skills V3 Live-Provider Pilot

Generated: ${summary.generatedAt}

Status: ${summary.status}

## Summary

- Cases: ${summary.totalCases}
- Passed: ${summary.passingCases}
- Failed: ${summary.failedCases}
- Estimated cost: $${summary.costs.actualEstimatedCostUsd.toFixed(6)}
- Budget cap: $${summary.costs.maxBudgetUsd.toFixed(2)}
- Provider: ${summary.provider}

## Model Split

| Model | Calls | Input tokens | Output tokens | Estimated cost |
| --- | ---: | ---: | ---: | ---: |
${modelRows}

## Allowed Claims

- Skills can be exercised through real or dry-run provider execution depending on run mode.
- Structured outputs, traces, escalation behavior, costs, latency, and failures are observable.
- Early divergence surfaces can be reviewed before broad live waves.

## Disallowed Claims

- Real-world civic efficacy.
- Full comparative superiority.
- Fairness solved.
- Field readiness.

## Recommendation

${summary.recommendation}
`;
}

export function renderLivePilotFailures(summary) {
  const failures = summary.results.filter((result) => result.status !== 'pass');
  if (!failures.length) {
    return `# ACP Skills V3 Live-Provider Pilot Failures

Generated: ${summary.generatedAt}

No live-pilot case failures were recorded.
`;
  }
  return `# ACP Skills V3 Live-Provider Pilot Failures

Generated: ${summary.generatedAt}

${failures.map((failure) => `## ${failure.taskId}

- Family: ${failure.family}
- Skill: ${failure.skill}
- Model: ${failure.model}
- Status: ${failure.status}
- Failures: ${failure.failures.join('; ')}
`).join('\n')}`;
}

async function main() {
  const [, , summaryPath, outDir] = process.argv;
  if (!summaryPath || !outDir) throw new Error('Usage: node scripts/evals/render-skills-live-provider-report.mjs <summary.json> <out-dir>');
  const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
  await writeFile(path.join(outDir, 'pilot-summary.md'), renderLivePilotSummary(summary), 'utf8');
  await writeFile(path.join(outDir, 'failures.md'), renderLivePilotFailures(summary), 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
