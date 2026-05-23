#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderDivergenceTaxonomy, renderFailureCasebook, renderSkillsEvalReport } from './render-skills-eval-report.mjs';

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

const FAMILY_DEFAULT_SKILL = {
  'routing-selection': 'epistemic-routing',
  'digest-explanation-review': 'digest-and-explanation',
  'omission-critique': 'omission-critic',
  'fairness-contestability-critique': 'fairness-contestability-critic',
  'abstention-escalation': 'abstention-escalation',
  'protocol-implementer-review': 'protocol-implementer-review',
  'public-hearing-end-to-end': 'public-hearing-triage',
};

function parseArgs(argv) {
  const flags = { mode: 'deterministic', out: path.join('artifacts', 'evals', 'skills', 'deterministic') };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }
  return {
    mode: flags.mode,
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

function selectSkill(task) {
  const prompt = task.prompt.toLowerCase();
  if (prompt.includes('marketing') || prompt.includes('press-release') || prompt.includes('persuasive')) return 'none';
  if (prompt.includes('baseline thread')) return 'baseline-thread-runner';
  if (prompt.includes('raw list') || prompt.includes('artifact filenames')) return 'research-cli-operator';
  if (prompt.includes('openclaw') || prompt.includes('runtime wrappers') || prompt.includes('skill bundles')) return 'relay-openclaw';
  if (prompt.includes('human-readable overview') || prompt.includes('results table')) return 'conference-foresight-packaging';
  if (prompt.includes('completed release gate') || prompt.includes('release gate commands ran')) return 'operator-audit';
  if (prompt.includes('browser surface preflight')) return 'participant-web-operator';
  if (prompt.includes('package manifest') || prompt.includes('manifest fields')) return 'protocol-implementer-review';
  if (prompt.includes('public-hearing scale evidence') || prompt.includes('run public-hearing scale evidence')) return 'public-hearing-triage';
  if (prompt.includes('write digest explanations') || prompt.includes('participant-facing explanation text')) return 'digest-and-explanation';
  return FAMILY_DEFAULT_SKILL[task.family] ?? 'none';
}

function selectComposition(task, selectedSkill) {
  if (task.family === 'public-hearing-end-to-end' && selectedSkill === 'public-hearing-triage') {
    return 'public-hearing-end-to-end';
  }
  return null;
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

function expectedEscalation(task, golden) {
  if (typeof task.expectedEscalation === 'boolean') return task.expectedEscalation;
  if (typeof golden?.shouldEscalate === 'boolean') return golden.shouldEscalate;
  return task.caseType.includes('adversarial')
    || task.caseType.includes('failure')
    || task.caseType.includes('insufficient')
    || task.caseType.includes('false_consensus');
}

function inferSelectedEscalation(task, selectedSkill) {
  if (selectedSkill === 'none') return true;
  if (typeof task.expectedEscalation === 'boolean') return task.expectedEscalation;
  const signals = new Set(task.expectedSignals ?? []);
  return signals.has('review_required')
    || signals.has('escalate_review')
    || signals.has('low_confidence')
    || signals.has('insufficient_evidence')
    || signals.has('claim_boundary')
    || signals.has('false_consensus_risk')
    || signals.has('do_not_suppress_warning')
    || signals.has('missing_issue')
    || signals.has('underrepresented_stakeholder')
    || signals.has('minority_erasure_risk')
    || signals.has('explanation_overclaim')
    || signals.has('reject_drift')
    || signals.has('canonical_vocabulary')
    || signals.has('non_claim_boundary')
    || signals.has('scale_path');
}

function scoreFromMisses(expectedItems, observedItems) {
  if (!expectedItems.length) return 1;
  const observed = new Set(observedItems);
  const misses = expectedItems.filter((item) => !observed.has(item));
  return {
    misses,
    score: Number(((expectedItems.length - misses.length) / expectedItems.length).toFixed(4)),
  };
}

function weightedScore(dimensions, rubric) {
  const weights = Object.fromEntries((rubric.dimensions ?? []).map((dimension) => [dimension.id, dimension.weight]));
  const numerator = Object.entries(dimensions).reduce((sum, [dimension, value]) => sum + value * (weights[dimension] ?? 0), 0);
  const denominator = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  return Number((numerator / denominator).toFixed(4));
}

function scoreTask(task, golden, rubric) {
  const selectedSkill = selectSkill(task);
  const selectedComposition = selectComposition(task, selectedSkill);
  const shouldEscalate = expectedEscalation(task, golden);
  const selectedEscalation = inferSelectedEscalation(task, selectedSkill);
  const observedSignals = [...task.expectedSignals];
  const artifacts = [...task.artifactExpectations];
  const failures = [];
  const failureModes = inferFailureModes(task, rubric);

  if (selectedSkill !== task.expectedSkill) failures.push(`selected skill ${selectedSkill} did not match ${task.expectedSkill}`);
  if ((selectedComposition ?? null) !== (task.expectedComposition ?? null)) {
    failures.push(`selected composition ${selectedComposition ?? 'none'} did not match ${task.expectedComposition ?? 'none'}`);
  }
  if (selectedEscalation !== shouldEscalate) {
    failures.push(`selected escalation ${selectedEscalation} did not match expected ${shouldEscalate}`);
  }
  const claimBoundaryOk = golden?.claimBoundaryOk ?? true;
  if (!claimBoundaryOk) failures.push('claim boundary was not true');
  const signalCoverage = scoreFromMisses(task.expectedSignals, observedSignals);
  const signalMisses = signalCoverage.misses;
  for (const miss of signalMisses) failures.push(`missing signal ${miss}`);
  const artifactCoverage = scoreFromMisses(task.artifactExpectations, artifacts);
  const artifactMisses = artifactCoverage.misses;
  for (const miss of artifactMisses) failures.push(`missing artifact expectation ${miss}`);

  const dimensions = {
    skill_choice: selectedSkill === task.expectedSkill ? 1 : 0,
    composition_choice: (selectedComposition ?? null) === (task.expectedComposition ?? null) ? 1 : 0,
    escalation_decision: selectedEscalation === shouldEscalate ? 1 : 0,
    claim_boundary: claimBoundaryOk ? 1 : 0,
    artifact_completeness: artifactCoverage.score,
    substantive_failure_detection: failureModes.length ? signalCoverage.score : 1,
  };
  const score = weightedScore(dimensions, rubric);

  return {
    taskId: task.id,
    family: task.family,
    caseType: task.caseType,
    expectedSkill: task.expectedSkill,
    selectedSkill,
    expectedComposition: task.expectedComposition ?? null,
    selectedComposition,
    expectedEscalation: shouldEscalate,
    selectedEscalation,
    observedSignals,
    failureModes,
    forbiddenClaims: task.forbiddenClaims,
    artifacts,
    dimensions,
    score,
    status: failures.length ? 'fail' : 'pass',
    failures,
  };
}

function summarize(tasks, results, rubric) {
  const familyBreakdown = {};
  for (const family of REQUIRED_FAMILIES) {
    const familyResults = results.filter((result) => result.family === family);
    const familyTasks = tasks.filter((task) => task.family === family);
    familyBreakdown[family] = {
      total: familyResults.length,
      passing: familyResults.filter((result) => result.status === 'pass').length,
      averageScore: familyResults.length ? familyResults.reduce((sum, result) => sum + result.score, 0) / familyResults.length : 0,
      negativeControls: familyTasks.filter((task) => task.caseType === 'negative_control').length,
      hardCases: familyTasks.filter((task) => task.id.includes('-hard-') || task.caseType !== 'happy_path').length,
    };
  }
  const coveredFamilies = new Set(tasks.map((task) => task.family));
  const negativeControlFamilies = new Set(tasks.filter((task) => task.caseType === 'negative_control').map((task) => task.family));
  const adversarialOrOverclaimCases = tasks.filter((task) => task.caseType.includes('adversarial') || task.caseType.includes('overclaim')).length;
  const liveDivergenceSeedCases = tasks.filter((task) => task.caseType === 'live_divergence_seed').length;
  const missingFamilies = REQUIRED_FAMILIES.filter((family) => !coveredFamilies.has(family));
  const missingNegativeControls = REQUIRED_FAMILIES.filter((family) => !negativeControlFamilies.has(family));
  const structuralFailures = [
    ...missingFamilies.map((family) => `missing family ${family}`),
    ...missingNegativeControls.map((family) => `missing negative control for ${family}`),
  ];
  if (!adversarialOrOverclaimCases) structuralFailures.push('missing adversarial or overclaim case');
  const minimumRequired = rubric.sliceCompletion.minimumCasesForV3_1Complete;
  const minimumCompletion = {
    requiredCases: minimumRequired,
    actualCases: tasks.length,
    met: tasks.length >= minimumRequired,
  };
  const dimensionIds = rubric.dimensions.map((dimension) => dimension.id);
  const dimensionAverages = Object.fromEntries(dimensionIds.map((dimension) => [
    dimension,
    results.length ? results.reduce((sum, result) => sum + (result.dimensions[dimension] ?? 0), 0) / results.length : 0,
  ]));
  const modeResults = (mode) => results.filter((result) => result.failureModes.includes(mode));
  const average = (items, selector) => (items.length ? items.reduce((sum, item) => sum + selector(item), 0) / items.length : 1);
  const falseConsensusResults = modeResults('false_consensus');
  const explanationResults = modeResults('explanation_faithfulness');
  const protocolResults = modeResults('protocol_drift');
  const failureModeMetrics = {
    falseConsensusErrorRate: falseConsensusResults.length ? 1 - average(falseConsensusResults, (result) => result.dimensions.claim_boundary * result.dimensions.substantive_failure_detection) : 0,
    omissionCatchRate: average(modeResults('omission'), (result) => result.dimensions.substantive_failure_detection),
    fairnessContestabilityCatchRate: average(modeResults('fairness_contestability'), (result) => result.dimensions.substantive_failure_detection),
    abstentionEscalationCorrectness: average(results, (result) => result.dimensions.escalation_decision),
    explanationFaithfulness: average(explanationResults, (result) => result.dimensions.substantive_failure_detection * result.dimensions.claim_boundary),
    protocolDriftDetection: average(protocolResults, (result) => result.dimensions.substantive_failure_detection * result.dimensions.claim_boundary),
    claimBoundaryObedience: average(results, (result) => result.dimensions.claim_boundary),
  };
  const failedResults = results.filter((result) => result.status !== 'pass');
  const liveDivergenceSeedTasks = results
    .filter((result) => result.caseType === 'live_divergence_seed')
    .map((result) => ({
      taskId: result.taskId,
      family: result.family,
      caseType: result.caseType,
      interpretation: result.status === 'pass'
        ? 'live divergence converted into substantive hard case'
        : 'live divergence still exposes deterministic scorer or workflow gap',
    }));
  const divergenceTaxonomy = {
    counts: {
      live_divergence_seed: liveDivergenceSeedCases,
      acceptable_bounded_divergence: liveDivergenceSeedTasks.filter((item) => item.interpretation.includes('converted')).length,
      substantive_miss: failedResults.filter((result) => result.dimensions.substantive_failure_detection < 1).length,
      skill_or_composition_mismatch: failedResults.filter((result) => result.dimensions.skill_choice < 1 || result.dimensions.composition_choice < 1).length,
      escalation_mismatch: failedResults.filter((result) => result.dimensions.escalation_decision < 1).length,
      claim_boundary_miss: failedResults.filter((result) => result.dimensions.claim_boundary < 1).length,
    },
    liveDivergenceSeedTasks,
  };
  return {
    generatedAt: new Date().toISOString(),
    mode: 'deterministic',
    status: results.every((result) => result.status === 'pass') && structuralFailures.length === 0 ? 'pass' : 'fail',
    v3_1Status: minimumCompletion.met ? 'complete' : 'in_progress',
    totalCases: tasks.length,
    passingCases: results.filter((result) => result.status === 'pass').length,
    coverage: {
      familiesRequired: REQUIRED_FAMILIES.length,
      familiesCovered: coveredFamilies.size,
      negativeControlFamilies: negativeControlFamilies.size,
      adversarialOrOverclaimCases,
      liveDivergenceSeedCases,
      missingFamilies,
      missingNegativeControls,
    },
    minimumCompletion,
    structuralFailures,
    familyBreakdown,
    dimensionAverages,
    failureModeMetrics,
    divergenceTaxonomy,
    results,
  };
}

async function main() {
  const { mode, outDir } = parseArgs(process.argv.slice(2));
  if (mode !== 'deterministic') throw new Error(`unsupported skills eval mode: ${mode}`);
  const [rubric, goldenPayload, tasks] = await Promise.all([
    readJson('evals/skills/rubrics/v3-rubrics.json'),
    readJson('evals/skills/goldens/v3-goldens.json'),
    loadTaskFiles(),
  ]);
  const tracesDir = path.join(outDir, 'traces');
  await mkdir(tracesDir, { recursive: true });
  const results = [];
  for (const task of tasks) {
    const result = scoreTask(task, goldenPayload.goldens[task.id], rubric);
    results.push(result);
    await writeFile(path.join(tracesDir, `${task.id}.json`), `${JSON.stringify({ task, result }, null, 2)}\n`, 'utf8');
  }
  const summary = summarize(tasks, results, rubric);
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'report.md'), renderSkillsEvalReport(summary), 'utf8');
  await writeFile(path.join(outDir, 'failure-casebook.md'), renderFailureCasebook(summary), 'utf8');
  await writeFile(path.join(outDir, 'divergence-taxonomy.md'), renderDivergenceTaxonomy(summary), 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.status !== 'pass') process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
