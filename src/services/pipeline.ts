import {
  type Contribution,
  type CycleMetrics,
  type CycleRecord,
  defaultDeliberativeCriteria,
  type Digest,
  type DigestItem,
  type ExportMode,
  type RoutingDecision,
  type TelemetryEvent,
} from '../core/types.js';

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const union = new Set([...a, ...b]);
  if (union.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  return intersection / union.size;
}

function gini(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sanitized = values.map((value) => Math.max(0, value)).sort((a, b) => a - b);
  const total = sanitized.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return 0;
  }
  let weighted = 0;
  sanitized.forEach((value, index) => {
    weighted += (index + 1) * value;
  });
  return (2 * weighted) / (sanitized.length * total) - (sanitized.length + 1) / sanitized.length;
}

function topShare(values: number[], fraction: number): number {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return 0;
  }
  const count = Math.max(1, Math.ceil(values.length * fraction));
  const top = [...values].sort((a, b) => b - a).slice(0, count).reduce((sum, value) => sum + value, 0);
  return top / total;
}

type CriteriaWeights = Record<'recipient_relevance' | 'prompt_relevance' | 'bridge_perspective' | 'load_balance', number>;
type RoutingFactors = RoutingDecision['factors'];

function normalizedCriteriaWeights(cycle: CycleRecord): CriteriaWeights {
  const criteria = cycle.config.deliberativeCriteria?.length ? cycle.config.deliberativeCriteria : defaultDeliberativeCriteria;
  const raw = {
    recipient_relevance: criteria.find((criterion) => criterion.id === 'recipient_relevance')?.weight ?? 0,
    prompt_relevance: criteria.find((criterion) => criterion.id === 'prompt_relevance')?.weight ?? 0,
    bridge_perspective: criteria.find((criterion) => criterion.id === 'bridge_perspective')?.weight ?? 0,
    load_balance: criteria.find((criterion) => criterion.id === 'load_balance')?.weight ?? 0,
  };
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return normalizedCriteriaWeights({ ...cycle, config: { ...cycle.config, deliberativeCriteria: defaultDeliberativeCriteria } });
  }
  return {
    recipient_relevance: raw.recipient_relevance / total,
    prompt_relevance: raw.prompt_relevance / total,
    bridge_perspective: raw.bridge_perspective / total,
    load_balance: raw.load_balance / total,
  };
}

function buildRoutingFactors(recipientRelevance: number, promptRelevance: number, maxDigestItems: number): RoutingFactors {
  return {
    recipientRelevance: Number(recipientRelevance.toFixed(4)),
    promptRelevance: Number(promptRelevance.toFixed(4)),
    bridgePerspective: Number((promptRelevance * (1 - recipientRelevance)).toFixed(4)),
    loadCost: Number((1 / Math.max(1, maxDigestItems)).toFixed(4)),
  };
}

function issueClusterIdFor(body: string): string {
  const normalized = body.toLowerCase();
  if (/(access|transit|mobility|language|childcare|accessible)/.test(normalized)) return 'issue_access';
  if (/(cost|rent|budget|affordable|fee|funding|tax)/.test(normalized)) return 'issue_cost';
  if (/(equity|minority|tenant|disabled|elder|student|worker)/.test(normalized)) return 'issue_equity';
  if (/(implement|timeline|staff|enforce|maintenance|monitor)/.test(normalized)) return 'issue_implementation';
  if (/(trust|transparent|accountable|notice|public record|legitimate)/.test(normalized)) return 'issue_legitimacy';
  if (/(process|hearing|agenda|comment|procedure|review)/.test(normalized)) return 'issue_process';
  if (/(safety|risk|emergency|hazard|police|fire)/.test(normalized)) return 'issue_safety';
  if (/\?|unknown|unclear|whether|question|what happens|how will/.test(normalized)) return 'issue_unresolved_question';
  return 'issue_other';
}

function confidenceFor(factors: RoutingFactors): number {
  return Number(Math.max(0.35, Math.min(0.96, (factors.recipientRelevance + factors.promptRelevance + (1 - factors.loadCost)) / 3)).toFixed(4));
}

function weightedScore(factors: RoutingFactors, weights: CriteriaWeights): number {
  const loadFit = 1 - factors.loadCost;
  return Number(
    (
      factors.recipientRelevance * weights.recipient_relevance +
      factors.promptRelevance * weights.prompt_relevance +
      factors.bridgePerspective * weights.bridge_perspective +
      loadFit * weights.load_balance
    ).toFixed(4),
  );
}

function weightedBridgeScore(factors: RoutingFactors, weights: CriteriaWeights): number {
  return Number(
    (
      factors.bridgePerspective * weights.bridge_perspective +
      factors.promptRelevance * weights.prompt_relevance -
      factors.recipientRelevance * weights.recipient_relevance
    ).toFixed(4),
  );
}

function dominantCriterion(decision: RoutingDecision): string {
  const weights = {
    recipient_relevance: decision.criteriaWeights.recipient_relevance ?? 0,
    prompt_relevance: decision.criteriaWeights.prompt_relevance ?? 0,
    bridge_perspective: decision.criteriaWeights.bridge_perspective ?? 0,
    load_balance: decision.criteriaWeights.load_balance ?? 0,
  };
  const weighted = [
    ['recipient relevance', decision.factors.recipientRelevance * weights.recipient_relevance],
    ['prompt relevance', decision.factors.promptRelevance * weights.prompt_relevance],
    ['bridge perspective', decision.factors.bridgePerspective * weights.bridge_perspective],
    ['load balance', (1 - decision.factors.loadCost) * weights.load_balance],
  ] as const;
  return [...weighted].sort((a, b) => b[1] - a[1])[0][0];
}

function explanationFor(decision: RoutingDecision): string {
  const criterion = dominantCriterion(decision);
  const engineClause = decision.engineVersion === 'engine-v2' && decision.issueClusterId
    ? ` It is linked to issue cluster ${decision.issueClusterId}.`
    : '';
  if (decision.bridgeFlag) {
    return `This item was included as bounded bridge exposure; dominant criterion: ${criterion}.${engineClause}`;
  }
  if (criterion === 'recipient relevance') {
    return `This item overlaps strongly with themes in your own contribution; dominant criterion: recipient relevance.${engineClause}`;
  }
  if (criterion === 'prompt relevance') {
    return `This item stays closely anchored to the shared prompt; dominant criterion: prompt relevance.${engineClause}`;
  }
  return `This item was selected under the shared criteria while respecting the digest load budget; dominant criterion: ${criterion}.${engineClause}`;
}

function formatJsonInline(value: unknown): string {
  if (value === undefined) {
    return '{}';
  }
  return JSON.stringify(value);
}

function labelMetric(value: number, lowThreshold: number, highThreshold: number): string {
  if (value >= highThreshold) {
    return 'high';
  }
  if (value >= lowThreshold) {
    return 'moderate';
  }
  return 'low';
}

function formatContributionLine(contribution: Contribution, index: number): string {
  return `${index + 1}. ${contribution.participantId}: ${contribution.body}`;
}

function buildAnalysisHighlights(cycle: CycleRecord, metrics: CycleMetrics): string[] {
  const concentrationLabel = labelMetric(metrics.exposureConcentrationGini, 0.25, 0.45);
  const replyLabel = labelMetric(metrics.replyConcentrationGini, 0.25, 0.45);
  const abandonmentLabel = labelMetric(metrics.abandonmentRate, 0.15, 0.35);
  const lines = [
    `- exposure concentration is ${concentrationLabel} (gini ${metrics.exposureConcentrationGini})`,
    `- reply concentration is ${replyLabel} (gini ${metrics.replyConcentrationGini})`,
    `- average contributor coverage is ${metrics.averageContributorCoverage}`,
    `- contribution abandonment is ${abandonmentLabel} (rate ${metrics.abandonmentRate})`,
  ];

  if (cycle.condition === 'intervention') {
    const bridgeCount = cycle.routingDecisions.filter((decision) => decision.bridgeFlag).length;
    lines.push(`- bridge exposure rate is ${metrics.bridgeExposureRate} across ${bridgeCount} bridge-routed items`);
    lines.push(`- explanation engagement rate is ${metrics.explanationEngagementRate}`);
    if (cycle.engineV2) {
      lines.push(`- Engine V2 issue coverage is ${cycle.engineV2.digestSetCritique.issueCoverageRate}`);
      lines.push(`- Engine V2 escalation recommendation is ${cycle.engineV2.escalation.recommendedAction}`);
    }
  } else {
    lines.push('- bridge exposure and explanation engagement are not applicable in the baseline thread condition');
  }

  return lines;
}

function renderProceduralLayer(cycle: CycleRecord): string[] {
  const layer = cycle.proceduralLayer;
  if (!layer) {
    return ['## Procedural Layer', '- no procedural layer recorded'];
  }

  return [
    '## Procedural Layer',
    `- references: ${layer.references.length}`,
    `- artifact_expectations: ${layer.artifactExpectations.length}`,
    `- contest_points: ${layer.contestPoints.length}`,
    `- binding_mode: ${layer.execution?.bindingMode ?? 'n/a'}`,
    `- selected_procedures: ${(layer.execution?.selectedProcedureIds ?? []).join(', ') || 'none'}`,
    `- trace_ids: ${(layer.execution?.traceIds ?? []).join(', ') || 'none'}`,
    `- artifact_coverage: ${layer.execution?.adherence?.expectedArtifactCoverage ?? 'n/a'}`,
    `- human_review_required: ${layer.execution?.escalation?.humanReviewRequired ?? false}`,
    `- escalation_source: ${layer.execution?.escalation?.source ?? 'n/a'}`,
    `- escalation_action: ${layer.execution?.escalation?.recommendedAction ?? 'n/a'}`,
  ];
}

function buildConditionReport(cycle: CycleRecord): string[] {
  if (cycle.condition === 'intervention') {
    const digestCount = cycle.digests.length;
    const routedContributionCount = new Set(cycle.routingDecisions.map((decision) => decision.contributionId)).size;
    const bridgeCount = cycle.routingDecisions.filter((decision) => decision.bridgeFlag).length;
    const weights = normalizedCriteriaWeights(cycle);
    return [
      `## Intervention Snapshot`,
      `- routing_decisions: ${cycle.routingDecisions.length}`,
      `- routed_contributions: ${routedContributionCount}`,
      `- digests_generated: ${digestCount}`,
      `- bridge_routed_items: ${bridgeCount}`,
      `- shared_weights: ${formatJsonInline(weights)}`,
      `- engine_mode: ${cycle.config.engineMode ?? 'heuristic'}`,
      ...(cycle.engineV2
        ? [
            `- issue_clusters: ${cycle.engineV2.issueMap.clusters.length}`,
            `- omission_critic: ${cycle.engineV2.critics.find((critic) => critic.criticType === 'omission')?.severity ?? 'unknown'}`,
            `- fairness_critic: ${cycle.engineV2.critics.find((critic) => critic.criticType === 'fairness')?.severity ?? 'unknown'}`,
            `- escalation: ${cycle.engineV2.escalation.recommendedAction}`,
          ]
        : []),
    ];
  }

  return [
    `## Baseline Thread Snapshot`,
    `- thread_exposed_contributions: ${cycle.contributions.length}`,
    `- operator_note: baseline thread exports preserve the same cycle contract without routing, digest, or explanation artifacts`,
  ];
}

export function buildRoutingDecisions(cycle: CycleRecord): RoutingDecision[] {
  if (cycle.condition !== 'intervention') {
    return [];
  }
  const createdAt = new Date().toISOString();
  const contributionsByParticipant = new Map(cycle.contributions.map((item) => [item.participantId, item]));
  const promptTokens = tokenize(cycle.prompt);
  const weights = normalizedCriteriaWeights(cycle);
  const engineMode = cycle.config.engineMode ?? 'recursive_engine_v2';
  const decisions: RoutingDecision[] = [];

  for (const recipient of cycle.participants.filter((participant) => participant.role === 'participant')) {
    const recipientContribution = contributionsByParticipant.get(recipient.id);
    const recipientTokens = tokenize(recipientContribution?.body ?? cycle.prompt);
    const maxDigestItems = Math.min(cycle.config.maxDigestItems, Math.max(0, cycle.contributions.length - 1));
    const candidates = cycle.contributions
      .filter((contribution) => contribution.participantId !== recipient.id)
      .map((contribution) => {
        const contributionTokens = tokenize(contribution.body);
        const thematicScore = jaccard(recipientTokens, contributionTokens);
        const promptScore = jaccard(promptTokens, contributionTokens);
        const factors = buildRoutingFactors(thematicScore, promptScore, maxDigestItems);
        return {
          contribution,
          factors,
          issueClusterId: issueClusterIdFor(contribution.body),
          score: weightedScore(factors, weights),
          bridgeScore: weightedBridgeScore(factors, weights),
        };
      })
      .sort((a, b) => b.score - a.score);

    const selected: Array<{ contribution: Contribution; score: number; factors: RoutingFactors; bridgeFlag: boolean; issueClusterId: string }> = [];
    const bridgeBudget = Math.min(cycle.config.maxBridgeItems, maxDigestItems);
    const primaryCount = Math.max(0, maxDigestItems - bridgeBudget);

    if (engineMode === 'recursive_engine_v2') {
      const selectedClusters = new Set<string>();
      for (const entry of candidates) {
        if (selected.length >= primaryCount) break;
        if (selectedClusters.has(entry.issueClusterId)) continue;
        selected.push({
          contribution: entry.contribution,
          score: entry.score,
          factors: entry.factors,
          bridgeFlag: false,
          issueClusterId: entry.issueClusterId,
        });
        selectedClusters.add(entry.issueClusterId);
      }
      for (const entry of candidates) {
        if (selected.length >= primaryCount) break;
        if (selected.some((item) => item.contribution.id === entry.contribution.id)) continue;
        selected.push({
          contribution: entry.contribution,
          score: entry.score,
          factors: entry.factors,
          bridgeFlag: false,
          issueClusterId: entry.issueClusterId,
        });
      }
    } else {
      selected.push(
        ...candidates.slice(0, primaryCount).map((entry) => ({
          contribution: entry.contribution,
          score: entry.score,
          factors: entry.factors,
          bridgeFlag: false,
          issueClusterId: entry.issueClusterId,
        })),
      );
    }

    const bridgeCandidates = [...candidates]
      .filter((entry) => !selected.some((item) => item.contribution.id === entry.contribution.id))
      .sort((a, b) => b.bridgeScore - a.bridgeScore)
      .slice(0, bridgeBudget)
      .map((entry) => ({
        contribution: entry.contribution,
        score: entry.score,
        factors: entry.factors,
        bridgeFlag: true,
        issueClusterId: entry.issueClusterId,
      }));

    selected.push(...bridgeCandidates);

    selected
      .sort((a, b) => b.score - a.score)
      .forEach((entry, index) => {
        const reason = entry.bridgeFlag
          ? 'Bridge perspective selected under the shared criteria.'
          : index === 0
            ? 'Recipient relevance selected under the shared criteria.'
            : 'Prompt-relevant adjacent perspective selected under the digest load budget.';
        const engineFields = engineMode === 'recursive_engine_v2'
          ? {
              engineVersion: 'engine-v2',
              issueClusterId: entry.issueClusterId,
              judgeConfidence: confidenceFor(entry.factors),
            }
          : {};
        decisions.push({
          id: `route_${cycle.id}_${recipient.id}_${entry.contribution.id}`,
          cycleId: cycle.id,
          contributionId: entry.contribution.id,
          authorParticipantId: entry.contribution.participantId,
          recipientParticipantId: recipient.id,
          score: Number(entry.score.toFixed(4)),
          factors: entry.factors,
          criteriaWeights: weights,
          ...engineFields,
          bridgeFlag: entry.bridgeFlag,
          reason,
          createdAt,
        });
      });
  }

  return decisions;
}

export function buildDigests(cycle: CycleRecord, decisions = cycle.routingDecisions): Digest[] {
  if (cycle.condition !== 'intervention') {
    return [];
  }
  const contributionsById = new Map(cycle.contributions.map((item) => [item.id, item]));
  const grouped = new Map<string, RoutingDecision[]>();
  for (const decision of decisions) {
    const bucket = grouped.get(decision.recipientParticipantId) ?? [];
    bucket.push(decision);
    grouped.set(decision.recipientParticipantId, bucket);
  }

  return cycle.participants
    .filter((participant) => participant.role === 'participant')
    .map((participant) => {
      const participantDecisions = (grouped.get(participant.id) ?? []).sort((a, b) => b.score - a.score);
      const items: DigestItem[] = participantDecisions.map((decision, index) => {
        const contribution = contributionsById.get(decision.contributionId);
        if (!contribution) {
          throw new Error(`Missing contribution ${decision.contributionId} for digest generation.`);
        }
        return {
          contributionId: contribution.id,
          authorParticipantId: contribution.participantId,
          body: contribution.body,
          reason: decision.reason,
          explanation: explanationFor(decision),
          bridgeFlag: decision.bridgeFlag,
          score: decision.score,
          position: index,
        };
      });
      const bridgeCount = items.filter((item) => item.bridgeFlag).length;
      const summary = items.length
        ? `You received ${items.length} routed contributions, including ${bridgeCount} bridge perspective${bridgeCount === 1 ? '' : 's'}.`
        : 'No routed contributions are available for this digest.';
      const routingExplanations = items.map((item) => item.explanation);
      return {
        id: `digest_${cycle.id}_${participant.id}`,
        cycleId: cycle.id,
        participantId: participant.id,
        createdAt: new Date().toISOString(),
        summary,
        routingExplanations,
        items,
      };
    });
}

export function computeMetrics(cycle: CycleRecord): CycleMetrics {
  const participantContributions = cycle.contributions.filter((item) =>
    cycle.participants.some((participant) => participant.id === item.participantId && participant.role === 'participant'),
  );
  const exposureEventType = cycle.condition === 'intervention' ? 'digest_item_opened' : 'thread_item_opened';
  const exposureEvents = cycle.telemetryEvents.filter((event) => event.eventType === exposureEventType && event.targetId);
  const exposureCounts = participantContributions.map((contribution) => {
    const observed = exposureEvents.filter((event) => event.targetId === contribution.id).length;
    if (observed > 0) {
      return observed;
    }
    if (cycle.condition === 'intervention') {
      return cycle.routingDecisions.filter((decision) => decision.contributionId === contribution.id).length;
    }
    return Math.max(0, cycle.participants.filter((participant) => participant.role === 'participant').length - 1);
  });

  const replyCounts = participantContributions.map(
    (contribution) => cycle.responses.filter((response) => response.parentContributionId === contribution.id).length,
  );

  const contributorCoveragePerParticipant = cycle.participants
    .filter((participant) => participant.role === 'participant')
    .map((participant) => {
      if (cycle.condition === 'intervention') {
        const openedContributionIds = cycle.telemetryEvents
          .filter((event) => event.participantId === participant.id && event.eventType === 'digest_item_opened' && event.targetId)
          .map((event) => event.targetId as string);
        if (openedContributionIds.length > 0) {
          return new Set(
            openedContributionIds
              .map((contributionId) => cycle.contributions.find((contribution) => contribution.id === contributionId)?.participantId)
              .filter(Boolean),
          ).size;
        }
        const digest = cycle.digests.find((item) => item.participantId === participant.id);
        return new Set((digest?.items ?? []).map((item) => item.authorParticipantId)).size;
      }
      const openedThreadContributionIds = cycle.telemetryEvents
        .filter((event) => event.participantId === participant.id && event.eventType === 'thread_item_opened' && event.targetId)
        .map((event) => event.targetId as string);
      if (openedThreadContributionIds.length > 0) {
        return new Set(
          openedThreadContributionIds
            .map((contributionId) => cycle.contributions.find((contribution) => contribution.id === contributionId)?.participantId)
            .filter(Boolean),
        ).size;
      }
      return new Set(
        cycle.contributions.filter((contribution) => contribution.participantId !== participant.id).map((item) => item.participantId),
      ).size;
    });

  const bridgeExposureRate =
    cycle.condition === 'intervention' && cycle.routingDecisions.length > 0
      ? cycle.routingDecisions.filter((decision) => decision.bridgeFlag).length / cycle.routingDecisions.length
      : 0;

  const digestOpens = cycle.telemetryEvents.filter((event) => event.eventType === 'digest_opened').length;
  const explanationViews = cycle.telemetryEvents.filter((event) => event.eventType === 'routing_explanation_viewed').length;
  const contributionStarts = cycle.telemetryEvents.filter((event) => event.eventType === 'contribution_started').length;
  const contributionAbandons = cycle.telemetryEvents.filter((event) => event.eventType === 'contribution_abandoned').length;

  return {
    exposureConcentrationGini: Number(gini(exposureCounts).toFixed(4)),
    exposureTop20Share: Number(topShare(exposureCounts, 0.2).toFixed(4)),
    replyConcentrationGini: Number(gini(replyCounts).toFixed(4)),
    replyTop20Share: Number(topShare(replyCounts, 0.2).toFixed(4)),
    averageContributorCoverage: contributorCoveragePerParticipant.length
      ? Number(
          (
            contributorCoveragePerParticipant.reduce((sum, value) => sum + value, 0) /
            contributorCoveragePerParticipant.length
          ).toFixed(4),
        )
      : 0,
    bridgeExposureRate: Number(bridgeExposureRate.toFixed(4)),
    explanationEngagementRate: digestOpens > 0 ? Number((explanationViews / digestOpens).toFixed(4)) : 0,
    abandonmentRate: contributionStarts > 0 ? Number((contributionAbandons / contributionStarts).toFixed(4)) : 0,
    issueCoverageRate: cycle.engineV2?.digestSetCritique.issueCoverageRate,
    omissionRiskRate: cycle.engineV2 ? (cycle.engineV2.critics.find((critic) => critic.criticType === 'omission')?.severity === 'high' ? 1 : cycle.engineV2.critics.find((critic) => critic.criticType === 'omission')?.severity === 'medium' ? 0.5 : 0) : undefined,
    fairnessRiskRate: cycle.engineV2 ? (cycle.engineV2.critics.find((critic) => critic.criticType === 'fairness')?.severity === 'high' ? 1 : cycle.engineV2.critics.find((critic) => critic.criticType === 'fairness')?.severity === 'medium' ? 0.5 : 0) : undefined,
    escalationRate: cycle.engineV2?.escalation.abstain ? 1 : cycle.engineV2 ? 0 : undefined,
    estimatedEngineCostUsd: cycle.engineV2?.modelAudit.estimatedCostUsd,
    engineLatencyMs: cycle.engineV2?.modelAudit.totalLatencyMs,
    participantCount: cycle.participants.filter((participant) => participant.role === 'participant').length,
    contributionCount: cycle.contributions.length,
    responseCount: cycle.responses.length,
  };
}

function renderAnalysis(cycle: CycleRecord): string {
  const metrics = cycle.metrics ?? computeMetrics(cycle);
  return [
    `# ACP Analysis Report`,
    '',
    `This report summarizes one Relay cycle as a presentation-quality ACP analysis artifact.`,
    '',
    `## Cycle Snapshot`,
    `- cycle_id: ${cycle.id}`,
    `- title: ${cycle.title}`,
    `- condition: ${cycle.condition}`,
    `- status: ${cycle.status}`,
    `- participant_count: ${metrics.participantCount}`,
    `- contribution_count: ${metrics.contributionCount}`,
    `- response_count: ${metrics.responseCount}`,
    '',
    `## Headline Metrics`,
    `- exposure_concentration_gini: ${metrics.exposureConcentrationGini}`,
    `- exposure_top_20_share: ${metrics.exposureTop20Share}`,
    `- reply_concentration_gini: ${metrics.replyConcentrationGini}`,
    `- reply_top_20_share: ${metrics.replyTop20Share}`,
    `- average_contributor_coverage: ${metrics.averageContributorCoverage}`,
    `- bridge_exposure_rate: ${metrics.bridgeExposureRate}`,
    `- explanation_engagement_rate: ${metrics.explanationEngagementRate}`,
    `- abandonment_rate: ${metrics.abandonmentRate}`,
    ...(cycle.engineV2
      ? [
          `- issue_coverage_rate: ${metrics.issueCoverageRate}`,
          `- omission_risk_rate: ${metrics.omissionRiskRate}`,
          `- fairness_risk_rate: ${metrics.fairnessRiskRate}`,
          `- escalation_rate: ${metrics.escalationRate}`,
          `- estimated_engine_cost_usd: ${metrics.estimatedEngineCostUsd}`,
          `- engine_latency_ms: ${metrics.engineLatencyMs}`,
        ]
      : []),
    '',
    `## Interpretation Aids`,
    ...buildAnalysisHighlights(cycle, metrics),
    '',
    ...buildConditionReport(cycle),
    '',
    ...renderProceduralLayer(cycle),
    '',
    `## Contributions By Participant`,
    ...(cycle.contributions.length > 0
      ? cycle.contributions.map((contribution, index) => formatContributionLine(contribution, index))
      : ['- no participant contributions were captured for this cycle']),
  ].join('\n');
}

function renderAudit(cycle: CycleRecord): string {
  const auditCount = cycle.auditEvents.length;
  const telemetryCount = cycle.telemetryEvents.length;
  return [
    `# ACP Audit Report`,
    '',
    `This report preserves an inspectable operator-facing trace for one Relay cycle.`,
    '',
    `## Cycle Snapshot`,
    `- cycle_id: ${cycle.id}`,
    `- title: ${cycle.title}`,
    `- condition: ${cycle.condition}`,
    `- status: ${cycle.status}`,
    `- audit_event_count: ${auditCount}`,
    `- telemetry_event_count: ${telemetryCount}`,
    '',
    ...renderProceduralLayer(cycle),
    '',
    `## Audit Events`,
    ...(cycle.auditEvents.length > 0
      ? cycle.auditEvents.map(
          (event, index) =>
            `${index + 1}. ${event.createdAt} | ${event.actorType}:${event.actorId} | ${event.action} | ${formatJsonInline(event.detail)}`,
        )
      : ['- no audit events recorded']),
    '',
    `## Telemetry Events`,
    ...(cycle.telemetryEvents.length > 0
      ? cycle.telemetryEvents.map(
          (event: TelemetryEvent, index) =>
            `${index + 1}. ${event.createdAt} | ${event.participantId ?? 'system'} | ${event.eventType} | ${event.targetId ?? ''} | ${formatJsonInline(event.metadata)}`,
        )
      : ['- no telemetry events recorded']),
  ].join('\n');
}

function renderMinimal(cycle: CycleRecord): string {
  return [
    `# ACP Cycle Snapshot`,
    '',
    `Compact export for quick operator review and demo use.`,
    '',
    `- cycle_id: ${cycle.id}`,
    `- title: ${cycle.title}`,
    `- condition: ${cycle.condition}`,
    `- status: ${cycle.status}`,
    `- participants: ${cycle.participants.filter((participant) => participant.role === 'participant').length}`,
    `- contributions: ${cycle.contributions.length}`,
    `- responses: ${cycle.responses.length}`,
    `- digests: ${cycle.digests.length}`,
    `- audit_events: ${cycle.auditEvents.length}`,
    `- telemetry_events: ${cycle.telemetryEvents.length}`,
    `- procedural_references: ${cycle.proceduralLayer?.references.length ?? 0}`,
    `- procedural_contest_points: ${cycle.proceduralLayer?.contestPoints.length ?? 0}`,
  ].join('\n');
}

export function buildExportContent(cycle: CycleRecord, mode: ExportMode): string {
  switch (mode) {
    case 'analysis':
      return renderAnalysis(cycle);
    case 'audit':
      return renderAudit(cycle);
    case 'minimal':
      return renderMinimal(cycle);
    default:
      return renderMinimal(cycle);
  }
}
