#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function renderSkillsEvalReport(summary) {
  const familyRows = Object.entries(summary.familyBreakdown)
    .map(([family, item]) => `| ${family} | ${item.total} | ${item.passing} | ${item.averageScore.toFixed(3)} | ${item.negativeControls} | ${item.hardCases} |`)
    .join('\n');
  const metricRows = Object.entries(summary.failureModeMetrics ?? {})
    .map(([metric, value]) => `| ${metric} | ${Number(value).toFixed(3)} |`)
    .join('\n');
  const dimensionRows = Object.entries(summary.dimensionAverages ?? {})
    .map(([dimension, value]) => `| ${dimension} | ${Number(value).toFixed(3)} |`)
    .join('\n');
  return `# ACP Skills V3 Deterministic Eval Report

Generated: ${summary.generatedAt}

Status: ${summary.status}

V3.1 status: ${summary.v3_1Status}

## Summary

- Cases: ${summary.totalCases}
- Passing: ${summary.passingCases}
- Families covered: ${summary.coverage.familiesCovered}/${summary.coverage.familiesRequired}
- Negative-control families: ${summary.coverage.negativeControlFamilies}/${summary.coverage.familiesRequired}
- Adversarial / overclaim cases: ${summary.coverage.adversarialOrOverclaimCases}
- Live-divergence-seeded hard cases: ${summary.coverage.liveDivergenceSeedCases}
- Full V3.1 48-case minimum met: ${summary.minimumCompletion.met}

## Family Breakdown

| Family | Cases | Passing | Average score | Negative controls | Hard cases |
| --- | ---: | ---: | ---: | ---: | ---: |
${familyRows}

## Scoring Dimensions

| Dimension | Mean score |
| --- | ---: |
${dimensionRows}

## Failure-Mode Metrics

| Metric | Value |
| --- | ---: |
${metricRows}

## Claim Boundary

This deterministic run supports fixture-level harness claims only. It does not support field efficacy, full comparative superiority, fairness-solved, or institutional readiness claims.
`;
}

export function renderFailureCasebook(summary) {
  const failures = summary.results.filter((result) => result.status !== 'pass');
  if (!failures.length) {
    return `# ACP Skills V3 Failure Casebook

Generated: ${summary.generatedAt}

No deterministic fixture failures in this run.

Negative controls still require reviewer attention because a green deterministic slice is not comparative behavioral proof.
`;
  }
  const entries = failures.map((failure) => `## ${failure.taskId}

- Family: ${failure.family}
- Case type: ${failure.caseType}
- Score: ${failure.score}
- Dimensions: ${Object.entries(failure.dimensions).map(([key, value]) => `${key}=${value}`).join(', ')}
- Failure modes: ${(failure.failureModes ?? []).join(', ') || 'none'}
- Failures: ${failure.failures.join('; ')}
`).join('\n');
  return `# ACP Skills V3 Failure Casebook

Generated: ${summary.generatedAt}

${entries}`;
}

export function renderDivergenceTaxonomy(summary) {
  const taxonomy = summary.divergenceTaxonomy ?? {};
  const rows = Object.entries(taxonomy.counts ?? {})
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join('\n');
  const liveSeedRows = (taxonomy.liveDivergenceSeedTasks ?? [])
    .map((item) => `| ${item.taskId} | ${item.family} | ${item.caseType} | ${item.interpretation} |`)
    .join('\n');
  return `# ACP Skills V3 Deterministic Divergence Taxonomy

Generated: ${summary.generatedAt}

This taxonomy converts live-provider pilot divergences into deterministic hard cases and separates label mismatch risk from substantive misses. It is a fixture-level result surface, not a live comparative wave.

## Divergence Counts

| Divergence class | Count |
| --- | ---: |
${rows}

## Live-Divergence-Seeded Cases

| Task | Family | Case type | Interpretation |
| --- | --- | --- | --- |
${liveSeedRows || '| none | none | none | none |'}

## Reviewer Use

- Label mismatches should not be treated the same as substantive failure when escalation, claim boundaries, and caught failure modes are correct.
- Substantive misses remain failures even if the action label looks plausible.
- Deterministic pass results remain bounded to fixture behavior and must not be promoted to field-efficacy claims.
`;
}

async function main() {
  const [, , summaryPath, outDir] = process.argv;
  if (!summaryPath || !outDir) {
    throw new Error('Usage: node scripts/evals/render-skills-eval-report.mjs <summary.json> <out-dir>');
  }
  const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
  await writeFile(path.join(outDir, 'report.md'), renderSkillsEvalReport(summary), 'utf8');
  await writeFile(path.join(outDir, 'failure-casebook.md'), renderFailureCasebook(summary), 'utf8');
  await writeFile(path.join(outDir, 'divergence-taxonomy.md'), renderDivergenceTaxonomy(summary), 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
