import type { ModelCallResult } from './model-schemas.js';

export interface ModelAuditEvent {
  provider: string;
  model: string;
  promptVersion: string;
  schemaName: string;
  latencyMs: number;
  cacheHit: boolean;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export class ModelAuditLog {
  private readonly events: ModelAuditEvent[] = [];

  record(result: ModelCallResult): void {
    this.events.push({
      provider: result.provider,
      model: result.model,
      promptVersion: result.promptVersion,
      schemaName: result.schemaName,
      latencyMs: result.latencyMs,
      cacheHit: result.cacheHit,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      estimatedCostUsd: result.usage.estimatedCostUsd,
    });
  }

  summary() {
    return {
      provider: this.events.find((event) => event.provider)?.provider ?? 'offline-deterministic',
      cacheHits: this.events.filter((event) => event.cacheHit).length,
      calls: this.events.length,
      totalLatencyMs: this.events.reduce((sum, event) => sum + event.latencyMs, 0),
      estimatedCostUsd: Number(this.events.reduce((sum, event) => sum + event.estimatedCostUsd, 0).toFixed(6)),
    };
  }

  entries(): ModelAuditEvent[] {
    return [...this.events];
  }
}

