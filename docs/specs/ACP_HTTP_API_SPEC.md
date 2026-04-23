# ACP HTTP API Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1
- `RELAY_WEB_APP_SPEC.md` v0.1
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the HTTP API contract exposed by Relay as the first implementation of ACP.

Its role is to specify:

- endpoint responsibilities
- request and response shapes
- error semantics
- lifecycle operation semantics
- compatibility rules for web and CLI surfaces

## 2. Normative Scope

This spec governs:

- versioned HTTP endpoints under `/v1`
- payload shape and field naming at the API boundary
- semantic behavior of lifecycle mutations
- machine-readable error behavior

This spec does not govern:

- internal service layout
- browser presentation
- CLI command syntax
- future non-HTTP transport layers

## 3. Global API Rules

- All ACP API endpoints must live under `/v1` for v1.
- Mutation endpoints must return the updated canonical object or an explicitly named artifact.
- Errors must return JSON with at least `error`.
- Not found semantics must return `404`.
- Invalid state transitions and conflicting semantic operations must return `409`.
- Invalid input must return `400`.
- Health/readiness endpoints may return simplified payloads.

## 4. Session And Health Endpoints

### 4.1 `GET /health`

Returns:

- `{ "ok": true }`

### 4.2 `GET /ready`

Returns:

- `{ "ok": true }`

### 4.3 `GET /v1/session`

Returns a local session description for the current Relay surface.

Minimum fields:

- `actorType`
- `actorId`
- `capabilities`

## 5. Cycle Collection Endpoints

### 5.1 `GET /v1/cycles`

Purpose:

- list cycles for operator or participant access

Supported query params:

- `scope`
- `status`
- `condition`

Returns:

- `{ cycles: Cycle[] }`

### 5.2 `POST /v1/cycles`

Purpose:

- create a cycle from canonical ACP input

Request body:

- `CreateCycleInput`

Returns:

- `201`
- `{ cycle: Cycle }`

### 5.3 `GET /v1/cycles/:cycleId`

Returns:

- `{ cycle: Cycle }`

## 6. Lifecycle Mutation Endpoints

### 6.1 `POST /v1/cycles/:cycleId/open`
### 6.2 `POST /v1/cycles/:cycleId/close-submissions`
### 6.3 `POST /v1/cycles/:cycleId/routing`
### 6.4 `POST /v1/cycles/:cycleId/release`
### 6.5 `POST /v1/cycles/:cycleId/close-reflection`
### 6.6 `POST /v1/cycles/:cycleId/archive`
### 6.7 `POST /v1/cycles/:cycleId/replay`

All lifecycle endpoints:

- must enforce ACP state transitions
- must return `{ cycle: Cycle }` on success
- must emit corresponding audit and telemetry side effects where required by parent specs

Condition-specific rule:

- `routing` is only valid for `intervention`
- `release` must work for both `intervention` and `baseline_thread`, with appropriate preconditions

## 7. Inspection Endpoints

### 7.1 `GET /v1/cycles/:cycleId/audit-events`
Returns:
- `{ auditEvents: AuditEvent[] }`

### 7.2 `GET /v1/cycles/:cycleId/telemetry-events`
Returns:
- `{ telemetryEvents: TelemetryEvent[] }`

### 7.3 `GET /v1/cycles/:cycleId/metrics`
Returns:
- `{ metrics: CycleMetrics | null }`

### 7.4 `GET /v1/cycles/:cycleId/routing-decisions`
Returns:
- `{ routingDecisions: RoutingDecision[] }`

### 7.5 `GET /v1/cycles/:cycleId/digests`
Returns:
- `{ digests: Digest[] }`

### 7.6 `GET /v1/cycles/:cycleId/digests/:participantId`
Returns:
- `{ digest: Digest | null }`

## 8. Participant Surface Endpoints

### 8.1 `GET /v1/cycles/:cycleId/participants/:participantId/view`

Purpose:

- return the canonical participant view derived from cycle status and condition

Returns:

- `{ view: ParticipantView }`

### 8.2 `POST /v1/cycles/:cycleId/participants/:participantId/contribution`
Request body:
- contribution input fields except `participantId`

Returns:
- `{ cycle: Cycle }`

### 8.3 `POST /v1/cycles/:cycleId/participants/:participantId/responses`
Request body:
- response input fields except `participantId`

Returns:
- `{ cycle: Cycle }`

### 8.4 `POST /v1/cycles/:cycleId/participants/:participantId/feedback`
Request body:
- feedback input fields except `participantId`

Returns:
- `{ cycle: Cycle }`

### 8.5 `POST /v1/cycles/:cycleId/participants/:participantId/events`
Request body:
- participant event input fields except `participantId`

Returns:
- `{ cycle: Cycle }`

## 9. Export Endpoints

### 9.1 `POST /v1/cycles/:cycleId/exports`

Request body:
- `{ mode }`

Returns:
- `201`
- `{ export: ExportArtifact }`

### 9.2 `GET /v1/cycles/:cycleId/exports`
Returns:
- `{ exports: ExportArtifact[] }`

### 9.3 `GET /v1/cycles/:cycleId/exports/:mode`
Returns:
- text content for the requested export mode

Normative rule:
- the textual export endpoint may return markdown or plain text
- structured export artifact metadata must remain available separately

## 10. Error Contract

Minimum error payload:

```json
{ "error": "message" }
```

Recommended future extension:

```json
{ "error": "message", "code": "STATE_CONFLICT", "details": {} }
```

## 11. File Ownership Guidance

This spec primarily governs work on:

- `src/api/app.ts`
- `src/core/types.ts`
- `src/services/*` where API-visible behavior is affected
- API-facing tests

## 12. Acceptance Criteria

The ACP HTTP API is ready for serious use when:

- all required lifecycle, inspection, participant, and export paths exist
- web and CLI surfaces can both rely on the same API semantics or shared service semantics
- intervention and baseline conditions are both represented correctly
- error behavior is stable and machine-readable
- API behavior remains aligned to the protocol contract

## 13. Agent Execution Notes

Use this spec when assigning API work.

Required task shape:

- list exact endpoints affected
- list exact files in write scope
- preserve protocol semantics from parent specs
- add or update tests for any endpoint semantic change
