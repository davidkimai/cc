# Relay Operator CLI And Headless Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the Relay CLI and headless workflow surface as the operational control plane for the first ACP implementation.

Its role is to specify:

- operator command responsibilities
- machine-readable output expectations
- replay and export behavior
- automation readiness requirements
- headless execution expectations for study operations

## 2. Normative Scope

This spec governs:

- the Relay CLI
- machine-friendly operational workflows
- headless cycle operation paths
- automation-facing command behavior

This spec does not govern:

- participant web UX
- browser presentation details
- protocol semantics beyond how they are exposed operationally

## 3. Surface Definition

The Relay CLI and headless layer exist to make ACP operable without manual browser interaction.

This surface is the primary control plane for:

- scripted cycle setup
- replay
- export
- inspection
- automation
- agent operation over the Relay implementation

## 4. Required Command Families

Relay must support command families for:

- `cycle`
- `participant`
- `export`
- `replay`
- `events` or equivalent telemetry/audit submission and inspection

At minimum, the CLI must allow:

- create
- list
- show
- open
- close submissions
- run routing
- release
- close reflection
- archive
- replay
- export
- participant view
- contribution submit
- response submit
- feedback submit
- participant event submit

## 5. Headless Workflow Requirements

The headless layer must support:

- full intervention cycle execution without browser use
- full baseline cycle execution without browser use
- reproducible replay of prior cycles
- generation of export artifacts suitable for evaluation
- machine-readable output for downstream scripts and agents

## 6. Output Contract

CLI and headless operations should prefer:

- stable field names
- machine-readable JSON where appropriate
- deterministic structure for the same command category
- exit codes that distinguish success from semantic failure

Normative rule:

- human-readable output may exist
- machine-readable output must remain available for automation-sensitive paths

## 7. Operational Behavior Rules

The CLI/headless layer must:

- enforce the same ACP state machine as the API and web surface
- preserve intervention/baseline parity on the same cycle model
- avoid hidden side effects not reflected in audit or telemetry outputs
- expose replay and export as first-class workflows
- remain usable by operators and autonomous agents with minimal manual patching

## 8. Telemetry And Audit Expectations

The operator CLI/headless layer must result in:

- required operator events being emitted or persisted
- failure paths being observable
- export generation being traceable
- replay runs being auditable

## 9. File Ownership Guidance

This spec primarily governs work on:

- `src/cli.ts`
- `src/server.ts` where headless behavior is surfaced
- `src/api/app.ts` where CLI/headless compatibility is affected
- `src/services/*` where command behavior depends on service semantics
- automation-facing tests covering CLI or headless paths

## 10. Acceptance Criteria

The CLI and headless layer are ready for serious implementation use when:

- an operator can complete a cycle lifecycle without the browser
- exports and replay can be invoked without manual file patching
- machine-readable command output is stable enough for agents and scripts
- intervention and baseline conditions are both operable through the control surface
- operator actions remain aligned to the same audit and telemetry semantics as the rest of Relay

## 11. Agent Execution Notes

Use this spec when assigning work on operational control paths.

Required task shape:

- reference this spec and the parent specs
- limit write scope to CLI, headless, and explicitly necessary shared modules
- preserve automation-first output discipline
- escalate if a requested shortcut would bypass ACP lifecycle enforcement

## 12. Immediate Follow-On Specs

This spec depends especially on:

- `ACP_HTTP_API_SPEC.md`
- `ACP_PERSISTENCE_EXPORT_SPEC.md`
- `ACP_PILOT_OPERATIONS_SPEC.md`
- `ACP_AGENT_EXECUTION_CONTRACT.md`
