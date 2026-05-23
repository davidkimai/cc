# ACP Versioning Spec

Status: Finalized Phase 3 conformance-layer spec
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This document defines how `Attention Coordination Protocol (ACP)` is versioned so Relay and replay fixtures can be checked for protocol legitimacy without local reinterpretation.

## 2. Scope

This spec applies to:

- protocol objects
- canonical event vocabularies
- schema bundles
- replay fixtures
- conformance reports

It does not define product UX or implementation details.

## 3. Normative Rules

- ACP uses semantic versioning.
- `major` changes are breaking and require a new compatibility line.
- `minor` changes are additive and backward-compatible for existing v1 readers unless explicitly marked otherwise.
- `patch` changes are editorial or fixture-only and must not change contract meaning.
- Relay must declare the ACP version it implements.
- Fixtures and conformance outputs must declare the ACP version they target.
- Relay must not invent a local protocol version that supersedes ACP.

## 4. Compatibility Rules

- A fixture is valid only if it targets a declared ACP version and uses only fields allowed by that version.
- A schema bundle is valid only if every object name, required field, enum value, and invariant can be traced to the current ACP version line.
- A replay report must state whether replay was `exact`, `partial`, or `diagnostic-only`.
- When a breaking contract change is needed, version first, then update schemas, then update fixtures, then update conformance expectations.

## 5. Versioned Artifacts

The following artifacts are versioned as ACP protocol artifacts:

- cycle and participant objects
- contribution, routing decision, digest, response, audit event, and telemetry event objects
- replay fixture manifests and per-case outputs
- conformance report templates

## 6. Acceptance Criteria

The versioning workstream is accepted when the repository satisfies all requirements below.

| Requirement | Acceptance test |
|---|---|
| Declared protocol line | `fixtures/replay/manifest.json`, every replay `state.json`, every `replay_expected.json`, and the conformance report declare the same ACP version string |
| SemVer-compatible version | The active ACP version is parseable as `major.minor.patch`; version mismatches are hard conformance failures |
| Artifact traceability | The conformance report states the active ACP version and reports which fixture case failed when a version mismatch occurs |
| Change discipline | Breaking schema, enum, or invariant changes require a version update before fixtures or conformance expectations are changed |
| No Relay-local override | Relay implementation files may declare the ACP version they implement, but must not introduce a competing local protocol version |

Mechanical requirements:

- `npm run conformance:check -- --json` emits `protocolVersion`
- replay fixture checks fail if manifest, state, and expected ACP versions diverge
- replay failures remain distinct from runtime command failures
