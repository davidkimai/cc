import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildApp } from '../src/api/app.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('browser telemetry boundary', () => {
  let dataDir: string;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-browser-telemetry-'));
    app = await buildApp({ dataDir });
  });

  afterAll(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('emits only canonical participant_web surface values from the browser bundle', async () => {
    const appJs = await readFile(path.join(repoRoot, 'public', 'app.js'), 'utf8');

    expect(appJs).toContain("const PARTICIPANT_WEB_SURFACE = 'participant_web'");
    expect(appJs).not.toContain("surface: 'web'");
    expect(appJs).not.toContain('surface: "web"');
    expect(appJs).toContain('keepalive: true');
    expect(appJs).toContain("new Blob([payload], { type: 'application/json' })");
    expect(appJs).toContain('Shared deliberative criteria');
    expect(appJs).toContain('Factors:');
  });

  it('persists browser participant events with schema-valid surface values and rejects legacy web surface', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/cycles',
      payload: {
        title: 'Browser telemetry cycle',
        prompt: 'Which participant event surfaces are valid?',
        condition: 'baseline_thread',
        participants: [
          { id: 'p1', name: 'Avery', role: 'participant' },
          { id: 'p2', name: 'Mina', role: 'participant' },
        ],
      },
    });
    expect(create.statusCode).toBe(201);
    const cycleId = create.json().cycle.id as string;

    const accepted = await app.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/participants/p1/events`,
      payload: {
        eventType: 'prompt_viewed',
        surface: 'participant_web',
        metadata: { source: 'browser-regression' },
      },
    });
    expect(accepted.statusCode).toBe(200);

    const rejected = await app.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/participants/p1/events`,
      payload: {
        eventType: 'prompt_viewed',
        surface: 'web',
        metadata: { source: 'legacy-browser-regression' },
      },
    });
    expect(rejected.statusCode).toBe(400);

    const telemetry = await app.inject({ method: 'GET', url: `/v1/cycles/${cycleId}/telemetry-events` });
    expect(telemetry.statusCode).toBe(200);
    const participantEvents = telemetry.json().telemetryEvents.filter((event: { eventType: string }) => event.eventType === 'prompt_viewed');
    expect(participantEvents).toHaveLength(1);
    expect(participantEvents[0]).toMatchObject({
      participantId: 'p1',
      eventType: 'prompt_viewed',
      surface: 'participant_web',
      condition: 'baseline_thread',
    });
  });
});
