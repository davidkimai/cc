# ACP Compatibility Spec

Status: Finalized Phase 5 compatibility alignment spec
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This document defines the compact compatibility layer for the current ACP stack.

Its role is to make the current relationship between:

- the canonical ACP protocol contract
- the current Relay implementation
- the Relay Blocks layer
- the current runtime and adapter assumptions

explicit enough that future implementers can extend the system without silently redefining protocol meaning.

## 2. Scope

This spec covers only the current compatibility surface for ACP v1 work in this repository.

It does not:

- redefine ACP semantics
- introduce a new protocol version
- replace the canonical protocol contract
- expand the Relay Blocks layer into canonical state ownership

## 3. Compatibility Model

Compatibility is a boundary discipline, not a new protocol layer.

The compatibility layer has four rules:

- the protocol contract stays authoritative
- Relay stores and executes the canonical state model
- Relay Blocks package reusable workflows and adapter guidance
- runtime adapters translate environment-specific behavior without changing protocol meaning

## 4. Canonical Compatibility Rules

### 4.1 Shared cycle model

Intervention and baseline-thread cycles share one canonical cycle shape.

Implementations must keep the same core object model for both conditions and vary only in allowed behavior.

### 4.2 Condition values

The current condition values are:

- `intervention`
- `baseline_thread`

These values must be preserved exactly at protocol boundaries.

### 4.3 Status vocabulary

The current repository uses the canonical ACP cycle lifecycle vocabulary at protocol boundaries and in the compact schema bundle:

- `draft`
- `scheduled`
- `submission_open`
- `submission_closed`
- `routing_complete`
- `digests_released`
- `reflection_closed`
- `archived`
- `failed`

Operator and telemetry event names are a separate vocabulary. For example, `routing_completed` remains valid as an operator event token, but it is not a cycle status.

### 4.4 Timestamp handling

All timestamps must remain machine-readable and comparable.

Compatibility rules for timestamps:

- use ISO 8601 datetime strings
- preserve exact values in exports
- do not coerce timestamps into display-only formats before persistence

### 4.5 Object ownership

The current ownership split is:

- Relay owns persisted state, execution, and lifecycle transitions
- Relay Blocks own operational workflows, trigger guidance, references, and helper scripts
- runtime adapters own environment assumptions and command wiring

No compatibility layer may move canonical data ownership into Relay Blocks.

## 5. Current Layer Responsibilities

### 5.1 Relay implementation

Current Relay compatibility expectations:

- support the same cycle model for both conditions
- enforce the state machine rather than relying on UI-only checks
- emit routing decisions only for intervention cycles
- emit digests only after routing completes
- keep baseline-thread execution comparable without routing artifacts
- retain telemetry, audit, export, and metric records for replay and inspection

### 5.2 Relay Blocks layer

Current Relay Blocks compatibility expectations:

- package procedures, not hidden protocol state
- stay readable as reusable operational units
- document runtime adapter assumptions explicitly
- use scripts for deterministic helper tasks where possible
- never become the canonical source of truth for cycle state

### 5.3 Runtime and adapter assumptions

The current runtime/adapter layer assumes:

- Relay is invoked through stable local surfaces such as web, CLI, and headless workflows
- adapters can read machine-readable outputs from Relay instead of scraping presentation text
- adapter-specific behavior belongs in the adapter, not in the protocol contract
- the current adapter surface should be treated as a compatibility target, not a new protocol

## 6. Compatibility Failure Conditions

Compatibility fails when any of the following occur:

- a layer changes the meaning of a canonical ACP object
- a status token is used without normalization at the boundary
- baseline-thread execution produces routing-only artifacts
- intervention execution omits routing explanations or digest detail
- a Relay Block is treated as canonical state instead of workflow packaging
- a runtime adapter assumes presentation text is the authoritative API

## 7. Companion Artifacts

The following files are part of the compatibility layer:

- `docs/compatibility/RELAY_COMPATIBILITY_NOTES.md`
- `protocol/compatibility/compatibility-matrix.json`

## 8. Acceptance Criteria

The compatibility workstream is accepted when all requirements below pass.

| Requirement | Acceptance test |
|---|---|
| Canonical lifecycle boundary | Compatibility docs do not define a parallel cycle-status vocabulary or map `routing_complete` to a different cycle status token |
| Event/status separation | Compatibility docs preserve `routing_completed` only as operator or telemetry event vocabulary |
| Proof surfaces | `protocol/compatibility/compatibility-matrix.json` lists the Relay browser surface and at least one non-browser proof surface |
| External adopter path | Public docs identify the HTTP API runner or TypeScript HTTP starter as an ACP-compatible consumer path outside Relay UI code |
| Relay Blocks boundary | Compatibility docs state that Relay Blocks package workflows and do not own canonical state |
| Programmatic readability | The compatibility matrix is valid JSON and includes `native`, `wrapped`, and `assumed` or `mapped` compatibility classifications |

Mechanical requirements:

- `npm run completion:audit` passes with outside-browser evidence
- `npm run release:gate` passes after compatibility updates
- compatibility notes and public protocol docs can be read without opening Relay UI code
