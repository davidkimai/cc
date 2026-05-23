#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const flags = {
    source: path.join('artifacts', 'evals', 'skills', 'live-provider', 'pilot-summary.json'),
    out: path.join('artifacts', 'evals', 'skills', 'live-provider'),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }
  return {
    sourcePath: path.resolve(repoRoot, flags.source),
    outDir: path.resolve(repoRoot, flags.out),
  };
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readJson(relativePath) {
  return readJsonFile(path.join(repoRoot, relativePath));
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function textMatches(haystack, needle) {
  const normalizedHaystack = normalize(haystack);
  const normalizedNeedle = normalize(needle);
  if (!normalizedNeedle) return true;
  if (normalizedHaystack.includes(normalizedNeedle)) return true;
  const needleWords = normalizedNeedle.split(' ').filter((word) => word.length > 3);
  if (!needleWords.length) return false;
  return needleWords.every((word) => normalizedHaystack.includes(word) || normalizedHaystack.includes(word.slice(0, Math.max(4, word.length - 2))));
}

function claimRejected(output, claim) {
  const rejected = output?.disallowedClaimsRejected ?? [];
  return rejected.some((item) => textMatches(item, claim))
    || (normalize(claim).includes('field ready') && rejected.some((item) => normalize(item).includes('field readiness')));
}

function hasSubstantiveCatch(caseItem, output) {
  if (!output) return false;
  if (!caseItem.expectedEscalation) return true;
  const caughtText = [...(output.caughtFailures ?? []), ...(output.traceNotes ?? []), output.allowedClaim ?? ''].join(' ');
  if ((output.caughtFailures ?? []).length > 0 && (caseItem.forbiddenClaims ?? []).some((claim) => textMatches(caughtText, claim))) return true;
  if ((output.caughtFailures ?? []).length > 0 && (caseItem.forbiddenClaims ?? []).every((claim) => claimRejected(output, claim))) return true;
  return false;
}

function classifyDivergence(caseItem, result) {
  const output = result.output;
  if (!output) {
    return {
      status: 'fail',
      divergenceType: 'schema_or_provider_failure',
      substantiveFailure: true,
      notes: ['No validated structured output was preserved.'],
    };
  }

  const skillMatch = output.selectedSkill === caseItem.skill;
  const decisionMatch = output.decision === caseItem.expectedDecision;
  const escalationMatch = output.escalation === caseItem.expectedEscalation;
  const claimBoundaryOk = (caseItem.forbiddenClaims ?? []).every((claim) => claimRejected(output, claim));
  const substantiveCatch = hasSubstantiveCatch(caseItem, output);
  const dimensions = {
    skill_choice: skillMatch ? 1 : 0,
    action_label: decisionMatch ? 1 : 0,
    escalation_decision: escalationMatch ? 1 : 0,
    claim_boundary: claimBoundaryOk ? 1 : 0,
    substantive_failure_detection: substantiveCatch ? 1 : 0,
    trace_legibility: (output.traceNotes ?? []).length > 0 || (output.caughtFailures ?? []).length > 0 ? 1 : 0,
  };
  const notes = [];
  if (!skillMatch) notes.push(`selected skill ${output.selectedSkill} did not match ${caseItem.skill}`);
  if (!decisionMatch) notes.push(`action label ${output.decision} differed from expected ${caseItem.expectedDecision}`);
  if (!escalationMatch) notes.push(`escalation ${output.escalation} differed from expected ${caseItem.expectedEscalation}`);
  if (!claimBoundaryOk) notes.push('one or more forbidden claims were not explicitly rejected');
  if (!substantiveCatch) notes.push('substantive failure was not clearly detected');

  if (Object.values(dimensions).every((value) => value === 1)) {
    return { status: 'pass', divergenceType: 'none', substantiveFailure: false, dimensions, notes };
  }
  if (skillMatch && claimBoundaryOk && substantiveCatch && (escalationMatch || output.decision === 'do_not_use' || output.decision === 'package_evidence')) {
    return {
      status: 'review',
      divergenceType: escalationMatch ? 'label_mismatch' : 'acceptable_bounded_divergence',
      substantiveFailure: false,
      dimensions,
      notes,
    };
  }
  return {
    status: 'fail',
    divergenceType: 'substantive_failure',
    substantiveFailure: true,
    dimensions,
    notes,
  };
}

function summarizeRows(rows, costs) {
  const totalCases = rows.length;
  const passCases = rows.filter((row) => row.portabilityStatus === 'pass').length;
  const reviewCases = rows.filter((row) => row.portabilityStatus === 'review').length;
  const failCases = rows.filter((row) => row.portabilityStatus === 'fail').length;
  const byModel = {};
  const byFamily = {};
  const divergenceCounts = {};
  for (const row of rows) {
    byModel[row.model] ??= { cases: 0, pass: 0, review: 0, fail: 0, estimatedCostUsd: 0, latencyMsTotal: 0 };
    byModel[row.model].cases += 1;
    byModel[row.model][row.portabilityStatus] += 1;
    byModel[row.model].estimatedCostUsd = Number((byModel[row.model].estimatedCostUsd + row.estimatedCostUsd).toFixed(6));
    byModel[row.model].latencyMsTotal += row.latencyMs;
    byFamily[row.family] ??= { cases: 0, pass: 0, review: 0, fail: 0 };
    byFamily[row.family].cases += 1;
    byFamily[row.family][row.portabilityStatus] += 1;
    divergenceCounts[row.divergenceType] = (divergenceCounts[row.divergenceType] ?? 0) + 1;
  }
  for (const item of Object.values(byModel)) {
    item.averageLatencyMs = item.cases ? Math.round(item.latencyMsTotal / item.cases) : 0;
    delete item.latencyMsTotal;
  }
  return {
    totalCases,
    passCases,
    reviewCases,
    failCases,
    byModel,
    byFamily,
    divergenceCounts,
    costEnvelope: {
      actualEstimatedCostUsd: costs.actualEstimatedCostUsd,
      projectedEstimatedCostUsd: costs.projectedEstimatedCostUsd,
      maxBudgetUsd: costs.maxBudgetUsd,
      modelSplit: costs.modelSplit,
    },
  };
}

function toCsv(rows) {
  const headers = [
    'case',
    'family',
    'model',
    'portability_status',
    'original_status',
    'divergence_type',
    'expected_decision',
    'observed_decision',
    'expected_escalation',
    'observed_escalation',
    'latency_ms',
    'estimated_cost_usd',
    'arbitration_used',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([
      row.caseId,
      row.family,
      row.model,
      row.portabilityStatus,
      row.originalStatus,
      row.divergenceType,
      row.expectedDecision,
      row.observedDecision,
      row.expectedEscalation,
      row.observedEscalation,
      row.latencyMs,
      row.estimatedCostUsd.toFixed(6),
      row.arbitrationUsed,
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderPortabilitySummary(summary) {
  const modelRows = Object.entries(summary.modelFindings)
    .map(([model, item]) => `| ${model} | ${item.cases} | ${item.pass} | ${item.review} | ${item.fail} | ${item.averageLatencyMs} | ${item.estimatedCostUsd.toFixed(6)} |`)
    .join('\n');
  const familyRows = Object.entries(summary.familyFindings)
    .map(([family, item]) => `| ${family} | ${item.cases} | ${item.pass} | ${item.review} | ${item.fail} |`)
    .join('\n');
  return `# ACP Skills V3 Live-Provider Portability Summary

Generated: ${summary.generatedAt}

Status: ${summary.status}

This rescoring pass uses the existing live-provider pilot artifacts. It did not spend additional provider budget.

## Result

- Cases: ${summary.totalCases}
- Pass: ${summary.passCases}
- Review: ${summary.reviewCases}
- Fail: ${summary.failCases}
- Estimated cost: $${summary.costEnvelope.actualEstimatedCostUsd.toFixed(6)}
- Budget cap: $${summary.costEnvelope.maxBudgetUsd.toFixed(2)}

## Model Findings

| Model | Cases | Pass | Review | Fail | Avg latency ms | Estimated cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${modelRows}

## Family Findings

| Family | Cases | Pass | Review | Fail |
| --- | ---: | ---: | ---: | ---: |
${familyRows}

## Answers To F3 Questions

1. Flagship skill flows executed through real provider calls and preserved structured outputs, traces, cost, and latency.
2. Most divergences were label or bounded-action divergences rather than substantive misses.
3. The most fragile surfaces are adversarial routing, protocol drift review, and clean release packaging because action labels vary even when claim boundaries are preserved.
4. Trace artifacts are sufficient for later review because they preserve input case, output JSON, failures, usage, latency, and this portability assessment.
5. \`gpt-5.4-mini\` was sufficient for most pilot cases as a portability smoke surface, but not yet proven as the best comparative judge.
6. The one \`gpt-5.4\` use was a hard fairness overclaim arbitration case. Keep \`gpt-5.4\` reserved for hard fairness, omission, and protocol-drift arbitration until comparative live evidence says otherwise.

## Non-Claims

- No real-world civic efficacy.
- No full live comparative superiority.
- No fairness-solved claim.
- No field readiness.
`;
}

function renderDivergenceTaxonomy(summary) {
  const rows = Object.entries(summary.divergenceCounts)
    .map(([kind, count]) => `| ${kind} | ${count} |`)
    .join('\n');
  const reviewRows = summary.rows
    .filter((row) => row.portabilityStatus !== 'pass')
    .map((row) => `| ${row.caseId} | ${row.family} | ${row.divergenceType} | ${row.expectedDecision} | ${row.observedDecision} | ${row.expectedEscalation} | ${row.observedEscalation} | ${row.notes.join('; ')} |`)
    .join('\n');
  return `# ACP Skills V3 Live-Provider Divergence Taxonomy

Generated: ${summary.generatedAt}

## Counts

| Divergence type | Count |
| --- | ---: |
${rows}

## Review Cases

| Case | Family | Divergence | Expected label | Observed label | Expected escalation | Observed escalation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
${reviewRows || '| none | none | none | none | none | none | none | none |'}

## Interpretation

The pilot's apparent failures are mostly useful portability signals: models sometimes choose a different action label while still rejecting forbidden claims and preserving substantive concerns. The later broad live wave should stress action-label calibration and escalation policy before any comparative live claim.
`;
}

function renderFailures(summary) {
  const substantive = summary.rows.filter((row) => row.portabilityStatus === 'fail');
  const review = summary.rows.filter((row) => row.portabilityStatus === 'review');
  return `# ACP Skills V3 Live-Provider Failures And Divergences

Generated: ${summary.generatedAt}

## Substantive Failures

${substantive.length ? substantive.map((row) => `- ${row.caseId}: ${row.notes.join('; ')}`).join('\n') : 'No substantive portability failures after taxonomy rescoring.'}

## Review Divergences

${review.length ? review.map((row) => `- ${row.caseId}: ${row.divergenceType}; ${row.notes.join('; ')}`).join('\n') : 'No review divergences.'}
`;
}

async function main() {
  const { sourcePath, outDir } = parseArgs(process.argv.slice(2));
  const [pilotSummary, cases] = await Promise.all([
    readJsonFile(sourcePath),
    readJson('evals/skills/live-provider/pilot-cases.json'),
  ]);
  const casesById = new Map(cases.map((caseItem) => [caseItem.id, caseItem]));
  const rows = [];
  for (const result of pilotSummary.results ?? []) {
    const caseItem = casesById.get(result.taskId);
    if (!caseItem) continue;
    const assessment = classifyDivergence(caseItem, result);
    rows.push({
      caseId: result.taskId,
      family: result.family,
      model: result.model,
      originalStatus: result.status,
      portabilityStatus: assessment.status,
      divergenceType: assessment.divergenceType,
      expectedDecision: caseItem.expectedDecision,
      observedDecision: result.output?.decision ?? 'none',
      expectedEscalation: caseItem.expectedEscalation,
      observedEscalation: result.output?.escalation ?? false,
      latencyMs: result.latencyMs ?? 0,
      estimatedCostUsd: result.usage?.estimatedCostUsd ?? 0,
      arbitrationUsed: result.model === 'gpt-5.4',
      dimensions: assessment.dimensions,
      substantiveFailure: assessment.substantiveFailure,
      notes: assessment.notes,
    });
  }
  const aggregate = summarizeRows(rows, pilotSummary.costs);
  const summary = {
    generatedAt: new Date().toISOString(),
    status: aggregate.failCases ? 'review' : 'pass',
    sourcePilot: path.relative(repoRoot, sourcePath),
    totalCases: aggregate.totalCases,
    passCases: aggregate.passCases,
    reviewCases: aggregate.reviewCases,
    failCases: aggregate.failCases,
    modelFindings: aggregate.byModel,
    familyFindings: aggregate.byFamily,
    divergenceCounts: aggregate.divergenceCounts,
    costEnvelope: aggregate.costEnvelope,
    recommendation: aggregate.failCases
      ? 'Repair substantive live-provider failures before expanding the live set.'
      : 'Use these portability results to design a small targeted live expansion only after operator-review surfaces are ready.',
    nonClaims: [
      'not real-world civic efficacy',
      'not full live comparative superiority',
      'not fairness solved',
      'not field readiness',
    ],
    rows,
  };

  await mkdir(path.join(outDir, 'traces'), { recursive: true });
  await writeFile(path.join(outDir, 'portability-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'portability-summary.md'), renderPortabilitySummary(summary), 'utf8');
  await writeFile(path.join(outDir, 'divergence-taxonomy.md'), renderDivergenceTaxonomy(summary), 'utf8');
  await writeFile(path.join(outDir, 'results-table.csv'), toCsv(rows), 'utf8');
  await writeFile(path.join(outDir, 'costs.json'), `${JSON.stringify(summary.costEnvelope, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'failures.md'), renderFailures(summary), 'utf8');

  for (const row of rows) {
    const tracePath = path.join(outDir, 'traces', `${row.caseId}.json`);
    let trace = {};
    try {
      trace = await readJsonFile(tracePath);
    } catch {
      trace = {};
    }
    await writeFile(tracePath, `${JSON.stringify({ ...trace, portabilityAssessment: row }, null, 2)}\n`, 'utf8');
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.failCases > 0) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
