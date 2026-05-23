export interface SkillStudyCostUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export interface SkillStudyTrace {
  traceId: string;
  study: string;
  caseId: string;
  condition: string;
  model: string;
  latencyMs: number;
  usage: SkillStudyCostUsage;
  artifacts: string[];
}

export function makeTrace(input: Omit<SkillStudyTrace, 'traceId'>): SkillStudyTrace {
  return {
    ...input,
    traceId: `${input.study}:${input.caseId}:${input.condition}:${input.model}`,
  };
}

export function addUsage(left: SkillStudyCostUsage, right: SkillStudyCostUsage): SkillStudyCostUsage {
  return {
    inputTokens: left.inputTokens + right.inputTokens,
    outputTokens: left.outputTokens + right.outputTokens,
    estimatedCostUsd: Number((left.estimatedCostUsd + right.estimatedCostUsd).toFixed(6)),
  };
}
