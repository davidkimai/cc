# ACP Persistence And Export Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines persistence and export behavior for the first ACP implementation.

Its role is to specify:

- storage responsibilities
- file-level invariants for v1
- export artifact expectations
- replay and archival expectations
- future transition constraints if storage evolves beyond local files

## 2. Normative Scope

This spec governs:

- persisted cycle records
- export artifact persistence
n- local file-store behavior for v1
- replay-supporting data retention expectations

This spec does not govern:

- long-term production database selection
- remote cloud storage topology

## 3. v1 Storage Model

The first Relay implementation may persist ACP state as local files, provided it:

- stores canonical cycle objects losslessly
- writes atomically enough to avoid partial corruption under normal local use
- supports listing, retrieval, and replay of prior cycles
- preserves audit, telemetry, feedback, exports, and metrics inside the cycle record or directly associated artifacts

## 4. Required Persistence Guarantees

The persistence layer must:

- create storage directories lazily and safely
- persist one canonical cycle record per cycle id
- preserve exact timestamps and ids
- preserve canonical arrays for contributions, routing decisions, digests, responses, feedback, telemetry, audit events, and exports
- reject invalid cycle objects before persistence

## 5. Export Modes

The system must support at least:

- `analysis`
- `audit`
- `minimal`

Each export artifact must include:

- artifact id
- cycle id
- mode
- created timestamp
- rendered content

## 6. Export Behavior Rules

Exports must:

- be derivable from canonical persisted cycle state
- remain reproducible for replay-grade analysis
- preserve enough detail for operator review and pilot analysis
- be inspectable through API and operational surfaces

## 7. Replay Requirements

Replay must rely on persisted state rather than reconstructed guesses.

At minimum, replay must preserve:

- cycle status
- condition
- contributions
- routing decisions
- digests
- responses
- feedback
- telemetry events
- audit events
- metrics and exports where available

## 8. Migration Constraints

If Relay later moves from file storage to a database-backed model:

- canonical ACP object semantics must remain unchanged
- export artifact semantics must remain unchanged
- replay of existing cycles must remain possible or be explicitly migrated

## 9. File Ownership Guidance

This spec primarily governs work on:

- `src/services/file-store.ts`
- export-related logic in `src/services/pipeline.ts`
- lifecycle/export semantics in `src/services/cycle-service.ts`
- persistence and export tests

## 10. Acceptance Criteria

Persistence and export are ready for serious use when:

- cycle records persist and reload losslessly under normal local use
- exports can be generated and re-read consistently
- replay can operate over persisted cycles without hidden dependencies
- persistence semantics remain aligned to ACP canonical objects

## 11. Agent Execution Notes

Use this spec when assigning persistence or export work.

Required task shape:

- identify storage or export modules in scope
- preserve backward readability of existing local cycle files where practical
- escalate if a proposed change would alter canonical object meaning
