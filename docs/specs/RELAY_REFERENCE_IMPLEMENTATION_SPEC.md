# Relay Reference Implementation Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `RELAY_BLOCKS_SPEC.md` v0.3
- `ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md` v0.3

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines `Relay`, the first working implementation of `Attention Coordination Protocol (ACP)`.

Its role is to specify:

- what Relay must implement for ACP v1
- what Relay may defer
- which repository modules constitute the reference implementation
- the implementation boundary between ACP, Relay, and Relay Blocks
- the acceptance bar for a serious fellowship-grade reference implementation

## 2. Normative Scope

This spec governs:

- the product shape of Relay
- the required product surfaces
- the implementation modules that together count as Relay
- the minimum implementation bar for intervention and baseline conditions

This spec does not govern:

- the ACP contract itself
- telemetry formulas beyond what parent specs define
- future alternative ACP implementations
- distribution strategy for external adopters beyond the first implementation

## 3. Relay Definition

`Relay` is the first validating implementation of ACP.

Relay must prove that ACP can be implemented as a coherent product system rather than only as an abstract protocol. It does this through:

- a participant-facing web surface
- an operator-facing web surface embedded in the same app shell
- an operator CLI and headless workflow surface
- a shared coordination core enforcing one canonical cycle model
- a baseline-comparable execution path on the same contract
- telemetry, audit, export, and replay support

Relay is not:

- a mass social platform
- a public feed product
- a general-purpose chat product
- the only possible implementation of ACP

## 4. Implementation Boundary

Read the stack this way:

- `ACP` defines the protocol contract and primary contribution.
- `Relay` implements ACP end to end in product form.
- `Relay Blocks` package reusable operational units over ACP and Relay.

Normative rule:

- Relay may operationalize, present, and automate ACP.
- Relay may not redefine ACP semantics locally.
- Relay Blocks may teach agents how to operate Relay.
- Relay Blocks may not become the hidden source of truth for ACP or Relay behavior.

## 5. Current Repository Modules Owned By Relay

The following modules together constitute the initial Relay implementation:

- `src/core/`
- `src/services/`
- `src/api/`
- `src/cli.ts`
- `src/server.ts`
- `public/`
- `tests/`

## 6. Required Relay Surfaces

### 6.1 Shared coordination core

Relay must implement a shared coordination core that supports:

- cycle creation
- canonical state transitions
- intervention routing
- digest generation
- baseline-thread release
- response collection
- feedback collection
- telemetry capture
- audit capture
- export generation
- replay

### 6.2 Relay web app

The web app must expose:

- operator cycle creation and lifecycle control
- participant cycle access
- intervention digest reading with explanations
- baseline-thread reading
- response and feedback submission
- visibility into metrics, audit, and export outputs

### 6.3 Relay CLI and headless workflows

The CLI must expose:

- create/list/show/open/close/release/archive/replay/export operations
- participant view retrieval
- scripted contribution, response, feedback, and telemetry input paths
- machine-readable outputs suitable for automation

## 7. Required Product Behavior

Relay must satisfy all of the following:

1. Support both `intervention` and `baseline_thread` on the same cycle model.
2. Enforce the ACP state machine rather than relying on UI-only gating.
3. Produce intervention digests only after routing completes.
4. Produce baseline release without routing while preserving comparable cycle structure.
5. Keep participant and operator surfaces aligned to one shared source of truth.
6. Preserve enough telemetry and audit detail for replay-grade inspection.
7. Generate exports that are useful for pilot analysis.

## 8. What Counts As Fellowship-Grade Relay

A serious fellowship-grade Relay implementation must be:

- coherent: one protocol core, not two drifting products
- usable: a participant can complete a cycle without operator patchwork
- inspectable: an operator can understand what happened in a cycle
- comparable: intervention and baseline are both runnable under one model
- measurable: required metrics and participant outcomes can be produced
- extensible: Relay Blocks can operate over the implementation without redefining it

## 9. Explicit Non-Goals For v1

Out of scope for the first fellowship-grade Relay implementation:

- multi-tenant org management
- account systems beyond local or minimal pilot assumptions
- production-grade auth or permissions complexity
- real-time collaborative editing
- mobile-native clients
- large-scale deployment infrastructure
- external ACP registry or adoption ecosystem

## 10. File Ownership Guidance

This spec primarily governs work on:

- `src/core/types.ts`
- `src/services/*`
- `src/api/app.ts`
- `src/cli.ts`
- `src/server.ts`
- `public/*`
- `tests/*`
- `README.md`

## 11. Acceptance Criteria

Relay is implementation-ready for the fellowship when:

- a cycle can be created, opened, closed, released, reflected, archived, replayed, and exported
- intervention and baseline conditions both work end to end
- the web app supports participant and operator flows on the same underlying state
- the CLI supports the same lifecycle in automatable form
- telemetry, audit events, metrics, and exports are observable and persisted
- build, typecheck, and tests pass
- the implementation still reads as ACP-first rather than as a disconnected app prototype

## 12. Agent Execution Notes

Use this spec when assigning work that changes the product shape of Relay.

Required task template:

- reference this spec and the relevant parent specs
- state exact write scope
- state whether the task is web, CLI, engine, or cross-surface
- forbid local redefinition of ACP semantics
- require explicit escalation if implementation pressure suggests a protocol change

## 13. Immediate Follow-On Specs

This spec is complemented directly by:

- `RELAY_WEB_APP_SPEC.md`
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md`
- `ACP_HTTP_API_SPEC.md`
- `ACP_COORDINATION_ENGINE_SPEC.md`
