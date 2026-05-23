import { z } from 'zod';

export const modelPassIdSchema = z.enum([
  'contribution-understanding',
  'pairwise-routing-judge',
  'set-optimization-critic',
  'omission-critic',
  'fairness-critic',
  'explanation-synthesis',
  'arbitration',
]);
export type ModelPassId = z.infer<typeof modelPassIdSchema>;

export const modelPolicySchema = z.object({
  primaryModel: z.string().min(1).default('gpt-5.4-mini'),
  arbitrationModel: z.string().min(1).default('gpt-5.4'),
});
export type ModelPolicy = z.infer<typeof modelPolicySchema>;

export const modelCallRequestSchema = z.object({
  passId: modelPassIdSchema,
  promptVersion: z.string().min(1),
  model: z.string().min(1),
  input: z.unknown(),
  schemaName: z.string().min(1),
});
export type ModelCallRequest = z.infer<typeof modelCallRequestSchema>;

export const modelCallUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),
});
export type ModelCallUsage = z.infer<typeof modelCallUsageSchema>;

export const modelCallResultSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  schemaName: z.string().min(1),
  latencyMs: z.number().int().nonnegative(),
  cacheHit: z.boolean(),
  usage: modelCallUsageSchema,
  output: z.unknown(),
});
export type ModelCallResult = z.infer<typeof modelCallResultSchema>;

export const routingJudgmentSchema = z.object({
  contributionId: z.string().min(1),
  recipientParticipantId: z.string().min(1),
  recipientRelevance: z.number().min(0).max(1),
  promptRelevance: z.number().min(0).max(1),
  bridgeValue: z.number().min(0).max(1),
  disagreementValue: z.number().min(0).max(1),
  complementarity: z.number().min(0).max(1),
  redundancyRisk: z.number().min(0).max(1),
  institutionalUsefulness: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
});
export type RoutingJudgment = z.infer<typeof routingJudgmentSchema>;

export const explanationRecordSchema = z.object({
  contributionId: z.string().min(1),
  recipientParticipantId: z.string().min(1),
  explanationText: z.string().min(1),
  factors: z.array(z.string().min(1)),
});
export type ExplanationRecord = z.infer<typeof explanationRecordSchema>;

