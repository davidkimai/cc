import { z } from 'zod';

import { ModelAuditLog } from './model-audit.js';
import { ModelCache } from './model-cache.js';
import { modelCallRequestSchema, type ModelCallRequest, type ModelCallResult } from './model-schemas.js';

export interface ModelProvider {
  readonly providerName: string;
  completeJson(request: ModelCallRequest): Promise<ModelCallResult>;
}

export class DeterministicModelProvider implements ModelProvider {
  readonly providerName = 'offline-deterministic';

  async completeJson(request: ModelCallRequest): Promise<ModelCallResult> {
    const parsed = modelCallRequestSchema.parse(request);
    const serialized = JSON.stringify(parsed.input);
    return {
      provider: this.providerName,
      model: parsed.model,
      promptVersion: parsed.promptVersion,
      schemaName: parsed.schemaName,
      latencyMs: 0,
      cacheHit: false,
      usage: {
        inputTokens: Math.ceil(serialized.length / 4),
        outputTokens: 0,
        estimatedCostUsd: 0,
      },
      output: parsed.input,
    };
  }
}

export class ModelRuntime {
  constructor(
    private readonly provider: ModelProvider = new DeterministicModelProvider(),
    private readonly cache = new ModelCache(),
    private readonly audit = new ModelAuditLog(),
  ) {}

  async run<T>(request: ModelCallRequest, schema: z.ZodType<T>): Promise<T> {
    const cached = this.cache.get(request);
    if (cached) {
      this.audit.record(cached);
      return schema.parse(cached.output);
    }
    const result = this.cache.set(request, await this.provider.completeJson(request));
    this.audit.record(result);
    return schema.parse(result.output);
  }

  auditSummary() {
    return this.audit.summary();
  }
}

