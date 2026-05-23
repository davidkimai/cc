import crypto from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface OpsCounters {
  requests: number;
  errors: number;
  authFailures: number;
  lifecycleTransitions: number;
  routingRuns: number;
  exportsGenerated: number;
  workspaceActivity: Record<string, number>;
  byStatusCode: Record<string, number>;
  byRoute: Record<string, number>;
}

export interface OpsRuntime {
  startedAt: string;
  counters: OpsCounters;
  protocolVersion: string;
}

export function createOpsRuntime(): OpsRuntime {
  return {
    startedAt: new Date().toISOString(),
    counters: {
      requests: 0,
      errors: 0,
      authFailures: 0,
      lifecycleTransitions: 0,
      routingRuns: 0,
      exportsGenerated: 0,
      workspaceActivity: {},
      byStatusCode: {},
      byRoute: {},
    },
    protocolVersion: '0.1.0',
  };
}

export function requestIdFrom(request: FastifyRequest): string {
  const header = request.headers['x-acp-request-id'];
  return typeof header === 'string' && header.trim() ? header.trim() : `req_${crypto.randomUUID()}`;
}

export function attachRequestId(request: FastifyRequest, reply: FastifyReply): void {
  const requestId = requestIdFrom(request);
  request.headers['x-acp-request-id'] = requestId;
  reply.header('x-acp-request-id', requestId);
}

export function recordResponse(runtime: OpsRuntime, request: FastifyRequest, reply: FastifyReply): void {
  const route = request.routeOptions.url ?? request.url;
  const statusCode = String(reply.statusCode);
  runtime.counters.requests += 1;
  runtime.counters.byStatusCode[statusCode] = (runtime.counters.byStatusCode[statusCode] ?? 0) + 1;
  runtime.counters.byRoute[route] = (runtime.counters.byRoute[route] ?? 0) + 1;
  if (reply.statusCode >= 400) {
    runtime.counters.errors += 1;
  }
  if (reply.statusCode === 401) {
    runtime.counters.authFailures += 1;
  }
}

export function recordWorkspace(runtime: OpsRuntime, workspaceId?: string): void {
  if (!workspaceId) return;
  runtime.counters.workspaceActivity[workspaceId] = (runtime.counters.workspaceActivity[workspaceId] ?? 0) + 1;
}

export function recordLifecycle(runtime: OpsRuntime): void {
  runtime.counters.lifecycleTransitions += 1;
}

export function recordRouting(runtime: OpsRuntime): void {
  runtime.counters.routingRuns += 1;
}

export function recordExport(runtime: OpsRuntime): void {
  runtime.counters.exportsGenerated += 1;
}

export function uptimeSeconds(runtime: OpsRuntime): number {
  return Math.max(0, Math.round((Date.now() - Date.parse(runtime.startedAt)) / 1000));
}

export async function protocolBundleStatus(repoRoot: string): Promise<{ ok: boolean; path: string; version?: string; error?: string }> {
  const manifestPath = path.join(repoRoot, 'protocol', 'acp-bundle.manifest.json');
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    return { ok: true, path: manifestPath, version: manifest.version ?? manifest.protocolVersion };
  } catch (error) {
    return { ok: false, path: manifestPath, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function storageStatus(dataDir: string): Promise<{ ok: boolean; path: string; error?: string }> {
  try {
    await access(dataDir);
    return { ok: true, path: dataDir };
  } catch (error) {
    return { ok: false, path: dataDir, error: error instanceof Error ? error.message : String(error) };
  }
}
