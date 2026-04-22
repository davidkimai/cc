import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { CycleRecord } from '../src/core/types.js';
import { CycleService } from '../src/services/cycle-service.js';
import { FileStore } from '../src/services/file-store.js';

function participants() {
  return [
    { id: 'p1', name: 'Alice', role: 'participant' },
    { id: 'p2', name: 'Bob', role: 'participant' },
    { id: 'p3', name: 'Carol', role: 'participant' },
  ];
}

const dirs: string[] = [];

async function createService() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'acp-service-'));
  dirs.push(dir);
  return new CycleService(new FileStore(dir));
}

afterEach(async () => {
  while (dirs.length) {
    const dir = dirs.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

describe('CycleService', () => {
  it('orchestrates an intervention cycle with routing, digests, replay, and export', async () => {
    const service = await createService();
    let cycle = await service.createCycle({
      title: 'Intervention cycle',
      prompt: 'How should the committee reason about budget tradeoffs?',
      condition: 'intervention',
      participants: participants(),
    });

    cycle = await service.openCycle(cycle.id);
    cycle = await service.submitContribution(cycle.id, { participantId: 'p1', body: 'Protect the most vulnerable groups.' });
    cycle = await service.submitContribution(cycle.id, { participantId: 'p2', body: 'Preserve fiscal sustainability.' });
    cycle = await service.submitContribution(cycle.id, { participantId: 'p3', body: 'Balance near-term relief with long-term capacity.' });
    cycle = await service.closeSubmissions(cycle.id);
    cycle = await service.runRouting(cycle.id);
    expect(cycle.routingDecisions.length).toBeGreaterThan(0);
    expect(cycle.digests.length).toBe(3);

    cycle = await service.releaseCycle(cycle.id);
    const participantView = await service.getParticipantView(cycle.id, 'p1');
    expect(participantView.mode).toBe('digest');
    expect(participantView.digest).toBeDefined();
    expect(participantView.digest!.items.length).toBeGreaterThan(0);

    cycle = await service.submitResponse(cycle.id, {
      participantId: 'p1',
      parentContributionId: participantView.digest!.items[0].contributionId,
      body: 'The tradeoff needs explicit sequencing.',
    });
    cycle = await service.submitFeedback(cycle.id, {
      participantId: 'p1',
      instrumentVersion: 'v1',
      answers: {
        overload: 2,
        usefulness: 4,
        exchangeQuality: 4,
        explanationClarity: 4,
        returnWillingness: 4,
      },
    });
    cycle = await service.replayCycle(cycle.id);
    expect(cycle.auditEvents.some((event) => event.action === 'cycle_replayed')).toBe(true);

    const analysis = await service.exportCycle(cycle.id, 'analysis');
    expect(analysis.content).toContain('ACP Analysis Export');
  });

  it('runs baseline cycles on the same model without routing or digests', async () => {
    const service = await createService();
    let cycle = await service.createCycle({
      title: 'Baseline cycle',
      prompt: 'Discuss staffing priorities.',
      condition: 'baseline_thread',
      participants: participants(),
    });

    cycle = await service.openCycle(cycle.id);
    cycle = await service.submitContribution(cycle.id, { participantId: 'p1', body: 'Prioritize retention.' });
    cycle = await service.submitContribution(cycle.id, { participantId: 'p2', body: 'Prioritize new hiring.' });
    cycle = await service.submitContribution(cycle.id, { participantId: 'p3', body: 'Sequence both.' });
    cycle = await service.closeSubmissions(cycle.id);
    await expect(service.runRouting(cycle.id)).rejects.toThrow(/only available for intervention/i);
    cycle = await service.releaseCycle(cycle.id);

    const participantView = await service.getParticipantView(cycle.id, 'p2');
    expect(participantView.mode).toBe('thread');
    expect(participantView.thread).toHaveLength(3);
    expect(cycle.routingDecisions).toHaveLength(0);
    expect(cycle.digests).toHaveLength(0);

  });
});
