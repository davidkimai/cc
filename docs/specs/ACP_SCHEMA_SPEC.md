# ACP Schema Spec

Status: Finalized Phase 3 conformance-layer spec
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This document defines the canonical schema bundle for ACP objects so Relay and replay fixtures validate against one shared object model.

## 2. Canonical Serialization

- Canonical fixture payloads are JSON objects encoded in UTF-8.
- Required fields must be present and non-null.
- Machine timestamps must be ISO 8601 strings with timezone information.
- Identifiers must be stable strings and unique where the protocol contract requires uniqueness.
- Enums must match the protocol contract exactly.

## 3. Canonical Objects

The schema bundle covers these ACP objects:

- `Cycle`
- `Participant`
- `Contribution`
- `RoutingDecision`
- `Digest`
- `DigestItem`
- `Response`
- `AuditEvent`
- `TelemetryEvent`
- `ReplayReport`

## 4. Shared Field Rules

- `cycle_id` is the primary cross-object anchor.
- `created_at`, `released_at`, and all lifecycle timestamps must be comparable.
- `condition` must be either `intervention` or `baseline_thread`.
- `status` must be one of the canonical cycle statuses.
- Cross-object references must point to existing objects in the same replay set.

## 5. Object-Level Schema Expectations

### 5.1 Cycle

Required shape:

- identifiers and prompt fields
- lifecycle timestamps
- `condition`
- `status`
- `config`

### 5.2 Participant

Required shape:

- identity fields
- status
- consent flags
- creation timestamp

### 5.3 Contribution

Required shape:

- `cycle_id`
- `participant_id`
- body text
- creation timestamp
- submission status

### 5.4 RoutingDecision

Required shape:

- recipient and contribution references
- `score`
- `factors`
- `bridge_flag`
- `load_cost`
- explanation basis

### 5.5 Digest

Required shape:

- recipient and cycle references
- digest items
- summary
- routing explanations
- estimated read time
- release timestamp

### 5.6 Response

Required shape:

- cycle and participant references
- body
- creation timestamp

### 5.7 AuditEvent

Required shape:

- event identity
- actor identity
- event type
- payload
- creation timestamp

### 5.8 TelemetryEvent

Required shape:

- event identity
- participant identity
- event type
- metadata
- creation timestamp

### 5.9 ReplayReport

Required shape:

- ACP version
- replay case identifier
- replay classification
- object counts
- event counts
- result status

## 6. Validation Rules

- Required fields must validate before any replay or conformance check is marked passing.
- Baseline fixtures must not contain routing decisions or digests.
- Intervention fixtures must contain routing decisions and digests before release.
- A digest item must correspond to a routed contribution for that recipient.
- Replay fixtures must fail validation if they mix incompatible protocol versions.

## 7. Acceptance Criteria

The schema workstream is accepted when the canonical bundle and replay fixtures satisfy all requirements below.

| Requirement | Acceptance test |
|---|---|
| Canonical status enum | `CycleStatus` includes exactly `draft`, `scheduled`, `submission_open`, `submission_closed`, `routing_complete`, `digests_released`, `reflection_closed`, `archived`, `failed` |
| Canonical condition enum | `CycleCondition` includes exactly `intervention` and `baseline_thread` |
| Required object coverage | The schema bundle exposes definitions for cycle, participant, contribution, routing decision, digest, digest item, response, audit event, telemetry event, export artifact, and cycle metrics objects |
| Required replay fields | Conformance checks verify required fields for `Cycle`, `Participant`, `Contribution`, `RoutingDecision`, `Digest`, `DigestItem`, `Response`, `AuditEvent`, and `TelemetryEvent` in replay fixtures |
| Cross-object references | Contributions, routing decisions, digests, digest items, responses, and events resolve to objects in the same replay case |
| Condition-specific shape | Baseline fixtures contain no routing decisions or digests; intervention fixtures contain routing decisions and digests |
| Timestamp validity | Lifecycle and object timestamps parse as ISO 8601 date-time strings and cycle lifecycle timestamps appear in protocol order |

Mechanical requirements:

- `npm run conformance:check -- --json` reports more than zero schema and replay checks
- every reported check has a stable `id`, `scope`, `status`, and failure message when failing
- schema validation does not rely on Relay UI code or product-only exceptions
