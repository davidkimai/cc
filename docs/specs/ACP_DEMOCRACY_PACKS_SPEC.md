# ACP Democracy Pack Spec

Status: Finalized Phase 5 democracy-pack spec  
Parent specs:

- `ACP_PILOT_OPERATIONS_SPEC.md` v0.1
- `ACP_EVALUATION_INSTRUMENT_SPEC.md` v0.1
- `ACP_PROMPT_PACK_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the required shape and quality bar for ACP democracy packs used in civic and governance demos, pilots, and evaluation cycles.

Democracy packs are a reusable layer above prompt packs. A prompt pack is a single concrete scenario. A democracy pack captures the repeatable civic decision pattern underneath that scenario so ACP can be reused across similar cases without rewriting the coordination logic from scratch.

## 2. What a Democracy Pack Is

A valid democracy pack:

- centers one democratic coordination problem such as routing public input, triaging agenda items, or reconciling competing civic interests
- keeps the decision frame stable while allowing scenario inputs to change
- makes the public-facing accountability requirement explicit
- can seed multiple prompt-pack style executions without changing the core governance pattern

Democracy packs are not:

- generic brainstorming templates
- partisan advocacy artifacts
- legal memos
- runtime configuration files

## 3. Normative Scope

This spec governs:

- democracy-pack file structure
- civic scenario design for reusable governance patterns
- pilot and evaluation pairing
- minimum CORDA legibility requirements

This spec does not govern:

- runtime orchestration
- telemetry schema
- participant recruitment
- legal review
- production policy content

## 4. Required Pack Set

Each democracy-pack scenario must exist in two forms:

- a pilot pack in `docs/pilot/democracy-packs/`
- an evaluation pack in `docs/evaluation/democracy-packs/`

The two files must share the same basename.

Each democracy pack may optionally cite one or more prompt packs as examples of downstream executions, but the democracy pack itself is the reusable contract.

## 5. Required Front Matter

Every democracy pack must begin with YAML front matter containing:

- `id`
- `title`
- `version`
- `status`
- `pack_type`
- `domain`
- `decision_archetype`
- `audience`
- `primary_use`
- `timebox_minutes`
- `reusable_knobs`
- `linked_companion`

Pack identifiers must be stable, kebab-cased, and specific to the governance pattern.

## 6. Required Pilot Pack Sections

Every pilot pack must include these sections in this order:

- Scenario
- Democratic function
- Civic context
- Reusable knobs
- Roles and inputs
- Prompt
- Output requirements
- Quality bar
- Operator notes
- CORDA legibility notes

## 7. Required Evaluation Pack Sections

Every evaluation pack must include these sections in this order:

- Scenario recap
- Democratic function under test
- Evaluation goal
- Evidence to capture
- Scoring rubric
- Failure modes
- CORDA legibility checks

## 8. Scenario Design Rules

A valid democracy pack must:

- center one concrete civic or governance decision
- include a real tradeoff, not an abstract discussion
- identify who is speaking, who is deciding, and who is affected
- define the time horizon or decision deadline
- state the operational constraints that matter
- be runnable without inventing missing context during the cycle
- preserve the same decision pattern across plausible civic variations

Scenario prompts must not:

- depend on unstated legal facts
- require fabricated data to feel complete
- drift into partisan advocacy
- use generic "discuss the issue" phrasing
- hide the decision behind broad thematic language

## 9. Reusability Rules

Each democracy pack should expose the knobs that can change without breaking the pattern.

Examples of reusable knobs:

- budget amount
- number of comments or speakers
- deadline or agenda lock time
- list of stakeholders
- policy alternatives
- operational capacity constraints

The pack is reusable only if the change in knobs does not require a new decision archetype.

## 10. Output Expectations

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
- whether the same pattern can be reused in a later civic cycle

## 11. Quality Bar

A pack is usable only if it meets all of the following:

- the scenario is specific enough to run in a real demo cycle
- the prompt can be executed in a 10 to 15 minute session without improvising the premise
- the scenario is serious enough for civic stakeholders to recognize
- the task reveals why ACP exists, not just what ACP outputs
- the language is neutral, concrete, and professionally legible
- the evaluation path is clear enough to compare cycles later
- the reuse boundary is obvious enough for an operator to adapt the pack safely

## 12. CORDA Legibility Rule

Every pack must help a CORDA reviewer answer three questions quickly:

- what civic problem is being coordinated
- what attention or routing ACP changes
- what a successful release would look like

If a reviewer cannot infer those answers from the pack alone, the pack is too vague.

## 13. Acceptance Criteria

The democracy-pack workstream is accepted when all requirements below pass.

| Requirement | Acceptance test |
|---|---|
| Minimum pack count | At least three democracy packs exist in both `docs/pilot/democracy-packs/` and `docs/evaluation/democracy-packs/` |
| Pilot/evaluation pairing | Pilot and evaluation directories contain matching basenames |
| Stable metadata | Every pack has required front matter and `status: ready` |
| Civic specificity | Every pilot pack names a concrete civic decision, affected roles, constraints, and output requirements |
| Evaluation path | Every evaluation pack names evidence to capture, scoring rubric, failure modes, and CORDA legibility checks |
| Reusable pattern | Every pilot pack exposes reusable knobs that can change without changing the decision archetype |
| ACP value proposition | Every pack demonstrates attention routing, bridge exposure, overload reduction, or release legibility rather than generic discussion |

Mechanical requirements:

- packs are Markdown files, not runtime configs
- packs require no network access or live model calls to inspect
- current pack set spans at least three civic or governance settings

## 14. File Ownership Guidance

This spec primarily governs:

- files under `docs/pilot/democracy-packs/`
- files under `docs/evaluation/democracy-packs/`
- future scenario additions that follow the same pack contract

## 15. Agent Execution Notes

Use this spec when adding or revising civic democracy packs.

Required task shape:

- preserve the pilot/evaluation pairing
- keep the scenario concrete and operational
- avoid generic civic language without a decision to make
- keep the pack legible to a reviewer who is not inside the implementation team
