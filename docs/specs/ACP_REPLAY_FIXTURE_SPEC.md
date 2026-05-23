# ACP Replay Fixture Spec

Status: Finalized Phase 3 conformance-layer spec
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This document defines the replay fixture format for ACP so Relay can be replayed against a compact, protocol-first data set.

## 2. Fixture Layout

Each replay case contains:

- `state.json`
- `events.jsonl`
- `replay_expected.json`

A root `manifest.json` lists the available cases and their ACP version.

## 3. Fixture Rules

- Use UTF-8 encoded JSON.
- Keep key ordering stable inside fixture files.
- Store one JSON value per line in `events.jsonl`.
- Use ISO 8601 timestamps with timezone information.
- Keep identifiers stable and human-readable.
- Do not add Relay-only fields that are not part of the ACP contract.

## 4. Case Coverage

The fixture set must include at least:

- one `intervention` case
- one `baseline_thread` case

The small set in this repository is intentionally minimal but must still exercise:

- cycle creation
- submissions
- release
- archive
- response handling
- replay classification

## 5. Current Relay Model Coverage

The fixture set is aligned to the current Relay model by representing:

- the same underlying Cycle object for both conditions
- intervention routing and digest generation
- baseline thread release without routing
- operator audit events and participant telemetry events

## 6. Replay Expectations

Each `replay_expected.json` file should declare:

- `case_id`
- `acp_version`
- `condition`
- `replay_mode`
- `object_counts`
- `event_counts`
- `status`

Recommended replay mode values:

- `exact`
- `partial`
- `diagnostic-only`

## 7. Validation Rules

- A baseline case must not contain routing decisions or digests.
- An intervention case must contain at least one routing decision and one digest.
- Release semantics must reflect the condition while preserving the shared cycle model.
- Replay outputs must match the expected classification declared in the fixture.

## 8. Acceptance Criteria

The replay fixture workstream is accepted when the fixture tree satisfies all requirements below.

| Requirement | Acceptance test |
|---|---|
| Manifest coverage | `fixtures/replay/manifest.json` lists at least one `intervention` case and one `baseline_thread` case |
| Required files | Every manifest case contains `state.json`, `events.jsonl`, and `replay_expected.json` |
| Version alignment | Manifest, state, and expected files declare the same ACP version |
| Expected counts | `replay_expected.json` object and event counts match the actual fixture contents |
| Required audit path | Each case contains `cycle_created`, `cycle_opened`, `submissions_closed`, `digests_released`, and `cycle_archived` audit events |
| Intervention path | Intervention cases contain routing decisions, digests, `routing_started`, `routing_completed`, and `digest_generated` |
| Baseline path | Baseline cases contain no routing decisions and no digests |
| Replay mode | Every case declares a replay mode of `exact`, `partial`, or `diagnostic-only` and the conformance report echoes it |

Mechanical requirements:

- fixture checks are executable without Relay UI code
- replay fixture validation is deterministic and suitable for regression gating
- fixture files remain compact enough for a reviewer to inspect manually
