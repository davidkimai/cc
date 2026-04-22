import { z } from 'zod';

export const cycleConditionSchema = z.enum(['intervention', 'baseline_thread']);
export type CycleCondition = z.infer<typeof cycleConditionSchema>;

export const cycleStatusSchema = z.enum([
  'draft',
  'submission_open',
  'submission_closed',
  'routing_completed',
  'digests_released',
  'reflection_closed',
  'archived',
  'failed',
]);
export type CycleStatus = z.infer<typeof cycleStatusSchema>;

export const confidenceLabelSchema = z.enum(['low', 'medium', 'high']).optional();
export type ConfidenceLabel = z.infer<typeof confidenceLabelSchema>;

export const participantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['participant', 'operator']).default('participant'),
});
export type Participant = z.infer<typeof participantSchema>;

export const contributionSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  participantId: z.string().min(1),
  body: z.string().min(1),
  confidenceLabel: confidenceLabelSchema,
  evidenceText: z.string().optional(),
  createdAt: z.string().min(1),
});
export type Contribution = z.infer<typeof contributionSchema>;

export const routingDecisionSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  contributionId: z.string().min(1),
  authorParticipantId: z.string().min(1),
  recipientParticipantId: z.string().min(1),
  score: z.number(),
  bridgeFlag: z.boolean(),
  reason: z.string().min(1),
  createdAt: z.string().min(1),
});
export type RoutingDecision = z.infer<typeof routingDecisionSchema>;

export const digestItemSchema = z.object({
  contributionId: z.string().min(1),
  authorParticipantId: z.string().min(1),
  body: z.string().min(1),
  reason: z.string().min(1),
  explanation: z.string().min(1),
  bridgeFlag: z.boolean(),
  score: z.number(),
  position: z.number().int().nonnegative(),
});
export type DigestItem = z.infer<typeof digestItemSchema>;

export const digestSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  participantId: z.string().min(1),
  createdAt: z.string().min(1),
  summary: z.string().min(1),
  items: z.array(digestItemSchema),
});
export type Digest = z.infer<typeof digestSchema>;

export const responseSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  participantId: z.string().min(1),
  parentContributionId: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.string().min(1),
});
export type ResponseRecord = z.infer<typeof responseSchema>;

export const feedbackAnswersSchema = z.object({
  overload: z.number().int().min(1).max(5),
  usefulness: z.number().int().min(1).max(5),
  exchangeQuality: z.number().int().min(1).max(5),
  explanationClarity: z.number().int().min(1).max(5).optional(),
  returnWillingness: z.number().int().min(1).max(5),
});
export type FeedbackAnswers = z.infer<typeof feedbackAnswersSchema>;

export const feedbackSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  participantId: z.string().min(1),
  instrumentVersion: z.string().min(1),
  answers: feedbackAnswersSchema,
  createdAt: z.string().min(1),
});
export type FeedbackRecord = z.infer<typeof feedbackSchema>;

export const participantEventTypeSchema = z.enum([
  'prompt_viewed',
  'contribution_started',
  'contribution_abandoned',
  'contribution_submitted',
  'digest_opened',
  'digest_item_opened',
  'bridge_item_engaged',
  'routing_explanation_viewed',
  'thread_opened',
  'thread_item_opened',
  'response_started',
  'response_submitted',
  'feedback_submitted',
]);
export type ParticipantEventType = z.infer<typeof participantEventTypeSchema>;

export const participantSurfaceSchema = z.enum(['participant_web', 'operator_cli', 'operator_web', 'api']);
export type ParticipantSurface = z.infer<typeof participantSurfaceSchema>;

export const telemetryEventSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  participantId: z.string().optional(),
  eventType: participantEventTypeSchema,
  surface: participantSurfaceSchema,
  targetId: z.string().optional(),
  condition: cycleConditionSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().min(1),
});
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

export const auditEventSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  actorType: z.enum(['operator', 'system', 'participant']),
  actorId: z.string().min(1),
  action: z.string().min(1),
  detail: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().min(1),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const exportModeSchema = z.enum(['analysis', 'audit', 'minimal']);
export type ExportMode = z.infer<typeof exportModeSchema>;

export const exportArtifactSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  mode: exportModeSchema,
  createdAt: z.string().min(1),
  content: z.string().min(1),
});
export type ExportArtifact = z.infer<typeof exportArtifactSchema>;

export const cycleMetricsSchema = z.object({
  exposureConcentrationGini: z.number(),
  exposureTop20Share: z.number(),
  replyConcentrationGini: z.number(),
  replyTop20Share: z.number(),
  averageContributorCoverage: z.number(),
  bridgeExposureRate: z.number(),
  explanationEngagementRate: z.number(),
  abandonmentRate: z.number(),
  participantCount: z.number().int().nonnegative(),
  contributionCount: z.number().int().nonnegative(),
  responseCount: z.number().int().nonnegative(),
});
export type CycleMetrics = z.infer<typeof cycleMetricsSchema>;

export const cycleConfigSchema = z.object({
  maxDigestItems: z.number().int().min(1).max(12).default(4),
  maxBridgeItems: z.number().int().min(0).max(4).default(1),
});
export type CycleConfig = z.infer<typeof cycleConfigSchema>;

export const cycleScheduleSchema = z.object({
  submissionClosesAt: z.string().optional(),
  reflectionClosesAt: z.string().optional(),
});
export type CycleSchedule = z.infer<typeof cycleScheduleSchema>;

export const cycleRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  condition: cycleConditionSchema,
  status: cycleStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  openedAt: z.string().optional(),
  submissionClosedAt: z.string().optional(),
  routingCompletedAt: z.string().optional(),
  releasedAt: z.string().optional(),
  reflectionClosedAt: z.string().optional(),
  archivedAt: z.string().optional(),
  schedule: cycleScheduleSchema.default({}),
  config: cycleConfigSchema,
  participants: z.array(participantSchema),
  contributions: z.array(contributionSchema),
  routingDecisions: z.array(routingDecisionSchema),
  digests: z.array(digestSchema),
  responses: z.array(responseSchema),
  feedback: z.array(feedbackSchema),
  telemetryEvents: z.array(telemetryEventSchema),
  auditEvents: z.array(auditEventSchema),
  exports: z.array(exportArtifactSchema),
  metrics: cycleMetricsSchema.optional(),
});
export type CycleRecord = z.infer<typeof cycleRecordSchema>;

export const createCycleInputSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  condition: cycleConditionSchema.default('intervention'),
  participants: z.array(participantSchema).min(2),
  config: cycleConfigSchema.partial().optional(),
  schedule: cycleScheduleSchema.optional(),
});
export type CreateCycleInput = z.infer<typeof createCycleInputSchema>;

export const contributionInputSchema = z.object({
  participantId: z.string().min(1),
  body: z.string().min(1),
  confidenceLabel: confidenceLabelSchema,
  evidenceText: z.string().optional(),
});
export type ContributionInput = z.infer<typeof contributionInputSchema>;

export const responseInputSchema = z.object({
  participantId: z.string().min(1),
  parentContributionId: z.string().min(1),
  body: z.string().min(1),
});
export type ResponseInput = z.infer<typeof responseInputSchema>;

export const feedbackInputSchema = z.object({
  participantId: z.string().min(1),
  instrumentVersion: z.string().min(1).default('v1'),
  answers: feedbackAnswersSchema,
});
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export const participantEventInputSchema = z.object({
  participantId: z.string().min(1),
  eventType: participantEventTypeSchema,
  targetId: z.string().optional(),
  surface: participantSurfaceSchema.default('participant_web'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ParticipantEventInput = z.infer<typeof participantEventInputSchema>;

export const participantViewSchema = z.object({
  cycle: cycleRecordSchema,
  participant: participantSchema,
  mode: z.enum(['digest', 'thread', 'waiting', 'submission', 'complete']),
  contribution: contributionSchema.optional(),
  digest: digestSchema.optional(),
  thread: z.array(contributionSchema).optional(),
  responses: z.array(responseSchema),
  feedback: feedbackSchema.optional(),
});
export type ParticipantView = z.infer<typeof participantViewSchema>;

export function parseCreateCycleInput(input: unknown): CreateCycleInput {
  return createCycleInputSchema.parse(input);
}

export function parseContributionInput(input: unknown): ContributionInput {
  return contributionInputSchema.parse(input);
}

export function parseResponseInput(input: unknown): ResponseInput {
  return responseInputSchema.parse(input);
}

export function parseFeedbackInput(input: unknown): FeedbackInput {
  return feedbackInputSchema.parse(input);
}

export function parseParticipantEventInput(input: unknown): ParticipantEventInput {
  return participantEventInputSchema.parse(input);
}
