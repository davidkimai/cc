import crypto from 'node:crypto';

import type { ModelCallRequest, ModelCallResult } from './model-schemas.js';

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export class ModelCache {
  private readonly records = new Map<string, ModelCallResult>();

  keyFor(request: ModelCallRequest): string {
    return crypto
      .createHash('sha256')
      .update(stableStringify({
        passId: request.passId,
        promptVersion: request.promptVersion,
        model: request.model,
        schemaName: request.schemaName,
        input: request.input,
      }))
      .digest('hex');
  }

  get(request: ModelCallRequest): ModelCallResult | undefined {
    const cached = this.records.get(this.keyFor(request));
    return cached ? { ...cached, cacheHit: true } : undefined;
  }

  set(request: ModelCallRequest, result: ModelCallResult): ModelCallResult {
    this.records.set(this.keyFor(request), { ...result, cacheHit: false });
    return result;
  }
}

