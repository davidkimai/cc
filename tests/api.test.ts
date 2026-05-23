import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildApp } from '../src/api/app.js';
import { issueSessionToken } from '../src/api/security.js';

function participants() {
  return [
    { id: 'p1', name: 'Alice', role: 'participant' },
    { id: 'p2', name: 'Bob', role: 'participant' },
    { id: 'p3', name: 'Carol', role: 'participant' },
  ];
}

function auth(token: string) {
  return { 'x-acp-session-token': token };
}

function signRawSession(payload: Record<string, unknown>, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
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

  it('runs an intervention cycle end to end in development mode with workspace metadata', async () => {
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
    expect(create.json().cycle.workspaceId).toBe('local-workspace');
    expect(create.json().access.participantInvites).toHaveLength(3);
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

  it('enforces operator, analyst, participant, and workspace boundaries in enforced mode', async () => {
    const securedDir = await mkdtemp(path.join(os.tmpdir(), 'acp-api-secured-'));
    const securedApp = await buildApp({
      dataDir: securedDir,
      security: { mode: 'enforced', authSecret: 'test-secret', defaultWorkspaceId: 'workspace-a' },
    });

    const facilitator = issueSessionToken(
      {
        sessionId: 'session_facilitator',
        actorId: 'facilitator-1',
        actorType: 'operator',
        role: 'facilitator',
        workspaceId: 'workspace-a',
        authMode: 'signed_session',
        issuedAt: new Date().toISOString(),
      },
      { mode: 'enforced', authSecret: 'test-secret', defaultWorkspaceId: 'workspace-a' },
    );

    const analyst = issueSessionToken(
      {
        sessionId: 'session_analyst',
        actorId: 'analyst-1',
        actorType: 'observer',
        role: 'research_analyst',
        workspaceId: 'workspace-a',
        authMode: 'signed_session',
        issuedAt: new Date().toISOString(),
      },
      { mode: 'enforced', authSecret: 'test-secret', defaultWorkspaceId: 'workspace-a' },
    );

    const otherWorkspace = issueSessionToken(
      {
        sessionId: 'session_workspace_b',
        actorId: 'facilitator-2',
        actorType: 'operator',
        role: 'facilitator',
        workspaceId: 'workspace-b',
        authMode: 'signed_session',
        issuedAt: new Date().toISOString(),
      },
      { mode: 'enforced', authSecret: 'test-secret', defaultWorkspaceId: 'workspace-a' },
    );

    const create = await securedApp.inject({
      method: 'POST',
      url: '/v1/cycles',
      headers: auth(facilitator.token),
      payload: {
        title: 'Secured cycle',
        prompt: 'What tradeoffs matter most?',
        condition: 'intervention',
        participants: participants(),
      },
    });
    expect(create.statusCode).toBe(201);
    const cycleId = create.json().cycle.id as string;
    expect(create.json().cycle.workspaceId).toBe('workspace-a');
    const participantInvite = create.json().access.participantInvites[0];

    const anonymous = await securedApp.inject({ method: 'GET', url: '/v1/cycles' });
    expect(anonymous.statusCode).toBe(401);
    expect(anonymous.json().code).toBe('UNAUTHORIZED');

    const analystCreate = await securedApp.inject({
      method: 'POST',
      url: '/v1/cycles',
      headers: auth(analyst.token),
      payload: {
        title: 'Blocked analyst cycle',
        prompt: 'Blocked',
        condition: 'baseline_thread',
        participants: participants(),
      },
    });
    expect(analystCreate.statusCode).toBe(403);
    expect(analystCreate.json().code).toBe('FORBIDDEN');

    const crossWorkspaceRead = await securedApp.inject({
      method: 'GET',
      url: `/v1/cycles/${cycleId}`,
      headers: auth(otherWorkspace.token),
    });
    expect(crossWorkspaceRead.statusCode).toBe(404);
    expect(crossWorkspaceRead.json().code).toBe('NOT_FOUND');

    expect((await securedApp.inject({ method: 'POST', url: `/v1/cycles/${cycleId}/open`, headers: auth(facilitator.token) })).statusCode).toBe(200);

    const participantSession = await securedApp.inject({
      method: 'GET',
      url: `/v1/session?token=${encodeURIComponent(participantInvite.token)}`,
      headers: auth(participantInvite.token),
    });
    expect(participantSession.statusCode).toBe(200);
    expect(participantSession.json().role).toBe('participant');
    expect(participantSession.json().participantId).toBe(participantInvite.participantId);

    const participantOwnContribution = await securedApp.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/participants/${participantInvite.participantId}/contribution`,
      headers: auth(participantInvite.token),
      payload: { body: 'Participant scoped contribution.' },
    });
    expect(participantOwnContribution.statusCode).toBe(200);

    const participantOtherContribution = await securedApp.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/participants/p2/contribution`,
      headers: auth(participantInvite.token),
      payload: { body: 'Illegal contribution.' },
    });
    expect(participantOtherContribution.statusCode).toBe(403);
    expect(participantOtherContribution.json().code).toBe('FORBIDDEN');

    const participantOperatorRoute = await securedApp.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/close-submissions`,
      headers: auth(participantInvite.token),
    });
    expect(participantOperatorRoute.statusCode).toBe(403);

    const analystRead = await securedApp.inject({
      method: 'GET',
      url: `/v1/cycles/${cycleId}/audit-events`,
      headers: auth(analyst.token),
    });
    expect(analystRead.statusCode).toBe(200);

    await securedApp.close();
    await rm(securedDir, { recursive: true, force: true });
  });

  it('hardens signed-session transport, expiry, and role capability semantics', async () => {
    const securedDir = await mkdtemp(path.join(os.tmpdir(), 'acp-api-auth-'));
    const authSecret = 'auth-hardening-secret';
    const security = { mode: 'enforced' as const, authSecret, defaultWorkspaceId: 'workspace-a' };
    const securedApp = await buildApp({ dataDir: securedDir, security });

    const facilitator = issueSessionToken(
      {
        sessionId: 'session_facilitator_auth',
        actorId: 'facilitator-auth',
        actorType: 'operator',
        role: 'facilitator',
        workspaceId: 'workspace-a',
        authMode: 'signed_session',
        issuedAt: new Date().toISOString(),
      },
      security,
    );

    const sessionViaQuery = await securedApp.inject({
      method: 'GET',
      url: `/v1/session?token=${encodeURIComponent(facilitator.token)}`,
    });
    expect(sessionViaQuery.statusCode).toBe(200);

    const cyclesViaQuery = await securedApp.inject({
      method: 'GET',
      url: `/v1/cycles?token=${encodeURIComponent(facilitator.token)}`,
    });
    expect(cyclesViaQuery.statusCode).toBe(401);
    expect(cyclesViaQuery.json().code).toBe('UNAUTHORIZED');

    const metricsAfterQueryFailure = await securedApp.inject({
      method: 'GET',
      url: '/v1/ops/metrics',
      headers: auth(facilitator.token),
    });
    expect(metricsAfterQueryFailure.statusCode).toBe(200);
    expect(metricsAfterQueryFailure.json().counters.authFailures).toBeGreaterThanOrEqual(1);

    const create = await securedApp.inject({
      method: 'POST',
      url: '/v1/cycles',
      headers: auth(facilitator.token),
      payload: {
        title: 'Auth hardening cycle',
        prompt: 'Where should privilege boundaries sit?',
        condition: 'intervention',
        participants: participants(),
      },
    });
    expect(create.statusCode).toBe(201);
    const cycleId = create.json().cycle.id as string;

    const overprivilegedParticipant = signRawSession(
      {
        sessionId: 'session_overprivileged_participant',
        actorId: 'p1',
        actorType: 'participant',
        role: 'participant',
        workspaceId: 'workspace-a',
        participantId: 'p1',
        cycleScopeId: cycleId,
        authMode: 'signed_invite',
        capabilities: ['participant:contribute', 'cycle:transition'],
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
      authSecret,
    );
    const overprivilegedAttempt = await securedApp.inject({
      method: 'POST',
      url: `/v1/cycles/${cycleId}/close-submissions`,
      headers: auth(overprivilegedParticipant),
    });
    expect(overprivilegedAttempt.statusCode).toBe(401);
    expect(overprivilegedAttempt.json().code).toBe('UNAUTHORIZED');

    const expiredOperator = issueSessionToken(
      {
        sessionId: 'session_expired_operator',
        actorId: 'expired-operator',
        actorType: 'operator',
        role: 'facilitator',
        workspaceId: 'workspace-a',
        authMode: 'signed_session',
        issuedAt: new Date(Date.now() - 120_000).toISOString(),
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
      security,
    );
    const expiredRead = await securedApp.inject({
      method: 'GET',
      url: '/v1/cycles',
      headers: auth(expiredOperator.token),
    });
    expect(expiredRead.statusCode).toBe(401);
    expect(expiredRead.json().code).toBe('UNAUTHORIZED');

    await securedApp.close();
    await rm(securedDir, { recursive: true, force: true });
  });
});
