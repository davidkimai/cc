import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'node:path';

import { exportModeSchema } from '../core/types.js';
import { FileStore } from '../services/file-store.js';
import { CycleService } from '../services/cycle-service.js';

function parseError(error: unknown): { statusCode: number; message: string; code: string } {
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (message.includes('not found')) {
    return { statusCode: 404, message, code: 'NOT_FOUND' };
  }
  if (message.includes('cannot transition') || message.includes('only available') || message.includes('already submitted')) {
    return { statusCode: 409, message, code: 'STATE_CONFLICT' };
  }
  return { statusCode: 400, message, code: 'BAD_REQUEST' };
}

export async function buildApp(config?: { dataDir?: string }): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const service = new CycleService(new FileStore(config?.dataDir));

  await app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), 'public'),
    prefix: '/',
  });

  app.get('/health', async () => ({ ok: true }));
  app.get('/ready', async () => ({ ok: true }));

  app.get('/v1/session', async () => ({
    actorType: 'operator',
    actorId: 'local-operator',
    capabilities: ['operator', 'participant'],
  }));

  app.get('/v1/cycles', async (request, reply) => {
    try {
      const cycles = await service.listCycles();
      const { scope, status, condition } = request.query as { scope?: string; status?: string; condition?: string };
      const filtered = cycles.filter((cycle) => {
        if (status && cycle.status !== status) return false;
        if (condition && cycle.condition !== condition) return false;
        if (scope === 'participant') return cycle.participants.some((participant) => participant.role === 'participant');
        return true;
      });
      return { cycles: filtered };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles', async (request, reply) => {
    try {
      const cycle = await service.createCycle(request.body, 'local-operator');
      return reply.code(201).send({ cycle });
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId', async (request, reply) => {
    try {
      const cycle = await service.getCycle((request.params as { cycleId: string }).cycleId);
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/open', async (request, reply) => {
    try {
      const cycle = await service.openCycle((request.params as { cycleId: string }).cycleId, 'local-operator');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/close-submissions', async (request, reply) => {
    try {
      const cycle = await service.closeSubmissions((request.params as { cycleId: string }).cycleId, 'local-operator');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/routing', async (request, reply) => {
    try {
      const cycle = await service.runRouting((request.params as { cycleId: string }).cycleId, 'local-operator');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/release', async (request, reply) => {
    try {
      const cycle = await service.releaseCycle((request.params as { cycleId: string }).cycleId, 'local-operator');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/close-reflection', async (request, reply) => {
    try {
      const cycle = await service.closeReflection((request.params as { cycleId: string }).cycleId, 'local-operator');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/archive', async (request, reply) => {
    try {
      const cycle = await service.archiveCycle((request.params as { cycleId: string }).cycleId, 'local-operator');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/replay', async (request, reply) => {
    try {
      const cycle = await service.replayCycle((request.params as { cycleId: string }).cycleId, 'local-operator');
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/audit-events', async (request, reply) => {
    try {
      const cycle = await service.getCycle((request.params as { cycleId: string }).cycleId);
      return { auditEvents: cycle.auditEvents };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/telemetry-events', async (request, reply) => {
    try {
      const cycle = await service.getCycle((request.params as { cycleId: string }).cycleId);
      return { telemetryEvents: cycle.telemetryEvents };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/metrics', async (request, reply) => {
    try {
      const cycle = await service.getCycle((request.params as { cycleId: string }).cycleId);
      return { metrics: cycle.metrics };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/routing-decisions', async (request, reply) => {
    try {
      const cycle = await service.getCycle((request.params as { cycleId: string }).cycleId);
      return { routingDecisions: cycle.routingDecisions };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/digests', async (request, reply) => {
    try {
      const cycle = await service.getCycle((request.params as { cycleId: string }).cycleId);
      return { digests: cycle.digests };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.get('/v1/cycles/:cycleId/digests/:participantId', async (request, reply) => {
    try {
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      const cycle = await service.getCycle(cycleId);
      return { digest: cycle.digests.find((item) => item.participantId === participantId) ?? null };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/contribution', async (request, reply) => {
    try {
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
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
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      const view = await service.getParticipantView(cycleId, participantId);
      return { view };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/responses', async (request, reply) => {
    try {
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      const cycle = await service.submitResponse(cycleId, {
        participantId,
        ...(request.body as Record<string, unknown>),
      });
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/feedback', async (request, reply) => {
    try {
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      const cycle = await service.submitFeedback(cycleId, {
        participantId,
        ...(request.body as Record<string, unknown>),
      });
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message });
    }
  });

  app.post('/v1/cycles/:cycleId/participants/:participantId/events', async (request, reply) => {
    try {
      const { cycleId, participantId } = request.params as { cycleId: string; participantId: string };
      const cycle = await service.recordParticipantEvent(cycleId, {
        participantId,
        ...(request.body as Record<string, unknown>),
      });
      return { cycle };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message });
    }
  });

  app.post('/v1/cycles/:cycleId/exports', async (request, reply) => {
    try {
      const { cycleId } = request.params as { cycleId: string };
      const mode = exportModeSchema.parse((request.body as { mode?: string })?.mode ?? 'analysis');
      const artifact = await service.exportCycle(cycleId, mode);
      return reply.code(201).send({ export: artifact });
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message });
    }
  });

  app.get('/v1/cycles/:cycleId/exports', async (request, reply) => {
    try {
      const cycle = await service.getCycle((request.params as { cycleId: string }).cycleId);
      return { exports: cycle.exports };
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message });
    }
  });

  app.get('/v1/cycles/:cycleId/exports/:mode', async (request, reply) => {
    try {
      const { cycleId, mode } = request.params as { cycleId: string; mode: string };
      const parsedMode = exportModeSchema.parse(mode);
      const artifact = await service.exportCycle(cycleId, parsedMode);
      reply.type('text/markdown; charset=utf-8');
      return artifact.content;
    } catch (error) {
      const parsed = parseError(error);
      return reply.code(parsed.statusCode).send({ error: parsed.message });
    }
  });

  return app;
}
