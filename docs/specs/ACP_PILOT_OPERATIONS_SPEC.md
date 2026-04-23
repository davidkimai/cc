# ACP Pilot Operations Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines how to run the fellowship pilot operationally.

Its role is to specify:

- operator responsibilities
- cycle preparation rules
- prompt and condition handling
- live-run checklists
- failure recovery expectations
- post-cycle artifact discipline

## 2. Normative Scope

This spec governs:

- pilot execution procedures
- operator workflow around cycles
- artifact and data handling discipline for the pilot

This spec does not govern:

- protocol semantics
- UI implementation details beyond operational usability

## 3. Pilot Structure For v1

The expected v1 pilot shape is:

- trusted participant community
- 24--40 target participants if feasible
- 4 target cycles
- both `intervention` and `baseline_thread` represented
- matched prompts or crossover structure according to the study plan

## 4. Operator Responsibilities

Operators must be able to:

- prepare cycle inputs in advance
- verify condition and participant assignments before opening a cycle
- launch and close phases on time
- inspect routing and release outputs before participant exposure where appropriate
- export artifacts after each cycle
- preserve auditability of failures and reruns

## 5. Pre-Cycle Checklist

Before opening a cycle, the operator must verify:

- prompt text is final
- condition is correct
- participant roster is correct
- load settings are correct
- storage/export path is working
- fallback communication path exists if Relay fails during the run

## 6. Live Cycle Checklist

During an active cycle, the operator must verify:

- submissions are open when expected
- participant contributions are being recorded
- submissions close at the intended point
- routing runs only when valid
- release occurs only after required prerequisites
- visible failures are logged rather than silently patched

## 7. Post-Cycle Checklist

After each cycle, the operator must verify:

- responses and feedback were captured as expected
- exports were generated
- telemetry and audit traces are available
- notes on anomalies or interventions are recorded
- replay remains possible

## 8. Failure Recovery Rules

If a live failure occurs:

- do not silently mutate cycle semantics to keep the session moving
- record the failure in operator notes and audit traces
- prefer explicit pause, recovery, or rerun decisions
- preserve partial data and annotate missingness rather than discarding it

## 9. Prompt Discipline

Prompt strategy must remain aligned to the study design.

For v1:

- prompts must be bounded and legible
- prompts across conditions must remain comparable
- prompt drift across cycles must be documented explicitly

## 10. Artifact Discipline

Each completed pilot cycle should retain:

- canonical cycle record
- exports
- telemetry traces
- audit traces
- any operator anomaly notes
- links to follow-on qualitative materials where collected

## 11. File Ownership Guidance

This spec primarily governs:

- operational docs
- CLI/headless workflows where pilot operations depend on them
- later runbooks or scripts for pilot execution

## 12. Acceptance Criteria

Pilot operations are ready for serious use when:

- an operator can run a cycle without inventing procedure on the fly
- pre-, live-, and post-cycle checklists are explicit
- failure handling is documented
- artifact retention discipline is clear

## 13. Agent Execution Notes

Use this spec when assigning work that affects pilot operability.

Required task shape:

- identify which operational checklist or workflow is being improved
- preserve comparability between intervention and baseline
- escalate if proposed shortcuts threaten study validity
