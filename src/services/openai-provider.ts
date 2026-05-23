import { request as httpsRequest } from 'node:https';

import { type ModelCallRequest, type ModelCallResult } from './model-schemas.js';
import type { ModelProvider } from './model-provider.js';

interface OpenAiProviderOptions {
  apiKey?: string;
  timeoutMs?: number;
}

interface ModelPrice {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

const DEFAULT_MODEL_PRICES: Record<string, ModelPrice> = {
  'gpt-5.4-mini': { inputUsdPerMillion: 3, outputUsdPerMillion: 12 },
  'gpt-5.4': { inputUsdPerMillion: 25, outputUsdPerMillion: 100 },
};

function envNumber(name: string): number | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function priceForModel(model: string): ModelPrice {
  if (model === 'gpt-5.4-mini') {
    return {
      inputUsdPerMillion: envNumber('ACP_GPT54_MINI_INPUT_USD_PER_1M') ?? DEFAULT_MODEL_PRICES['gpt-5.4-mini'].inputUsdPerMillion,
      outputUsdPerMillion: envNumber('ACP_GPT54_MINI_OUTPUT_USD_PER_1M') ?? DEFAULT_MODEL_PRICES['gpt-5.4-mini'].outputUsdPerMillion,
    };
  }
  if (model === 'gpt-5.4') {
    return {
      inputUsdPerMillion: envNumber('ACP_GPT54_INPUT_USD_PER_1M') ?? DEFAULT_MODEL_PRICES['gpt-5.4'].inputUsdPerMillion,
      outputUsdPerMillion: envNumber('ACP_GPT54_OUTPUT_USD_PER_1M') ?? DEFAULT_MODEL_PRICES['gpt-5.4'].outputUsdPerMillion,
    };
  }
  return { inputUsdPerMillion: envNumber('ACP_MODEL_INPUT_USD_PER_1M') ?? 25, outputUsdPerMillion: envNumber('ACP_MODEL_OUTPUT_USD_PER_1M') ?? 100 };
}

export function estimateOpenAiCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = priceForModel(model);
  return Number(((inputTokens / 1_000_000) * price.inputUsdPerMillion + (outputTokens / 1_000_000) * price.outputUsdPerMillion).toFixed(6));
}

function postJson(url: URL, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<{ status: number; body: string; latencyMs: number }> {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = httpsRequest(
      url,
      {
        method: 'POST',
        headers: {
          ...headers,
          'content-type': 'application/json',
          'content-length': String(Buffer.byteLength(payload)),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), latencyMs: Date.now() - startedAt }));
      },
    );
    req.on('timeout', () => req.destroy(new Error(`OpenAI request timed out after ${timeoutMs}ms`)));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export class OpenAiProvider implements ModelProvider {
  readonly providerName = 'openai';
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAiProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAiProvider.');
    }
    this.apiKey = apiKey;
    this.timeoutMs = options.timeoutMs ?? 20000;
  }

  async completeJson(request: ModelCallRequest): Promise<ModelCallResult> {
    const response = await postJson(
      new URL('https://api.openai.com/v1/responses'),
      { authorization: `Bearer ${this.apiKey}` },
      {
        model: request.model,
        input: [
          {
            role: 'system',
            content: `Return strict JSON for ${request.schemaName}. Prompt version: ${request.promptVersion}.`,
          },
          {
            role: 'user',
            content: JSON.stringify(request.input),
          },
        ],
        text: { format: { type: 'json_object' } },
      },
      this.timeoutMs,
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OpenAI provider failed with HTTP ${response.status}`);
    }
    const payload = JSON.parse(response.body);
    const text = payload.output_text ?? payload.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).find((item: { text?: string }) => item.text)?.text;
    if (!text) {
      throw new Error('OpenAI provider returned no JSON text.');
    }
    const usage = payload.usage ?? {};
    return {
      provider: this.providerName,
      model: request.model,
      promptVersion: request.promptVersion,
      schemaName: request.schemaName,
      latencyMs: response.latencyMs,
      cacheHit: false,
      usage: {
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        estimatedCostUsd: estimateOpenAiCostUsd(request.model, usage.input_tokens ?? 0, usage.output_tokens ?? 0),
      },
      output: JSON.parse(text),
    };
  }
}
