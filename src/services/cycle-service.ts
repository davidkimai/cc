import crypto from 'node:crypto';

import {
  type AuditEvent,
  type Contribution,
  type ContributionInput,
  type CreateCycleInput,
  type CycleCondition,
  type CycleRecord,
  type ExportArtifact,
  type ExportMode,
  type FeedbackInput,
  type Participant,
  type ParticipantEventInput,
  type ParticipantView,
  type ResponseInput,
  cycleConfigSchema,
  cycleRecordSchema,
  parseContributionInput,
  parseCreateCycleInput,
  parseFeedbackInput,
  parseParticipantEventInput,
  parseResponseInput,
} from '../core/types.js';
import { FileStore } from './file-store.js';
import { buildDigests, buildExportContent, buildRoutingDecisions, computeMetrics } from './pipeline.js';

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function participantName(participant: Participant | undefined, fallback: string): string {
  return participant?.name ?? fallback;
}

export class CycleService {
  constructor(private readonly store: FileStore = new FileStore()) {}

  async listCycles(): Promise<CycleRecord[]> {
    return this.store.listCycles();
  }

  async getCycle(cycleId: string): Promise<CycleRecord> {
    const cycle = await this.store.getCycle(cycleId);
    if (!cycle) {
      throw new Error(`Cycle ${cycleId} not found.`);
    }
    return cycle;
  }

  async createCycle(input: unknown, actorId = 'operator'): Promise<CycleRecord> {
    const parsed = parseCreateCycleInput(input);
    const createdAt = now();
    const cycle: CycleRecord = cycleRecordSchema.parse({
      id: id('cycle'),
      title: parsed.title,
      prompt: parsed.prompt,
      condition: parsed.condition,
      status: 'draft',
      createdAt,
      updatedAt: createdAt,
      schedule: parsed.schedule ?? {},
      config: cycleConfigSchema.parse(parsed.config ?? {}),
      participants: parsed.participants,
      contributions: [],
      routingDecisions: [],
      digests: [],
      responses: [],
      feedback: [],
      telemetryEvents: [],
      auditEvents: [],
      exports: [],
    });
    this.appendAudit(cycle, 'operator', actorId, 'cycle_created', {
      condition: parsed.condition,
      participantCount: parsed.participants.length,
    });
    this.appendTelemetry(cycle, {
      eventType: 'cycle_created',
      surface: 'api',
      condition: parsed.condition,
      metadata: { participantCount: parsed.participants.length },
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async openCycle(cycleId: string, actorId = 'operator'): Promise<CycleRecord> {
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['draft']);
    cycle.status = 'submission_open';
    cycle.openedAt = now();
    this.appendAudit(cycle, 'operator', actorId, 'cycle_opened');
    this.appendTelemetry(cycle, {
      eventType: 'cycle_opened',
      surface: 'api',
      condition: cycle.condition,
      metadata: {},
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async closeSubmissions(cycleId: string, actorId = 'operator'): Promise<CycleRecord> {
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['submission_open']);
    cycle.status = 'submission_closed';
    cycle.submissionClosedAt = now();
    this.appendAudit(cycle, 'operator', actorId, 'submissions_closed', {
      contributionCount: cycle.contributions.length,
    });
    this.appendTelemetry(cycle, {
      eventType: 'submissions_closed',
      surface: 'api',
      condition: cycle.condition,
      metadata: { contributionCount: cycle.contributions.length },
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async runRouting(cycleId: string, actorId = 'operator'): Promise<CycleRecord> {
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['submission_closed']);
    if (cycle.condition !== 'intervention') {
      throw new Error('Routing is only available for intervention cycles.');
    }
    this.appendTelemetry(cycle, {
      eventType: 'routing_started',
      surface: 'api',
      condition: cycle.condition,
      metadata: {},
    });
    try {
      cycle.routingDecisions = buildRoutingDecisions(cycle);
      cycle.digests = buildDigests(cycle, cycle.routingDecisions);
    } catch (error) {
      this.appendAudit(cycle, 'system', actorId, 'routing_job_failed', {
        message: error instanceof Error ? error.message : String(error),
      });
      this.appendTelemetry(cycle, {
        eventType: 'routing_job_failed',
        surface: 'api',
        condition: cycle.condition,
        metadata: { message: error instanceof Error ? error.message : String(error) },
      });
      cycle.metrics = computeMetrics(cycle);
      await this.persist(cycle);
      throw error;
    }
    cycle.status = 'routing_completed';
    cycle.routingCompletedAt = now();
    this.appendTelemetry(cycle, {
      eventType: 'digest_generated',
      surface: 'api',
      condition: cycle.condition,
      metadata: {
        routingDecisionCount: cycle.routingDecisions.length,
        digestCount: cycle.digests.length,
      },
    });
    this.appendAudit(cycle, 'operator', actorId, 'routing_completed', {
      routingDecisionCount: cycle.routingDecisions.length,
      digestCount: cycle.digests.length,
    });
    this.appendTelemetry(cycle, {
      eventType: 'routing_completed',
      surface: 'api',
      condition: cycle.condition,
      metadata: {
        routingDecisionCount: cycle.routingDecisions.length,
        digestCount: cycle.digests.length,
      },
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async releaseCycle(cycleId: string, actorId = 'operator'): Promise<CycleRecord> {
    const cycle = await this.getCycle(cycleId);
    if (cycle.condition === 'intervention') {
      this.assertStatus(cycle, ['routing_completed']);
    } else {
      this.assertStatus(cycle, ['submission_closed']);
    }
    cycle.status = 'digests_released';
    cycle.releasedAt = now();
    this.appendAudit(cycle, 'operator', actorId, cycle.condition === 'intervention' ? 'digests_released' : 'thread_released');
    this.appendTelemetry(cycle, {
      eventType: 'digests_released',
      surface: 'api',
      condition: cycle.condition,
      metadata: { releaseMode: cycle.condition === 'intervention' ? 'digest' : 'thread' },
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async closeReflection(cycleId: string, actorId = 'operator'): Promise<CycleRecord> {
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['digests_released']);
    cycle.status = 'reflection_closed';
    cycle.reflectionClosedAt = now();
    this.appendAudit(cycle, 'operator', actorId, 'reflection_closed');
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async archiveCycle(cycleId: string, actorId = 'operator'): Promise<CycleRecord> {
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['reflection_closed']);
    cycle.status = 'archived';
    cycle.archivedAt = now();
    this.appendAudit(cycle, 'operator', actorId, 'cycle_archived');
    this.appendTelemetry(cycle, {
      eventType: 'cycle_archived',
      surface: 'api',
      condition: cycle.condition,
      metadata: {},
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async replayCycle(cycleId: string, actorId = 'operator'): Promise<CycleRecord> {
    const cycle = await this.getCycle(cycleId);
    this.appendTelemetry(cycle, {
      eventType: 'replay_started',
      surface: 'api',
      condition: cycle.condition,
      metadata: { status: cycle.status },
    });
    this.appendAudit(cycle, 'operator', actorId, 'cycle_replayed', {
      status: cycle.status,
      condition: cycle.condition,
    });
    this.appendTelemetry(cycle, {
      eventType: 'replay_completed',
      surface: 'api',
      condition: cycle.condition,
      metadata: { status: cycle.status },
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async submitContribution(cycleId: string, input: unknown): Promise<CycleRecord> {
    const parsed = parseContributionInput(input);
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['submission_open']);
    this.ensureParticipant(cycle, parsed.participantId);
    if (cycle.contributions.some((contribution) => contribution.participantId === parsed.participantId)) {
      throw new Error(`Participant ${parsed.participantId} already submitted a contribution.`);
    }
    const contribution: Contribution = {
      id: id('contribution'),
      cycleId,
      participantId: parsed.participantId,
      body: parsed.body,
      confidenceLabel: parsed.confidenceLabel,
      evidenceText: parsed.evidenceText,
      createdAt: now(),
    };
    cycle.contributions.push(contribution);
    this.appendAudit(cycle, 'participant', parsed.participantId, 'contribution_submitted', {
      contributionId: contribution.id,
    });
    this.appendTelemetry(cycle, {
      participantId: parsed.participantId,
      eventType: 'contribution_submitted',
      surface: 'participant_web',
      targetId: contribution.id,
      condition: cycle.condition,
      metadata: {},
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async submitResponse(cycleId: string, input: unknown): Promise<CycleRecord> {
    const parsed = parseResponseInput(input);
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['digests_released']);
    this.ensureParticipant(cycle, parsed.participantId);
    const parent = cycle.contributions.find((contribution) => contribution.id === parsed.parentContributionId);
    if (!parent) {
      throw new Error(`Parent contribution ${parsed.parentContributionId} not found.`);
    }
    cycle.responses.push({
      id: id('response'),
      cycleId,
      participantId: parsed.participantId,
      parentContributionId: parsed.parentContributionId,
      body: parsed.body,
      createdAt: now(),
    });
    this.appendAudit(cycle, 'participant', parsed.participantId, 'response_submitted', {
      parentContributionId: parsed.parentContributionId,
    });
    this.appendTelemetry(cycle, {
      participantId: parsed.participantId,
      eventType: 'response_submitted',
      surface: 'participant_web',
      targetId: parsed.parentContributionId,
      condition: cycle.condition,
      metadata: {},
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async submitFeedback(cycleId: string, input: unknown): Promise<CycleRecord> {
    const parsed = parseFeedbackInput(input);
    const cycle = await this.getCycle(cycleId);
    this.assertStatus(cycle, ['digests_released', 'reflection_closed', 'archived']);
    this.ensureParticipant(cycle, parsed.participantId);
    const existingIndex = cycle.feedback.findIndex((record) => record.participantId === parsed.participantId);
    const record = {
      id: existingIndex >= 0 ? cycle.feedback[existingIndex].id : id('feedback'),
      cycleId,
      participantId: parsed.participantId,
      instrumentVersion: parsed.instrumentVersion,
      answers: parsed.answers,
      createdAt: now(),
    };
    if (existingIndex >= 0) {
      cycle.feedback[existingIndex] = record;
    } else {
      cycle.feedback.push(record);
    }
    this.appendAudit(cycle, 'participant', parsed.participantId, 'feedback_submitted');
    this.appendTelemetry(cycle, {
      participantId: parsed.participantId,
      eventType: 'feedback_submitted',
      surface: 'participant_web',
      targetId: record.id,
      condition: cycle.condition,
      metadata: {},
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async recordParticipantEvent(cycleId: string, input: unknown): Promise<CycleRecord> {
    const parsed = parseParticipantEventInput(input);
    const cycle = await this.getCycle(cycleId);
    this.ensureParticipant(cycle, parsed.participantId);
    this.appendTelemetry(cycle, {
      participantId: parsed.participantId,
      eventType: parsed.eventType,
      surface: parsed.surface,
      targetId: parsed.targetId,
      condition: cycle.condition,
      metadata: parsed.metadata ?? {},
    });
    this.appendAudit(cycle, 'participant', parsed.participantId, 'participant_event_recorded', {
      eventType: parsed.eventType,
      targetId: parsed.targetId,
    });
    cycle.metrics = computeMetrics(cycle);
    return this.persist(cycle);
  }

  async getParticipantView(cycleId: string, participantId: string): Promise<ParticipantView> {
    const cycle = await this.getCycle(cycleId);
    const participant = this.ensureParticipant(cycle, participantId);
    const contribution = cycle.contributions.find((item) => item.participantId === participantId);
    const feedback = cycle.feedback.find((item) => item.participantId === participantId);
    const responses = cycle.responses.filter((item) => item.participantId === participantId);
    if (cycle.status === 'submission_open') {
      return { cycle, participant, mode: 'submission', contribution, responses, feedback };
    }
    if (cycle.status === 'submission_closed' || cycle.status === 'routing_completed') {
      return { cycle, participant, mode: 'waiting', contribution, responses, feedback };
    }
    if (cycle.status === 'digests_released') {
      if (cycle.condition === 'intervention') {
        return {
          cycle,
          participant,
          mode: 'digest',
          contribution,
          digest: cycle.digests.find((item) => item.participantId === participantId),
          responses,
          feedback,
        };
      }
      return {
        cycle,
        participant,
        mode: 'thread',
        contribution,
        thread: [...cycle.contributions].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        responses,
        feedback,
      };
    }
    return { cycle, participant, mode: 'complete', contribution, responses, feedback };
  }

  async exportCycle(cycleId: string, mode: ExportMode): Promise<ExportArtifact> {
    const cycle = await this.getCycle(cycleId);
    cycle.metrics = computeMetrics(cycle);
    const content = buildExportContent(cycle, mode);
    const artifact: ExportArtifact = {
      id: id('export'),
      cycleId,
      mode,
      createdAt: now(),
      content,
    };
    const existingIndex = cycle.exports.findIndex((item) => item.mode === mode);
    if (existingIndex >= 0) {
      artifact.id = cycle.exports[existingIndex].id;
      cycle.exports[existingIndex] = artifact;
    } else {
      cycle.exports.push(artifact);
    }
    this.appendAudit(cycle, 'system', 'system', 'export_generated', { mode });
    this.appendTelemetry(cycle, {
      eventType: 'export_generated',
      surface: 'api',
      condition: cycle.condition,
      targetId: artifact.id,
      metadata: { mode },
    });
    await this.persist(cycle);
    return artifact;
  }

  private assertStatus(cycle: CycleRecord, allowed: CycleRecord['status'][]): void {
    if (!allowed.includes(cycle.status)) {
      throw new Error(`Cycle ${cycle.id} cannot transition from ${cycle.status}. Expected one of: ${allowed.join(', ')}.`);
    }
  }

  private ensureParticipant(cycle: CycleRecord, participantId: string): Participant {
    const participant = cycle.participants.find((item) => item.id === participantId && item.role === 'participant');
    if (!participant) {
      throw new Error(`Participant ${participantId} not found in cycle ${cycle.id}.`);
    }
    return participant;
  }

  private appendTelemetry(
    cycle: CycleRecord,
    event: Omit<CycleRecord['telemetryEvents'][number], 'id' | 'cycleId' | 'createdAt'>,
  ): void {
    cycle.telemetryEvents.push({
      id: id('telemetry'),
      cycleId: cycle.id,
      createdAt: now(),
      ...event,
    });
    cycle.updatedAt = now();
  }

  private appendAudit(
    cycle: CycleRecord,
    actorType: AuditEvent['actorType'],
    actorId: string,
    action: string,
    detail: Record<string, unknown> = {},
  ): void {
    cycle.auditEvents.push({
      id: id('audit'),
      cycleId: cycle.id,
      actorType,
      actorId,
      action,
      detail,
      createdAt: now(),
    });
    cycle.updatedAt = now();
  }

  private async persist(cycle: CycleRecord): Promise<CycleRecord> {
    cycle.updatedAt = now();
    cycle.metrics = computeMetrics(cycle);
    return this.store.saveCycle(cycle);
  }
}
