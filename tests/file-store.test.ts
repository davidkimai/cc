import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { CycleRecord } from '../src/core/types.js';
import { FileStore } from '../src/services/file-store.js';

const dirs: string[] = [];

afterEach(async () => {
  while (dirs.length) {
    const dir = dirs.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

describe('FileStore', () => {
  it('round-trips canonical cycle artifacts', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'acp-store-'));
    dirs.push(dir);
    const store = new FileStore(dir);
    const cycle: CycleRecord = {
      id: 'cycle_store',
      title: 'Persistence check',
      prompt: 'What should persist?',
      condition: 'intervention',
      status: 'draft',
      createdAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-04-22T00:00:00.000Z',
      schedule: {},
      config: { maxDigestItems: 4, maxBridgeItems: 1 },
      participants: [
        { id: 'p1', name: 'Alice', role: 'participant' },
        { id: 'p2', name: 'Bob', role: 'participant' },
      ],
      contributions: [
        { id: 'c1', cycleId: 'cycle_store', participantId: 'p1', body: 'Persist me.', createdAt: '2026-04-22T00:01:00.000Z' },
      ],
      routingDecisions: [
        {
          id: 'rd1',
          cycleId: 'cycle_store',
          contributionId: 'c1',
          authorParticipantId: 'p1',
          recipientParticipantId: 'p2',
          score: 0.5,
          bridgeFlag: false,
          reason: 'test',
          createdAt: '2026-04-22T00:02:00.000Z',
        },
      ],
      digests: [
        {
          id: 'd1',
          cycleId: 'cycle_store',
          participantId: 'p2',
          createdAt: '2026-04-22T00:03:00.000Z',
          summary: 'summary',
          items: [
            {
              contributionId: 'c1',
              authorParticipantId: 'p1',
              body: 'Persist me.',
              reason: 'test',
              explanation: 'because',
              bridgeFlag: false,
              score: 0.5,
              position: 0,
            },
          ],
        },
      ],
      responses: [],
      feedback: [],
      telemetryEvents: [],
      auditEvents: [],
      exports: [],
      metrics: {
        exposureConcentrationGini: 0,
        exposureTop20Share: 0,
        replyConcentrationGini: 0,
        replyTop20Share: 0,
        averageContributorCoverage: 1,
        bridgeExposureRate: 0,
        explanationEngagementRate: 0,
        abandonmentRate: 0,
        participantCount: 2,
        contributionCount: 1,
        responseCount: 0,
      },
    };

    await store.saveCycle(cycle);
    const fetched = await store.getCycle(cycle.id);
    expect(fetched?.id).toBe(cycle.id);
    expect(fetched?.digests[0].items[0].body).toBe('Persist me.');
    expect((await store.listCycles()).length).toBe(1);
  });
});
