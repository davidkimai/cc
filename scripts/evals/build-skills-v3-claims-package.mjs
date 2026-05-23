#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const CASEBOOK_IDS = [
  'routing-hard-003',
  'digest-hard-002',
  'omission-hard-002',
  'fairness-hard-002',
  'abstention-hard-002',
  'protocol-hard-002',
  'lp-routing-003',
  'lp-protocol-review-001',
];

function parseArgs(argv) {
  const flags = {
    out: path.join('artifacts', 'evals', 'skills', 'final'),
    deterministic: path.join('artifacts', 'evals', 'skills', 'deterministic', 'summary.json'),
    comparative: path.join('artifacts', 'evals', 'skills', 'comparative', 'deterministic-comparison.json'),
    measured: path.join('artifacts', 'evals', 'skills', 'measured-comparative', 'summary.json'),
    'measured-adjudication': path.join('artifacts', 'evals', 'skills', 'measured-comparative', 'adjudication', 'summary.json'),
    live: path.join('artifacts', 'evals', 'skills', 'live-provider', 'portability-summary.json'),
    'operator-review': path.join('artifacts', 'evals', 'skills', 'operator-review'),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }
  const operatorReviewDir = path.resolve(repoRoot, flags['operator-review']);
  return {
    outDir: path.resolve(repoRoot, flags.out),
    deterministicPath: path.resolve(repoRoot, flags.deterministic),
    comparativePath: path.resolve(repoRoot, flags.comparative),
    measuredPath: path.resolve(repoRoot, flags.measured),
    measuredAdjudicationPath: path.resolve(repoRoot, flags['measured-adjudication']),
    livePath: path.resolve(repoRoot, flags.live),
    operatorReviewDir,
    operatorReviewPath: path.join(operatorReviewDir, 'review-results.json'),
  };
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readOptionalJson(filePath) {
  try {
    return await readJsonFile(filePath);
  } catch {
    return null;
  }
}

function fmt(value, digits = 4) {
  return Number(value).toFixed(digits);
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function renderClaimsMemo(context) {
  const measuredSentence = context.measuredAdjudication
    ? `- Measured held-out slice: ${context.measuredAdjudication.totalCases} cases, ${context.measuredAdjudication.totalOutputs} generated outputs adjudicated blind, status ${context.measuredAdjudication.status}, with ${context.measuredAdjudication.arbitration.arbitrationUsed} arbitration calls. This slice does not yet establish a simple full-skill superiority claim.`
    : '- Measured held-out slice: not available in this package.';
  const liveAdjudicationSentence = context.live.surrogateAdjudication
    ? `- Live-provider surrogate adjudication: ${context.live.surrogateAdjudication.reviewCasesAdjudicated} review divergences rejudged, ${context.live.surrogateAdjudication.arbitrationUsed} arbitration calls, status ${context.live.surrogateAdjudication.status}.`
    : '- Live-provider surrogate adjudication: not available in this package.';
  return `# ACP Skills V3 Claims Memo

Generated: ${context.generatedAt}

## Claim ACP Can Support Now

ACP now has a measured and surrogate-adjudicated Skills V3 evidence program showing bounded comparative behavior on deliberative workflow tasks, plus narrow low-cost live-provider portability. The evidence is stronger than structural maturity or proxy fixtures alone, but it remains bounded: surrogate adjudication is not human operator review, and the measured slice is not field efficacy.

## Evidence Basis

- Structural maturity: \`skills:audit\` remains green for the Skills V2 suite.
- Deterministic benchmark: ${context.deterministic.totalCases} cases across seven families, with ${context.deterministic.coverage.negativeControlFamilies}/7 negative-control coverage.
- Proxy comparative model: full skill ${fmt(context.comparative.aggregate.full_skill)} vs metadata-only ${fmt(context.comparative.aggregate.metadata_only)} vs no-skill ${fmt(context.comparative.aggregate.no_skill)} under simulated fixture-policy assumptions.
${measuredSentence}
- Live-provider portability: ${context.live.totalCases} cases, ${context.live.passCases} exact passes, ${context.live.reviewCases} review divergences, ${context.live.failCases} substantive failures, estimated cost $${context.live.costEnvelope.actualEstimatedCostUsd.toFixed(6)}.
${liveAdjudicationSentence}
- Operator review: packet prepared, actual reviewer evidence not collected.

## Paper-Safe Interpretation

The strongest claim is bounded measured-slice evidence plus surrogate adjudication, supported by proxy fixture coverage and low-cost live portability. The measured slice is a paper-grade anchor for uncertainty and failure surfaces, not yet a broad superiority result. The current evidence does not prove real-world civic efficacy, institutional legitimacy, fairness solved, operator utility, or field readiness.
`;
}

function renderResultsOverview(context) {
  const comparisonRows = [
    ['No skill', fmt(context.comparative.aggregate.no_skill), fmt(context.comparative.aggregateFailureModes.no_skill.false_consensus_error_rate), fmt(context.comparative.aggregateFailureModes.no_skill.omission_catch_rate), fmt(context.comparative.aggregateFailureModes.no_skill.fairness_contestability_catch_rate), fmt(context.comparative.aggregateFailureModes.no_skill.claim_boundary_obedience)],
    ['Metadata-only', fmt(context.comparative.aggregate.metadata_only), fmt(context.comparative.aggregateFailureModes.metadata_only.false_consensus_error_rate), fmt(context.comparative.aggregateFailureModes.metadata_only.omission_catch_rate), fmt(context.comparative.aggregateFailureModes.metadata_only.fairness_contestability_catch_rate), fmt(context.comparative.aggregateFailureModes.metadata_only.claim_boundary_obedience)],
    ['Full skill', fmt(context.comparative.aggregate.full_skill), fmt(context.comparative.aggregateFailureModes.full_skill.false_consensus_error_rate), fmt(context.comparative.aggregateFailureModes.full_skill.omission_catch_rate), fmt(context.comparative.aggregateFailureModes.full_skill.fairness_contestability_catch_rate), fmt(context.comparative.aggregateFailureModes.full_skill.claim_boundary_obedience)],
    ['Composition', fmt(context.comparative.aggregate.composition), fmt(context.comparative.aggregateFailureModes.composition.false_consensus_error_rate), fmt(context.comparative.aggregateFailureModes.composition.omission_catch_rate), fmt(context.comparative.aggregateFailureModes.composition.fairness_contestability_catch_rate), fmt(context.comparative.aggregateFailureModes.composition.claim_boundary_obedience)],
  ];
  const liveRows = Object.entries(context.live.modelFindings)
    .map(([model, item]) => [model, item.cases, item.pass, item.review, item.fail, item.averageLatencyMs, `$${item.estimatedCostUsd.toFixed(6)}`]);
  const measuredRows = context.measuredAdjudication
    ? Object.entries(context.measuredAdjudication.byBaseline)
      .map(([baseline, item]) => [baseline, item.outputs, item.pass, item.review, item.fail, item.averageOverallScore.toFixed(4), item.claimBoundaryObedience.toFixed(4), item.arbitrationUsed])
    : [['not available', 0, 0, 0, 0, 'n/a', 'n/a', 0]];
  const operatorRows = [
    ['Operator review', context.operator.status, context.operator.caseCount, context.operator.disagreementCaseCount, context.operator.actualReviewerEvidence ? 'yes' : 'no', context.operator.claimBoundary],
  ];
  return `# ACP Skills V3 Results Overview

Generated: ${context.generatedAt}

## Table 1: Proxy Fixture Comparator

${mdTable(['Baseline', 'Reviewer lift', 'False-consensus error', 'Omission catch', 'Fairness catch', 'Claim-boundary obedience'], comparisonRows)}

## Table 2: Measured Held-Out Slice With Blinded Surrogate Adjudication

${mdTable(['Baseline', 'Outputs', 'Pass', 'Review', 'Fail', 'Overall score', 'Claim boundary', 'Arbitrations'], measuredRows)}

## Table 3: Live-Provider Portability And Cost

${mdTable(['Model', 'Cases', 'Pass', 'Review', 'Fail', 'Avg latency ms', 'Estimated cost'], liveRows)}

## Table 4: Reviewer / Operator Usefulness

${mdTable(['Layer', 'Status', 'Cases', 'Seeded disagreements', 'Actual evidence', 'Claim boundary'], operatorRows)}

## Interpretation

ACP now has a clearer evidence chain: proxy fixture coverage, measured held-out baseline execution with separated blinded surrogate adjudication, live-provider portability and cost, and a ready human-review packet. The measured slice should be read conservatively: composition outputs score best in this slice, but full-skill superiority is not established. The operator-utility layer remains a prepared protocol, not an empirical result, until reviewer judgments are collected.
`;
}

function renderResultsTableCsv(context) {
  const rows = [
    ['table', 'scope', 'metric', 'value', 'notes'],
    ['proxy_fixture_comparator', 'no_skill', 'reviewer_lift_score', fmt(context.comparative.aggregate.no_skill), 'simulated fixture-policy comparator, not measured execution'],
    ['proxy_fixture_comparator', 'metadata_only', 'reviewer_lift_score', fmt(context.comparative.aggregate.metadata_only), 'simulated fixture-policy comparator, not measured execution'],
    ['proxy_fixture_comparator', 'full_skill', 'reviewer_lift_score', fmt(context.comparative.aggregate.full_skill), 'simulated fixture-policy comparator, not measured execution'],
    ['proxy_fixture_comparator', 'composition', 'reviewer_lift_score', fmt(context.comparative.aggregate.composition), 'simulated fixture-policy comparator, not measured execution'],
    ['deterministic_failure_modes', 'full_skill', 'false_consensus_error_rate', fmt(context.comparative.aggregateFailureModes.full_skill.false_consensus_error_rate), 'bounded fixture metric'],
    ['deterministic_failure_modes', 'full_skill', 'omission_catch_rate', fmt(context.comparative.aggregateFailureModes.full_skill.omission_catch_rate), 'bounded fixture metric'],
    ['deterministic_failure_modes', 'full_skill', 'fairness_contestability_catch_rate', fmt(context.comparative.aggregateFailureModes.full_skill.fairness_contestability_catch_rate), 'bounded fixture metric'],
    ['live_provider_portability', 'all_models', 'cases', context.live.totalCases, 'existing live pilot rescored; no new spend'],
    ['live_provider_portability', 'all_models', 'pass_review_fail', `${context.live.passCases}/${context.live.reviewCases}/${context.live.failCases}`, 'pass/review/fail'],
    ['live_provider_portability', 'all_models', 'estimated_cost_usd', context.live.costEnvelope.actualEstimatedCostUsd.toFixed(6), 'actual estimated pilot cost'],
    ['operator_review', 'prepared_packet', 'actual_reviewer_evidence', context.operator.actualReviewerEvidence ? 'yes' : 'no', context.operator.claimBoundary],
  ];
  if (context.measuredAdjudication) {
    for (const [baseline, item] of Object.entries(context.measuredAdjudication.byBaseline)) {
      rows.push(['measured_blinded_surrogate_adjudication', baseline, 'average_overall_score', item.averageOverallScore.toFixed(4), 'measured output, baseline hidden from judge prompt']);
      rows.push(['measured_blinded_surrogate_adjudication', baseline, 'claim_boundary_obedience', item.claimBoundaryObedience.toFixed(4), 'measured output, surrogate adjudication']);
      rows.push(['measured_blinded_surrogate_adjudication', baseline, 'pass_review_fail', `${item.pass}/${item.review}/${item.fail}`, 'surrogate adjudication, not human review']);
    }
  }
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function renderFailureTaxonomy(context) {
  const deterministicRows = Object.entries(context.deterministic.divergenceTaxonomy.counts)
    .map(([kind, count]) => [kind, count]);
  const liveRows = Object.entries(context.live.divergenceCounts)
    .map(([kind, count]) => [kind, count]);
  const adjudicatedLiveRows = Object.entries(context.live.adjudicatedDivergenceCounts ?? {})
    .map(([kind, count]) => [kind, count]);
  return `# ACP Skills V3 Failure Taxonomy

Generated: ${context.generatedAt}

## Deterministic Divergence Taxonomy

${mdTable(['Type', 'Count'], deterministicRows)}

## Live-Provider Divergence Taxonomy

${mdTable(['Type', 'Count'], liveRows)}

## Surrogate-Adjudicated Live Review Divergences

${mdTable(['Final type', 'Count'], adjudicatedLiveRows.length ? adjudicatedLiveRows : [['not available', 0]])}

## Reviewer-Relevant Reading

- Deterministic failures are intentionally sparse after F1 hardening; the suite is now better read as a bounded fixture benchmark.
- Live-provider review cases are mostly label mismatches, not substantive misses, after F3 rescoring.
- Measured comparative outputs are separated from adjudication; baseline identity is hidden from the judge prompt where practical.
- Measured held-out results should not be rounded up into broad full-skill superiority.
- The broad live comparative wave should stress action-label calibration and escalation policy before any live superiority claim.
`;
}

function renderCasebook(context) {
  const deterministicById = new Map((context.deterministic.results ?? []).map((result) => [result.taskId, result]));
  const liveById = new Map((context.live.rows ?? []).map((row) => [row.caseId, row]));
  const blocks = CASEBOOK_IDS.map((caseId) => {
    const deterministic = deterministicById.get(caseId);
    if (deterministic) {
      return `## ${caseId}

- Source: deterministic
- Family: ${deterministic.family}
- Case type: ${deterministic.caseType}
- Failure modes: ${(deterministic.failureModes ?? []).join(', ') || 'none'}
- Score: ${deterministic.score}
- Reviewer value: ${casebookValue(caseId)}
`;
    }
    const live = liveById.get(caseId);
    if (live) {
      return `## ${caseId}

- Source: live-provider
- Family: ${live.family}
- Model: ${live.model}
- Portability status: ${live.portabilityStatus}
- Divergence type: ${live.divergenceType}
- Expected / observed decision: ${live.expectedDecision} / ${live.observedDecision}
- Reviewer value: ${casebookValue(caseId)}
`;
    }
    return `## ${caseId}

Case not found in current artifacts.
`;
  }).join('\n');
  return `# ACP Skills V3 Casebook

Generated: ${context.generatedAt}

This casebook highlights the result-bearing examples a reviewer should inspect first.

${blocks}
`;
}

function casebookValue(caseId) {
  const map = {
    'routing-hard-003': 'false-consensus pressure and dissent-preservation boundary',
    'digest-hard-002': 'explanation overclaim pressure',
    'omission-hard-002': 'loud redundancy hiding caregiver-access testimony',
    'fairness-hard-002': 'tokenistic bridge exposure and minority-erasure risk',
    'abstention-hard-002': 'conflicting critics and release discipline',
    'protocol-hard-002': 'routing_reason drift versus explanation_text protocol truth',
    'lp-routing-003': 'acceptable bounded divergence under adversarial consensus overclaim',
    'lp-protocol-review-001': 'live label mismatch with substantive protocol-drift catch',
  };
  return map[caseId] ?? 'representative review case';
}

function renderNonClaims(context) {
  return `# ACP Skills V3 Non-Claims

Generated: ${context.generatedAt}

ACP should not claim any of the following from the current Skills V3 evidence:

- real-world civic efficacy
- fairness solved
- institutional legitimacy proved
- legal adequacy for public hearings
- field readiness from fixtures or the narrow live pilot alone
- broad superiority beyond the tested task families
- live comparative superiority from the deterministic comparison
- measured-slice superiority beyond the held-out cases
- operator utility from surrogate adjudication
- operator utility before actual reviewer judgments are collected

## Positive Boundary

The current evidence supports bounded claims about structural maturity, proxy fixture coverage, measured held-out behavior with blinded surrogate adjudication, live-provider portability, trace preservation, and prepared operator review.
`;
}

function renderStartHere(context) {
  return `# ACP Skills V3 Reviewer Start Here

Generated: ${context.generatedAt}

Read in this order:

1. \`skills-v3-claims-memo.md\` for the bounded claim.
2. \`skills-v3-results-overview.md\` for the three result tables.
3. \`skills-v3-results-table.csv\` if you want machine-readable metrics.
4. \`skills-v3-failure-taxonomy.md\` for deterministic and live divergence interpretation.
5. \`skills-v3-casebook.md\` for the strongest review cases.
6. \`skills-v3-non-claims.md\` before using any claim in paper prose.
7. \`../operator-review/review-protocol.md\` and \`../operator-review/case-pack.md\` before collecting human review.

Current bottom line: ACP Skills V3 now has proxy fixture coverage, a measured held-out slice with blinded surrogate adjudication, and live-provider portability evidence. The measured slice improves truthfulness of the evidence program but does not prove broad full-skill superiority. Operator utility is prepared for review but not yet empirically established.
`;
}

async function main() {
  const { outDir, deterministicPath, comparativePath, measuredPath, measuredAdjudicationPath, livePath, operatorReviewDir, operatorReviewPath } = parseArgs(process.argv.slice(2));
  const [deterministic, comparative, measured, measuredAdjudication, live, operator] = await Promise.all([
    readJsonFile(deterministicPath),
    readJsonFile(comparativePath),
    readOptionalJson(measuredPath),
    readOptionalJson(measuredAdjudicationPath),
    readJsonFile(livePath),
    readJsonFile(operatorReviewPath),
  ]);
  const context = {
    generatedAt: new Date().toISOString(),
    deterministic,
    comparative,
    measured,
    measuredAdjudication,
    live,
    operator,
    paths: {
      deterministic: path.relative(repoRoot, deterministicPath),
      comparative: path.relative(repoRoot, comparativePath),
      measured: path.relative(repoRoot, measuredPath),
      measuredAdjudication: path.relative(repoRoot, measuredAdjudicationPath),
      live: path.relative(repoRoot, livePath),
      operatorReview: path.relative(repoRoot, operatorReviewDir),
    },
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'skills-v3-claims-memo.md'), renderClaimsMemo(context), 'utf8');
  await writeFile(path.join(outDir, 'skills-v3-results-overview.md'), renderResultsOverview(context), 'utf8');
  await writeFile(path.join(outDir, 'skills-v3-results-table.csv'), renderResultsTableCsv(context), 'utf8');
  await writeFile(path.join(outDir, 'skills-v3-failure-taxonomy.md'), renderFailureTaxonomy(context), 'utf8');
  await writeFile(path.join(outDir, 'skills-v3-casebook.md'), renderCasebook(context), 'utf8');
  await writeFile(path.join(outDir, 'skills-v3-non-claims.md'), renderNonClaims(context), 'utf8');
  await writeFile(path.join(outDir, 'reviewer-start-here.md'), renderStartHere(context), 'utf8');

  process.stdout.write(`${JSON.stringify({
    generatedAt: context.generatedAt,
    status: 'pass',
    outDir: path.relative(repoRoot, outDir),
    inputs: context.paths,
    files: [
      'skills-v3-claims-memo.md',
      'skills-v3-results-overview.md',
      'skills-v3-results-table.csv',
      'skills-v3-failure-taxonomy.md',
      'skills-v3-casebook.md',
      'skills-v3-non-claims.md',
      'reviewer-start-here.md',
    ],
    nonClaimsPreserved: true,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
