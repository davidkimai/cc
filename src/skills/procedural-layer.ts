import {
  type CycleRecord,
  proceduralLayerSchema,
  type ProceduralArtifactExpectation,
  type ProceduralContestPoint,
  type ProceduralEscalationProvenance,
  type ProceduralLayer,
  type ProceduralReference,
} from '../core/types.js';

const INTERVENTION_REFERENCES: ProceduralReference[] = [
  {
    procedureId: 'deliberation-cycle',
    kind: 'skill',
    role: 'workflow',
    purpose: 'Preserve the cycle shell, release checkpoints, and operator review rhythm.',
    sourcePath: 'skills/deliberation-cycle/SKILL.md',
  },
  {
    procedureId: 'epistemic-routing',
    kind: 'skill',
    role: 'routing',
    purpose: 'Route participant attention under explicit deliberative criteria.',
    sourcePath: 'skills/epistemic-routing/SKILL.md',
  },
  {
    procedureId: 'digest-and-explanation',
    kind: 'skill',
    role: 'explanation',
    purpose: 'Compress routed material into bounded, inspectable briefing language.',
    sourcePath: 'skills/digest-and-explanation/SKILL.md',
  },
  {
    procedureId: 'omission-critic',
    kind: 'skill',
    role: 'critic',
    purpose: 'Surface issue-coverage and stakeholder-coverage loss before release.',
    sourcePath: 'skills/omission-critic/SKILL.md',
  },
  {
    procedureId: 'fairness-contestability-critic',
    kind: 'skill',
    role: 'critic',
    purpose: 'Check minority-salience, bridge discipline, and contestability before release.',
    sourcePath: 'skills/fairness-contestability-critic/SKILL.md',
  },
  {
    procedureId: 'abstention-escalation',
    kind: 'skill',
    role: 'escalation',
    purpose: 'Preserve human-steerable escalation when confidence or authority is insufficient.',
    sourcePath: 'skills/abstention-escalation/SKILL.md',
  },
];

const BASELINE_REFERENCES: ProceduralReference[] = [
  {
    procedureId: 'deliberation-cycle',
    kind: 'skill',
    role: 'workflow',
    purpose: 'Preserve the same cycle shell and release checkpoints as intervention cycles.',
    sourcePath: 'skills/deliberation-cycle/SKILL.md',
  },
  {
    procedureId: 'baseline-thread-runner',
    kind: 'skill',
    role: 'baseline',
    purpose: 'Keep the comparison denominator chronological rather than routed.',
    sourcePath: 'skills/baseline-thread-runner/SKILL.md',
  },
];

const INTERVENTION_EXPECTATIONS: ProceduralArtifactExpectation[] = [
  {
    artifactId: 'routing_trace',
    description: 'A recoverable routing trace tied to explicit deliberative criteria.',
    required: true,
  },
  {
    artifactId: 'digest_review_trace',
    description: 'A digest or explanation-bearing artifact suitable for release review.',
    required: true,
  },
  {
    artifactId: 'omission_trace',
    description: 'An omission-coverage signal or critic trace.',
    required: true,
  },
  {
    artifactId: 'fairness_trace',
    description: 'A fairness or contestability signal before release.',
    required: true,
  },
  {
    artifactId: 'escalation_trace',
    description: 'A preserved escalation recommendation with reasons.',
    required: true,
  },
];

const BASELINE_EXPECTATIONS: ProceduralArtifactExpectation[] = [
  {
    artifactId: 'baseline_release_note',
    description: 'A compact note preserving that the release followed the baseline-thread condition.',
    required: true,
  },
];

const INTERVENTION_CONTEST_POINTS: ProceduralContestPoint[] = [
  {
    pointId: 'routing-profile-review',
    stage: 'pre_routing',
    prompt: 'Does the routing profile match the institution\'s deliberative aim for this cycle?',
    defaultAction: 'review',
    requiredHumanRole: 'facilitator',
  },
  {
    pointId: 'bridge-budget-review',
    stage: 'post_routing',
    prompt: 'Should bridge exposure be revised before release?',
    defaultAction: 'revise',
    requiredHumanRole: 'facilitator',
  },
  {
    pointId: 'escalation-review',
    stage: 'pre_release',
    prompt: 'Does the escalation recommendation require human hold, abstention, or revision?',
    defaultAction: 'review',
    requiredHumanRole: 'facilitator',
  },
  {
    pointId: 'claim-boundary-review',
    stage: 'pre_release',
    prompt: 'Are the release claims bounded by the actual evidence trace?',
    defaultAction: 'review',
    requiredHumanRole: 'research_analyst',
  },
];

const BASELINE_CONTEST_POINTS: ProceduralContestPoint[] = [
  {
    pointId: 'baseline-release-review',
    stage: 'pre_release',
    prompt: 'Does the baseline release remain chronological and free of synthetic routing claims?',
    defaultAction: 'review',
    requiredHumanRole: 'facilitator',
  },
];

const RELEASE_STATES = new Set<CycleRecord['status']>(['digests_released', 'reflection_closed', 'archived']);
const POST_ROUTING_STATES = new Set<CycleRecord['status']>(['routing_complete', 'digests_released', 'reflection_closed', 'archived']);

function cloneReferences(condition: CycleRecord['condition']): ProceduralReference[] {
  return (condition === 'intervention' ? INTERVENTION_REFERENCES : BASELINE_REFERENCES).map((item) => ({ ...item }));
}

function cloneExpectations(condition: CycleRecord['condition']): ProceduralArtifactExpectation[] {
  return (condition === 'intervention' ? INTERVENTION_EXPECTATIONS : BASELINE_EXPECTATIONS).map((item) => ({ ...item }));
}

function cloneContestPoints(condition: CycleRecord['condition']): ProceduralContestPoint[] {
  return (condition === 'intervention' ? INTERVENTION_CONTEST_POINTS : BASELINE_CONTEST_POINTS).map((item) => ({ ...item }));
}

function producedArtifactIds(cycle: CycleRecord): string[] {
  const produced = new Set<string>();
  if (cycle.condition === 'intervention') {
    if ((cycle.routingDecisions ?? []).length > 0) produced.add('routing_trace');
    if ((cycle.digests ?? []).length > 0) produced.add('digest_review_trace');
    if (cycle.engineV2?.critics?.some((critic) => critic.criticType === 'omission')) produced.add('omission_trace');
    if (cycle.engineV2?.critics?.some((critic) => critic.criticType === 'fairness')) produced.add('fairness_trace');
    if (cycle.engineV2?.escalation) produced.add('escalation_trace');
  }
  if (cycle.condition === 'baseline_thread' && RELEASE_STATES.has(cycle.status)) {
    produced.add('baseline_release_note');
  }
  for (const artifact of cycle.exports ?? []) {
    produced.add(`export_${artifact.mode}`);
  }
  return [...produced];
}

function selectedProcedureIds(cycle: CycleRecord): string[] {
  if (cycle.condition === 'baseline_thread') {
    return ['deliberation-cycle', 'baseline-thread-runner'];
  }

  const selected = ['deliberation-cycle', 'epistemic-routing', 'digest-and-explanation'];
  if ((cycle.config.engineMode ?? 'recursive_engine_v2') === 'recursive_engine_v2') {
    selected.push('omission-critic', 'fairness-contestability-critic', 'abstention-escalation');
  }
  return selected;
}

function adherenceNotes(cycle: CycleRecord, missingArtifactIds: string[]): string[] {
  const notes: string[] = [];
  if (cycle.condition === 'intervention' && !POST_ROUTING_STATES.has(cycle.status)) {
    notes.push('release-facing intervention artifacts are not expected before routing completes');
  }
  if (cycle.condition === 'baseline_thread' && !RELEASE_STATES.has(cycle.status)) {
    notes.push('baseline release note is only expected after the baseline condition reaches release');
  }
  if (missingArtifactIds.length === 0) {
    notes.push('all currently expected procedural artifact classes are present');
  }
  return notes;
}

function escalationProvenance(cycle: CycleRecord): ProceduralEscalationProvenance | undefined {
  const escalation = cycle.engineV2?.escalation;
  if (!escalation) return undefined;
  return {
    source: 'engine_v2',
    recommendedAction: escalation.recommendedAction,
    humanReviewRequired: escalation.abstain || escalation.recommendedAction !== 'release',
    reasons: escalation.reasons,
    confidence: escalation.confidence,
  };
}

export function buildProceduralLayer(cycle: CycleRecord): ProceduralLayer {
  const references = cloneReferences(cycle.condition);
  const artifactExpectations = cloneExpectations(cycle.condition);
  const contestPoints = cloneContestPoints(cycle.condition);
  const produced = producedArtifactIds(cycle);
  const missingRequired = artifactExpectations
    .filter((item) => item.required)
    .map((item) => item.artifactId)
    .filter((artifactId) => !produced.includes(artifactId));
  const requiredCount = artifactExpectations.filter((item) => item.required).length;
  const coverage = requiredCount === 0 ? 1 : Number(((requiredCount - missingRequired.length) / requiredCount).toFixed(4));

  return proceduralLayerSchema.parse({
    references,
    artifactExpectations,
    contestPoints,
    execution: {
      bindingMode: 'protocol_profile',
      selectedProcedureIds: selectedProcedureIds(cycle),
      traceIds: cycle.engineV2 ? [`engine-v2:${cycle.id}`] : [],
      producedArtifactIds: produced,
      adherence: {
        expectedArtifactCoverage: coverage,
        allRequiredArtifactsProduced: missingRequired.length === 0,
        missingArtifactIds: missingRequired,
        notes: adherenceNotes(cycle, missingRequired),
      },
      escalation: escalationProvenance(cycle),
      updatedAt: cycle.updatedAt,
    },
  });
}
