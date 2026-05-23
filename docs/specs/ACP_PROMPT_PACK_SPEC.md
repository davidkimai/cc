# ACP Prompt Pack Spec

Status: Finalized Phase 1C child spec derived from ACP parent specs  
Parent specs:

- `ACP_PILOT_OPERATIONS_SPEC.md` v0.1
- `ACP_EVALUATION_INSTRUMENT_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the required shape and quality bar for ACP prompt packs used in civic and governance demos, pilots, and evaluation cycles.

Prompt packs are scenario bundles, not generic templates. Each pack must make ACP legible to a non-specialist civic audience, especially CORDA-facing reviewers, by showing a concrete decision, the relevant stakeholders, the operational constraints, and the output expected from the cycle.

## 2. Normative Scope

This spec governs:

- prompt-pack file structure
- scenario selection for civic and governance use
- the minimum quality bar for pilot and evaluation packs
- the relationship between pilot packs and evaluation companions

This spec does not govern:

- runtime orchestration
- telemetry schema
- participant recruitment
- legal review
- production policy content

## 3. Required Pack Set

Each civic prompt-pack scenario must exist in two forms:

- a pilot pack in `docs/pilot/prompt-packs/`
- an evaluation pack in `docs/evaluation/prompt-packs/`

The two files must share the same basename.

Example:

- `civic-budget-reallocation.md`
- `civic-budget-reallocation.md`

## 4. Required Front Matter

Every pack must begin with YAML front matter containing:

- `id`
- `title`
- `version`
- `status`
- `pack_type`
- `domain`
- `audience`
- `primary_use`
- `timebox_minutes`
- `linked_companion`

Pack identifiers must be stable, kebab-cased, and specific to the scenario.

## 5. Required Pilot Pack Sections

Every pilot pack must include these sections in this order:

- Scenario
- Civic context
- Roles and inputs
- Prompt
- Output requirements
- Quality bar
- Operator notes
- CORDA legibility notes

## 6. Required Evaluation Pack Sections

Every evaluation pack must include these sections in this order:

- Scenario recap
- Evaluation goal
- Evidence to capture
- Scoring rubric
- Failure modes
- CORDA legibility checks

## 7. Scenario Design Rules

A valid civic prompt pack must:

- center one concrete civic or governance decision
- include a real tradeoff, not an abstract discussion
- identify who is speaking, who is deciding, and who is affected
- define the time horizon or decision deadline
- state the operational constraints that matter
- be runnable without inventing missing context during the cycle

Scenario prompts must not:

- depend on unstated legal facts
- require fabricated data to feel complete
- drift into partisan advocacy
- use generic "discuss the issue" phrasing
- hide the decision behind broad thematic language

## 8. Output Expectations

Each pack must specify what a good cycle should produce.

Pilot packs should name outputs such as:

- a briefing note
- a routed question set
- a release-ready summary
- a list of unresolved items
- a decision recommendation with tradeoffs

Evaluation packs should name the evidence needed to judge whether ACP helped:

- clarity of the decision path
- quality of surfaced tradeoffs
- usefulness of the routed perspectives
- completeness of unresolved questions
- whether the result is legible to civic stakeholders

## 9. Quality Bar

A pack is usable only if it meets all of the following:

- the scenario is specific enough to run in a real demo cycle
- the prompt can be executed in a 10 to 15 minute session without improvising the premise
- the scenario is serious enough for civic stakeholders to recognize
- the task reveals why ACP exists, not just what ACP outputs
- the language is neutral, concrete, and professionally legible
- the evaluation path is clear enough to compare cycles later

## 10. CORDA Legibility Rule

Every pack must help a CORDA reviewer answer three questions quickly:

- what civic problem is being coordinated
- what attention or routing ACP changes
- what a successful release would look like

If a reviewer cannot infer those answers from the pack alone, the pack is too vague.

## 11. Acceptance Criteria

The prompt-pack workstream is accepted when it satisfies all mechanical and semantic requirements below.

| Fixture | Pilot pack requirement | Evaluation pack requirement |
|---|---|---|
| Minimum collection | At least 3 civic scenarios under `docs/pilot/prompt-packs/` | Matching companion for each pilot scenario under `docs/evaluation/prompt-packs/` |
| File pairing | Same basename as evaluation companion | Same basename as pilot companion |
| Front matter | All required fields present; `pack_type: pilot`; stable kebab-case `id` | All required fields present; `pack_type: evaluation`; same `id` as pilot companion |
| Scenario specificity | Concrete civic decision with stakeholders, constraints, and decision deadline | Same scenario recap, with evaluation target tied to the pilot decision |
| ACP value proposition | Prompt reveals routing, attention allocation, or release discipline | Evidence captures whether ACP improved clarity, surfaced tradeoffs, or preserved unresolved questions |
| CORDA legibility | Reviewer can identify problem, attention change, and successful release from the pack alone | Reviewer can identify decision, evidence to capture, and failure modes from the pack alone |

Mechanical requirements:

- prompt packs require no network access or live model calls
- each ready scenario has one pilot file and one evaluation file
- each pilot file contains the required pilot sections in the required order
- each evaluation file contains the required evaluation sections in the required order
- the ready collection spans at least 3 distinct civic or governance settings

## 12. File Ownership Guidance

This spec primarily governs:

- files under `docs/pilot/prompt-packs/`
- files under `docs/evaluation/prompt-packs/`
- future scenario additions that follow the same pack contract

## 13. Agent Execution Notes

Use this spec when adding or revising civic prompt packs.

Required task shape:

- preserve the pilot/evaluation pairing
- keep the scenario concrete and operational
- avoid generic civic language without a decision to make
- keep the pack legible to a reviewer who is not inside the implementation team
