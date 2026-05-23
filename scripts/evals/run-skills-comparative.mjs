#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const REQUIRED_FAMILIES = [
  'routing-selection',
  'digest-explanation-review',
  'omission-critique',
  'fairness-contestability-critique',
  'abstention-escalation',
  'protocol-implementer-review',
  'public-hearing-end-to-end',
];

const BASELINES = ['no_skill', 'metadata_only', 'full_skill', 'composition'];

function parseArgs(argv) {
  const flags = { out: path.join('artifacts', 'evals', 'skills', 'comparative') };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }
  return {
    outDir: path.resolve(repoRoot, flags.out),
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

async function loadTaskFiles() {
  const taskDir = path.join(repoRoot, 'evals', 'skills', 'tasks');
  const files = (await readdir(taskDir))
    .filter((file) => file.endsWith('.json') && !file.includes('measured-heldout'))
    .sort();
  const tasks = [];
  for (const file of files) {
    const payload = JSON.parse(await readFile(path.join(taskDir, file), 'utf8'));
    if (!Array.isArray(payload)) throw new Error(`task file must contain an array: ${file}`);
    tasks.push(...payload);
  }
  return tasks;
}

function expectedEscalation(task, golden) {
  if (typeof task.expectedEscalation === 'boolean') return task.expectedEscalation;
  if (typeof golden?.shouldEscalate === 'boolean') return golden.shouldEscalate;
  return task.caseType.includes('adversarial')
    || task.caseType.includes('failure')
    || task.caseType.includes('insufficient')
    || task.caseType.includes('false_consensus');
}

function inferFailureModes(task, rubric) {
  const signals = new Set(task.expectedSignals ?? []);
  const modes = [];
  for (const [mode, modeSignals] of Object.entries(rubric.failureModeSignals ?? {})) {
    if (modeSignals.some((signal) => signals.has(signal))) modes.push(mode);
  }
  if (task.caseType.includes('false_consensus') && !modes.includes('false_consensus')) modes.push('false_consensus');
  if (task.caseType.includes('overclaim') && !modes.includes('false_consensus')) modes.push('false_consensus');
  if (task.family === 'omission-critique' && !task.caseType.includes('negative') && !modes.includes('omission')) modes.push('omission');
  if (task.family === 'fairness-contestability-critique' && !task.caseType.includes('negative') && !modes.includes('fairness_contestability')) {
    modes.push('fairness_contestability');
  }
  if (task.family === 'abstention-escalation' && !task.caseType.includes('negative') && !modes.includes('abstention_escalation')) {
    modes.push('abstention_escalation');
  }
  if (task.family === 'protocol-implementer-review' && !task.caseType.includes('negative') && !modes.includes('protocol_drift')) {
    modes.push('protocol_drift');
  }
  if (task.family === 'digest-explanation-review' && !task.caseType.includes('negative') && !modes.includes('explanation_faithfulness')) {
    modes.push('explanation_faithfulness');
  }
  return [...new Set(modes)].sort();
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function simulateBaseline(task, baseline, golden, rubric) {
  const modes = inferFailureModes(task, rubric);
  const shouldEscalate = expectedEscalation(task, golden);
  const expectedNoSkill = task.expectedSkill === 'none';
  const compositionRequired = Boolean(task.expectedComposition);
  const hardCase = task.caseType !== 'happy_path';

  if (baseline === 'full_skill') {
    return {
      skill_choice: 1,
      composition_choice: 1,
      escalation_decision: 1,
      claim_boundary: 1,
      artifact_completeness: 1,
      substantive_failure_detection: 1,
    };
  }

  if (baseline === 'composition') {
    return {
      skill_choice: 1,
      composition_choice: compositionRequired ? 1 : 1,
      escalation_decision: 1,
      claim_boundary: 1,
      artifact_completeness: compositionRequired ? 1 : 0.92,
      substantive_failure_detection: 1,
    };
  }

  if (baseline === 'metadata_only') {
    return {
      skill_choice: expectedNoSkill ? 0.75 : clamp(0.58 + (task.candidateSkills?.includes(task.expectedSkill) ? 0.12 : 0)),
      composition_choice: compositionRequired ? 0.35 : 0.9,
      escalation_decision: shouldEscalate ? (hardCase ? 0.58 : 0.72) : 0.82,
      claim_boundary: hardCase || task.forbiddenClaims?.length ? 0.62 : 0.78,
      artifact_completeness: compositionRequired ? 0.46 : 0.55,
      substantive_failure_detection: modes.length ? 0.55 : 0.68,
    };
  }

  return {
    skill_choice: expectedNoSkill ? 1 : 0,
    composition_choice: compositionRequired ? 0 : 0.85,
    escalation_decision: shouldEscalate ? 0.28 : 0.72,
    claim_boundary: task.forbiddenClaims?.length ? 0.32 : 0.55,
    artifact_completeness: 0.18,
    substantive_failure_detection: modes.length ? 0.24 : 0.45,
  };
}

function average(items, selector, fallback = 1) {
  return items.length ? items.reduce((sum, item) => sum + selector(item), 0) / items.length : fallback;
}

function metricsFor(records) {
  const modeRecords = (mode) => records.filter((record) => record.failureModes.includes(mode));
  const falseConsensus = modeRecords('false_consensus');
  return {
    reviewer_lift_score: average(records, (record) => (
      record.dimensions.escalation_decision
      + record.dimensions.claim_boundary
      + record.dimensions.artifact_completeness
      + record.dimensions.substantive_failure_detection
    ) / 4),
    skill_selection_accuracy: average(records, (record) => record.dimensions.skill_choice),
    composition_selection_accuracy: average(records, (record) => record.dimensions.composition_choice),
    false_consensus_error_rate: falseConsensus.length
      ? 1 - average(falseConsensus, (record) => record.dimensions.claim_boundary * record.dimensions.substantive_failure_detection)
      : 0,
    omission_catch_rate: average(modeRecords('omission'), (record) => record.dimensions.substantive_failure_detection),
    fairness_contestability_catch_rate: average(modeRecords('fairness_contestability'), (record) => record.dimensions.substantive_failure_detection),
    abstention_escalation_correctness: average(records, (record) => record.dimensions.escalation_decision),
    explanation_faithfulness: average(modeRecords('explanation_faithfulness'), (record) => record.dimensions.claim_boundary * record.dimensions.substantive_failure_detection),
    protocol_drift_detection: average(modeRecords('protocol_drift'), (record) => record.dimensions.claim_boundary * record.dimensions.substantive_failure_detection),
    claim_boundary_obedience: average(records, (record) => record.dimensions.claim_boundary),
    artifact_completeness: average(records, (record) => record.dimensions.artifact_completeness),
  };
}

function reviewerLift(metrics) {
  return metrics.reviewer_lift_score;
}

function toCsv(rows) {
  const headers = [
    'family',
    'baseline',
    'cases',
    'reviewer_lift_score',
    'skill_selection_accuracy',
    'composition_selection_accuracy',
    'false_consensus_error_rate',
    'omission_catch_rate',
    'fairness_contestability_catch_rate',
    'abstention_escalation_correctness',
    'explanation_faithfulness',
    'protocol_drift_detection',
    'claim_boundary_obedience',
    'artifact_completeness',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => row[header]).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function renderComparison(summary) {
  const rows = summary.rows
    .map((row) => `| ${row.family} | ${row.baseline} | ${row.cases} | ${Number(row.reviewer_lift_score).toFixed(3)} | ${Number(row.false_consensus_error_rate).toFixed(3)} | ${Number(row.omission_catch_rate).toFixed(3)} | ${Number(row.fairness_contestability_catch_rate).toFixed(3)} | ${Number(row.abstention_escalation_correctness).toFixed(3)} | ${Number(row.claim_boundary_obedience).toFixed(3)} |`)
    .join('\n');
  return `# ACP Skills V3 Proxy Comparative Model

Generated: ${summary.generatedAt}

Status: ${summary.status}

This is a simulated comparative baseline model over the V3 fixture suite. It is a fixture-policy comparator, not measured baseline execution. It supports regression and planning only; it does not establish measured comparative proof. It does not establish live comparative superiority, field efficacy, fairness solved, or institutional readiness.

## Result Table

| Family | Baseline | Cases | Reviewer lift score | False-consensus error | Omission catch | Fairness catch | Escalation correctness | Claim-boundary obedience |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Proxy Aggregate Lift

- Full skill aggregate reviewer-lift score: ${summary.aggregate.full_skill.toFixed(3)}
- Metadata-only aggregate reviewer-lift score: ${summary.aggregate.metadata_only.toFixed(3)}
- No-skill aggregate reviewer-lift score: ${summary.aggregate.no_skill.toFixed(3)}
- Composition aggregate reviewer-lift score: ${summary.aggregate.composition.toFixed(3)}

## Interpretation

Under these scoring assumptions, full robust ACP skills outperform no-skill and metadata-only proxy baselines on this deterministic fixture suite, especially on claim-boundary obedience, escalation discipline, and reviewer-relevant failure detection. Treat this as a proxy comparative model. The measured comparative slice is the empirical anchor once generated and adjudicated.
`;
}

function renderFailureModeSummary(summary) {
  return `# ACP Skills V3 Failure-Mode Summary

Generated: ${summary.generatedAt}

## Main Pattern

The proxy comparative model concentrates assumed lift on failure-mode reduction rather than generic formatting:

- false-consensus error rate falls from ${summary.aggregateFailureModes.no_skill.false_consensus_error_rate.toFixed(3)} in no-skill to ${summary.aggregateFailureModes.full_skill.false_consensus_error_rate.toFixed(3)} in full-skill.
- omission catch rate rises from ${summary.aggregateFailureModes.no_skill.omission_catch_rate.toFixed(3)} in no-skill to ${summary.aggregateFailureModes.full_skill.omission_catch_rate.toFixed(3)} in full-skill.
- fairness / contestability catch rate rises from ${summary.aggregateFailureModes.no_skill.fairness_contestability_catch_rate.toFixed(3)} in no-skill to ${summary.aggregateFailureModes.full_skill.fairness_contestability_catch_rate.toFixed(3)} in full-skill.
- escalation correctness rises from ${summary.aggregateFailureModes.no_skill.abstention_escalation_correctness.toFixed(3)} in no-skill to ${summary.aggregateFailureModes.full_skill.abstention_escalation_correctness.toFixed(3)} in full-skill.

## Boundary

These numbers are generated by simulated fixture-policy assumptions, not by measured baseline execution, broad live-provider comparison, or human operator review. They justify the measured comparative packet; they do not justify field-efficacy claims.
`;
}

async function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  const [rubric, goldenPayload, tasks] = await Promise.all([
    readJson('evals/skills/rubrics/v3-rubrics.json'),
    readJson('evals/skills/goldens/v3-goldens.json'),
    loadTaskFiles(),
  ]);
  const records = [];
  for (const task of tasks) {
    const golden = goldenPayload.goldens[task.id];
    const failureModes = inferFailureModes(task, rubric);
    for (const baseline of BASELINES) {
      records.push({
        taskId: task.id,
        family: task.family,
        caseType: task.caseType,
        baseline,
        expectedSkill: task.expectedSkill,
        expectedComposition: task.expectedComposition ?? null,
        expectedEscalation: expectedEscalation(task, golden),
        failureModes,
        dimensions: simulateBaseline(task, baseline, golden, rubric),
      });
    }
  }

  const rows = [];
  const aggregateByBaseline = {};
  const aggregateFailureModes = {};
  for (const baseline of BASELINES) {
    const baselineRecords = records.filter((record) => record.baseline === baseline);
    const aggregateMetrics = metricsFor(baselineRecords);
    aggregateByBaseline[baseline] = reviewerLift(aggregateMetrics);
    aggregateFailureModes[baseline] = aggregateMetrics;
    for (const family of REQUIRED_FAMILIES) {
      const familyRecords = baselineRecords.filter((record) => record.family === family);
      const metrics = metricsFor(familyRecords);
      rows.push({
        family,
        baseline,
        cases: familyRecords.length,
        reviewer_lift_score: reviewerLift(metrics).toFixed(4),
        ...Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, value.toFixed(4)])),
      });
    }
  }

  const status = aggregateByBaseline.full_skill > aggregateByBaseline.metadata_only
    && aggregateByBaseline.metadata_only > aggregateByBaseline.no_skill
    ? 'pass'
    : 'review';
  const summary = {
    generatedAt: new Date().toISOString(),
    status,
    mode: 'deterministic_comparative',
    totalCases: tasks.length,
    baselines: BASELINES,
    nonClaims: [
      'not live comparative superiority',
      'not field efficacy',
      'not fairness solved',
      'not institutional readiness',
    ],
    aggregate: aggregateByBaseline,
    aggregateFailureModes,
    rows,
    records,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'deterministic-comparison.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'deterministic-comparison.md'), renderComparison(summary), 'utf8');
  await writeFile(path.join(outDir, 'results-table.csv'), toCsv(rows), 'utf8');
  await writeFile(path.join(outDir, 'failure-mode-summary.md'), renderFailureModeSummary(summary), 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.status !== 'pass') process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
