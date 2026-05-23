import type { SkillAdherenceResult, SkillStudyOutput, SkillStudyTask } from './types.js';

const NONE_VALUES = new Set(['', 'none', 'n/a', 'na', 'not_applicable', 'not applicable', 'null']);
const ARTIFACT_KEYWORDS: Record<string, string[]> = {
  ablation_summary: ['ablation'],
  baseline_release_note: ['baseline', 'thread', 'release'],
  claim_boundary_note: ['claim', 'boundary', 'nonclaim', 'non-claim'],
  claim_safe_notes: ['claim', 'safe', 'safety', 'boundary'],
  comparison_summary: ['comparison', 'compare'],
  critic_flag: ['critic', 'critique', 'flag', 'risk', 'warning'],
  digest_review_trace: ['digest', 'explanation', 'review'],
  divergence_note: ['divergence', 'mismatch', 'difference'],
  escalation_trace: ['escalation', 'escalate', 'abstention', 'confidence'],
  failure_note: ['failure', 'risk', 'warning', 'gap'],
  fairness_trace: ['fairness', 'contestability', 'minority', 'bridge'],
  implementer_review_trace: ['implementer', 'protocol', 'conformance', 'schema', 'review'],
  limitations_note: ['limitation', 'nonclaim', 'non-claim', 'boundary'],
  load_warning: ['load', 'overload', 'warning'],
  non_use_reason: ['nonuse', 'non-use', 'do not use', 'reject'],
  omission_trace: ['omission', 'missing', 'coverage'],
  overclaim_flag: ['overclaim', 'unsupported', 'claim'],
  protocol_drift_flag: ['protocol', 'drift', 'schema', 'vocabulary'],
  release_recommendation: ['release', 'recommendation'],
  review_recommendation: ['review', 'recommendation'],
  routing_trace: ['routing', 'route', 'recipient', 'bridge'],
  scale_summary: ['scale', 'band'],
};

export function evaluateAdherence(task: SkillStudyTask, output: SkillStudyOutput): SkillAdherenceResult {
  const selectedSkill = normalize(output.output?.selectedSkill);
  const selectedComposition = normalizeNullable(output.output?.selectedComposition);
  const expectedArtifacts = task.artifactExpectations ?? [];
  const producedArtifacts = output.output?.producedArtifacts ?? [];
  const expectedArtifactProduced = expectedArtifacts.length === 0 || expectedArtifacts.some((artifact) => artifactProduced(artifact, producedArtifacts));
  const candidateSkills = new Set(task.candidateSkills ?? []);
  const deviationReasons: string[] = [];
  let conditionAdhered = true;
  let prohibitedSkillLeakage = false;

  if (output.assignedCondition === 'no_skill') {
    conditionAdhered = isNone(selectedSkill) && selectedComposition === null;
    prohibitedSkillLeakage = !conditionAdhered;
  } else if (output.assignedCondition === 'metadata_only') {
    conditionAdhered = selectedComposition === null && (isNone(selectedSkill) || candidateSkills.has(selectedSkill) || selectedSkill === task.expectedSkill);
    prohibitedSkillLeakage = selectedComposition !== null;
  } else if (output.assignedCondition === 'full_skill') {
    conditionAdhered = selectedComposition === null && (isNone(selectedSkill) || candidateSkills.has(selectedSkill) || selectedSkill === task.expectedSkill);
    prohibitedSkillLeakage = selectedComposition !== null;
  } else {
    conditionAdhered = selectedComposition === task.expectedComposition;
    prohibitedSkillLeakage = selectedComposition !== task.expectedComposition;
  }

  if (!conditionAdhered) deviationReasons.push('assigned condition not followed by selected skill/composition');
  if (prohibitedSkillLeakage) deviationReasons.push('prohibited skill or composition leakage');
  if (!expectedArtifactProduced) deviationReasons.push('expected artifact class not produced');

  return {
    outputId: output.outputId,
    assignedCondition: output.assignedCondition,
    selectedSkill,
    selectedComposition,
    conditionAdhered,
    expectedArtifactProduced,
    prohibitedSkillLeakage,
    receivedCondition: inferReceivedCondition(selectedSkill, selectedComposition),
    deviationReasons,
  };
}

function inferReceivedCondition(selectedSkill: string, selectedComposition: string | null): SkillAdherenceResult['receivedCondition'] {
  if (selectedComposition) return 'composition';
  if (isNone(selectedSkill)) return 'no_skill';
  return 'full_skill';
}

function normalize(value: unknown): string {
  return String(value ?? 'none').trim();
}

function normalizeNullable(value: unknown): string | null {
  const normalized = normalize(value).toLowerCase();
  return NONE_VALUES.has(normalized) ? null : String(value).trim();
}

function isNone(value: string): boolean {
  return NONE_VALUES.has(value.toLowerCase());
}

function artifactProduced(expected: string, produced: string[]): boolean {
  const expectedText = normalizeArtifact(expected);
  const expectedKeywords = ARTIFACT_KEYWORDS[expected] ?? expectedText.split(' ').filter((token) => token.length > 3);
  return produced.some((artifact) => {
    const artifactText = normalizeArtifact(artifact);
    return artifactText === expectedText || expectedKeywords.some((keyword) => artifactText.includes(normalizeArtifact(keyword)));
  });
}

function normalizeArtifact(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
