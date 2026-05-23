# ACP Pilot Data Handling Spec

Status: Finalized Phase 2 child spec derived from ACP pilot operations work
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This spec defines the minimum data-handling contract for ACP pilot cycles.
It keeps the pilot practical: capture what happened, retain what is needed, and hand the cycle off without forcing the operator to invent structure.

## 2. Scope

This spec governs:

- pilot artifact capture
- export snapshotting
- missingness logging
- retention decisions
- operator handoff packaging

This spec does not govern:

- protocol semantics
- analysis methods
- participant-facing product behavior

## 3. Artifact Contract

Each pilot cycle must have one stable cycle directory under `ACP_DATA_DIR/pilot/cycles/<cycle_id>/`.

The cycle directory must hold, at minimum:

- `cycle-manifest.json`
- one or more export bundles under `exports/`
- `missingness.jsonl`
- `handoff.md`

Derived evaluation notes may be written elsewhere, but raw pilot exports must remain untouched.

## 4. Export Capture Rules

1. Capture exports immediately after the relevant cycle phase closes.
2. Copy raw exports into a cycle-scoped export bundle; do not rewrite the source files in place.
3. Record the source path, capture time, file list, and checksums.
4. If an export is partial, empty, or malformed, keep the partial bundle and log the gap as missingness instead of hiding it.

## 5. Missingness Rules

Missingness includes:

- absent files
- truncated exports
- skipped participant records
- delayed or failed routing output
- fields that cannot be recovered without changing the raw record

Each missingness entry must name:

- cycle id
- artifact or field
- missingness kind
- scope
- severity
- operator or owner
- next step

Do not backfill raw pilot data silently. Annotate the gap and preserve the evidence trail.

## 6. Retention Rules

Pilot data retention is conservative by default.

- keep raw exports, manifests, handoff notes, and missingness logs for the full pilot unless an explicit retention decision says otherwise
- do not delete a cycle with unresolved missingness or an open audit question
- if pruning is needed, prune only after the handoff is complete and the analysis owner has acknowledged the bundle
- retain at least one canonical export snapshot per cycle

Any retention script must support a dry run and must not delete held cycles.

## 7. Operator Handoff Rules

The operator handoff must answer three questions:

- what was captured
- what is missing
- what should the next owner do

The handoff package must point to the raw export bundle, the manifest, and the missingness log. It must also name any follow-up that affects analysis or replay.

## 8. Evaluation Handoff

Evaluation work receives the handoff packet and treats it as the source of truth for:

- export completeness
- known gaps
- cycle-level exclusions
- manual interventions that should remain visible in analysis

Evaluators should not edit pilot raw exports. Any derived analysis artifact belongs in the evaluation area.

## 9. Acceptance Criteria

The pilot data-handling path is accepted when it satisfies all requirements below.

| Fixture | Requirement |
|---|---|
| Capture command | `capture-export` copies a source export bundle into a cycle-scoped directory and records checksums |
| Missingness command | `log-missingness` appends a structured JSONL entry without editing raw exports |
| Handoff command | `build-handoff` produces `handoff.md` and `handoff.json` from the cycle directory |
| Retention dry run | `apply-retention` reports planned deletions unless `--apply` is present |
| Default smoke path | `npm run pilot:data` runs a local smoke workflow covering capture, missingness, handoff, and retention dry-run |

Mechanical requirements:

- pilot data commands require no network access or live model call
- raw captured exports are copied, not rewritten in place
- missing or partial data remains visible through missingness artifacts
- retention must respect hold files or manifest retention flags
