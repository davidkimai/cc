import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'node:path';

import { exportModeSchema, type CycleRecord } from '../core/types.js';
import { CycleService } from '../services/cycle-service.js';
import { createCycleStore } from '../services/store-factory.js';
import type { CycleStore } from '../services/store.js';
import {
  AccessError,
  AuthenticationError,
  assertCycleAccess,
  canAccessParticipant,
  filterCyclesForSession,
  issueSessionToken,
  participantInvite,
  requireCapability,
  resolveSession,
  securityDefaults,
  type AccessAction,
  type AppSession,
  type SecurityConfig,
} from './security.js';
import {
  attachRequestId,
  createOpsRuntime,
  protocolBundleStatus,
  recordExport,
  recordLifecycle,
  recordResponse,
  recordRouting,
  recordWorkspace,
  storageStatus,
  uptimeSeconds,
} from './ops.js';

interface BuildAppConfig {
  dataDir?: string;
  store?: CycleStore;
  storeMode?: string;
  sqlitePath?: string;
  security?: SecurityConfig;
  repoRoot?: string;
}

function parseError(error: unknown): { statusCode: number; message: string; code: string } {
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (error instanceof AuthenticationError) {
    return { statusCode: 401, message, code: error.code };
  }
  if (error instanceof AccessError) {
    return { statusCode: 403, message, code: error.code };
  }
  if (message.includes('not found')) {
    return { statusCode: 404, message, code: 'NOT_FOUND' };
  }
  if (message.includes('cannot transition') || message.includes('only available') || message.includes('already submitted') || message.includes('already failed')) {
    return { statusCode: 409, message, code: 'STATE_CONFLICT' };
  }
  return { statusCode: 400, message, code: 'BAD_REQUEST' };
}

function requestBaseUrl(request: FastifyRequest): string {
  const protocolHeader = request.headers['x-forwarded-proto'];
  const protocol = typeof protocolHeader === 'string' && protocolHeader.trim() ? protocolHeader.trim() : 'http';
  const host = typeof request.headers.host === 'string' && request.headers.host.trim() ? request.headers.host.trim() : '127.0.0.1:4317';
  return `${protocol}://${host}`;
}

function sessionPayload(session: AppSession) {
  return {
    sessionId: session.sessionId,
    actorId: session.actorId,
    actorType: session.actorType,
    role: session.role,
    workspaceId: session.workspaceId,
    participantId: session.participantId,
    cycleScopeId: session.cycleScopeId,
    authMode: session.authMode,
    capabilities: session.capabilities,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    token: session.token,
  };
}

async function cycleFor(service: CycleService, session: AppSession, cycleId: string, action: AccessAction, participantId?: string): Promise<CycleRecord> {
  const cycle = await service.getCycle(cycleId, session.workspaceId);
  assertCycleAccess(session, cycle, action, participantId);
  return cycle;
}

export async function buildApp(config?: BuildAppConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const security = securityDefaults(config?.security);
  const dataDir = config?.dataDir ?? path.resolve(process.cwd(), '.acp-data');
  const repoRoot = config?.repoRoot ?? process.cwd();
  const ops = createOpsRuntime();
  const store = config?.store ?? createCycleStore({ mode: config?.storeMode ?? 'file', dataDir, sqlitePath: config?.sqlitePath });
  const service = new CycleService(store);

  await app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), 'public'),
    prefix: '/',
  });

  app.addHook('onRequest', async (request, reply) => {
    attachRequestId(request, reply);
  });

  app.addHook('onResponse', async (request, reply) => {
    recordResponse(ops, request, reply);
  });

  app.get('/health', async () => ({
    ok: true,
    version: ops.protocolVersion,
    authMode: security.mode,
    uptimeSeconds: uptimeSeconds(ops),
    startedAt: ops.startedAt,
  }));

  app.get('/ready', async () => {
    const storage = await storageStatus(dataDir);
    const protocol = await protocolBundleStatus(repoRoot);
    return {
      ok: storage.ok && protocol.ok,
      version: ops.protocolVersion,
      authMode: security.mode,
      uptimeSeconds: uptimeSeconds(ops),
      checks: { storage, protocolBundle: protocol },
    };
  });

  app.get('/v1/ops/status', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      requireCapability(session, 'ops:read');
      recordWorkspace(ops, session.workspaceId);
      const storage = await storageStatus(dataDir);
      const protocol = await protocolBundleStatus(repoRoot);
      return {
        ok: storage.ok && protocol.ok,
        version: ops.protocolVersion,
        authMode: security.mode,
        workspaceId: session.workspaceId,
        startedAt: ops.startedAt,
        uptimeSeconds: uptimeSeconds(ops),
        checks: { storage, protocolBundle: protocol },
      };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/ops/metrics', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      requireCapability(session, 'ops:read');
      recordWorkspace(ops, session.workspaceId);
      return {
        version: ops.protocolVersion,
        workspaceId: session.workspaceId,
        startedAt: ops.startedAt,
        uptimeSeconds: uptimeSeconds(ops),
        counters: ops.counters,
      };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/session', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const analystSession = issueSessionToken(
        {
          sessionId: `session_analyst_${session.workspaceId}`,
          actorId: 'research-analyst',
          actorType: 'observer',
          role: 'research_analyst',
          workspaceId: session.workspaceId,
          authMode: security.mode === 'development' ? 'development' : 'signed_session',
          issuedAt: new Date().toISOString(),
        },
        security,
      );
      return {
        ...sessionPayload(session),
        availableSessions: {
          analyst: sessionPayload(analystSession),
        },
      };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      requireCapability(session, 'cycle:list');
      const cycles = filterCyclesForSession(session, await service.listCycles(session.workspaceId));
      const { scope, status, condition } = request.query as { scope?: string; status?: string; condition?: string };
      const filtered = cycles.filter((cycle) => {
        if (status && cycle.status !== status) return false;
        if (condition && cycle.condition !== condition) return false;
        if (scope === 'participant') return cycle.participants.some((participant) => participant.role === 'participant');
        return true;
      });
      return { cycles: filtered, workspaceId: session.workspaceId };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      requireCapability(session, 'cycle:create');
      const cycle = await service.createCycle(
        {
          ...(request.body as Record<string, unknown>),
          workspaceId: session.workspaceId,
        },
        session.actorId,
      );
      const baseUrl = requestBaseUrl(request);
      const participantInvites = cycle.participants
        .filter((participant) => participant.role === 'participant')
        .map((participant) => {
          const invite = participantInvite(session, cycle, participant.id, security);
          return {
            participantId: participant.id,
            participantName: participant.name,
            token: invite.token,
            url: `${baseUrl}/?token=${encodeURIComponent(invite.token)}#/participant/${cycle.id}/${participant.id}`,
          };
        });
      return reply.code(201).send({ cycle, access: { workspaceId: session.workspaceId, participantInvites } });
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycle = await cycleFor(service, session, (request.params as { cycleId: string }).cycleId, 'cycle:read');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/open', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycleId = (request.params as { cycleId: string }).cycleId;
      await cycleFor(service, session, cycleId, 'cycle:transition');
      const cycle = await service.openCycle(cycleId, session.actorId);
      recordLifecycle(ops);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/close-submissions', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycleId = (request.params as { cycleId: string }).cycleId;
      await cycleFor(service, session, cycleId, 'cycle:transition');
      const cycle = await service.closeSubmissions(cycleId, session.actorId);
      recordLifecycle(ops);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/routing', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycleId = (request.params as { cycleId: string }).cycleId;
      await cycleFor(service, session, cycleId, 'cycle:routing');
      const cycle = await service.runRouting(cycleId, session.actorId);
      recordRouting(ops);
      recordLifecycle(ops);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/release', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycleId = (request.params as { cycleId: string }).cycleId;
      await cycleFor(service, session, cycleId, 'cycle:transition');
      const cycle = await service.releaseCycle(cycleId, session.actorId);
      recordLifecycle(ops);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/close-reflection', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycleId = (request.params as { cycleId: string }).cycleId;
      await cycleFor(service, session, cycleId, 'cycle:transition');
      const cycle = await service.closeReflection(cycleId, session.actorId);
      recordLifecycle(ops);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/archive', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycleId = (request.params as { cycleId: string }).cycleId;
      await cycleFor(service, session, cycleId, 'cycle:transition');
      const cycle = await service.archiveCycle(cycleId, session.actorId);
      recordLifecycle(ops);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/fail', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId } = request.params as { cycleId: string };
      await cycleFor(service, session, cycleId, 'cycle:transition');
      const body = (request.body as { reason?: string } | undefined) ?? {};
      const cycle = await service.failCycle(cycleId, body.reason ?? 'operator_marked_failed', session.actorId);
      recordLifecycle(ops);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/replay', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycleId = (request.params as { cycleId: string }).cycleId;
      await cycleFor(service, session, cycleId, 'cycle:transition');
      const cycle = await service.replayCycle(cycleId, session.actorId);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/audit-events', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycle = await cycleFor(service, session, (request.params as { cycleId: string }).cycleId, 'cycle:audit');
      return { auditEvents: cycle.auditEvents };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/telemetry-events', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycle = await cycleFor(service, session, (request.params as { cycleId: string }).cycleId, 'cycle:telemetry');
      return { telemetryEvents: cycle.telemetryEvents };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/metrics', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycle = await cycleFor(service, session, (request.params as { cycleId: string }).cycleId, 'cycle:metrics');
      return { metrics: cycle.metrics };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/routing-decisions', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycle = await cycleFor(service, session, (request.params as { cycleId: string }).cycleId, 'cycle:digests');
      return { routingDecisions: cycle.routingDecisions };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/digests', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycle = await cycleFor(service, session, (request.params as { cycleId: string }).cycleId, 'cycle:digests');
      return { digests: cycle.digests };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/digests/:participantId', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      const action: AccessAction = session.role === 'participant' ? 'participant:view' : 'cycle:digests';
      const cycle = await cycleFor(service, session, cycleId, action, participantId);
      if (!canAccessParticipant(session, participantId)) {
        throw new AccessError(`Session cannot inspect digest for participant ${participantId}.`);
      }
      return { digest: cycle.digests.find((item) => item.participantId === participantId) ?? null };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/contribution', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      await cycleFor(service, session, cycleId, 'participant:contribute', participantId);
      if (!canAccessParticipant(session, participantId)) {
        throw new AccessError(`Session cannot submit contribution for participant ${participantId}.`);
      }
      const cycle = await service.submitContribution(cycleId, {
        participantId,
        ...(request.body as Record<string, unknown>),
      });
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/participants/:participantId/view', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      await cycleFor(service, session, cycleId, 'participant:view', participantId);
      if (!canAccessParticipant(session, participantId)) {
        throw new AccessError(`Session cannot load view for participant ${participantId}.`);
      }
      const view = await service.getParticipantView(cycleId, participantId);
      return { view };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/responses', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      await cycleFor(service, session, cycleId, 'participant:respond', participantId);
      if (!canAccessParticipant(session, participantId)) {
        throw new AccessError(`Session cannot submit response for participant ${participantId}.`);
      }
      const cycle = await service.submitResponse(cycleId, {
        participantId,
        ...(request.body as Record<string, unknown>),
      });
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/feedback', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      await cycleFor(service, session, cycleId, 'participant:feedback', participantId);
      if (!canAccessParticipant(session, participantId)) {
        throw new AccessError(`Session cannot submit feedback for participant ${participantId}.`);
      }
      const cycle = await service.submitFeedback(cycleId, {
        participantId,
        ...(request.body as Record<string, unknown>),
      });
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/events', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      await cycleFor(service, session, cycleId, 'participant:event', participantId);
      if (!canAccessParticipant(session, participantId)) {
        throw new AccessError(`Session cannot record events for participant ${participantId}.`);
      }
      const cycle = await service.recordParticipantEvent(cycleId, {
        participantId,
        ...(request.body as Record<string, unknown>),
      });
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/exports', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId } = request.params as { cycleId: string };
      await cycleFor(service, session, cycleId, 'cycle:export');
      const mode = exportModeSchema.parse((request.body as { mode?: string })?.mode ?? 'analysis');
      const artifact = await service.exportCycle(cycleId, mode);
      recordExport(ops);
      return reply.code(201).send({ export: artifact });
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/exports', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const cycle = await cycleFor(service, session, (request.params as { cycleId: string }).cycleId, 'cycle:export');
      return { exports: cycle.exports };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/exports/:mode', async (request, reply) => {
    try {
      const session = resolveSession(request, security);
      recordWorkspace(ops, session.workspaceId);
      const { cycleId, mode } = request.params as { cycleId: string; mode: string };
      await cycleFor(service, session, cycleId, 'cycle:export');
      const parsedMode = exportModeSchema.parse(mode);
      const artifact = await service.exportCycle(cycleId, parsedMode);
      recordExport(ops);
      reply.type('text/markdown; charset=utf-8');
      return artifact.content;
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  return app;
}
