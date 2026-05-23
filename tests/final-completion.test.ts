import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../src/api/app.js';
import { issueSessionToken } from '../src/api/security.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('final technical completion wave', () => {
  it('returns request ids and exposes protected operational status', async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-ops-data-'));
    const app = await buildApp({
      dataDir,
      security: { mode: 'enforced', authSecret: 'ops-secret', defaultWorkspaceId: 'workspace-ops' },
    });
    const operator = issueSessionToken(
      {
        sessionId: 'ops-operator',
        actorId: 'operator-ops',
        actorType: 'operator',
        role: 'facilitator',
        workspaceId: 'workspace-ops',
        authMode: 'signed_session',
        issuedAt: new Date().toISOString(),
      },
      { mode: 'enforced', authSecret: 'ops-secret', defaultWorkspaceId: 'workspace-ops' },
    );
    const participant = issueSessionToken(
      {
        sessionId: 'ops-participant',
        actorId: 'p1',
        actorType: 'participant',
        role: 'participant',
        workspaceId: 'workspace-ops',
        participantId: 'p1',
        cycleScopeId: 'ops-cycle',
        authMode: 'signed_invite',
        issuedAt: new Date().toISOString(),
      },
      { mode: 'enforced', authSecret: 'ops-secret', defaultWorkspaceId: 'workspace-ops' },
    );

    try {
      const health = await app.inject({ method: 'GET', url: '/health', headers: { 'x-acp-request-id': 'req-test' } });
      expect(health.statusCode).toBe(200);
      expect(health.headers['x-acp-request-id']).toBe('req-test');
      expect(health.json().uptimeSeconds).toBeGreaterThanOrEqual(0);

      const ready = await app.inject({ method: 'GET', url: '/ready' });
      expect(ready.statusCode).toBe(200);
      expect(ready.json().checks.storage.ok).toBe(true);
      expect(ready.json().checks.protocolBundle.ok).toBe(true);

      const blocked = await app.inject({
        method: 'GET',
        url: '/v1/ops/status',
        headers: { 'x-acp-session-token': participant.token },
      });
      expect(blocked.statusCode).toBe(403);

      const status = await app.inject({
        method: 'GET',
        url: '/v1/ops/status',
        headers: { 'x-acp-session-token': operator.token },
      });
      expect(status.statusCode).toBe(200);
      expect(status.json().workspaceId).toBe('workspace-ops');

      const metrics = await app.inject({
        method: 'GET',
        url: '/v1/ops/metrics',
        headers: { 'x-acp-session-token': operator.token },
      });
      expect(metrics.statusCode).toBe(200);
      expect(metrics.json().counters.requests).toBeGreaterThan(0);
    } finally {
      await app.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  it('runs release smoke and completion audit with machine-readable outputs', async () => {
    const completionOut = await mkdtemp(path.join(os.tmpdir(), 'acp-completion-audit-'));
    try {
      const smoke = await execFileAsync('npm', ['run', '--silent', 'release:smoke'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      expect(JSON.parse(smoke.stdout).ok).toBe(true);

      await execFileAsync('npm', ['run', '--silent', 'completion:audit', '--', '--out', completionOut], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const audit = JSON.parse(await readFile(path.join(completionOut, 'technical-completion-audit.json'), 'utf8'));
      const handoff = await readFile(path.join(completionOut, 'remaining-human-layer-work.md'), 'utf8');
      expect(audit.status).toBe('pass');
      expect(audit.claims).toHaveLength(7);
      expect(handoff).toContain('partner and pilot recruitment');
    } finally {
      await rm(completionOut, { recursive: true, force: true });
    }
  }, 30000);
});
