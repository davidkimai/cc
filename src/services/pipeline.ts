import {
  type Contribution,
  type CycleMetrics,
  type CycleRecord,
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

function explanationFor(score: number, bridgeFlag: boolean): string {
  if (bridgeFlag) {
    return 'This item was included to expose you to a relevant but less obvious perspective.';
  }
  if (score >= 0.45) {
    return 'This item overlaps strongly with the themes in your own contribution.';
  }
  if (score >= 0.2) {
    return 'This item was selected because it connects to adjacent themes in your contribution.';
  }
  return 'This item was selected to broaden coverage while staying on the prompt.';
}

export function buildRoutingDecisions(cycle: CycleRecord): RoutingDecision[] {
  if (cycle.condition !== 'intervention') {
    return [];
  }
  const createdAt = new Date().toISOString();
  const contributionsByParticipant = new Map(cycle.contributions.map((item) => [item.participantId, item]));
  const promptTokens = tokenize(cycle.prompt);
  const decisions: RoutingDecision[] = [];

  for (const recipient of cycle.participants.filter((participant) => participant.role === 'participant')) {
    const recipientContribution = contributionsByParticipant.get(recipient.id);
    const recipientTokens = tokenize(recipientContribution?.body ?? cycle.prompt);
    const candidates = cycle.contributions
      .filter((contribution) => contribution.participantId !== recipient.id)
      .map((contribution) => {
        const contributionTokens = tokenize(contribution.body);
        const thematicScore = jaccard(recipientTokens, contributionTokens);
        const promptScore = jaccard(promptTokens, contributionTokens);
        return {
          contribution,
          score: thematicScore * 0.7 + promptScore * 0.3,
        };
      })
      .sort((a, b) => b.score - a.score);

    const selected: Array<{ contribution: Contribution; score: number; bridgeFlag: boolean }> = [];
    const maxDigestItems = Math.min(cycle.config.maxDigestItems, candidates.length);
    const bridgeBudget = Math.min(cycle.config.maxBridgeItems, maxDigestItems);
    const primaryCount = Math.max(0, maxDigestItems - bridgeBudget);

    selected.push(
      ...candidates.slice(0, primaryCount).map((entry) => ({
        contribution: entry.contribution,
        score: entry.score,
        bridgeFlag: false,
      })),
    );

    const bridgeCandidates = [...candidates]
      .reverse()
      .filter((entry) => !selected.some((item) => item.contribution.id === entry.contribution.id))
      .slice(0, bridgeBudget)
      .map((entry) => ({
        contribution: entry.contribution,
        score: entry.score,
        bridgeFlag: true,
      }));

    selected.push(...bridgeCandidates);

    selected
      .sort((a, b) => b.score - a.score)
      .forEach((entry, index) => {
        const reason = entry.bridgeFlag
          ? 'Bridge exposure to a non-obvious but relevant perspective.'
          : index === 0
            ? 'Strong thematic overlap with recipient contribution.'
            : 'Relevant adjacent perspective selected under the digest load budget.';
        decisions.push({
          id: `route_${cycle.id}_${recipient.id}_${entry.contribution.id}`,
          cycleId: cycle.id,
          contributionId: entry.contribution.id,
          authorParticipantId: entry.contribution.participantId,
          recipientParticipantId: recipient.id,
          score: Number(entry.score.toFixed(4)),
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
          explanation: explanationFor(decision.score, decision.bridgeFlag),
          bridgeFlag: decision.bridgeFlag,
          score: decision.score,
          position: index,
        };
      });
      const bridgeCount = items.filter((item) => item.bridgeFlag).length;
      const summary = items.length
        ? `You received ${items.length} routed contributions, including ${bridgeCount} bridge perspective${bridgeCount === 1 ? '' : 's'}.`
        : 'No routed contributions are available for this digest.';
      return {
        id: `digest_${cycle.id}_${participant.id}`,
        cycleId: cycle.id,
        participantId: participant.id,
        createdAt: new Date().toISOString(),
        summary,
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
    participantCount: cycle.participants.filter((participant) => participant.role === 'participant').length,
    contributionCount: cycle.contributions.length,
    responseCount: cycle.responses.length,
  };
}

function renderAnalysis(cycle: CycleRecord): string {
  const metrics = cycle.metrics ?? computeMetrics(cycle);
  return [
    `# ACP Analysis Export`,
    '',
    `- cycle_id: ${cycle.id}`,
    `- title: ${cycle.title}`,
    `- condition: ${cycle.condition}`,
    `- status: ${cycle.status}`,
    `- participant_count: ${metrics.participantCount}`,
    `- contribution_count: ${metrics.contributionCount}`,
    `- response_count: ${metrics.responseCount}`,
    '',
    `## Metrics`,
    `- exposure_concentration_gini: ${metrics.exposureConcentrationGini}`,
    `- exposure_top_20_share: ${metrics.exposureTop20Share}`,
    `- reply_concentration_gini: ${metrics.replyConcentrationGini}`,
    `- reply_top_20_share: ${metrics.replyTop20Share}`,
    `- average_contributor_coverage: ${metrics.averageContributorCoverage}`,
    `- bridge_exposure_rate: ${metrics.bridgeExposureRate}`,
    `- explanation_engagement_rate: ${metrics.explanationEngagementRate}`,
    `- abandonment_rate: ${metrics.abandonmentRate}`,
    '',
    `## Contributions`,
    ...cycle.contributions.map((contribution) => `- ${contribution.participantId}: ${contribution.body}`),
  ].join('\n');
}

function renderAudit(cycle: CycleRecord): string {
  return [
    `# ACP Audit Export`,
    '',
    `- cycle_id: ${cycle.id}`,
    `- condition: ${cycle.condition}`,
    '',
    `## Audit Events`,
    ...cycle.auditEvents.map(
      (event) => `- ${event.createdAt} | ${event.actorType}:${event.actorId} | ${event.action} | ${JSON.stringify(event.detail)}`,
    ),
    '',
    `## Telemetry Events`,
    ...cycle.telemetryEvents.map(
      (event: TelemetryEvent) =>
        `- ${event.createdAt} | ${event.participantId ?? 'system'} | ${event.eventType} | ${event.targetId ?? ''} | ${JSON.stringify(event.metadata)}`,
    ),
  ].join('\n');
}

function renderMinimal(cycle: CycleRecord): string {
  return [
    `# ACP Minimal Export`,
    '',
    `- cycle_id: ${cycle.id}`,
    `- title: ${cycle.title}`,
    `- condition: ${cycle.condition}`,
    `- status: ${cycle.status}`,
    `- participants: ${cycle.participants.filter((participant) => participant.role === 'participant').length}`,
    `- contributions: ${cycle.contributions.length}`,
    `- responses: ${cycle.responses.length}`,
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
