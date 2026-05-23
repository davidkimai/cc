# Relay Compatibility Notes

Status: Practical companion notes for `ACP_COMPATIBILITY_SPEC.md`
Version: 0.1
Date: 2026-04-23

## 1. Read This First

Use these notes when implementing or reviewing the current ACP stack.

The compatibility rule is simple:

- ACP defines meaning
- Relay implements meaning
- Relay Blocks package workflows around meaning
- adapters translate local runtime behavior into the Relay surface

## 2. Current Compatibility Profile

| Layer | What it owns | Current compatibility posture |
| --- | --- | --- |
| Protocol contract | Canonical cycle semantics, lifecycle rules, and object meaning | Authoritative |
| Relay implementation | Persisted state, transitions, exports, telemetry, replay, and operator/participant surfaces | Native implementation |
| Relay Blocks | Operator workflows, trigger guidance, references, and helper scripts | Wrapped operational layer |
| Runtime adapter | Local execution assumptions and surface wiring | Assumed and normalized at the boundary |

## 3. Practical Normalization Rules

### 3.1 Status tokens

Treat the following as the current cycle lifecycle vocabulary:

- `draft`
- `scheduled`
- `submission_open`
- `submission_closed`
- `routing_complete`
- `digests_released`
- `reflection_closed`
- `archived`
- `failed`

`routing_completed` remains valid as an operator event token only. Do not use it as a cycle status.

### 3.2 Baseline-thread behavior

Baseline-thread cycles must remain comparable to intervention cycles while staying routing-free.

That means:

- same core cycle object
- no routing decisions
- no digests
- release and archive transitions still exist
- telemetry, responses, feedback, exports, and metrics still matter

### 3.3 Intervention behavior

Intervention cycles may include:

- routing decisions
- digests
- digest explanations
- bridge flags

Those artifacts should appear only after routing has completed.

## 4. What Relay Blocks May and May Not Do

Relay Blocks may:

- document workflows
- provide deterministic helper scripts
- package operational sequences for operators and agents
- describe runtime adapter expectations

Relay Blocks may not:

- store canonical cycle state
- redefine lifecycle rules
- silently change status or condition meaning
- replace Relay as the system of record

## 5. What the Current Adapter Assumes

The current runtime adapter should assume:

- Relay surfaces machine-readable outputs for automation
- one local execution context is enough for the current implementation
- adapter behavior is allowed to be opinionated, but only at the boundary
- if a value is not part of the protocol contract, the adapter must not promote it to canonical meaning

The adapter should also prefer the current Relay surfaces over browser-only reconstruction whenever a stable API or CLI path exists.

## 6. Recommended Use of the Matrix

Read `protocol/compatibility/compatibility-matrix.json` when deciding whether a feature is:

- native to Relay
- wrapped by Relay Blocks
- normalized by the adapter
- merely assumed by the current runtime

If a feature is marked as mapped or assumed, future work should keep the mapping explicit and localized.

## 7. Implementation Guidance

When adding new compatibility behavior:

1. keep the protocol contract unchanged unless the protocol itself is being revised
2. update the notes before inventing a second interpretation of the same object
3. update the matrix whenever a new boundary mapping is introduced
4. prefer a single translation layer over repeated special-case logic

## 8. Output Expectation

Future compatibility work should be able to answer, for every important capability:

- whether Relay owns it
- whether Relay Blocks wrap it
- whether the adapter translates it
- whether the runtime merely assumes it

If any of those answers are unclear, the implementation is too implicit.
