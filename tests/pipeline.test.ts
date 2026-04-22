import { describe, expect, it } from 'vitest';

import type { CycleRecord } from '../src/core/types.js';
import { buildDigests, buildExportContent, buildRoutingDecisions, computeMetrics } from '../src/services/pipeline.js';

function interventionCycle(): CycleRecord {
  return {
    id: 'cycle_1',
    title: 'Intervention analysis',
    prompt: 'How should the group reason under load?',
    condition: 'intervention',
    status: 'digests_released',
    createdAt: '2026-04-22T00:00:00.000Z',
    updatedAt: '2026-04-22T00:00:00.000Z',
    schedule: {},
    config: { maxDigestItems: 3, maxBridgeItems: 1 },
    participants: [
      { id: 'p1', name: 'Alice', role: 'participant' },
      { id: 'p2', name: 'Bob', role: 'participant' },
      { id: 'p3', name: 'Carol', role: 'participant' },
    ],
    contributions: [
      { id: 'c1', cycleId: 'cycle_1', participantId: 'p1', body: 'Pacing matters for reading.', createdAt: '2026-04-22T00:01:00.000Z' },
      { id: 'c2', cycleId: 'cycle_1', participantId: 'p2', body: 'Bridge exposure matters for minority views.', createdAt: '2026-04-22T00:02:00.000Z' },
      { id: 'c3', cycleId: 'cycle_1', participantId: 'p3', body: 'Auditability matters for operator trust.', createdAt: '2026-04-22T00:03:00.000Z' },
    ],
    routingDecisions: [],
    digests: [],
    responses: [
      { id: 'r1', cycleId: 'cycle_1', participantId: 'p1', parentContributionId: 'c2', body: 'Agreed.', createdAt: '2026-04-22T00:05:00.000Z' },
    ],
    feedback: [],
    telemetryEvents: [
      { id: 't1', cycleId: 'cycle_1', participantId: 'p1', eventType: 'contribution_started', surface: 'participant_web', condition: 'intervention', metadata: {}, createdAt: '2026-04-22T00:01:00.000Z' },
      { id: 't2', cycleId: 'cycle_1', participantId: 'p1', eventType: 'digest_opened', surface: 'participant_web', condition: 'intervention', metadata: {}, createdAt: '2026-04-22T00:04:00.000Z' },
      { id: 't3', cycleId: 'cycle_1', participantId: 'p1', eventType: 'routing_explanation_viewed', surface: 'participant_web', condition: 'intervention', metadata: {}, createdAt: '2026-04-22T00:04:30.000Z' },
      { id: 't4', cycleId: 'cycle_1', participantId: 'p1', eventType: 'digest_item_opened', surface: 'participant_web', condition: 'intervention', targetId: 'c2', metadata: {}, createdAt: '2026-04-22T00:04:45.000Z' },
    ],
    auditEvents: [],
    exports: [],
  };
}

describe('pipeline', () => {
  it('builds routing decisions and digests for intervention cycles', () => {
    const cycle = interventionCycle();
    const routing = buildRoutingDecisions(cycle);
    expect(routing.length).toBeGreaterThan(0);
    const digests = buildDigests({ ...cycle, routingDecisions: routing });
    expect(digests).toHaveLength(3);
    expect(digests[0].items.length).toBeGreaterThan(0);
  });

  it('computes metrics and analysis exports', () => {
    const cycle = interventionCycle();
    cycle.routingDecisions = buildRoutingDecisions(cycle);
    cycle.digests = buildDigests(cycle);
    const metrics = computeMetrics(cycle);
    expect(metrics.participantCount).toBe(3);
    expect(metrics.responseCount).toBe(1);
    expect(metrics.explanationEngagementRate).toBeGreaterThanOrEqual(0);

    const analysis = buildExportContent({ ...cycle, metrics }, 'analysis');
    expect(analysis).toContain('exposure_concentration_gini');
    const minimal = buildExportContent({ ...cycle, metrics }, 'minimal');
    expect(minimal).not.toContain('Pacing matters for reading');
  });
});
