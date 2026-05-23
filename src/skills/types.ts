export type SkillCondition = 'no_skill' | 'metadata_only' | 'full_skill' | 'composition';

export interface SkillPackageRecord {
  name: string;
  category: string;
  maturity?: string;
  manifest: string;
}

export interface SkillCompositionRecord {
  name: string;
  maturity?: string;
  entrypoint: string;
}

export interface SkillRegistryRecord {
  suite: string;
  suiteVersion: string;
  maturityStandard?: string;
  packages: SkillPackageRecord[];
  compositions?: SkillCompositionRecord[];
}

export interface SkillManifest {
  name?: string;
  summary?: string;
  useWhen?: string[];
  dontUseWhen?: string[];
  skillFile?: string;
}

export interface NormalizedSkillPackage extends SkillPackageRecord {
  manifestData: SkillManifest;
}

export interface SkillStudyTask {
  id: string;
  family: string;
  caseType: string;
  prompt: string;
  candidateSkills?: string[];
  expectedSkill: string;
  expectedComposition?: string | null;
  expectedEscalation?: boolean | null;
  expectedSignals?: string[];
  failureModes?: string[];
  forbiddenClaims?: string[];
  artifactExpectations?: string[];
}

export interface SkillConditionMaterial {
  assignedCondition: SkillCondition;
  instruction: string;
  task: {
    taskId: string;
    family: string;
    caseType: string;
    prompt: string;
    availableCandidateNames: string[];
    nonClaimBoundary: string[];
  };
  context: Record<string, unknown>;
  materializedFrom: string[];
}

export interface SkillStudyOutput {
  outputId: string;
  caseId: string;
  family: string;
  caseType: string;
  assignedCondition: SkillCondition;
  model: string;
  status: 'generated' | 'fail';
  output?: {
    decision?: string;
    selectedSkill?: string;
    selectedComposition?: string | null;
    escalation?: boolean;
    detectedFailures?: string[];
    rejectedClaims?: string[];
    producedArtifacts?: string[];
    confidence?: number;
    rationale?: string;
  } | null;
}

export interface SkillAdherenceResult {
  outputId: string;
  assignedCondition: SkillCondition;
  selectedSkill: string;
  selectedComposition: string | null;
  conditionAdhered: boolean;
  expectedArtifactProduced: boolean;
  prohibitedSkillLeakage: boolean;
  receivedCondition: SkillCondition | 'unknown';
  deviationReasons: string[];
}
