import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const manifestPath = path.join(repoRoot, 'benchmarks', 'manifest.json');
const replayManifestPath = path.join(repoRoot, 'fixtures', 'replay', 'manifest.json');

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      flags[token.slice(2)] = argv[index + 1];
      index += 1;
      continue;
    }
    positional.push(token);
  }
  return {
    mode: positional[0] || 'comparison',
    scenarioClass: flags.class,
    outDir: flags.out,
    surface: flags.surface || 'batch',
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
}

function mean(values) {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function summarizeFeedback(feedbackEntries) {
  const answers = feedbackEntries.map((entry) => entry.answers || {});
  return {
    overload: mean(answers.map((entry) => entry.overload).filter((value) => Number.isFinite(value))),
    usefulness: mean(answers.map((entry) => entry.usefulness).filter((value) => Number.isFinite(value))),
    exchangeQuality: mean(answers.map((entry) => entry.exchangeQuality).filter((value) => Number.isFinite(value))),
    explanationClarity: mean(answers.map((entry) => entry.explanationClarity).filter((value) => Number.isFinite(value))),
    returnWillingness: mean(answers.map((entry) => entry.returnWillingness).filter((value) => Number.isFinite(value))),
  };
}

function dominantCriterion(decision) {
  const factors = decision.factors || {};
  const weights = decision.criteriaWeights || {};
  const weighted = [
    ['recipient_relevance', (factors.recipientRelevance ?? 0) * (weights.recipient_relevance ?? 0)],
    ['prompt_relevance', (factors.promptRelevance ?? 0) * (weights.prompt_relevance ?? 0)],
    ['bridge_perspective', (factors.bridgePerspective ?? 0) * (weights.bridge_perspective ?? 0)],
    ['load_balance', (1 - (factors.loadCost ?? 1)) * (weights.load_balance ?? 0)],
  ];
  return weighted.sort((a, b) => b[1] - a[1])[0][0];
}

function summarizeCriteria(cycle) {
  const decisions = cycle.routingDecisions || [];
  const criteria = cycle.config?.deliberativeCriteria || [];
  const decisionsWithFactors = decisions.filter((decision) => decision.factors && decision.criteriaWeights).length;
  const dominantCounts = {};
  for (const decision of decisions) {
    const criterion = dominantCriterion(decision);
    dominantCounts[criterion] = (dominantCounts[criterion] ?? 0) + 1;
  }
  const averageFactors = decisionsWithFactors
    ? {
        recipientRelevance: mean(decisions.map((decision) => decision.factors?.recipientRelevance).filter((value) => Number.isFinite(value))),
        promptRelevance: mean(decisions.map((decision) => decision.factors?.promptRelevance).filter((value) => Number.isFinite(value))),
        bridgePerspective: mean(decisions.map((decision) => decision.factors?.bridgePerspective).filter((value) => Number.isFinite(value))),
        loadCost: mean(decisions.map((decision) => decision.factors?.loadCost).filter((value) => Number.isFinite(value))),
      }
    : {};
  return {
    criteria,
    criteriaCount: criteria.length,
    decisionsWithFactors,
    decisionsWithCriteriaWeights: decisions.filter((decision) => decision.criteriaWeights && Object.keys(decision.criteriaWeights).length > 0).length,
    dominantCriteria: dominantCounts,
    averageFactors,
    sharedWeights: decisions.find((decision) => decision.criteriaWeights)?.criteriaWeights || {},
  };
}

function summarizeProceduralLayer(cycle) {
  const layer = cycle.proceduralLayer;
  return {
    present: Boolean(layer),
    referenceCount: layer?.references?.length || 0,
    artifactExpectationCount: layer?.artifactExpectations?.length || 0,
    contestPointCount: layer?.contestPoints?.length || 0,
    selectedProcedureCount: layer?.execution?.selectedProcedureIds?.length || 0,
    expectedArtifactCoverage: layer?.execution?.adherence?.expectedArtifactCoverage ?? null,
    allRequiredArtifactsProduced: layer?.execution?.adherence?.allRequiredArtifactsProduced ?? null,
    escalationSource: layer?.execution?.escalation?.source ?? null,
    escalationAction: layer?.execution?.escalation?.recommendedAction ?? null,
    humanReviewRequired: layer?.execution?.escalation?.humanReviewRequired ?? null,
  };
}

function summarizeEngineV2(cycle) {
  const trace = cycle.engineV2;
  if (!trace) {
    return {
      present: false,
      engineMode: cycle.config?.engineMode || 'heuristic',
      issueClusterCount: 0,
      contributionRecordCount: 0,
      criticSeverities: {},
      escalation: null,
      issueCoverageRate: null,
      stakeholderDiversityRate: null,
      modelAudit: null,
    };
  }
  return {
    present: true,
    engineMode: trace.engineMode,
    provider: trace.provider,
    primaryModel: trace.modelPolicy?.primaryModel,
    arbitrationModel: trace.modelPolicy?.arbitrationModel,
    promptVersions: trace.promptVersions || {},
    issueClusterCount: trace.issueMap?.clusters?.length || 0,
    contributionRecordCount: trace.contributionRecords?.length || 0,
    criticSeverities: Object.fromEntries((trace.critics || []).map((critic) => [critic.criticType, critic.severity])),
    escalation: trace.escalation || null,
    issueCoverageRate: trace.digestSetCritique?.issueCoverageRate ?? null,
    stakeholderDiversityRate: trace.digestSetCritique?.stakeholderDiversityRate ?? null,
    modelAudit: trace.modelAudit || null,
  };
}

function buildEvidence({ scenario, cycle, runManifest, conformance }) {
  const exportModes = (runManifest.exports || []).map((entry) => entry.mode);
  const feedbackEntries = cycle.feedback || cycle.feedbackEntries || [];
  return {
    scenarioId: scenario.scenarioId,
    title: scenario.title,
    prompt: scenario.prompt,
    condition: scenario.condition,
    participantCount: (scenario.participants || []).length,
    contributionCount: (cycle.contributions || []).length,
    responseCount: (cycle.responses || []).length,
    feedbackCount: feedbackEntries.length,
    routingDecisionCount: (cycle.routingDecisions || []).length,
    digestCount: (cycle.digests || []).length,
    auditEventCount: (cycle.auditEvents || []).length,
    telemetryEventCount: (cycle.telemetryEvents || []).length,
    exportModes,
    metrics: cycle.metrics || {},
    criteria: summarizeCriteria(cycle),
    engineV2: summarizeEngineV2(cycle),
    proceduralLayer: summarizeProceduralLayer(cycle),
    averageFeedback: summarizeFeedback(feedbackEntries),
    conformanceResult: conformance.result,
  };
}

function buildComparisonSummary(benchmarkClass, interventionEvidence, baselineEvidence, bundleManifest) {
  const interventionFeedback = interventionEvidence.averageFeedback || {};
  const baselineFeedback = baselineEvidence.averageFeedback || {};

  return {
    bundleId: bundleManifest.bundleId,
    scenarioClass: benchmarkClass.slug,
    title: benchmarkClass.title,
    domain: benchmarkClass.domain,
    description: benchmarkClass.description,
    conditions: {
      intervention: interventionEvidence.condition,
      baseline: baselineEvidence.condition,
    },
    pairSignals: {
      routingContrast: interventionEvidence.routingDecisionCount > 0 && baselineEvidence.routingDecisionCount === 0,
      digestContrast: interventionEvidence.digestCount > 0 && baselineEvidence.digestCount === 0,
      sharedParticipantCount: interventionEvidence.participantCount === baselineEvidence.participantCount,
      sharedContributionCount: interventionEvidence.contributionCount === baselineEvidence.contributionCount,
      stableExportSurface: interventionEvidence.exportModes.length >= baselineEvidence.exportModes.length,
      criteriaEvidencePresent:
        interventionEvidence.criteria.decisionsWithFactors === interventionEvidence.routingDecisionCount &&
        interventionEvidence.criteria.decisionsWithCriteriaWeights === interventionEvidence.routingDecisionCount &&
        interventionEvidence.criteria.criteriaCount >= 4,
      engineV2TracePresent: interventionEvidence.engineV2.present === true,
      engineV2CriticsPresent:
        interventionEvidence.engineV2.present === true &&
        Boolean(interventionEvidence.engineV2.criticSeverities.omission) &&
        Boolean(interventionEvidence.engineV2.criticSeverities.fairness),
      proceduralLayerPresent: interventionEvidence.proceduralLayer.present === true,
      proceduralContestPointsPresent: interventionEvidence.proceduralLayer.contestPointCount > 0,
    },
    comparison: {
      contributionCountDelta: interventionEvidence.contributionCount - baselineEvidence.contributionCount,
      responseCountDelta: interventionEvidence.responseCount - baselineEvidence.responseCount,
      overloadDelta: interventionFeedback.overload !== null && baselineFeedback.overload !== null
        ? Number((interventionFeedback.overload - baselineFeedback.overload).toFixed(2))
        : null,
      usefulnessDelta: interventionFeedback.usefulness !== null && baselineFeedback.usefulness !== null
        ? Number((interventionFeedback.usefulness - baselineFeedback.usefulness).toFixed(2))
        : null,
      exchangeQualityDelta: interventionFeedback.exchangeQuality !== null && baselineFeedback.exchangeQuality !== null
        ? Number((interventionFeedback.exchangeQuality - baselineFeedback.exchangeQuality).toFixed(2))
        : null,
      bridgeExposureDelta: Number(
        (((interventionEvidence.metrics || {}).bridgeExposureRate ?? 0) - ((baselineEvidence.metrics || {}).bridgeExposureRate ?? 0)).toFixed(2),
      ),
      contributorCoverageDelta: Number(
        (((interventionEvidence.metrics || {}).averageContributorCoverage ?? 0) - ((baselineEvidence.metrics || {}).averageContributorCoverage ?? 0)).toFixed(2),
      ),
    },
    criteria: {
      sharedWeights: interventionEvidence.criteria.sharedWeights,
      averageFactors: interventionEvidence.criteria.averageFactors,
      dominantCriteria: interventionEvidence.criteria.dominantCriteria,
    },
    engineV2: interventionEvidence.engineV2,
    proceduralLayer: interventionEvidence.proceduralLayer,
    intervention: interventionEvidence,
    baseline: baselineEvidence,
  };
}

function comparisonSummaryToMarkdown(summary, bundleManifest) {
  const checks = Object.entries(summary.pairSignals)
    .map(([label, value]) => `| ${label} | ${value ? 'pass' : 'fail'} |`)
    .join('\n');

  return `# ACP comparison summary

- Bundle: ${bundleManifest.bundleId}
- Scenario class: ${summary.scenarioClass}
- Title: ${summary.title}
- Domain: ${summary.domain}

## Pair checks

| Check | Status |
| --- | --- |
${checks}

## Headline deltas

- Overload delta: ${summary.comparison.overloadDelta ?? 'n/a'}
- Usefulness delta: ${summary.comparison.usefulnessDelta ?? 'n/a'}
- Exchange quality delta: ${summary.comparison.exchangeQualityDelta ?? 'n/a'}
- Bridge exposure delta: ${summary.comparison.bridgeExposureDelta}
- Contributor coverage delta: ${summary.comparison.contributorCoverageDelta}

## Shared criteria

- Criteria evidence present: ${summary.pairSignals.criteriaEvidencePresent ? 'pass' : 'fail'}
- Shared weights: ${JSON.stringify(summary.criteria.sharedWeights)}
- Average routing factors: ${JSON.stringify(summary.criteria.averageFactors)}
- Dominant criteria: ${JSON.stringify(summary.criteria.dominantCriteria)}

## Engine V2

- Trace present: ${summary.pairSignals.engineV2TracePresent ? 'pass' : 'fail'}
- Critics present: ${summary.pairSignals.engineV2CriticsPresent ? 'pass' : 'fail'}
- Issue clusters: ${summary.engineV2.issueClusterCount}
- Issue coverage rate: ${summary.engineV2.issueCoverageRate ?? 'n/a'}
- Escalation: ${summary.engineV2.escalation?.recommendedAction ?? 'n/a'}

## Procedural Layer

- Procedural layer present: ${summary.pairSignals.proceduralLayerPresent ? 'pass' : 'fail'}
- Contest points present: ${summary.pairSignals.proceduralContestPointsPresent ? 'pass' : 'fail'}
- References: ${summary.proceduralLayer.referenceCount}
- Selected procedures: ${summary.proceduralLayer.selectedProcedureCount}
- Expected artifact coverage: ${summary.proceduralLayer.expectedArtifactCoverage ?? 'n/a'}
- Human review required: ${summary.proceduralLayer.humanReviewRequired ?? 'n/a'}

## Export surface

- Intervention exports: ${summary.intervention.exportModes.join(', ')}
- Baseline exports: ${summary.baseline.exportModes.join(', ')}
`;
}

function withEngineMode(scenario, engineMode) {
  return {
    ...scenario,
    scenarioId: `${scenario.scenarioId}-${engineMode}`,
    title: `${scenario.title} (${engineMode})`,
    config: {
      ...(scenario.config || {}),
      engineMode,
    },
  };
}

async function writeScenarioTemp(tmpDir, scenario) {
  const filePath = path.join(tmpDir, `${scenario.scenarioId}.json`);
  await writeJson(filePath, scenario);
  return path.relative(repoRoot, filePath);
}

function buildAblationSummary(benchmarkClass, recursiveEvidence, heuristicEvidence, baselineEvidence) {
  return {
    scenarioClass: benchmarkClass.slug,
    title: benchmarkClass.title,
    modes: {
      recursive_engine_v2: {
        routingDecisionCount: recursiveEvidence.routingDecisionCount,
        digestCount: recursiveEvidence.digestCount,
        issueCoverageRate: recursiveEvidence.engineV2.issueCoverageRate,
        stakeholderDiversityRate: recursiveEvidence.engineV2.stakeholderDiversityRate,
        criticSeverities: recursiveEvidence.engineV2.criticSeverities,
        escalation: recursiveEvidence.engineV2.escalation?.recommendedAction ?? null,
      },
      heuristic: {
        routingDecisionCount: heuristicEvidence.routingDecisionCount,
        digestCount: heuristicEvidence.digestCount,
        issueCoverageRate: heuristicEvidence.engineV2.issueCoverageRate,
        stakeholderDiversityRate: heuristicEvidence.engineV2.stakeholderDiversityRate,
        criticSeverities: heuristicEvidence.engineV2.criticSeverities,
        escalation: heuristicEvidence.engineV2.escalation?.recommendedAction ?? null,
      },
      baseline_thread: {
        routingDecisionCount: baselineEvidence.routingDecisionCount,
        digestCount: baselineEvidence.digestCount,
      },
    },
    signals: {
      recursiveTracePresent: recursiveEvidence.engineV2.present,
      heuristicTraceAbsent: heuristicEvidence.engineV2.present === false,
      baselineDigestAbsent: baselineEvidence.digestCount === 0,
      recursiveHasCritics: Boolean(recursiveEvidence.engineV2.criticSeverities.omission && recursiveEvidence.engineV2.criticSeverities.fairness),
    },
  };
}

function ablationSummaryToMarkdown(summary) {
  return `# ACP Engine V2 Ablation Summary

- Scenario class: ${summary.scenarioClass}
- Recursive trace present: ${summary.signals.recursiveTracePresent}
- Heuristic trace absent: ${summary.signals.heuristicTraceAbsent}
- Recursive critics present: ${summary.signals.recursiveHasCritics}

| Mode | Routing decisions | Digests | Issue coverage | Escalation |
| --- | ---: | ---: | ---: | --- |
| recursive_engine_v2 | ${summary.modes.recursive_engine_v2.routingDecisionCount} | ${summary.modes.recursive_engine_v2.digestCount} | ${summary.modes.recursive_engine_v2.issueCoverageRate ?? 'n/a'} | ${summary.modes.recursive_engine_v2.escalation ?? 'n/a'} |
| heuristic | ${summary.modes.heuristic.routingDecisionCount} | ${summary.modes.heuristic.digestCount} | ${summary.modes.heuristic.issueCoverageRate ?? 'n/a'} | ${summary.modes.heuristic.escalation ?? 'n/a'} |
| baseline_thread | ${summary.modes.baseline_thread.routingDecisionCount} | ${summary.modes.baseline_thread.digestCount} | n/a | n/a |
`;
}

async function runAblation(manifest, benchmarkClass, outDir) {
  const resolvedOutDir = path.resolve(repoRoot, outDir || path.join('artifacts', 'benchmarks', 'ablation', benchmarkClass.slug));
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'acp-engine-ablation-'));
  try {
    const interventionScenario = await readJson(path.join(repoRoot, benchmarkClass.pair.intervention));
    const recursiveScenarioPath = await writeScenarioTemp(tmpDir, withEngineMode(interventionScenario, 'recursive_engine_v2'));
    const heuristicScenarioPath = await writeScenarioTemp(tmpDir, withEngineMode(interventionScenario, 'heuristic'));
    const recursiveRun = await runBatchScenario(recursiveScenarioPath, path.join(resolvedOutDir, 'recursive-engine-v2'));
    const heuristicRun = await runBatchScenario(heuristicScenarioPath, path.join(resolvedOutDir, 'heuristic'));
    const baselineRun = await runBatchScenario(benchmarkClass.pair.baseline, path.join(resolvedOutDir, 'baseline-thread'));
    const [recursiveEvidence, heuristicEvidence, baselineEvidence] = await Promise.all([
      writeRunArtifacts(path.join(resolvedOutDir, 'recursive-engine-v2'), recursiveRun),
      writeRunArtifacts(path.join(resolvedOutDir, 'heuristic'), heuristicRun),
      writeRunArtifacts(path.join(resolvedOutDir, 'baseline-thread'), baselineRun),
    ]);
    const summary = buildAblationSummary(benchmarkClass, recursiveEvidence, heuristicEvidence, baselineEvidence);
    await writeJson(path.join(resolvedOutDir, 'ablation-summary.json'), summary);
    await writeText(path.join(resolvedOutDir, 'ablation-summary.md'), ablationSummaryToMarkdown(summary));
    await writeJson(path.join(resolvedOutDir, 'bundle-manifest.json'), {
      bundleId: `acp-engine-v2-ablation-${benchmarkClass.slug}`,
      protocolVersion: manifest.protocolVersion,
      scenarioClass: benchmarkClass.slug,
      modes: ['recursive_engine_v2', 'heuristic', 'baseline_thread'],
    });
    return { mode: 'ablation', benchmarkClass: benchmarkClass.slug, outDir: resolvedOutDir, summary };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

const SCALE_ISSUES = [
  ['access', 'Transit access and language access need to be handled before the hearing record closes.'],
  ['cost', 'The rent and fee impacts are still unclear for residents on fixed incomes.'],
  ['equity', 'Disabled tenants and late-shift workers are not being heard in the dominant comments.'],
  ['implementation', 'The implementation timeline needs enforcement milestones and named staff owners.'],
  ['legitimacy', 'Public trust depends on transparent publication of assumptions and tradeoffs.'],
  ['process', 'The process should separate repeated endorsements from new decision-relevant evidence.'],
  ['safety', 'Safety risks around traffic, lighting, and emergency access need direct mitigation.'],
  ['unresolved', 'How will unresolved questions be retained if the agenda packet is compressed?'],
];

function generateScaleScenario({ band, count, condition }) {
  const participants = Array.from({ length: count }, (_, index) => ({
    id: `scale-${band}-p${String(index + 1).padStart(3, '0')}`,
    name: `Scale ${band} Participant ${index + 1}`,
    role: 'participant',
  }));
  return {
    protocolVersion: '0.1.0',
    scenarioId: `public-hearing-triage-${band}-${condition}`,
    title: `Public hearing triage ${band.toUpperCase()} ${condition}`,
    prompt: 'A planning board must prepare an issue map from a crowded mixed-use rezoning hearing without erasing minority concerns.',
    condition,
    participants,
    config: {
      maxDigestItems: 8,
      maxBridgeItems: 2,
      engineMode: condition === 'intervention' ? 'recursive_engine_v2' : 'heuristic',
    },
    contributions: participants.map((participant, index) => {
      const [issue, sentence] = SCALE_ISSUES[index % SCALE_ISSUES.length];
      const pileOn = index < Math.floor(count * 0.35)
        ? 'I also support the early dominant view that approval should move quickly.'
        : '';
      const minority = index > Math.floor(count * 0.7) && issue === 'equity'
        ? 'This is a buried minority signal that should not disappear in chronological review.'
        : '';
      return {
        participantId: participant.id,
        confidenceLabel: index % 5 === 0 ? 'medium' : 'high',
        body: `${sentence} ${pileOn} ${minority}`.trim(),
      };
    }),
    feedback: participants.slice(0, Math.min(12, count)).map((participant, index) => ({
      participantId: participant.id,
      answers: {
        overload: condition === 'intervention' ? 2 + (index % 2) : 4,
        usefulness: condition === 'intervention' ? 4 : 3,
        exchangeQuality: condition === 'intervention' ? 4 : 3,
        explanationClarity: condition === 'intervention' ? 4 : 2,
        returnWillingness: 4,
      },
    })),
    exportModes: ['analysis', 'audit', 'minimal'],
  };
}

async function runScale(manifest, outDir) {
  const resolvedOutDir = path.resolve(repoRoot, outDir || path.join('artifacts', 'benchmarks', 'scale', 'public-hearing-triage'));
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'acp-scale-scenarios-'));
  const bands = [
    { band: 'band-b', count: 32 },
    { band: 'band-c', count: 120 },
  ];
  try {
    const results = [];
    for (const band of bands) {
      const interventionPath = await writeScenarioTemp(tmpDir, generateScaleScenario({ ...band, condition: 'intervention' }));
      const baselinePath = await writeScenarioTemp(tmpDir, generateScaleScenario({ ...band, condition: 'baseline_thread' }));
      const interventionRun = await runBatchScenario(interventionPath, path.join(resolvedOutDir, band.band, 'intervention'));
      const baselineRun = await runBatchScenario(baselinePath, path.join(resolvedOutDir, band.band, 'baseline'));
      const [interventionEvidence, baselineEvidence] = await Promise.all([
        writeRunArtifacts(path.join(resolvedOutDir, band.band, 'intervention'), interventionRun),
        writeRunArtifacts(path.join(resolvedOutDir, band.band, 'baseline'), baselineRun),
      ]);
      results.push({
        band: band.band,
        contributionCount: band.count,
        intervention: interventionEvidence,
        baseline: baselineEvidence,
        signals: {
          engineV2TracePresent: interventionEvidence.engineV2.present,
          issueClusters: interventionEvidence.engineV2.issueClusterCount,
          issueCoverageRate: interventionEvidence.engineV2.issueCoverageRate,
          estimatedCostUsd: interventionEvidence.engineV2.modelAudit?.estimatedCostUsd ?? 0,
          latencyMs: interventionEvidence.engineV2.modelAudit?.totalLatencyMs ?? 0,
        },
      });
    }
    const summary = {
      bundleId: 'acp-public-hearing-scale-bands',
      protocolVersion: manifest.protocolVersion,
      generatedAt: new Date().toISOString(),
      bands: results,
    };
    await writeJson(path.join(resolvedOutDir, 'scale-summary.json'), summary);
    await writeText(
      path.join(resolvedOutDir, 'scale-summary.md'),
      `# ACP Public-Hearing Scale Bands\n\n${results
        .map((entry) => `- ${entry.band}: ${entry.contributionCount} comments, ${entry.signals.issueClusters} issue clusters, issue coverage ${entry.signals.issueCoverageRate}`)
        .join('\n')}\n`,
    );
    return { mode: 'scale', outDir: resolvedOutDir, summary };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function runBatchScenario(scenarioPath, outDir) {
  await execFileAsync('npm', ['run', '--silent', 'batch:run', '--', scenarioPath, '--out', outDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  const [scenario, cycle, conformance, runManifest] = await Promise.all([
    readJson(path.join(outDir, 'normalized-input.json')),
    readJson(path.join(outDir, 'cycle.json')),
    readJson(path.join(outDir, 'conformance-report.json')),
    readJson(path.join(outDir, 'run-manifest.json')),
  ]);

  return { scenario, cycle, conformance, runManifest };
}

async function writeRunArtifacts(runDir, runData) {
  const evidence = buildEvidence(runData);
  await writeJson(path.join(runDir, 'evidence.json'), evidence);
  await writeJson(path.join(runDir, 'telemetry.json'), runData.cycle.telemetryEvents || []);
  await writeJson(path.join(runDir, 'audit.json'), runData.cycle.auditEvents || []);
  return evidence;
}

function getBenchmarkClass(manifest, slug) {
  const targetSlug = slug || manifest.defaultClass;
  const benchmarkClass = manifest.classes.find((entry) => entry.slug === targetSlug);
  if (!benchmarkClass) {
    throw new Error(`unknown benchmark class: ${targetSlug}`);
  }
  return benchmarkClass;
}

async function runComparison(manifest, benchmarkClass, outDir) {
  const resolvedOutDir = path.resolve(repoRoot, outDir || path.join('artifacts', 'benchmarks', benchmarkClass.slug));
  const interventionDir = path.join(resolvedOutDir, 'intervention');
  const baselineDir = path.join(resolvedOutDir, 'baseline');

  const [interventionRun, baselineRun] = await Promise.all([
    runBatchScenario(benchmarkClass.pair.intervention, interventionDir),
    runBatchScenario(benchmarkClass.pair.baseline, baselineDir),
  ]);

  const [interventionEvidence, baselineEvidence] = await Promise.all([
    writeRunArtifacts(interventionDir, interventionRun),
    writeRunArtifacts(baselineDir, baselineRun),
  ]);

  const bundleManifest = {
    bundleId: `acp-benchmark-${benchmarkClass.slug}`,
    protocolVersion: manifest.protocolVersion,
    scenarioClass: benchmarkClass.slug,
    surface: 'batch',
    entries: {
      intervention: {
        scenario: benchmarkClass.pair.intervention,
        outDir: interventionDir,
      },
      baseline: {
        scenario: benchmarkClass.pair.baseline,
        outDir: baselineDir,
      },
    },
  };

  const comparisonSummary = buildComparisonSummary(benchmarkClass, interventionEvidence, baselineEvidence, bundleManifest);
  await writeJson(path.join(resolvedOutDir, 'bundle-manifest.json'), bundleManifest);
  await writeJson(path.join(resolvedOutDir, 'comparison-summary.json'), comparisonSummary);
  await writeText(path.join(resolvedOutDir, 'comparison-summary.md'), comparisonSummaryToMarkdown(comparisonSummary, bundleManifest));

  return {
    mode: 'comparison',
    benchmarkClass: benchmarkClass.slug,
    outDir: resolvedOutDir,
    bundleManifest,
    comparisonSummary,
  };
}

async function runFixtures(manifest, outDir) {
  const payload = {
    bundleId: manifest.bundleId,
    protocolVersion: manifest.protocolVersion,
    defaultClass: manifest.defaultClass,
    flagshipClass: manifest.flagshipClass || manifest.defaultClass,
    flagshipRationale: manifest.flagshipRationale,
    classCount: manifest.classes.length,
    classes: manifest.classes,
  };
  if (outDir) {
    const resolvedOutDir = path.resolve(repoRoot, outDir);
    await writeJson(path.join(resolvedOutDir, 'fixtures-index.json'), payload);
  }
  return payload;
}

async function runReplay(outDir) {
  const replayManifest = await readJson(replayManifestPath);
  const payload = {
    protocolVersion: replayManifest.acp_protocol_version,
    relayModel: replayManifest.relay_model,
    caseCount: replayManifest.cases.length,
    cases: replayManifest.cases.map((entry) => ({
      caseId: entry.case_id,
      condition: entry.condition,
      replayMode: entry.replay_mode,
      path: entry.path,
    })),
  };

  if (outDir) {
    const resolvedOutDir = path.resolve(repoRoot, outDir);
    await writeJson(path.join(resolvedOutDir, 'replay-summary.json'), payload);
    await writeText(
      path.join(resolvedOutDir, 'replay-summary.md'),
      `# ACP replay fixture summary\n\n- Protocol version: ${payload.protocolVersion}\n- Relay model: ${payload.relayModel}\n- Cases: ${payload.caseCount}\n`,
    );
  }

  return payload;
}

async function main() {
  const { mode, scenarioClass, outDir, surface } = parseArgs(process.argv.slice(2));
  const manifest = await readJson(manifestPath);

  if (surface !== 'batch') {
    throw new Error(`unsupported benchmark surface: ${surface}`);
  }

  if (mode === 'fixtures') {
    const payload = await runFixtures(manifest, outDir);
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (mode === 'replay') {
    const payload = await runReplay(outDir || path.join('artifacts', 'benchmarks', 'replay'));
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (mode === 'ablation') {
    const benchmarkClass = getBenchmarkClass(manifest, scenarioClass || manifest.flagshipClass || manifest.defaultClass);
    const payload = await runAblation(manifest, benchmarkClass, outDir);
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (mode === 'scale') {
    const payload = await runScale(manifest, outDir);
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (mode === 'demo') {
    const benchmarkClass = getBenchmarkClass(manifest, scenarioClass || manifest.defaultClass);
    const payload = await runComparison(manifest, benchmarkClass, outDir || path.join('artifacts', 'benchmarks', 'demo', benchmarkClass.slug));
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (mode === 'comparison') {
    const benchmarkClass = getBenchmarkClass(manifest, scenarioClass);
    const payload = await runComparison(manifest, benchmarkClass, outDir);
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  throw new Error(`unsupported benchmark mode: ${mode}`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
