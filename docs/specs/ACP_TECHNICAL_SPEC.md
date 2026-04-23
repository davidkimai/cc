# ACP Technical Specification

Status: Canonical draft  
Version: 0.3  
Date: 2026-04-23  
Owners: Philipp Rachle, Jason Tang, Elizabeth Yan, Amy Guo, Hayley Wu

## 1. Purpose

This document is the canonical technical specification for `Attention Coordination Protocol (ACP)`.

Its role is to translate the research proposal into an implementation-ready system definition that can drive:

- product scoping
- spec-driven development
- interface contracts
- skills package design
- prototype implementation
- pilot instrumentation
- operator workflows
- evaluation readiness

If the proposal and implementation artifacts diverge, this document is the source of truth unless superseded by a later version of this spec.

## 2. Product Definition

`Attention Coordination Protocol (ACP)` is a thin deliberation middleware layer for small-group sensemaking under cognitive load.

`Relay` is the first implementation of ACP.

ACP is the reusable coordination primitive. Relay is the validating reference implementation. Relay Blocks are the reusable operational units packaged over ACP.

The system replaces a broadcast-thread default with bounded discussion cycles in which:

- participants submit one considered contribution per cycle
- contributions are routed to a small number of recipients
- recipients receive compact digests rather than an open thread
- routing is explained in plain language
- reading burden is explicitly constrained
- operator traces support audit, export, and replay

The system is implemented as:

- a canonical protocol contract
- a participant-facing web application
- an operator-facing CLI and headless workflow layer
- a reusable Relay Blocks layer packaged as Agent Skills-compatible units
- a replaceable runtime substrate, initially OpenClaw

## 3. Core Thesis

The system operationalizes one core claim:

`Collective sensemaking under load can be improved by decomposing coordination into explicit protocol functions at the attention-allocation layer.`

The relevant protocol functions are:

- routing
- digest construction
- explanation
- overload control
- bridge exposure
- operator audit

The system is not an AI participant.
The system is an AI coordinator.

## 4. Goals

### 4.1 Primary goals

- Reduce perceived overload versus a chronological thread baseline.
- Improve usefulness of encountered perspectives.
- Improve reflective exchange quality.
- Make the coordination logic legible to participants and operators.
- Generate reproducible traces and exports for pilot evaluation.

### 4.2 Secondary goals

- Package the coordination layer as reusable Relay Blocks aligned with the Agent Skills ecosystem.
- Keep the substrate replaceable.
- Make the protocol portable across compatible agent runtimes over time.

### 4.3 Non-goals

- Building a mass social network
- Building a live chat product
- Building a full-stack agent runtime
- Building a generalized recommendation system
- Having AI generate user viewpoints
- Optimizing for engagement, posting volume, or time-on-site

## 5. System Boundaries

### 5.1 In scope

- bounded discussion cycles
- contribution submission
- contribution routing
- digest generation
- routing explanation
- pacing and overload controls
- bridge exposure heuristics
- operator launch / inspect / replay / export workflows
- pilot telemetry
- Relay Blocks layer

### 5.2 Out of scope

- public identity graph
- public feeds
- real-time chat
- community moderation systems beyond minimal pilot safety controls
- long-term federated infrastructure
- rich multi-tenant permissions systems
- autonomous agent-to-agent social network features

## 6. Primary Users

### 6.1 Participants

Members of a trusted group discussing a bounded prompt.

Participant needs:

- contribute once, clearly
- read only what is worth reading
- understand why items were shown
- respond or reflect without overload

### 6.2 Operators

Facilitators and researchers running cycles and analyzing results.

Operator needs:

- create and run cycles
- inspect routing outputs
- export telemetry
- replay and audit prior runs
- compare intervention and baseline conditions

## 7. Product Surfaces

## 7.1 Participant web app

The participant web app is the only participant-facing surface used in the pilot.

Capabilities:

- onboarding
- prompt reading
- one contribution per cycle
- optional confidence / evidence markers
- digest reading
- routing explanations
- respond / reflect / stop flow
- lightweight feedback capture

## 7.2 Operator CLI

The CLI is the operational and research surface around the same shared protocol core.

Capabilities:

- cycle creation
- participant import or assignment
- routing execution
- digest generation
- replay
- export
- scripted comparisons
- inspection and audit

## 7.3 Headless workflow layer

The headless layer exists for scripted runs, automation, and reproducibility.

Capabilities:

- invoke core cycle jobs without UI
- run baseline and intervention conditions
- produce structured outputs
- support repeatable analysis pipelines

## 8. Canonical Architecture

The system has 5 logical layers.

### 8.1 Protocol contract layer

Defines the canonical domain model and lifecycle.

Artifacts:

- cycle model
- contribution model
- digest model
- routing decision model
- explanation model
- audit event model
- telemetry event model

This layer is not a skill.
It is the source-of-truth contract.

### 8.2 Coordination engine layer

Implements the protocol functions:

- routing
- digest building
- explanation
- overload control
- bridge exposure
- audit trace generation

This layer may call models and rules.

### 8.3 Application layer

Implements participant and operator workflows on top of the coordination engine.

### 8.4 Skills suite layer

Packages reusable procedural knowledge and workflows as Agent Skills-compatible bundles.

This layer teaches compatible agents how to invoke the system and its workflows.
Protocol skills teach agents how to invoke the coordination engine; they are not themselves the coordination engine implementation.

### 8.5 Runtime substrate layer

Initial substrate: OpenClaw

The substrate supplies:

- agent runtime
- tool calling
- skill loading
- browser / exec / automation support

The substrate is implementation support, not the product itself.

## 9. Canonical Domain Model

The following objects are canonical.

## 9.1 Cycle

A bounded unit of discussion around one prompt.

Fields:

- `cycle_id`
- `condition`
- `prompt_id`
- `title`
- `prompt_text`
- `status`
- `submission_open_at`
- `submission_close_at`
- `digest_release_at`
- `reflection_close_at`
- `created_by`
- `created_at`
- `config`

Status enum:

- `draft`
- `scheduled`
- `submission_open`
- `submission_closed`
- `routing_complete`
- `digests_released`
- `reflection_closed`
- `archived`
- `failed`

## 9.2 Condition

Study condition for a cycle.

Enum:

- `intervention`
- `baseline_thread`

## 9.3 Participant

Fields:

- `participant_id`
- `display_name`
- `status`
- `profile_tags`
- `topic_interests`
- `consent_flags`
- `created_at`

## 9.4 Contribution

One participant submission for one cycle.

Fields:

- `contribution_id`
- `cycle_id`
- `participant_id`
- `body`
- `confidence_label` optional
- `evidence_text` optional
- `created_at`
- `submission_status`

Constraints:

- max one contribution per participant per cycle
- must be submitted during submission window

## 9.5 Routing Decision

Represents why a contribution was selected for a recipient.

Fields:

- `routing_decision_id`
- `cycle_id`
- `recipient_id`
- `contribution_id`
- `score`
- `factors`
- `bridge_flag`
- `load_cost`
- `explanation_basis`
- `created_at`

## 9.6 Digest

The briefing packet delivered to one participant for one cycle.

Fields:

- `digest_id`
- `cycle_id`
- `recipient_id`
- `items`
- `summary`
- `routing_explanations`
- `estimated_read_time`
- `created_at`
- `released_at`

### 9.6.1 Digest item

Fields:

- `contribution_id`
- `author_label`
- `body`
- `confidence_label` optional
- `evidence_text` optional
- `explanation_text`
- `bridge_flag`

## 9.7 Reflection / Response

Optional participant follow-up after digest receipt.

Fields:

- `response_id`
- `cycle_id`
- `participant_id`
- `parent_contribution_id` optional
- `body`
- `created_at`

## 9.8 Audit Event

Operator-facing trace event.

Fields:

- `event_id`
- `cycle_id`
- `event_type`
- `actor_type`
- `actor_id`
- `payload`
- `created_at`

## 9.9 Telemetry Event

Behavioral event for study measurement.

Fields:

- `event_id`
- `cycle_id`
- `participant_id`
- `event_type`
- `target_id` optional
- `metadata`
- `created_at`

## 10. Canonical Protocol Functions

The protocol is defined by 6 functions.

## 10.1 Routing

Purpose:

- determine which contributions are shown to which recipients

Inputs:

- cycle config
- participant set
- contribution set
- topic / similarity signals
- diversity heuristics
- load constraints

Outputs:

- routing decisions

Rules:

- each contribution is routed to a bounded number of recipients
- each recipient receives a bounded number of items
- routing should balance relevance and diversity
- routing should avoid over-concentrating attention on a few contributions

## 10.2 Digest construction

Purpose:

- turn routed contributions into a readable briefing packet

Rules:

- include source material
- use lightweight synthesis, not argument generation
- preserve disagreement
- estimate reading burden

## 10.3 Explanation

Purpose:

- explain in plain language why an item was shown

Rules:

- explanation must be human-legible
- explanation must reference routing logic categories, not hidden model internals
- explanation must not claim certainty where only heuristic relevance exists

## 10.4 Overload control

Purpose:

- constrain reading burden and pacing

Rules:

- one contribution per participant per cycle
- bounded digest size
- bounded estimated reading time
- no infinite thread expansion inside intervention condition

## 10.5 Bridge exposure

Purpose:

- surface some perspectives outside a participant’s obvious cluster without making the digest feel random

Rules:

- bridge items must remain relevant
- bridge items are additive, not dominant

## 10.6 Operator audit

Purpose:

- provide visibility into launches, routing outputs, errors, replay, and export

Rules:

- all major cycle state transitions must emit audit events
- routing runs must be replayable from stored state
- exports must support analysis without exposing unnecessary detail

## 11. Cycle State Machine

Canonical lifecycle:

1. `draft`
2. `scheduled`
3. `submission_open`
4. `submission_closed`
5. `routing_complete`
6. `digests_released`
7. `reflection_closed`
8. `archived`

Failure path:

- any state may transition to `failed` with an error record

Guardrails:

- routing cannot run until submission is closed
- digests cannot release until routing completes
- archive cannot occur before reflection closes unless force-closed by operator

## 12. Participant Workflow

Canonical participant flow:

1. Read prompt
2. Submit one considered contribution
3. Optionally attach confidence / evidence markers
4. Wait for digest release
5. Read digest
6. Read routing explanations
7. Optionally respond or reflect
8. Provide feedback

### 12.1 Participant constraints

- no open broadcast thread in intervention condition
- no multiple submissions per cycle
- no unrestricted browsing of all contributions during intervention condition

## 13. Operator Workflow

Canonical operator flow:

1. Create prompt
2. Create cycle
3. Assign participants
4. Open submission window
5. Close submission window
6. Trigger routing run
7. Inspect outputs
8. Release digests
9. Export telemetry
10. Replay or audit if needed
11. Close and archive cycle

## 14. Baseline Condition

The baseline condition must be implemented explicitly.

Behavior:

- uses the same `Cycle` object with `condition = baseline_thread`
- uses the same bounded cycle windows as the intervention condition
- uses the same one-primary-contribution-per-participant rule during the submission window
- reveals all submitted primary contributions in a standard chronological thread view during the reflection window
- allows reply activity during the reflection window
- uses no routing
- uses no digest compression
- uses no routing explanation

The baseline must still support:

- participation logging
- reply logging
- timing measures
- same participant feedback collection

Prompt strategy:

- the baseline and intervention must use the same prompt family
- for crossover operation, matched prompts are preferred over exact prompt reuse to reduce carryover effects while preserving topic comparability
- exact prompt reuse is allowed only if the team explicitly accepts the carryover risk for that cycle pair

## 15. Relay Blocks Architecture

Relay Blocks are the reusable product packaging layer, not the canonical protocol itself.

The suite should be organized into 4 package categories.

Mapping note:

- the six protocol functions in Section 10 are the normative coordination operations
- `deliberation-cycle` is an orchestration skill that sequences those functions and is not itself a protocol function
- `bridge exposure` remains a distinct protocol function in Section 10, but is packaged inside `epistemic-routing` because it is implemented as a routing heuristic rather than a standalone workflow

## 15.1 Protocol skills

These capture reusable social coordination workflows.

Recommended packages:

- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `operator-audit`

## 15.2 Surface and workflow skills

These teach agents how to operate product surfaces and research flows.

Recommended packages:

- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`

## 15.3 Runtime adapter skills

These capture runtime-specific packaging and invocation conventions.

Recommended packages:

- `relay-openclaw`
- `relay-hermes` later

## 15.4 Skill packaging rules

Each skill must:

- have valid `name` and `description`
- be one coherent unit of work
- use progressive disclosure
- keep `SKILL.md` concise
- move long material into `references/`
- move reusable logic into `scripts/`
- include explicit trigger wording in the description

Each skill must not:

- serve as canonical state storage
- duplicate full backend schemas
- hide critical protocol assumptions in unversioned prompt text

## 16. Initial Skills Package Definitions

These are the initial canonical skill package definitions for implementation.

## 16.1 `deliberation-cycle`

Purpose:

- run a full intervention cycle from creation through closure

Draft skill description:

- Use this skill when running or coordinating a full ACP intervention cycle from prompt setup through closure, especially when the task involves sequencing submission, routing, digest release, reflection, or feedback collection.

Responsibilities:

- describe cycle stages
- enforce sequencing
- call subordinate skills when needed

Non-goals:

- compute routing itself
- perform analysis

## 16.2 `epistemic-routing`

Purpose:

- determine recipient allocation for contributions

Draft skill description:

- Use this skill when contributions in a ACP cycle need to be routed to recipients using relevance, diversity, bridge-exposure, and load constraints, or when routing decisions need to be inspected or replayed.

Responsibilities:

- compute routing candidate sets
- apply relevance, diversity, and load constraints
- record routing decisions

May include:

- `scripts/score_routing.py`
- `references/routing-heuristics.md`

## 16.3 `digest-and-explanation`

Purpose:

- produce participant-ready digests and routing explanations

Draft skill description:

- Use this skill when routed contributions must be assembled into a participant digest with lightweight synthesis and clear plain-language explanations of why each item was shown.

Responsibilities:

- assemble digest items
- generate concise synthesis
- explain why each item was shown

## 16.4 `overload-governance`

Purpose:

- enforce bounded attention and pacing

Draft skill description:

- Use this skill when a ACP cycle needs reading-burden limits, pacing controls, attention caps, or checks that prevent the discussion from turning back into an overloaded feed.

Responsibilities:

- compute digest caps
- estimate reading time
- apply overload thresholds

## 16.5 `operator-audit`

Purpose:

- support operator inspection, replay, and failure analysis

Draft skill description:

- Use this skill when operators need to inspect cycle state, replay routing or digest runs, export traces, diagnose failures, or verify that a ACP cycle followed the protocol correctly.

Responsibilities:

- export traces
- explain state transitions
- support replay workflows

## 16.6 `participant-web-operator`

Purpose:

- teach an agent how to operate and validate the participant web app

Draft skill description:

- Use this skill when the ACP participant web surface must be exercised, validated, or documented through browser-based flows such as onboarding, submission, digest reading, routing explanation viewing, and feedback capture.

Responsibilities:

- browser-based flow testing
- prompt open / submit / digest read / feedback path checks

This skill should compose existing browser tools where available.

## 16.7 `research-cli-operator`

Purpose:

- teach an agent how to use the project CLI

Draft skill description:

- Use this skill when the ACP CLI must be used to create cycles, trigger routing, generate or inspect outputs, export telemetry, replay runs, or compare intervention and baseline conditions.

Responsibilities:

- create cycles
- run routing
- export telemetry
- replay runs
- compare intervention and baseline

## 16.8 `baseline-thread-runner`

Purpose:

- run and inspect the baseline condition with the same prompt family and telemetry conventions

Draft skill description:

- Use this skill when a chronological-thread baseline cycle must be created, run, inspected, or compared against the ACP intervention using the same prompt family and measurement conventions.

## 16.9 `pilot-analysis`

Purpose:

- compute study measures and produce standard pilot outputs

Draft skill description:

- Use this skill when ACP pilot data must be summarized into structural attention metrics, participant outcome summaries, operator reliability metrics, or a standard comparison readout across conditions.

Responsibilities:

- structural metrics
- participant outcome summaries
- operator reliability summaries

## 17. Data Storage Requirements

The implementation must persist:

- cycles
- participants
- contributions
- routing decisions
- digests
- responses
- audit events
- telemetry events

Minimum requirement:

- reproducible local persistence for pilot use

The storage technology is not fixed by this spec.
The data contract is fixed by this spec.

## 18. API Requirements

The prototype should expose internal interfaces around these operations:

- create cycle
- open cycle
- submit contribution
- close submissions
- run routing
- generate digests
- release digests
- submit feedback / reflection
- export telemetry
- replay cycle

An external public API is not required for fellowship scope.

## 19. Telemetry Specification

The pilot must log at least the following event classes.

Participant events:

- prompt_viewed
- contribution_started
- contribution_abandoned
- contribution_submitted
- digest_opened
- digest_item_opened
- bridge_item_engaged
- routing_explanation_viewed
- response_started
- response_submitted
- feedback_submitted

Operator events:

- cycle_created
- cycle_opened
- submissions_closed
- routing_started
- routing_job_failed
- routing_completed
- digest_generated
- digests_released
- export_generated
- replay_started
- replay_completed
- cycle_archived
- cycle_failed

## 20. Metrics Definitions

## 20.1 Exposure concentration

Definition:

- inequality of contribution views across contributions in a cycle

Implementation:

- compute view counts per contribution
- primary measure: Gini coefficient across contribution view counts within a cycle
- secondary diagnostic: top-20-percent share of total views

## 20.2 Reply concentration

Definition:

- inequality of replies across contributions in a cycle

Implementation:

- primary measure: Gini coefficient across reply counts within a cycle
- secondary diagnostic: top-20-percent share of total replies

## 20.3 Contributor coverage

Definition:

- number of distinct authors surfaced within one recipient digest

Implementation:

- compute distinct author count per recipient digest
- aggregate at cycle level using mean, median, and distribution

## 20.4 Bridge exposure

Definition:

- extent to which participants receive relevant but non-obvious perspectives

Implementation:

- primary measure: share of digest items with `bridge_flag = true` for each recipient digest
- cycle-level summary: mean bridge-item share across recipients
- engagement diagnostic: fraction of bridge-flagged items that are opened, replied to, or explicitly marked useful

## 20.5 Perceived overload

Definition:

- participant-reported burden after using the system

Implementation:

- measured via a post-cycle feedback instrument
- v1 instrument details remain an open decision tracked in Section 25

## 20.6 Exchange quality

Definition:

- participant-reported usefulness and reflectiveness of the discussion

Implementation:

- measured via a post-cycle feedback instrument
- v1 instrument details remain an open decision tracked in Section 25

## 21. UX and Interaction Constraints

The intervention must preserve the following properties:

- the loop should be understandable within roughly 30 seconds of first exposure
- the participant reads a digest, not a feed
- each digest is bounded
- routing explanations are visible
- source material remains available
- the interface never suggests that AI authored the participant’s viewpoint

Design note:

- the 30-second criterion is a design principle for onboarding simplicity and must later be translated into a usability test criterion in the web app spec

## 22. Safety and Governance Constraints

- Participation must be opt-in.
- Telemetry consent must be explicit.
- Exports should minimize unnecessary personal detail.
- Operator traces must support accountability without overexposing participant data.
- The system must not generate user viewpoints.
- The system must not optimize for engagement as a primary objective.

## 23. Implementation Strategy

Implementation should proceed in 4 phases.

## 23.1 Phase 1: Protocol and skeleton

Deliverables:

- canonical protocol contract
- basic data model
- cycle state machine
- web and CLI skeletons
- initial skills repository scaffold

## 23.2 Phase 2: Core intervention

Deliverables:

- participant contribution flow
- routing implementation
- digest generation
- explanation generation
- overload controls

## 23.3 Phase 3: Operator and study readiness

Deliverables:

- CLI launch / inspect / replay / export flows
- baseline implementation
- telemetry logging
- pilot metrics

## 23.4 Phase 4: Packaging and pilot

Deliverables:

- initial Agent Skills-compatible suite
- OpenClaw packaging
- pilot deployment
- pilot report scaffolding

## 24. Acceptance Criteria

The prototype is considered implementation-complete for fellowship scope when:

- participants can complete one full intervention cycle end to end
- operators can create, run, inspect, and export a cycle without manual patchwork
- intervention and baseline conditions both run
- routing explanations are visible in the participant surface
- telemetry required for primary measures is captured
- replay is possible for at least one completed cycle
- the Relay Blocks layer exists in initial package form
- the implementation remains thin-layer and does not collapse into substrate work

## 25. Open Questions

These remain unresolved and must be closed during implementation planning.

- What exact heuristic mix will routing use in v1?
- What is the digest size cap?
- What exact feedback instrument will measure overload and exchange quality?
- What storage layer will be used for pilot persistence?
- What level of participant identity / pseudonymization is appropriate?
- How much of the routing trace is visible to operators versus internal only?
- How far will interoperability beyond OpenClaw be tested within fellowship scope?

## 25.1 Decision Queue

| Question | Owner | Decision needed before | Status |
|---|---|---|---|
| What exact heuristic mix will routing use in v1? | Philipp, Jason | `epistemic-routing` implementation | Open |
| What is the digest size cap? | Philipp, Amy | participant web app implementation | Open |
| What exact feedback instrument will measure overload and exchange quality? | Jason, Amy | telemetry and feedback implementation | Open |
| What storage layer will be used for pilot persistence? | Elizabeth | backend implementation | Open |
| What level of participant identity / pseudonymization is appropriate? | Hayley, Jason | pilot deployment | Open |
| How much of the routing trace is visible to operators versus internal only? | Philipp, Hayley | `operator-audit` implementation | Open |
| How far will interoperability beyond OpenClaw be tested within fellowship scope? | Philipp, Elizabeth | runtime adapter packaging | Open |

## 26. Change Control

Changes to this document must:

- update the version
- preserve a short decision log
- identify whether the change affects protocol, implementation, study design, or packaging

Suggested change classes:

- `protocol-breaking`
- `implementation-detail`
- `study-design`
- `skills-packaging`
- `clarification-only`

## 27. Immediate Next Specs

This canonical technical spec should drive the next layer of spec documents:

1. Protocol Contract Spec
- precise field definitions
- schemas
- state transitions

2. Telemetry and Evaluation Spec
- event schema
- metrics formulas
- export format

3. Relay Blocks Spec
- package list
- per-skill descriptions
- `SKILL.md` structure
- scripts and references layout

4. Product Requirements Spec
- participant flows
- operator flows
- acceptance criteria by surface

5. Web App Spec
- routes
- UI states
- interaction rules

6. CLI Spec
- commands
- outputs
- replay and export flows

## 27.1 Rationale for ordering

The Protocol Contract Spec comes first because all product flows, skills packages, telemetry events, and operator workflows depend on the canonical domain model and state transitions defined there.

## 28. Canonical Summary

`ACP` is a thin deliberation middleware system for improving collective sensemaking under cognitive load.

Its product truth is:

- one protocol contract
- two surfaces
- six protocol functions
- one baseline condition
- one reusable Relay Blocks layer
- one replaceable runtime substrate

Everything else is implementation detail.

## 29. Change Log

- `v0.2` (2026-04-22)
  - clarified mapping between protocol functions and skills packages
  - specified baseline condition and prompt strategy more concretely
  - committed primary metric formulas and clarified bridge exposure and contributor coverage
  - added canonical draft trigger descriptions for each initial skill package
  - expanded telemetry events for abandonment, bridge engagement, digest generation, and routing failure
  - clarified coordination engine versus Relay Blocks boundary
  - reordered child specs to put the protocol contract first
  - added a decision queue for unresolved implementation questions
