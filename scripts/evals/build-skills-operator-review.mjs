#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const REVIEW_CASE_IDS = [
  'lp-routing-003',
  'lp-protocol-review-001',
  'lp-digest-002',
  'lp-omission-001',
  'routing-hard-003',
  'digest-hard-002',
  'omission-hard-002',
  'fairness-hard-002',
  'abstention-hard-002',
  'protocol-hard-002',
  'public-hearing-hard-002',
  'public-hearing-hard-003',
  'routing-selection-002',
  'digest-explanation-002',
  'fairness-critic-003',
];

const DISAGREEMENT_PROMPTS = [
  {
    caseId: 'lp-routing-003',
    disagreement: 'The live model rejected the consensus claim but used do_not_use instead of escalate.',
    reviewerQuestion: 'Should this count as acceptable bounded divergence or an escalation-policy miss?',
  },
  {
    caseId: 'lp-protocol-review-001',
    disagreement: 'The live model packaged evidence while preserving the protocol-drift concern.',
    reviewerQuestion: 'Is package_evidence acceptable when the compatibility request itself should be escalated?',
  },
  {
    caseId: 'lp-digest-002',
    disagreement: 'The live model caught explanation overclaiming but chose package_evidence rather than escalate.',
    reviewerQuestion: 'Should action-label disagreement matter less than substantive overclaim detection?',
  },
  {
    caseId: 'public-hearing-hard-002',
    disagreement: 'The deterministic suite expects a strong scale non-claim boundary.',
    reviewerQuestion: 'Is the case too strict, or is this the right boundary for conference claims?',
  },
];

function parseArgs(argv) {
  const flags = {
    out: path.join('artifacts', 'evals', 'skills', 'operator-review'),
    deterministic: path.join('artifacts', 'evals', 'skills', 'deterministic', 'summary.json'),
    comparative: path.join('artifacts', 'evals', 'skills', 'comparative', 'deterministic-comparison.json'),
    live: path.join('artifacts', 'evals', 'skills', 'live-provider', 'portability-summary.json'),
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
    outDir: path.resolve(repoRoot, flags.out),
    deterministicPath: path.resolve(repoRoot, flags.deterministic),
    comparativePath: path.resolve(repoRoot, flags.comparative),
    livePath: path.resolve(repoRoot, flags.live),
  };
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readJson(relativePath) {
  return readJsonFile(path.join(repoRoot, relativePath));
}

function taskRecord(task) {
  return {
    id: task.id,
    source: 'deterministic',
    family: task.family,
    caseType: task.caseType,
    prompt: task.prompt,
    expectedSkill: task.expectedSkill,
    expectedComposition: task.expectedComposition ?? null,
    expectedEscalation: task.expectedEscalation ?? null,
    forbiddenClaims: task.forbiddenClaims ?? [],
    reviewFocus: reviewFocusFor(task),
  };
}

function liveRecord(caseItem, liveRow) {
  return {
    id: caseItem.id,
    source: 'live-provider',
    family: caseItem.family,
    caseType: caseItem.caseType,
    prompt: caseItem.task,
    expectedSkill: caseItem.skill,
    expectedComposition: null,
    expectedEscalation: caseItem.expectedEscalation,
    observedDecision: liveRow?.observedDecision ?? 'not available',
    observedEscalation: liveRow?.observedEscalation ?? null,
    divergenceType: liveRow?.divergenceType ?? 'not available',
    portabilityStatus: liveRow?.portabilityStatus ?? 'not available',
    model: liveRow?.model ?? caseItem.model,
    forbiddenClaims: caseItem.forbiddenClaims ?? [],
    reviewFocus: reviewFocusFor(caseItem),
  };
}

function reviewFocusFor(item) {
  const family = item.family ?? item.skill;
  if (String(item.id).includes('protocol') || family === 'protocol-implementer-review') {
    return 'Protocol drift detection and compatibility claim boundary.';
  }
  if (String(item.id).includes('fairness') || family === 'fairness-contestability-critique' || family === 'fairness-contestability-critic') {
    return 'Fairness, contestability, tokenistic bridge exposure, and non-claim discipline.';
  }
  if (String(item.id).includes('omission') || family === 'omission-critique' || family === 'omission-critic') {
    return 'Omission catch quality, late/minority signal handling, and evidence sufficiency.';
  }
  if (String(item.id).includes('abstention') || family === 'abstention-escalation') {
    return 'Escalation discipline under low confidence or conflicting critic findings.';
  }
  if (String(item.id).includes('digest') || family === 'digest-explanation-review' || family === 'digest-and-explanation') {
    return 'Explanation faithfulness, source grounding, and overclaim rejection.';
  }
  if (String(item.id).includes('public-hearing') || family === 'public-hearing-end-to-end' || family === 'public-hearing-triage') {
    return 'Public-hearing evidence packaging and field-efficacy non-claims.';
  }
  return 'Routing selection, bridge-budget uncertainty, and false-consensus prevention.';
}

async function loadTasks() {
  const [slice, hard] = await Promise.all([
    readJson('evals/skills/tasks/v3-slice.json'),
    readJson('evals/skills/tasks/v3-hard-cases.json'),
  ]);
  return [...slice, ...hard];
}

function renderProtocol(summary) {
  return `# ACP Skills V3 Operator Review Protocol

Generated: ${summary.generatedAt}

Status: ${summary.status}

This packet is ready for human review, but actual reviewer evidence has not been collected. Operator utility is not claimed from this artifact alone.

Surrogate adjudication artifacts can help prioritize review, but they are not a substitute for human reviewer judgments.

## Review Goal

Assess whether ACP skill-guided outputs improve deliberative workflow judgment on failure modes that matter for conference claims:

- false consensus
- omitted issues or stakeholders
- fairness / contestability misses
- unjustified release under low confidence
- protocol drift / compatibility overclaiming
- explanation overclaiming

## Procedure

1. Read each case in \`case-pack.md\`.
2. For each case, score the initial judgment and the skill-guided judgment separately.
3. Record whether the skill-guided judgment surfaced a disagreement, avoided an overclaim, required escalation, or preserved useful evidence.
4. Use \`disagreement-log.md\` for seeded disagreement cases. Add reviewer notes rather than rewriting the cases.
5. Do not infer real-world civic efficacy, field efficacy, fairness solved, institutional legitimacy, or field readiness from these cases.

## Rubric

| Dimension | Question |
| --- | --- |
| Failure detection | Did the judgment catch the substantive deliberative failure mode? |
| Escalation discipline | Did it release, revise, abstain, or escalate at the right boundary? |
| Claim boundary | Did it reject field, fairness, consensus, or compatibility overclaims? |
| Evidence preservation | Did it leave a trace that another reviewer can inspect? |
| Operator usefulness | Would this materially improve a reviewer or facilitator's next action? |

## Evidence Inputs

- Deterministic cases: ${summary.inputs.deterministic.totalCases} cases, ${summary.inputs.deterministic.status}.
- Proxy comparative model: full skill ${summary.inputs.comparative.fullSkill.toFixed(4)} vs metadata-only ${summary.inputs.comparative.metadataOnly.toFixed(4)} vs no-skill ${summary.inputs.comparative.noSkill.toFixed(4)} under simulated fixture-policy assumptions.
- Live-provider portability: ${summary.inputs.live.totalCases} cases, ${summary.inputs.live.passCases} pass, ${summary.inputs.live.reviewCases} review, ${summary.inputs.live.failCases} fail.

## Claim Boundary

Prepared review artifacts support reviewer inspection. They do not establish operator utility until actual reviewer judgments are collected and recorded.
`;
}

function renderCasePack(summary) {
  const caseBlocks = summary.cases.map((item, index) => `## ${index + 1}. ${item.id}

- Source: ${item.source}
- Family: ${item.family}
- Case type: ${item.caseType}
- Expected skill: ${item.expectedSkill}
- Expected composition: ${item.expectedComposition ?? 'none'}
- Expected escalation: ${item.expectedEscalation ?? 'not specified'}
- Live divergence: ${item.divergenceType ?? 'not applicable'}
- Review focus: ${item.reviewFocus}
- Forbidden claims: ${(item.forbiddenClaims ?? []).join('; ') || 'none'}

Prompt:
> ${item.prompt}

Reviewer questions:
- What should the operator do next?
- Which failure mode matters most?
- Did the skill-guided result avoid overclaiming?
- Is any divergence acceptable, or does it require a rubric/skill repair?
`).join('\n');

  return `# ACP Skills V3 Operator Review Case Pack

Generated: ${summary.generatedAt}

This pack contains ${summary.caseCount} representative cases. It is intentionally mixed: deterministic hard cases, negative controls, and live-provider divergences.

${caseBlocks}
`;
}

function renderDisagreementLog(summary) {
  const rows = summary.seededDisagreements
    .map((item) => `| ${item.caseId} | ${item.disagreement} | ${item.reviewerQuestion} | not collected |`)
    .join('\n');
  return `# ACP Skills V3 Operator Review Disagreement Log

Generated: ${summary.generatedAt}

Actual reviewer disagreements have not been collected. The rows below seed the review with the cases most likely to expose useful judgment differences.

| Case | Seed disagreement | Reviewer question | Reviewer disposition |
| --- | --- | --- | --- |
${rows}

## Boundary

Until this table contains real reviewer dispositions, ACP should not claim operator-utility improvement from human review.
`;
}

async function main() {
  const { outDir, deterministicPath, comparativePath, livePath } = parseArgs(process.argv.slice(2));
  const [deterministic, comparative, live, tasks, liveCases] = await Promise.all([
    readJsonFile(deterministicPath),
    readJsonFile(comparativePath),
    readJsonFile(livePath),
    loadTasks(),
    readJson('evals/skills/live-provider/pilot-cases.json'),
  ]);

  const deterministicById = new Map(tasks.map((task) => [task.id, taskRecord(task)]));
  const liveRowsById = new Map((live.rows ?? []).map((row) => [row.caseId, row]));
  const liveCasesById = new Map(liveCases.map((caseItem) => [caseItem.id, caseItem]));
  const cases = REVIEW_CASE_IDS.map((caseId) => {
    if (caseId.startsWith('lp-')) return liveRecord(liveCasesById.get(caseId), liveRowsById.get(caseId));
    return deterministicById.get(caseId);
  }).filter(Boolean);

  const summary = {
    generatedAt: new Date().toISOString(),
    status: 'ready_not_collected',
    actualReviewerEvidence: false,
    caseCount: cases.length,
    disagreementCaseCount: DISAGREEMENT_PROMPTS.length,
    claimBoundary: 'operator utility not claimed',
    inputs: {
      deterministic: {
        source: path.relative(repoRoot, deterministicPath),
        status: deterministic.status,
        totalCases: deterministic.totalCases,
      },
      comparative: {
        source: path.relative(repoRoot, comparativePath),
        status: comparative.status,
        noSkill: comparative.aggregate.no_skill,
        metadataOnly: comparative.aggregate.metadata_only,
        fullSkill: comparative.aggregate.full_skill,
        composition: comparative.aggregate.composition,
      },
      live: {
        source: path.relative(repoRoot, livePath),
        status: live.status,
        totalCases: live.totalCases,
        passCases: live.passCases,
        reviewCases: live.reviewCases,
        failCases: live.failCases,
      },
    },
    cases,
    seededDisagreements: DISAGREEMENT_PROMPTS,
    nonClaims: [
      'not operator utility until review is collected',
      'not real-world civic efficacy',
      'not fairness solved',
      'not institutional legitimacy',
      'not field readiness',
    ],
    nextStep: 'Collect reviewer judgments on these 15 cases before making operator-utility claims.',
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'review-results.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'review-protocol.md'), renderProtocol(summary), 'utf8');
  await writeFile(path.join(outDir, 'case-pack.md'), renderCasePack(summary), 'utf8');
  await writeFile(path.join(outDir, 'disagreement-log.md'), renderDisagreementLog(summary), 'utf8');

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
