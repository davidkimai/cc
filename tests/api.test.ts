import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildApp } from '../src/api/app';

function participants() {
  return [
    { id: 'p1', name: 'Alice', role: 'participant' },
    { id: 'p2', name: 'Bob', role: 'participant' },
    { id: 'p3', name: 'Carol', role: 'participant' },
  ];
}

describe('acp API', () => {
  let dataDir: string;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-api-'));
    app = await buildApp({ dataDir });
  });

  afterAll(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('runs an intervention cycle end to end', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/cycles',
      payload: {
        title: 'Housing tradeoffs',
        prompt: 'What tradeoffs matter most?',
        condition: 'intervention',
        participants: participants(),
      },
    });
    expect(create.statusCode).toBe(201);
    const cycleId = create.json().cycle.id as string;

    expect((await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/open` })).statusCode).toBe(200);

    for (const [participantId, body] of [
      ['p1', 'Rent stability matters for families.'],
      ['p2', 'Supply constraints drive prices.'],
      ['p3', 'Tenant protection and supply both matter.'],
    ] as const) {
      const response = await app.inject({
        method: 'POST',
        url: `/v1/cycles/${cycleId}/participants/${participantId}/contribution`,
        payload: { body },
      });
      expect(response.statusCode).toBe(200);
    }

    expect((await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/close-submissions` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/routing` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/release` })).statusCode).toBe(200);

    const participantView = await app.inject({ method: 'GET', url: `/v1/cycles/${cycleId}/participants/p1/view` });
    expect(participantView.statusCode).toBe(200);
    expect(participantView.json().view.mode).toBe('digest');
    expect(participantView.json().view.digest.items.length).toBeGreaterThan(0);

    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/v1/cycles/${cycleId}/participants/p1/responses`,
          payload: {
            parentContributionId: participantView.json().view.digest.items[0].contributionId,
            body: 'This connects supply constraints to tenant stability.',
          },
        })
      ).statusCode,
    ).toBe(200);

    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/v1/cycles/${cycleId}/participants/p1/feedback`,
          payload: {
            instrumentVersion: 'v1',
            answers: {
              overload: 2,
              usefulness: 4,
              exchangeQuality: 4,
              explanationClarity: 4,
              returnWillingness: 5,
            },
          },
        })
      ).statusCode,
    ).toBe(200);

    expect((await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/close-reflection` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/archive` })).statusCode).toBe(200);

    const exportResponse = await app.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/exports`,
      payload: { mode: 'analysis' },
    });
    expect(exportResponse.statusCode).toBe(201);
    expect(exportResponse.json().export.mode).toBe('analysis');
  });

  it('runs a baseline cycle end to end on the same cycle model', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/cycles',
      payload: {
        title: 'Baseline committee loop',
        prompt: 'What tradeoffs matter most?',
        condition: 'baseline_thread',
        participants: participants(),
      },
    });
    const cycleId = create.json().cycle.id as string;

    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/open` });
    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/participants/p1/contribution`, payload: { body: 'First thread post.' } });
    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/participants/p2/contribution`, payload: { body: 'Second thread post.' } });
    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/participants/p3/contribution`, payload: { body: 'Third thread post.' } });
    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/close-submissions` });
    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/release` });

    const participantView = await app.inject({ method: 'GET', url: `/v1/cycles/${cycleId}/participants/p2/view` });
    expect(participantView.statusCode).toBe(200);
    expect(participantView.json().view.mode).toBe('thread');
    expect(participantView.json().view.thread).toHaveLength(3);

    const routeAttempt = await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/routing` });
    expect(routeAttempt.statusCode).toBe(409);

    await app.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/participants/p2/responses`,
      payload: {
        parentContributionId: participantView.json().view.thread[0].id,
        body: 'Baseline reply.',
      },
    });
    await app.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/participants/p2/feedback`,
      payload: {
        instrumentVersion: 'v1',
        answers: {
          overload: 3,
          usefulness: 3,
          exchangeQuality: 3,
          explanationClarity: 3,
          returnWillingness: 3,
        },
      },
    });
    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/close-reflection` });
    await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/archive` });

    const metrics = await app.inject({ method: 'GET', url: `/v1/cycles/${cycleId}/metrics` });
    expect(metrics.statusCode).toBe(200);
    expect(metrics.json().metrics.participantCount).toBe(3);
  });

  it('enforces lifecycle guardrails', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/cycles',
      payload: {
        title: 'Guardrails',
        prompt: 'Test guardrails',
        condition: 'intervention',
        participants: participants(),
      },
    });
    const cycleId = create.json().cycle.id as string;

    const routeTooEarly = await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/routing` });
    expect(routeTooEarly.statusCode).toBe(409);

    const archiveTooEarly = await app.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/archive` });
    expect(archiveTooEarly.statusCode).toBe(409);
  });
});
