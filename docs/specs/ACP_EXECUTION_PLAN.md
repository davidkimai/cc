# ACP Execution Plan

Status: draft v0.1  
Owner: ACP core team  
Scope: protocol-first execution from current state to pilot-grade ACP, with Relay as the first implementation and Relay Blocks as the operational layer.

## 1. Purpose

This document is the execution control plane for ACP.

It translates the existing parent and implementation specs into a small number of concrete phases, workstreams, milestones, and agent assignments. It exists to prevent local reinterpretation during implementation.

Use this document when deciding:
- what to build next
- which agent owns what
- what counts as done for each phase
- which new specs are worth drafting
- which work should be rejected as scope drift

This document does not redefine ACP. The normative source of truth remains:
- `ACP_PROTOCOL_CONTRACT_SPEC.md`
- `ACP_TECHNICAL_SPEC.md`
- `ACP_TELEMETRY_EVALUATION_SPEC.md`
- `RELAY_BLOCKS_SPEC.md`
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md`

## 2. Strategic framing

ACP is the primary object.

Relay is the first reference implementation of ACP.

Relay Blocks are reusable operational units that help implement and operate ACP workflows.

The project should expand outward from the protocol, not sideways into generic app features.

## 3. Current state

Current state is strong enough to be taken seriously.

The repo already has:
- ACP-first canonical specs in `docs/specs/`
- Relay web app, HTTP API, CLI, persistence layer, routing/digest pipeline, exports, telemetry, and tests
- pilot and evaluation docs in `docs/pilot/` and `docs/evaluation/`
- Relay Blocks with real helper scripts
- CI for build, typecheck, and tests

The main remaining gap is not architecture. It is evidence, demoability, conformance, and pilot hardening.

## 4. Delivery principle

Prioritize in this order:
1. make ACP legible
2. make Relay demoable
3. make pilot operation reliable
4. make ACP conformable and replayable
5. make Relay Blocks reusable
6. prove ACP can outlive Relay

## 5. Phase model

## Phase 1. Demoable ACP

Goal:
Make the current implementation easy to run, easy to understand, and easy to show.

Required outputs:
- seeded demo cycles
- sample civic prompt pack
- one-command operator bootstrap
- polished export artifacts
- updated screenshots and sample outputs

Done when:
- a fresh operator can run a demo end to end in under 15 minutes
- the repo contains at least 3 seeded cycles
- exports are presentation-quality without manual cleanup

## Phase 2. Pilot-ready Relay

Goal:
Make Relay credible for a trusted small-group pilot.

Required outputs:
- onboarding and operator run flow tightened to match pilot docs
- participant identity and session handling strengthened enough for real pilot use
- failure recovery path exercised
- data handling path aligned to evaluation docs

Done when:
- an operator can run a full cycle using only the runbooks and product surfaces
- pilot data artifacts can be exported and reviewed without manual patchwork
- the baseline and intervention conditions remain comparable

## Phase 3. ACP conformance layer

Goal:
Turn ACP from a strong implementation into a real protocol effort.

Required outputs:
- ACP versioning rules
- schema bundle for canonical objects
- conformance checks
- replay fixtures and golden outputs
- compatibility notes for implementations and adapters

Done when:
- ACP behavior can be validated against fixtures
- changes to Relay can be checked for protocol regressions
- ACP can be described independently of Relay UI details

## Phase 4. Relay Blocks maturity

Goal:
Make Relay Blocks operationally useful rather than merely descriptive.

Required outputs:
- executable scripts for core blocks
- references for block operators
- block composition examples
- runtime adapter hardening

Done when:
- core operator workflows can be run through block helpers
- blocks reduce operator effort in practice
- at least one runtime adapter path is documented and validated

## Phase 5. Ecosystem proof

Goal:
Show that ACP is more than a single app.

Required outputs:
- second ACP-compatible surface, adapter, or runner
- democracy scenario packs
- public-facing protocol docs and examples

Done when:
- ACP has at least one proof surface beyond the main Relay flow
- democracy-specific scenarios are first-class examples, not just generic prompts

## 6. Workstreams

Use these workstreams for parallel agent execution.

## Workstream A. Protocol and conformance

Mission:
Stabilize ACP as a protocol with schema, fixtures, replay, and validation.

Owns:
- versioning
- schemas
- conformance tests
- replay fixtures
- compatibility notes

Primary outputs:
- `ACP_VERSIONING_SPEC.md`
- `ACP_SCHEMA_SPEC.md`
- `ACP_CONFORMANCE_SPEC.md`
- `ACP_REPLAY_FIXTURE_SPEC.md`
- `ACP_COMPATIBILITY_SPEC.md`

Write scope:
- `docs/specs/`
- protocol schemas
- replay fixtures
- conformance scripts/tests

## Workstream B. Relay product quality

Mission:
Make Relay demoable and pilot-usable.

Owns:
- web UX polish tied to spec
- operator flow polish
- sample/demo content loading
- export/report presentation quality
- bootstrap scripts

Primary outputs:
- `RELAY_DEMO_DATA_SPEC.md`
- `RELAY_EXPORT_REPORT_SPEC.md`
- implementation changes in `src/`, `public/`, and bootstrap scripts

Write scope:
- `src/`
- `public/`
- `docs/deployment/`
- demo seed data
- export/report templates

## Workstream C. Pilot operations and evidence

Mission:
Make ACP pilot-ready as a fellowship artifact.

Owns:
- civic prompt packs
- scenario packs
- data handling
- evaluation packaging
- internal pilot evidence bundle

Primary outputs:
- `ACP_PROMPT_PACK_SPEC.md`
- `ACP_PILOT_DATA_HANDLING_SPEC.md`
- `ACP_DEMOCRACY_PACKS_SPEC.md`

Write scope:
- `docs/pilot/`
- `docs/evaluation/`
- scenario templates
- sample prompts
- example evidence artifacts

## Workstream D. Relay Blocks maturity

Mission:
Make Relay Blocks reusable operational units.

Owns:
- block packaging
- block composition
- helper scripts
- runtime adapter hardening

Primary outputs:
- `RELAY_BLOCKS_PACKAGING_SPEC.md`
- `RELAY_BLOCKS_COMPOSITION_SPEC.md`

Write scope:
- `skills/`
- block references
- block scripts
- adapter validation helpers

## Workstream E. Integration and release

Mission:
Keep all workstreams aligned and releasable.

Owns:
- branch integration rules
- release gates
- build/test discipline
- repo vs spec audits

Primary outputs:
- release readiness checks
- integration audit notes
- milestone signoff

Write scope:
- CI
- release docs
- integration tests
- root docs where needed

## 7. Agent assignment model

Assign agents by workstream, not by vague feature area.

Recommended specialist assignment:
- Agent 1: Protocol and conformance
- Agent 2: Relay product quality
- Agent 3: Pilot operations and evidence
- Agent 4: Relay Blocks maturity
- Main orchestrator: integration and release

Rules:
- each agent gets one workstream at a time
- each agent receives the relevant parent specs plus one child spec
- each agent owns a disjoint write scope
- agents may not redefine ACP locally
- when a spec conflict appears, stop and escalate back into `docs/specs/`

## 8. Milestones

## Milestone M1. Strong demo baseline

Includes:
- seeded cycles
- operator bootstrap
- sample civic prompts
- polished exports

Success signal:
- ACP can be demoed cleanly without explanation-heavy setup

## Milestone M2. Pilot readiness

Includes:
- stable operator run path
- stronger participant flow
- pilot evidence artifacts
- data handling path

Success signal:
- trusted-group pilot can run with current tooling and docs

## Milestone M3. Protocol legitimacy

Includes:
- ACP versioning
- schemas
- conformance checks
- replay fixtures

Success signal:
- ACP can be validated independently of Relay UI behavior

## Milestone M4. Ecosystem legitimacy

Includes:
- mature Relay Blocks
- second proof surface or adapter
- democracy packs

Success signal:
- ACP reads as a reusable coordination primitive, not a one-off app

## 9. Exact next specs to draft first

Do not draft everything at once.

Draft next in this order:
1. `RELAY_DEMO_DATA_SPEC.md`
2. `ACP_PROMPT_PACK_SPEC.md`
3. `RELAY_EXPORT_REPORT_SPEC.md`
4. `ACP_VERSIONING_SPEC.md`
5. `ACP_SCHEMA_SPEC.md`
6. `ACP_CONFORMANCE_SPEC.md`
7. `ACP_REPLAY_FIXTURE_SPEC.md`
8. `ACP_PILOT_DATA_HANDLING_SPEC.md`
9. `RELAY_BLOCKS_PACKAGING_SPEC.md`
10. `RELAY_BLOCKS_COMPOSITION_SPEC.md`
11. `ACP_DEMOCRACY_PACKS_SPEC.md`
12. `ACP_COMPATIBILITY_SPEC.md`

Reason for this order:
- first make the project easier to show
- then make the project easier to pilot
- then make the protocol harder to misinterpret
- then make the block layer and ecosystem credible

## 10. Scope guardrails

Reject work that does any of the following:
- expands Relay into a generic social platform
- adds broad chat-platform features unrelated to ACP
- introduces a marketplace before conformance exists
- creates new naming layers that compete with ACP, Relay, or Relay Blocks
- adds major implementation surfaces without protocol or product-spec grounding

## 11. Review and audit rule

At the end of each phase, perform a repo vs spec audit.

Audit questions:
- does the repo still match ACP-first framing?
- does Relay still implement ACP rather than drift from it?
- do Relay Blocks remain operational helpers rather than truth sources?
- are new features tied to a spec?
- does the evidence layer exist in the repo, not just in aspiration?

## 12. Deliverable standard

The project is successful when it can honestly be described as:

`ACP is a reusable democratic coordination primitive, validated through Relay as a serious reference implementation and operationalized through Relay Blocks.`
