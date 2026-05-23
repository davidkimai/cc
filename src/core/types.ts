import { z } from 'zod';

export const cycleConditionSchema = z.enum(['intervention', 'baseline_thread']);
export type CycleCondition = z.infer<typeof cycleConditionSchema>;

export const cycleStatusSchema = z.enum([
  'draft',
  'scheduled',
  'submission_open',
  'submission_closed',
  'routing_complete',
  'digests_released',
  'reflection_closed',
  'archived',
  'failed',
]);
export type CycleStatus = z.infer<typeof cycleStatusSchema>;

export const confidenceLabelSchema = z.enum(['low', 'medium', 'high']).optional();
export type ConfidenceLabel = z.infer<typeof confidenceLabelSchema>;

export const userRoleSchema = z.enum(['platform_admin', 'workspace_admin', 'facilitator', 'research_analyst', 'participant', 'observer']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const workspaceRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1).optional(),
});
export type WorkspaceRecord = z.infer<typeof workspaceRecordSchema>;

export const sessionAuthModeSchema = z.enum(['development', 'signed_session', 'signed_invite']);
export type SessionAuthMode = z.infer<typeof sessionAuthModeSchema>;

export const sessionContextSchema = z.object({
  sessionId: z.string().min(1),
  actorId: z.string().min(1),
  actorType: z.enum(['operator', 'participant', 'observer']),
  role: userRoleSchema,
  workspaceId: z.string().min(1),
  participantId: z.string().min(1).optional(),
  cycleScopeId: z.string().min(1).optional(),
  authMode: sessionAuthModeSchema,
  capabilities: z.array(z.string()).default([]),
  issuedAt: z.string().min(1),
  expiresAt: z.string().min(1).optional(),
});
export type SessionContext = z.infer<typeof sessionContextSchema>;

export const participantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['participant', 'operator']).default('participant'),
});
export type Participant = z.infer<typeof participantSchema>;

export const deliberativeCriterionIdSchema = z.enum(['recipient_relevance', 'prompt_relevance', 'bridge_perspective', 'load_balance']);
export type DeliberativeCriterionId = z.infer<typeof deliberativeCriterionIdSchema>;

export const deliberativeCriterionSchema = z.object({
  id: deliberativeCriterionIdSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().min(0),
});
export type DeliberativeCriterion = z.infer<typeof deliberativeCriterionSchema>;

export const defaultDeliberativeCriteria: DeliberativeCriterion[] = [
  {
    id: 'recipient_relevance',
    label: 'Recipient relevance',
    description: "Prioritize contributions that connect to the recipient's stated concern.",
    weight: 0.55,
  },
  {
    id: 'prompt_relevance',
    label: 'Prompt relevance',
    description: 'Keep routed items anchored to the shared cycle prompt.',
    weight: 0.25,
  },
  {
    id: 'bridge_perspective',
    label: 'Bridge perspective',
    description: 'Reserve bounded room for relevant but less-obvious views.',
    weight: 0.15,
  },
  {
    id: 'load_balance',
    label: 'Load balance',
    description: 'Respect bounded reading burden for each participant.',
    weight: 0.05,
  },
];

export const deliberativeCriteriaSchema = z
  .array(deliberativeCriterionSchema)
  .min(1)
  .refine((criteria) => criteria.reduce((sum, criterion) => sum + criterion.weight, 0) > 0, 'deliberativeCriteria total weight must be greater than zero')
  .default(defaultDeliberativeCriteria);

export const engineModeSchema = z.enum(['heuristic', 'recursive_engine_v2']);
export type EngineMode = z.infer<typeof engineModeSchema>;

export const engineIssueTypeSchema = z.enum([
  'access',
  'cost',
  'equity',
  'implementation',
  'legitimacy',
  'process',
  'safety',
  'unresolved_question',
  'other',
]);
export type EngineIssueType = z.infer<typeof engineIssueTypeSchema>;

export const contributionUnderstandingSchema = z.object({
  contributionId: z.string().min(1),
  issueType: engineIssueTypeSchema,
  stakeholderType: z.string().min(1),
  urgency: z.number().min(0).max(1),
  actionability: z.number().min(0).max(1),
  evidenceStrength: z.number().min(0).max(1),
  novelty: z.number().min(0).max(1),
  minoritySalience: z.number().min(0).max(1),
  publicInterestRelevance: z.number().min(0).max(1),
  distortionRisk: z.number().min(0).max(1),
  unresolvedQuestion: z.boolean(),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
});
export type ContributionUnderstanding = z.infer<typeof contributionUnderstandingSchema>;

export const issueClusterSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  issueType: engineIssueTypeSchema,
  contributionIds: z.array(z.string().min(1)),
  summary: z.string().min(1),
  minoritySignalCount: z.number().int().nonnegative(),
  unresolvedQuestionCount: z.number().int().nonnegative(),
});
export type IssueCluster = z.infer<typeof issueClusterSchema>;

export const issueMapSchema = z.object({
  clusters: z.array(issueClusterSchema),
  unresolvedQuestionCount: z.number().int().nonnegative(),
  minoritySignalCount: z.number().int().nonnegative(),
});
export type IssueMap = z.infer<typeof issueMapSchema>;

export const digestSetCritiqueSchema = z.object({
  issueCoverageRate: z.number().min(0).max(1),
  stakeholderDiversityRate: z.number().min(0).max(1),
  redundancyRisk: z.number().min(0).max(1),
  unresolvedQuestionRetentionRate: z.number().min(0).max(1),
  missingIssueLabels: z.array(z.string().min(1)).default([]),
  notes: z.array(z.string().min(1)).default([]),
});
export type DigestSetCritique = z.infer<typeof digestSetCritiqueSchema>;

export const engineCriticSchema = z.object({
  criticType: z.enum(['omission', 'fairness']),
  severity: z.enum(['low', 'medium', 'high']),
  findings: z.array(z.string().min(1)),
  recommendedAction: z.enum(['release', 'revise_digest', 'escalate', 'abstain']),
});
export type EngineCritic = z.infer<typeof engineCriticSchema>;

export const engineEscalationSchema = z.object({
  confidence: z.number().min(0).max(1),
  abstain: z.boolean(),
  recommendedAction: z.enum(['release', 'review', 'revise_digest', 'abstain']),
  reasons: z.array(z.string().min(1)),
});
export type EngineEscalation = z.infer<typeof engineEscalationSchema>;

export const modelAuditSummarySchema = z.object({
  provider: z.string().min(1),
  cacheHits: z.number().int().nonnegative(),
  calls: z.number().int().nonnegative(),
  totalLatencyMs: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),
});
export type ModelAuditSummary = z.infer<typeof modelAuditSummarySchema>;

export const engineV2TraceSchema = z.object({
  engineVersion: z.literal('engine-v2'),
  engineMode: z.literal('recursive_engine_v2'),
  provider: z.string().min(1),
  modelPolicy: z.object({
    primaryModel: z.string().min(1),
    arbitrationModel: z.string().min(1),
  }),
  promptVersions: z.record(z.string(), z.string()),
  contributionRecords: z.array(contributionUnderstandingSchema),
  issueMap: issueMapSchema,
  digestSetCritique: digestSetCritiqueSchema,
  critics: z.array(engineCriticSchema),
  escalation: engineEscalationSchema,
  modelAudit: modelAuditSummarySchema,
  createdAt: z.string().min(1),
});
export type EngineV2Trace = z.infer<typeof engineV2TraceSchema>;

export const proceduralReferenceKindSchema = z.enum(['skill', 'composition']);
export type ProceduralReferenceKind = z.infer<typeof proceduralReferenceKindSchema>;

export const proceduralRoleSchema = z.enum(['workflow', 'routing', 'explanation', 'critic', 'escalation', 'baseline', 'interoperability']);
export type ProceduralRole = z.infer<typeof proceduralRoleSchema>;

export const proceduralReferenceSchema = z.object({
  procedureId: z.string().min(1),
  kind: proceduralReferenceKindSchema,
  role: proceduralRoleSchema,
  purpose: z.string().min(1),
  sourcePath: z.string().min(1),
  maturity: z.string().min(1).optional(),
});
export type ProceduralReference = z.infer<typeof proceduralReferenceSchema>;

export const proceduralArtifactExpectationSchema = z.object({
  artifactId: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean().default(true),
});
export type ProceduralArtifactExpectation = z.infer<typeof proceduralArtifactExpectationSchema>;

export const proceduralContestStageSchema = z.enum(['pre_routing', 'post_routing', 'pre_release', 'post_release', 'interoperability_review']);
export type ProceduralContestStage = z.infer<typeof proceduralContestStageSchema>;

export const proceduralContestDefaultActionSchema = z.enum(['allow', 'review', 'revise', 'escalate', 'abstain']);
export type ProceduralContestDefaultAction = z.infer<typeof proceduralContestDefaultActionSchema>;

export const proceduralContestPointSchema = z.object({
  pointId: z.string().min(1),
  stage: proceduralContestStageSchema,
  prompt: z.string().min(1),
  defaultAction: proceduralContestDefaultActionSchema,
  requiredHumanRole: userRoleSchema.optional(),
});
export type ProceduralContestPoint = z.infer<typeof proceduralContestPointSchema>;

export const proceduralBindingModeSchema = z.enum(['protocol_profile', 'skill_runtime', 'study_condition']);
export type ProceduralBindingMode = z.infer<typeof proceduralBindingModeSchema>;

export const proceduralAdherenceSchema = z.object({
  expectedArtifactCoverage: z.number().min(0).max(1),
  allRequiredArtifactsProduced: z.boolean(),
  missingArtifactIds: z.array(z.string().min(1)).default([]),
  notes: z.array(z.string().min(1)).default([]),
});
export type ProceduralAdherence = z.infer<typeof proceduralAdherenceSchema>;

export const proceduralEscalationProvenanceSchema = z.object({
  source: z.enum(['engine_v2', 'skill_trace', 'composition_trace', 'operator', 'study_judgment']),
  recommendedAction: z.enum(['release', 'review', 'revise_digest', 'abstain']),
  humanReviewRequired: z.boolean(),
  reasons: z.array(z.string().min(1)).default([]),
  confidence: z.number().min(0).max(1).optional(),
});
export type ProceduralEscalationProvenance = z.infer<typeof proceduralEscalationProvenanceSchema>;

export const proceduralExecutionSchema = z.object({
  bindingMode: proceduralBindingModeSchema,
  selectedProcedureIds: z.array(z.string().min(1)).default([]),
  selectedCompositionId: z.string().min(1).optional(),
  traceIds: z.array(z.string().min(1)).default([]),
  producedArtifactIds: z.array(z.string().min(1)).default([]),
  adherence: proceduralAdherenceSchema.optional(),
  escalation: proceduralEscalationProvenanceSchema.optional(),
  updatedAt: z.string().min(1),
});
export type ProceduralExecution = z.infer<typeof proceduralExecutionSchema>;

export const proceduralLayerSchema = z.object({
  references: z.array(proceduralReferenceSchema).default([]),
  artifactExpectations: z.array(proceduralArtifactExpectationSchema).default([]),
  contestPoints: z.array(proceduralContestPointSchema).default([]),
  execution: proceduralExecutionSchema.optional(),
});
export type ProceduralLayer = z.infer<typeof proceduralLayerSchema>;

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
  factors: z
    .object({
      recipientRelevance: z.number(),
      promptRelevance: z.number(),
      bridgePerspective: z.number(),
      loadCost: z.number(),
    })
    .default({ recipientRelevance: 0, promptRelevance: 0, bridgePerspective: 0, loadCost: 0 }),
  criteriaWeights: z.record(z.string(), z.number()).default({}),
  engineVersion: z.string().min(1).optional(),
  issueClusterId: z.string().min(1).optional(),
  judgeConfidence: z.number().min(0).max(1).optional(),
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
  routingExplanations: z.array(z.string().min(1)).default([]).optional(),
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

export const operatorEventTypeSchema = z.enum([
  'cycle_created',
  'cycle_opened',
  'submissions_closed',
  'routing_started',
  'routing_job_failed',
  'routing_completed',
  'digest_generated',
  'digests_released',
  'export_generated',
  'replay_started',
  'replay_completed',
  'cycle_archived',
  'cycle_failed',
]);
export type OperatorEventType = z.infer<typeof operatorEventTypeSchema>;

export const telemetryEventTypeSchema = z.enum([
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
  'cycle_created',
  'cycle_opened',
  'submissions_closed',
  'routing_started',
  'routing_job_failed',
  'routing_completed',
  'digest_generated',
  'digests_released',
  'export_generated',
  'replay_started',
  'replay_completed',
  'cycle_archived',
  'cycle_failed',
]);
export type TelemetryEventType = z.infer<typeof telemetryEventTypeSchema>;

export const participantSurfaceSchema = z.enum(['participant_web', 'operator_cli', 'operator_web', 'api']);
export type ParticipantSurface = z.infer<typeof participantSurfaceSchema>;

export const telemetryEventSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  participantId: z.string().optional(),
  eventType: telemetryEventTypeSchema,
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
  issueCoverageRate: z.number().optional(),
  omissionRiskRate: z.number().optional(),
  fairnessRiskRate: z.number().optional(),
  escalationRate: z.number().optional(),
  estimatedEngineCostUsd: z.number().optional(),
  engineLatencyMs: z.number().optional(),
  participantCount: z.number().int().nonnegative(),
  contributionCount: z.number().int().nonnegative(),
  responseCount: z.number().int().nonnegative(),
});
export type CycleMetrics = z.infer<typeof cycleMetricsSchema>;

export const cycleConfigSchema = z.object({
  maxDigestItems: z.number().int().min(1).max(12).default(4),
  maxBridgeItems: z.number().int().min(0).max(4).default(1),
  deliberativeCriteria: deliberativeCriteriaSchema,
  engineMode: engineModeSchema.optional(),
});
export type CycleConfig = z.infer<typeof cycleConfigSchema>;

export const cycleScheduleSchema = z.object({
  submissionClosesAt: z.string().optional(),
  reflectionClosesAt: z.string().optional(),
});
export type CycleSchedule = z.infer<typeof cycleScheduleSchema>;

export const cycleRecordSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1).default('local-workspace'),
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
  engineV2: engineV2TraceSchema.optional(),
  proceduralLayer: proceduralLayerSchema.optional(),
});
export type CycleRecord = z.infer<typeof cycleRecordSchema>;

export const createCycleInputSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  condition: cycleConditionSchema.default('intervention'),
  workspaceId: z.string().min(1).optional(),
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
