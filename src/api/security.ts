import crypto from 'node:crypto';
import type { FastifyRequest } from 'fastify';

import { type CycleRecord, type SessionContext, type UserRole, sessionContextSchema } from '../core/types.js';

export type AppSecurityMode = 'development' | 'enforced';

export type AccessAction =
  | 'session:read'
  | 'ops:read'
  | 'cycle:list'
  | 'cycle:create'
  | 'cycle:read'
  | 'cycle:transition'
  | 'cycle:routing'
  | 'cycle:export'
  | 'cycle:audit'
  | 'cycle:telemetry'
  | 'cycle:metrics'
  | 'cycle:digests'
  | 'participant:view'
  | 'participant:contribute'
  | 'participant:respond'
  | 'participant:feedback'
  | 'participant:event';

export interface SecurityConfig {
  mode?: AppSecurityMode;
  authSecret?: string;
  defaultWorkspaceId?: string;
  sessionTtlSeconds?: number;
}

export interface AppSession extends SessionContext {
  token: string;
}

const operatorRoles = new Set<UserRole>(['platform_admin', 'workspace_admin', 'facilitator']);
const analystRoles = new Set<UserRole>(['research_analyst', 'observer']);

export class AccessError extends Error {
  readonly code = 'FORBIDDEN';

  constructor(message: string) {
    super(message);
  }
}

export class AuthenticationError extends Error {
  readonly code = 'UNAUTHORIZED';

  constructor(message: string) {
    super(message);
  }
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function hmac(secret: string, value: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function signatureMatches(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'base64url');
  const actualBuffer = Buffer.from(actual, 'base64url');
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function signPayload(payload: Omit<AppSession, 'token'>, secret: string): string {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = hmac(secret, encoded);
  return `${encoded}.${signature}`;
}

function readHeader(request: FastifyRequest, key: string): string | null {
  const value = request.headers[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function tokenFromRequest(request: FastifyRequest): string | null {
  const bearer = readHeader(request, 'authorization');
  if (bearer?.startsWith('Bearer ')) {
    return bearer.slice('Bearer '.length).trim();
  }
  const headerToken = readHeader(request, 'x-acp-session-token');
  if (headerToken) return headerToken;
  const query = request.query as { token?: string } | undefined;
  const pathOnly = request.url.split('?')[0];
  if (request.method === 'GET' && pathOnly === '/v1/session' && typeof query?.token === 'string' && query.token.trim()) {
    return query.token.trim();
  }
  return null;
}

function capabilitiesFor(role: UserRole): AccessAction[] {
  if (operatorRoles.has(role)) {
    return [
      'session:read',
      'ops:read',
      'cycle:list',
      'cycle:create',
      'cycle:read',
      'cycle:transition',
      'cycle:routing',
      'cycle:export',
      'cycle:audit',
      'cycle:telemetry',
      'cycle:metrics',
      'cycle:digests',
      'participant:view',
      'participant:contribute',
      'participant:respond',
      'participant:feedback',
      'participant:event',
    ];
  }
  if (analystRoles.has(role)) {
    return [
      'session:read',
      'ops:read',
      'cycle:list',
      'cycle:read',
      'cycle:audit',
      'cycle:telemetry',
      'cycle:metrics',
      'cycle:digests',
      'cycle:export',
      'participant:view',
    ];
  }
  return [
    'session:read',
    'cycle:list',
    'cycle:read',
    'participant:view',
    'participant:contribute',
    'participant:respond',
    'participant:feedback',
    'participant:event',
  ];
}

function assertRoleSemantics(session: SessionContext): void {
  const allowed = new Set(capabilitiesFor(session.role));
  const disallowed = session.capabilities.filter((capability) => !allowed.has(capability as AccessAction));
  if (disallowed.length > 0) {
    throw new AuthenticationError(`Session token grants capabilities not allowed for role ${session.role}.`);
  }

  if (operatorRoles.has(session.role) && session.actorType !== 'operator') {
    throw new AuthenticationError(`Role ${session.role} must use operator actor type.`);
  }
  if (analystRoles.has(session.role) && session.actorType !== 'observer') {
    throw new AuthenticationError(`Role ${session.role} must use observer actor type.`);
  }
  if (session.role === 'participant') {
    if (session.actorType !== 'participant') {
      throw new AuthenticationError('Participant role must use participant actor type.');
    }
    if (!session.participantId || !session.cycleScopeId) {
      throw new AuthenticationError('Participant session tokens must be scoped to one participant and one cycle.');
    }
  }
}

function applyDefaultExpiry(payload: Omit<AppSession, 'token'>, config: Required<SecurityConfig>): Omit<AppSession, 'token'> {
  if (payload.expiresAt || config.sessionTtlSeconds <= 0) {
    return payload;
  }
  const issuedAtMs = Date.parse(payload.issuedAt);
  if (Number.isNaN(issuedAtMs)) {
    throw new AuthenticationError('Session token issuedAt is invalid.');
  }
  return {
    ...payload,
    expiresAt: new Date(issuedAtMs + config.sessionTtlSeconds * 1000).toISOString(),
  };
}

function defaultSession(config: Required<SecurityConfig>): AppSession {
  const payload = applyDefaultExpiry({
    sessionId: 'session_local_operator',
    actorId: 'local-operator',
    actorType: 'operator',
    role: 'facilitator',
    workspaceId: config.defaultWorkspaceId,
    authMode: 'development',
    capabilities: capabilitiesFor('facilitator'),
    issuedAt: new Date().toISOString(),
  }, config);
  return { ...payload, token: signPayload(payload, config.authSecret) };
}

function parseToken(token: string, secret: string): AppSession {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) {
    throw new AuthenticationError('Session token is malformed.');
  }
  if (!signatureMatches(hmac(secret, encoded), signature)) {
    throw new AuthenticationError('Session token signature is invalid.');
  }
  let parsed: SessionContext;
  try {
    parsed = sessionContextSchema.parse(JSON.parse(base64UrlDecode(encoded)));
  } catch {
    throw new AuthenticationError('Session token payload is invalid.');
  }
  assertRoleSemantics(parsed);
  if (parsed.expiresAt && parsed.expiresAt < new Date().toISOString()) {
    throw new AuthenticationError('Session token expired.');
  }
  return { ...parsed, token };
}

export function securityDefaults(config?: SecurityConfig): Required<SecurityConfig> {
  const mode = config?.mode ?? 'development';
  return {
    mode,
    authSecret: config?.authSecret ?? 'acp-local-dev-secret',
    defaultWorkspaceId: config?.defaultWorkspaceId ?? 'local-workspace',
    sessionTtlSeconds: config?.sessionTtlSeconds ?? (mode === 'enforced' ? 8 * 60 * 60 : 0),
  };
}

export function issueSessionToken(payload: Omit<AppSession, 'token' | 'capabilities'> & { capabilities?: AccessAction[] }, config?: SecurityConfig): AppSession {
  const resolved = securityDefaults(config);
  const sessionPayload = applyDefaultExpiry({
    ...payload,
    capabilities: payload.capabilities ?? capabilitiesFor(payload.role),
  }, resolved);
  assertRoleSemantics(sessionPayload);
  return {
    ...sessionPayload,
    token: signPayload(sessionPayload, resolved.authSecret),
  };
}

export function resolveSession(request: FastifyRequest, config?: SecurityConfig): AppSession {
  const resolved = securityDefaults(config);
  const token = tokenFromRequest(request);
  if (token) {
    return parseToken(token, resolved.authSecret);
  }
  if (resolved.mode === 'development') {
    return defaultSession(resolved);
  }
  throw new AuthenticationError('Signed session token required.');
}

export function requireCapability(session: AppSession, action: AccessAction): void {
  if (!session.capabilities.includes(action)) {
    throw new AccessError(`Role ${session.role} cannot perform ${action}.`);
  }
}

export function assertCycleAccess(session: AppSession, cycle: CycleRecord, action: AccessAction, participantId?: string): void {
  requireCapability(session, action);
  if (cycle.workspaceId !== session.workspaceId) {
    throw new AccessError(`Workspace ${session.workspaceId} cannot access cycle ${cycle.id}.`);
  }
  if (session.role === 'participant') {
    const scopedCycleId = session.cycleScopeId;
    if (scopedCycleId && scopedCycleId !== cycle.id) {
      throw new AccessError(`Participant session is not scoped to cycle ${cycle.id}.`);
    }
    const effectiveParticipantId = participantId ?? session.participantId;
    if (!effectiveParticipantId || effectiveParticipantId !== session.participantId) {
      throw new AccessError('Participant sessions may only act as their own participant identity.');
    }
    const isMember = cycle.participants.some((participant) => participant.id === effectiveParticipantId && participant.role === 'participant');
    if (!isMember) {
      throw new AccessError(`Participant ${effectiveParticipantId} is not a member of cycle ${cycle.id}.`);
    }
  }
}

export function filterCyclesForSession(session: AppSession, cycles: CycleRecord[]): CycleRecord[] {
  return cycles.filter((cycle) => {
    if (cycle.workspaceId !== session.workspaceId) return false;
    if (session.role !== 'participant') return true;
    if (session.cycleScopeId && session.cycleScopeId !== cycle.id) return false;
    return cycle.participants.some((participant) => participant.id === session.participantId && participant.role === 'participant');
  });
}

export function participantInvite(session: AppSession, cycle: CycleRecord, participantId: string, config?: SecurityConfig): AppSession {
  const participant = cycle.participants.find((item) => item.id === participantId && item.role === 'participant');
  if (!participant) {
    throw new AccessError(`Participant ${participantId} not found in cycle ${cycle.id}.`);
  }
  return issueSessionToken(
    {
      sessionId: `session_${participantId}_${cycle.id}`,
      actorId: participantId,
      actorType: 'participant',
      role: 'participant',
      workspaceId: cycle.workspaceId,
      participantId,
      cycleScopeId: cycle.id,
      authMode: 'signed_invite',
      issuedAt: new Date().toISOString(),
    },
    config,
  );
}

export function canAccessParticipant(session: AppSession, participantId: string): boolean {
  if (session.role === 'participant') {
    return session.participantId === participantId;
  }
  return true;
}
