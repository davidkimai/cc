# Relay Demo Data Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_PILOT_OPERATIONS_SPEC.md` v0.1
- `RELAY_WEB_APP_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the canonical demo-data bundle for ACP-first Relay demos.

Its role is to specify:

- seeded cycle data
- sample participants
- lifecycle expectations
- bootstrap entrypoints
- the minimal file layout used to make the repo easier to demo

The bundle exists to make Relay easier to show, rehearse, and validate as an ACP implementation. It is not a replacement for the protocol contract or for real pilot data.

## 2. Normative Scope

This spec governs:

- demo seed material under `demo/`
- bootstrap helpers under `scripts/demo/`
- deployment guidance under `docs/deployment/demo/`

This spec does not govern:

- production persistence schemas
- live participant data
- protocol semantics
- UI behavior outside the demo bundle

## 3. ACP-First Framing

Demo data must frame Relay as the first implementation used to validate ACP.

Normative rules:

- the demo bundle must make ACP cycles legible before Relay UI details
- intervention and baseline behavior must both be represented
- the seed data must not imply that Relay is the protocol owner
- sample data must be clearly synthetic and disposable

## 4. Bundle Layout

The canonical demo bundle lives under `demo/` and contains:

- `demo/README.md`
- `demo/bootstrap-manifest.json`
- `demo/seed/cycles.json`
- `demo/seed/participants.json`
- `demo/seed/lifecycle.json`

The bootstrap scripts live under `scripts/demo/` and operate on that bundle without needing other repo edits.

## 5. Seeded Cycle Data

The seeded data must include two canonical cycles.

### 5.1 Intervention cycle

Required properties:

- `condition`: `intervention`
- one primary prompt
- one prompt-facing participant set
- routed digest output after submission closes
- explanation content that makes routing legible

Canonical cycle identity:

- `slug`: `acp-demo-intervention`

### 5.2 Baseline cycle

Required properties:

- `condition`: `baseline_thread`
- one primary prompt
- chronological thread presentation
- no routed digest
- no implication that thread order was algorithmically curated

Canonical cycle identity:

- `slug`: `acp-demo-baseline`

### 5.3 Shared cycle expectations

Both seeded cycles must include:

- a stable cycle id
- a stable prompt
- a participant roster
- lifecycle state expectations
- expected artifacts or export locations
- operator notes that make the demo self-explanatory

## 6. Sample Participants

The sample roster should be small but realistic enough to show both conditions.

Required roster shape:

- one operator identity
- at least six participant identities
- participants split across the intervention and baseline demo cycles
- participant metadata that is synthetic and human-readable

Recommended participant fields:

- `id`
- `display_name`
- `role`
- `persona`
- `cohort`
- `condition_scope`
- `notes`

Normative rule:

- participants must be synthetic placeholders, not real people

## 7. Lifecycle Expectations

The demo lifecycle should use the ACP-friendly order below:

1. `draft`
2. `scheduled`
3. `submission_open`
4. `submission_closed`
5. `routing_complete`
6. `digests_released`
7. `reflection_closed`
8. `archived`
9. `failed`

Non-normative note: Current implementation schemas and demo seed files may use different lifecycle tokens. Any such divergence is non-conformant and must be corrected in Phase 1B. No parallel demo-only lifecycle vocabulary should be introduced.

Normative behavior:

- `scheduled` indicates the cycle is prepared but not yet accepting contributions
- `submission_open` allows one primary contribution per participant
- `submission_closed` blocks new primary contributions
- `routing_complete` is only meaningful for `intervention`
- `digests_released` exposes the cycle-specific outputs for review
- `reflection_closed` follows release and remains distinct from the main prompt loop
- `archived` indicates the demo cycle is closed and retainable
- `failed` indicates an explicit failure state rather than a silent partial success

Condition-specific expectations:

- `intervention` must show routed digest items and routing explanations
- `baseline_thread` must show a plain chronological thread and no digest layer

## 8. Bootstrap EntryPoints

The canonical bootstrap entrypoints are:

- `scripts/demo/bootstrap-demo.sh`
- `scripts/demo/demo-summary.sh`

Bootstrap behavior:

- copy or materialize the canonical demo bundle into a target directory
- preserve the seed files exactly as tracked in `demo/`
- require no network access
- avoid mutating unrelated repo files

Summary behavior:

- print the seeded cycle identities
- print participant roster counts
- print the lifecycle sequence and condition-specific expectations

## 9. Acceptance Criteria

The demo-data workstream is accepted when it satisfies all mechanical and semantic requirements below.

| Fixture | Baseline Thread (`acp-demo-baseline`) | Intervention (`acp-demo-intervention`) |
|---|---|---|
| Contribution count | >=10 synthetic contributions | >=10 synthetic contributions |
| Pile-on pattern | >=3 contributions reinforcing the same early dominant view | Present in raw data, disrupted by epistemic routing |
| Buried minority signal | >=1 useful dissenting contribution after position 8 | That contribution surfaced in the routed digest |
| Digest layer | None (chronological thread only) | Present -- one `DigestItem` per routed contribution |
| `explanation_text` per item | Not applicable | Non-empty on every `DigestItem` per `ACP_PROTOCOL_CONTRACT_SPEC.md` Section 4.6 |
| `bridge_flag` | Not applicable | At least one `DigestItem` has `bridge_flag: true` |
| `routing_explanations` | Not applicable | Non-empty on parent `Digest` per `ACP_PROTOCOL_CONTRACT_SPEC.md` Section 4.5 |

Mechanical requirements:

- the repo contains a compact spec for the demo bundle
- the demo bundle has synthetic cycle and participant seeds
- the bootstrap scripts provide an obvious local entrypoint
- deployment notes explain how to use the bundle without guesswork

## 10. Agent Execution Notes

Use this spec when assigning work on ACP demo assets.

Required task shape:

- keep edits inside the demo bundle, demo scripts, and demo deployment docs
- preserve ACP-first framing
- prefer small synthetic data sets over realistic but noisy dumps
- keep the bundle easy to inspect by humans and agents
