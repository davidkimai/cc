# ACP Protocol Contract Spec

Status: Child spec derived from canonical technical spec  
Parent: `ACP_TECHNICAL_SPEC.md` v0.3  
Version: 0.3  
Date: 2026-04-23

## 1. Purpose

This document defines the canonical protocol contract for `Attention Coordination Protocol (ACP)`.

Its role is to specify:

- domain objects
- required fields
- enums
- invariants
- state transitions
- core operations
- failure semantics

This spec is the contract that all other implementation layers must follow:

- participant web app
- operator CLI
- headless jobs
- telemetry pipeline
- Relay Blocks layer

## 2. Normative Rules

- The protocol contract is the source of truth for data semantics.
- Product surfaces may present, omit, or group fields differently, but may not redefine their meaning.
- Skills may describe workflows over the protocol, but may not replace the protocol definitions.
- The initial runtime substrate may constrain implementation detail, but may not redefine the contract.

## 3. Global Concepts

## 3.1 Condition

Enum:

- `intervention`
- `baseline_thread`

## 3.2 Cycle status

Enum:

- `draft`
- `scheduled`
- `submission_open`
- `submission_closed`
- `routing_complete`
- `digests_released`
- `reflection_closed`
- `archived`
- `failed`

## 3.3 Timestamps

All timestamp fields:

- must be stored in a machine-readable datetime format
- must be comparable
- must be preserved exactly in exports

## 4. Canonical Objects

## 4.1 Cycle

Definition:

A bounded unit of discussion around one prompt under one study condition.

Required fields:

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

Constraints:

- `cycle_id` must be unique
- `condition` must be a valid `Condition`
- `status` must be a valid cycle status
- `submission_open_at < submission_close_at`
- `submission_close_at <= digest_release_at`
- `digest_release_at <= reflection_close_at`

Notes:

- Both intervention and baseline use the same Cycle object.
- Differences between conditions are expressed through `condition` and execution behavior, not separate cycle models.

## 4.2 Participant

Definition:

A user enrolled in one or more cycles.

Required fields:

- `participant_id`
- `display_name`
- `status`
- `consent_flags`
- `created_at`

Optional fields:

- `profile_tags`
- `topic_interests`

Constraints:

- `participant_id` must be unique
- `consent_flags` must support explicit telemetry opt-in state

## 4.3 Contribution

Definition:

One primary participant submission for one cycle.

Required fields:

- `contribution_id`
- `cycle_id`
- `participant_id`
- `body`
- `created_at`
- `submission_status`

Optional fields:

- `confidence_label`
- `evidence_text`

Constraints:

- `contribution_id` must be unique
- one participant may submit at most one primary contribution per cycle
- contribution submission must occur during the submission window
- empty bodies are invalid

## 4.4 RoutingDecision

Definition:

A record that one contribution was selected for one recipient with specific reasons.

Required fields:

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

Constraints:

- `routing_decision_id` must be unique
- one `(cycle_id, recipient_id, contribution_id)` combination must not appear more than once per routing run
- `bridge_flag` is boolean
- `score` and `load_cost` must be machine-comparable

Notes:

- `bridge_flag = true` means the item was intentionally included as a bridge-perspective item under the routing heuristic

## 4.5 Digest

Definition:

A participant-specific briefing packet for one cycle.

Required fields:

- `digest_id`
- `cycle_id`
- `recipient_id`
- `items`
- `summary`
- `routing_explanations`
- `estimated_read_time`
- `created_at`
- `released_at`

Constraints:

- `digest_id` must be unique
- one recipient should receive at most one digest per cycle per release
- `estimated_read_time` must be computed and stored
- each digest item must reference a routed contribution

## 4.6 DigestItem

Definition:

A contribution entry inside a digest.

Required fields:

- `contribution_id`
- `author_label`
- `body`
- `explanation_text`
- `bridge_flag`

Optional fields:

- `confidence_label`
- `evidence_text`

Constraints:

- `bridge_flag` must match the underlying routing decision for that contribution-recipient pair

## 4.7 Response

Definition:

An optional follow-up message after digest release.

Required fields:

- `response_id`
- `cycle_id`
- `participant_id`
- `body`
- `created_at`

Optional fields:

- `parent_contribution_id`

Constraints:

- responses may only be submitted during the reflection window

## 4.8 AuditEvent

Definition:

An operator-facing event trace for lifecycle, execution, and failure analysis.

Required fields:

- `event_id`
- `cycle_id`
- `event_type`
- `actor_type`
- `actor_id`
- `payload`
- `created_at`

Constraints:

- `event_id` must be unique
- event ordering must be reconstructible from timestamps and identifiers

## 4.9 TelemetryEvent

Definition:

A behavioral event used for study instrumentation.

Required fields:

- `event_id`
- `cycle_id`
- `participant_id`
- `event_type`
- `metadata`
- `created_at`

Optional fields:

- `target_id`

Constraints:

- `event_id` must be unique
- `event_type` must be from an allowed event vocabulary

## 5. Cross-Object Invariants

- A `Contribution` must reference an existing `Cycle` and `Participant`.
- A `RoutingDecision` must reference an existing `Cycle`, recipient participant, and contribution.
- A `Digest` must reference an existing `Cycle` and recipient participant.
- A `DigestItem` must correspond to a routed contribution for that digest recipient.
- A `Response` must reference an existing `Cycle` and participant.
- Audit and telemetry events must reference existing cycles.

## 6. Condition Semantics

## 6.1 Intervention condition

The intervention condition uses:

- bounded contribution submission
- routed contribution allocation
- digest delivery
- routing explanations
- overload controls
- bridge exposure heuristics

Not allowed:

- unrestricted open thread browsing during the intervention flow

## 6.2 Baseline condition

The baseline condition uses:

- the same Cycle object
- the same bounded submission and reflection windows
- the same one-primary-contribution-per-participant submission rule
- chronological thread display during the reflection window
- no routing
- no digest compression
- no routing explanation

Allowed:

- reply activity during the reflection window

## 7. Core Operations

The following operations are canonical and must exist in some implementation form.

## 7.1 CreateCycle

Inputs:

- condition
- prompt
- schedule values
- config

Output:

- `Cycle`

Preconditions:

- valid schedule

Postconditions:

- cycle exists in `draft` or `scheduled`

## 7.2 OpenCycle

Inputs:

- `cycle_id`

Preconditions:

- cycle exists
- current state is `scheduled`

Postconditions:

- cycle state becomes `submission_open`

## 7.3 SubmitContribution

Inputs:

- `cycle_id`
- `participant_id`
- `body`
- optional confidence / evidence

Preconditions:

- cycle is `submission_open`
- participant is eligible
- participant has not already submitted a primary contribution

Postconditions:

- contribution is persisted

## 7.4 CloseSubmissions

Inputs:

- `cycle_id`

Preconditions:

- cycle is `submission_open`

Postconditions:

- cycle state becomes `submission_closed`

## 7.5 RunRouting

Inputs:

- `cycle_id`

Preconditions:

- cycle is `submission_closed`
- condition is `intervention`

Postconditions:

- routing decisions are created
- cycle state becomes `routing_complete`

Failure semantics:

- on failure, emit audit event
- cycle may remain `submission_closed` or move to `failed` depending on implementation policy, but failure must be explicit

## 7.6 GenerateDigests

Inputs:

- `cycle_id`

Preconditions:

- cycle is `routing_complete`
- condition is `intervention`

Postconditions:

- participant digests are created
- `digest_generated` operator event is emitted

## 7.7 ReleaseDigests

Inputs:

- `cycle_id`

Preconditions:

- digests exist for intervention condition, or baseline thread is ready for release

Postconditions:

- cycle state becomes `digests_released`

## 7.8 SubmitResponse

Inputs:

- `cycle_id`
- `participant_id`
- `body`
- optional parent

Preconditions:

- cycle is `digests_released`
- current time is within reflection window

Postconditions:

- response is persisted

## 7.9 CloseReflection

Inputs:

- `cycle_id`

Preconditions:

- cycle is `digests_released`

Postconditions:

- cycle state becomes `reflection_closed`

## 7.10 ArchiveCycle

Inputs:

- `cycle_id`

Preconditions:

- cycle is `reflection_closed`, or force-close policy is invoked

Postconditions:

- cycle state becomes `archived`

## 7.11 ExportCycleData

Inputs:

- `cycle_id`
- export mode

Output:

- structured export payload or file

Constraints:

- must preserve canonical identifiers
- must preserve event timestamps
- must minimize unnecessary participant detail

## 7.12 ReplayCycle

Inputs:

- `cycle_id`

Preconditions:

- sufficient persisted state exists

Output:

- replay report

Constraints:

- replay must make explicit whether it is exact, partial, or diagnostic-only

## 8. State Machine

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

- any state may transition to `failed`

## 8.1 Guardrails

- routing cannot run until submissions are closed
- digests cannot release until routing completes in intervention condition
- archive cannot occur before reflection closes unless force-close policy is used

## 9. Condition-Specific Execution

## 9.1 Intervention

Execution path:

- create cycle
- open submissions
- accept one contribution per participant
- close submissions
- run routing
- generate digests
- release digests
- accept responses
- close reflection
- archive

## 9.2 Baseline

Execution path:

- create cycle
- open submissions
- accept one contribution per participant
- close submissions
- prepare chronological thread
- release thread
- accept replies
- close reflection
- archive

Differences from intervention:

- no routing
- no digest generation
- no explanation generation

## 10. Event Vocabulary

## 10.1 Participant telemetry events

- `prompt_viewed`
- `contribution_started`
- `contribution_abandoned`
- `contribution_submitted`
- `digest_opened`
- `digest_item_opened`
- `bridge_item_engaged`
- `routing_explanation_viewed`
- `response_started`
- `response_submitted`
- `feedback_submitted`

## 10.2 Operator events

- `cycle_created`
- `cycle_opened`
- `submissions_closed`
- `routing_started`
- `routing_job_failed`
- `routing_completed`
- `digest_generated`
- `digests_released`
- `export_generated`
- `replay_started`
- `replay_completed`
- `cycle_archived`
- `cycle_failed`

## 11. Failure Semantics

Failures must be explicit.

At minimum:

- routing failure must emit `routing_job_failed`
- full cycle failure must emit `cycle_failed`
- replay failure must return a structured failure reason
- partial outputs must never be silently treated as success

## 12. Open Decisions Carried From Parent Spec

- exact routing heuristic mix
- digest size cap
- feedback instrument details
- storage backend choice
- participant pseudonymization level
- operator trace visibility policy

## 13. Acceptance Criteria For This Spec

The protocol contract is ready to drive implementation when:

- every object above has a concrete schema representation
- every canonical operation has a defined interface boundary
- state transitions are enforced consistently
- both conditions use the same underlying Cycle model
- telemetry and operator event vocabularies are fixed for v1
- downstream product and skills specs can reference this document without redefining domain terms
