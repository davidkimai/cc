export interface AcpCycleLike {
  condition?: string;
  config?: {
    deliberativeCriteria?: Array<{ id: string; label?: string; description?: string; weight: number }>;
  };
  routingDecisions?: Array<{
    factors?: {
      recipientRelevance?: number;
      promptRelevance?: number;
      bridgePerspective?: number;
      loadCost?: number;
    };
    criteriaWeights?: Record<string, number>;
    bridgeFlag?: boolean;
  }>;
  digests?: unknown[];
  auditEvents?: unknown[];
  telemetryEvents?: unknown[];
  engineV2?: {
    issueMap?: { clusters?: unknown[] };
    digestSetCritique?: {
      issueCoverageRate?: number;
      stakeholderDiversityRate?: number;
    };
    critics?: Array<{ criticType?: string; severity?: string }>;
    escalation?: { recommendedAction?: string; confidence?: number; abstain?: boolean };
    modelAudit?: { provider?: string; calls?: number; estimatedCostUsd?: number };
  };
  proceduralLayer?: {
    references?: unknown[];
    artifactExpectations?: unknown[];
    contestPoints?: unknown[];
    execution?: {
      selectedProcedureIds?: string[];
      adherence?: { expectedArtifactCoverage?: number; allRequiredArtifactsProduced?: boolean };
      escalation?: { source?: string; recommendedAction?: string; humanReviewRequired?: boolean };
    };
  };
}

export interface AcpRunEvidenceSummary {
  condition: string;
  routingDecisionCount: number;
  digestCount: number;
  auditEventCount: number;
  telemetryEventCount: number;
  criteria: {
    criteriaCount: number;
    decisionsWithFactors: number;
    decisionsWithCriteriaWeights: number;
    bridgeDecisionCount: number;
    sharedWeights: Record<string, number>;
  };
  engineV2: {
    present: boolean;
    issueClusterCount: number;
    issueCoverageRate: number | null;
    stakeholderDiversityRate: number | null;
    criticSeverities: Record<string, string>;
    escalationAction: string | null;
    confidence: number | null;
    provider: string | null;
    modelCalls: number | null;
    estimatedCostUsd: number | null;
  };
  proceduralLayer: {
    present: boolean;
    referenceCount: number;
    artifactExpectationCount: number;
    contestPointCount: number;
    selectedProcedureCount: number;
    expectedArtifactCoverage: number | null;
    allRequiredArtifactsProduced: boolean | null;
    escalationSource: string | null;
    escalationAction: string | null;
    humanReviewRequired: boolean | null;
  };
}

export function summarizeCycleEvidence(cycle: AcpCycleLike): AcpRunEvidenceSummary {
  const routingDecisions = cycle.routingDecisions ?? [];
  return {
    condition: cycle.condition ?? 'unknown',
    routingDecisionCount: routingDecisions.length,
    digestCount: (cycle.digests ?? []).length,
    auditEventCount: (cycle.auditEvents ?? []).length,
    telemetryEventCount: (cycle.telemetryEvents ?? []).length,
    criteria: {
      criteriaCount: cycle.config?.deliberativeCriteria?.length ?? 0,
      decisionsWithFactors: routingDecisions.filter((decision) => Boolean(decision.factors)).length,
      decisionsWithCriteriaWeights: routingDecisions.filter((decision) => Boolean(decision.criteriaWeights && Object.keys(decision.criteriaWeights).length > 0)).length,
      bridgeDecisionCount: routingDecisions.filter((decision) => decision.bridgeFlag === true).length,
      sharedWeights: routingDecisions.find((decision) => decision.criteriaWeights)?.criteriaWeights ?? {},
    },
    engineV2: {
      present: Boolean(cycle.engineV2),
      issueClusterCount: cycle.engineV2?.issueMap?.clusters?.length ?? 0,
      issueCoverageRate: cycle.engineV2?.digestSetCritique?.issueCoverageRate ?? null,
      stakeholderDiversityRate: cycle.engineV2?.digestSetCritique?.stakeholderDiversityRate ?? null,
      criticSeverities: Object.fromEntries((cycle.engineV2?.critics ?? []).map((critic) => [critic.criticType || 'unknown', critic.severity || 'unknown'])),
      escalationAction: cycle.engineV2?.escalation?.recommendedAction ?? null,
      confidence: cycle.engineV2?.escalation?.confidence ?? null,
      provider: cycle.engineV2?.modelAudit?.provider ?? null,
      modelCalls: cycle.engineV2?.modelAudit?.calls ?? null,
      estimatedCostUsd: cycle.engineV2?.modelAudit?.estimatedCostUsd ?? null,
    },
    proceduralLayer: {
      present: Boolean(cycle.proceduralLayer),
      referenceCount: cycle.proceduralLayer?.references?.length ?? 0,
      artifactExpectationCount: cycle.proceduralLayer?.artifactExpectations?.length ?? 0,
      contestPointCount: cycle.proceduralLayer?.contestPoints?.length ?? 0,
      selectedProcedureCount: cycle.proceduralLayer?.execution?.selectedProcedureIds?.length ?? 0,
      expectedArtifactCoverage: cycle.proceduralLayer?.execution?.adherence?.expectedArtifactCoverage ?? null,
      allRequiredArtifactsProduced: cycle.proceduralLayer?.execution?.adherence?.allRequiredArtifactsProduced ?? null,
      escalationSource: cycle.proceduralLayer?.execution?.escalation?.source ?? null,
      escalationAction: cycle.proceduralLayer?.execution?.escalation?.recommendedAction ?? null,
      humanReviewRequired: cycle.proceduralLayer?.execution?.escalation?.humanReviewRequired ?? null,
    },
  };
}
