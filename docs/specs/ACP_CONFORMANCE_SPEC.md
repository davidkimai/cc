# ACP Conformance Spec

Status: Finalized Phase 3 conformance-layer spec
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This document defines the minimum conformance bar for ACP so Relay can be tested as a protocol implementation rather than as an ad hoc app.

## 2. Conformance Model

Conformance is a pass/fail discipline over three layers:

- version conformance
- schema conformance
- replay conformance

All three layers must pass for a case to be considered ACP-legitimate.

## 3. Version Conformance

- The implementation version must match the fixture version line.
- The report must state the active ACP version explicitly.
- Version mismatches are hard failures.

## 4. Schema Conformance

A case passes schema conformance only if:

- all required objects are present
- all required fields are present
- enum values match the contract
- timestamps are valid and ordered
- cross-object references resolve
- no fixture-only object violates canonical shape

Schema conformance failures must identify the object type and field that failed.

## 5. Replay Conformance

Replay conformance checks whether the persisted case can be reconstructed into the expected protocol story.

Replay must state one of:

- `exact`
- `partial`
- `diagnostic-only`

Replay passes only when the expected replay mode is met for the case.

## 6. Case-Specific Expectations

### 6.1 Intervention case

Must include:

- one cycle in the `intervention` condition
- submissions closed before routing starts
- routing decisions
- digests
- at least one response during the reflection window
- release and archive transitions

### 6.2 Baseline case

Must include:

- one cycle in the `baseline_thread` condition
- no routing decisions
- no digests
- a shared release step that represents the baseline thread release
- at least one response during the reflection window
- release and archive transitions

## 7. Failure Semantics

Conformance fails if any of the following occur:

- a required object is missing
- a required field is missing or malformed
- a baseline fixture contains intervention-only artifacts
- an intervention fixture omits routing or digests
- replay cannot classify the case
- the fixture declares the wrong ACP version

## 8. Minimal Report Contents

Every conformance report should include:

- case id
- ACP version
- schema result
- replay result
- final status
- failure reason if failed

## 9. Acceptance Criteria

The conformance workstream is accepted when `npm run conformance:check -- --json` produces a meaningful pass/fail report with the structure below.

| Requirement | Acceptance test |
|---|---|
| Non-zero coverage | Report includes `summary.totalChecks > 0` |
| Stable check records | Report includes a `checks` array; every check has `id`, `scope`, `status`, and `failures` |
| Compatibility with legacy consumers | Report also exposes `results` as an alias for `checks` during the Phase 3 transition |
| Version layer | Version mismatches across manifest, state, and expected outputs are reported as failed checks |
| Schema layer | Required fields, enum values, timestamps, object counts, event counts, and cross-object references are checked |
| Replay layer | Intervention and baseline replay cases are classified independently and condition-specific artifacts are enforced |
| Human-readable failure output | Non-JSON output lists total checks, per-case status, and concrete failure messages |

Mechanical requirements:

- conformance fails closed when any check fails
- `summary.failed` equals the number of failed check records
- `schemaBundle.status` and every `replayCases[].status` remain available for existing tests and scripts
