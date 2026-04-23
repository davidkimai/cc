# ACP Telemetry and Evaluation Spec

Status: Child spec derived from canonical technical spec  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3

Version: 0.3  
Date: 2026-04-23

## 1. Purpose

This document defines the telemetry, measurement, export, and evaluation contract for `Attention Coordination Protocol (ACP)`.

Its role is to specify:

- event vocabularies
- event payload schemas
- instrumentation rules
- metric formulas
- export formats
- analysis outputs
- failure handling for incomplete telemetry
- acceptance criteria for pilot readiness

This spec is authoritative for all telemetry and evaluation behavior in:

- intervention cycles
- baseline cycles
- participant surface instrumentation
- operator workflows
- analysis pipelines

## 2. Normative Scope

- The canonical domain terms come from the parent specs and must not be renamed here.
- Event names defined here are normative for v1.
- Metrics defined here are normative for v1.
- Product surfaces may emit additional debug events, but not instead of the required events.
- If telemetry is incomplete, the system must preserve partial data and annotate missingness rather than silently discarding the affected run.

## 3. Telemetry Principles

- Instrument behavior, not inferred psychology.
- Keep event names stable and payloads small.
- Preserve enough detail for replay-grade analysis without exposing unnecessary participant detail.
- Use the same measurement conventions across intervention and baseline wherever possible.
- Prefer explicit event emission over reconstructing behavior from logs later.

## 4. Event Model

Every telemetry event must include:

- `event_id`
- `cycle_id`
- `participant_id` when participant-scoped
- `event_type`
- `created_at`
- `metadata`

Optional:

- `target_id`

### 4.1 Common event fields

#### `event_id`

- unique identifier
- immutable

#### `cycle_id`

- foreign key to `Cycle`

#### `participant_id`

- required for participant-scoped telemetry
- omitted or null for pure operator events when stored in a shared pipeline

#### `event_type`

- must match one of the allowed event names in this spec

#### `created_at`

- machine-readable timestamp

#### `target_id`

- identifier for the entity acted on
- examples:
  - contribution id
  - digest id
  - digest item contribution id
  - response id

#### `metadata`

- structured object
- must contain only event-specific fields defined below

## 5. Required Participant Events

### 5.1 `prompt_viewed`

Emitted when a participant opens the cycle prompt.

Metadata:

- `condition`
- `surface` = `web`

### 5.2 `contribution_started`

Emitted when a participant begins composing a contribution.

Metadata:

- `condition`

### 5.3 `contribution_abandoned`

Emitted when contribution composition is initiated but not submitted before exit or timeout.

Metadata:

- `condition`
- `abandon_stage`

### 5.4 `contribution_submitted`

Emitted on successful primary contribution submission.

Target:

- `target_id = contribution_id`

Metadata:

- `condition`
- `body_length_chars`
- `has_confidence_label`
- `has_evidence_text`

### 5.5 `digest_opened`

Intervention only.
Emitted when a participant opens their digest.

Target:

- `target_id = digest_id`

Metadata:

- `estimated_read_time`
- `item_count`

### 5.6 `digest_item_opened`

Intervention only.
Emitted when a participant expands, focuses, or explicitly opens a digest item.

Target:

- `target_id = contribution_id`

Metadata:

- `bridge_flag`
- `item_position`

### 5.7 `bridge_item_engaged`

Intervention only.
Emitted when a bridge-flagged item receives meaningful engagement.

Target:

- `target_id = contribution_id`

Metadata:

- `engagement_type`

Allowed `engagement_type` values:

- `opened`
- `responded`
- `marked_useful`

### 5.8 `routing_explanation_viewed`

Intervention only.
Emitted when a participant explicitly views the explanation for why an item was routed.

Target:

- `target_id = contribution_id`

Metadata:

- `bridge_flag`

### 5.9 `response_started`

Emitted when a participant starts a response or reflection.

Metadata:

- `condition`
- `parent_type`

### 5.10 `response_submitted`

Emitted when a participant submits a response or reflection.

Target:

- `target_id = response_id`

Metadata:

- `condition`
- `body_length_chars`
- `has_parent_contribution`

### 5.11 `feedback_submitted`

Emitted when post-cycle feedback is successfully submitted.

Metadata:

- `condition`
- `feedback_instrument_version`

## 6. Required Operator Events

### 6.1 `cycle_created`

Metadata:

- `condition`
- `created_by`

### 6.2 `cycle_opened`

Metadata:

- `condition`

### 6.3 `submissions_closed`

Metadata:

- `condition`
- `submission_count`

### 6.4 `routing_started`

Intervention only.

Metadata:

- `contribution_count`
- `recipient_count`

### 6.5 `routing_job_failed`

Intervention only.

Metadata:

- `failure_code`
- `failure_stage`
- `recoverable`

### 6.6 `routing_completed`

Intervention only.

Metadata:

- `routing_decision_count`
- `bridge_decision_count`

### 6.7 `digest_generated`

Intervention only.

Metadata:

- `digest_count`
- `mean_item_count`
- `mean_estimated_read_time`

### 6.8 `digests_released`

Metadata:

- `condition`
- `recipient_count`

### 6.9 `export_generated`

Metadata:

- `export_type`
- `record_count`

### 6.10 `replay_started`

Metadata:

- `replay_scope`

### 6.11 `replay_completed`

Metadata:

- `replay_scope`
- `replay_status`

### 6.12 `cycle_archived`

Metadata:

- `condition`

### 6.13 `cycle_failed`

Metadata:

- `failure_code`
- `failure_stage`

## 7. Event Emission Rules

- `prompt_viewed` should fire once per cycle per participant per viewing session.
- `contribution_submitted` must fire only after durable persistence.
- `contribution_abandoned` must not fire if `contribution_submitted` has already fired for the same draft session.
- `digest_opened` must fire only after digest release.
- `bridge_item_engaged` must fire only for items with `bridge_flag = true`.
- `routing_started`, `routing_completed`, `digest_generated`, and `digests_released` must preserve causal order.
- `routing_job_failed` must be emitted separately from `cycle_failed` when routing fails but the entire cycle has not yet been declared failed.

## 8. Required Metadata Contracts

The following metadata fields are required for measurement.

### 8.1 Contribution submission metadata

- `body_length_chars`
- `has_confidence_label`
- `has_evidence_text`

### 8.2 Digest item metadata

- `bridge_flag`
- `item_position`

### 8.3 Feedback metadata

- `feedback_instrument_version`

### 8.4 Failure metadata

- `failure_code`
- `failure_stage`
- `recoverable` where relevant

## 9. Derived Datasets

The telemetry pipeline must support creation of these derived tables.

### 9.1 `cycle_summary`

Contains:

- cycle identifiers
- condition
- participant counts
- contribution counts
- response counts
- timing data

### 9.2 `contribution_summary`

Contains:

- contribution id
- author id
- cycle id
- view count
- reply count
- routed recipient count

### 9.3 `digest_summary`

Intervention only.

Contains:

- digest id
- recipient id
- item count
- estimated read time
- bridge item count
- distinct author count

### 9.4 `participant_cycle_summary`

Contains:

- participant id
- cycle id
- viewed prompt
- submitted contribution
- opened digest or thread
- submitted response
- submitted feedback

## 10. Metric Definitions

## 10.1 Exposure concentration

Definition:

- inequality of contribution views across contributions within a cycle

Primary formula:

- Gini coefficient over per-contribution view counts

Secondary diagnostic:

- top-20-percent share of total views

Input requirements:

- contribution-level view counts

## 10.2 Reply concentration

Definition:

- inequality of replies across contributions within a cycle

Primary formula:

- Gini coefficient over per-contribution reply counts

Secondary diagnostic:

- top-20-percent share of total replies

Input requirements:

- contribution-level reply counts

## 10.3 Contributor coverage

Definition:

- number of distinct authors surfaced within one recipient digest

Primary computation:

- distinct author count per recipient digest

Cycle-level summaries:

- mean
- median
- distribution

Baseline note:

- for baseline, an analogous measure may be approximated only if a bounded reading slice is defined; otherwise this metric is intervention-primary and baseline-secondary

## 10.4 Bridge exposure

Definition:

- extent to which participants receive relevant but non-obvious perspectives

Primary formula:

- share of digest items with `bridge_flag = true` per recipient digest

Cycle-level summary:

- mean bridge-item share across recipients

Engagement diagnostic:

- fraction of bridge-flagged items that are opened, replied to, or explicitly marked useful

## 10.5 Perceived overload

Definition:

- participant-reported burden after a cycle

Implementation:

- measured through a post-cycle feedback instrument

Status:

- exact instrument remains an open decision from the parent spec

## 10.6 Exchange quality

Definition:

- participant-reported usefulness and reflectiveness of the discussion

Implementation:

- measured through a post-cycle feedback instrument

Status:

- exact instrument remains an open decision from the parent spec

## 10.7 Explanation clarity

Definition:

- participant-reported clarity of routing explanations

Implementation:

- measured through a post-cycle feedback instrument for intervention cycles

## 10.8 Willingness to return

Definition:

- participant-reported willingness to use the system again

Implementation:

- measured through a post-cycle feedback instrument

## 11. Baseline Measurement Rules

The baseline must preserve comparability where possible.

Required:

- prompt views
- contribution starts and submissions
- reply activity
- feedback submission
- cycle timing

Not available in baseline:

- digest open events
- digest item events
- routing explanation events
- bridge item engagement events

Analysis rule:

- comparisons must only be made on measures valid for both conditions unless the metric is explicitly labeled intervention-specific

## 12. Feedback Instrument Contract

The initial feedback instrument must support at minimum:

- perceived overload
- usefulness of encountered perspectives
- perceived exchange quality
- explanation clarity for intervention
- willingness to use again
- optional free-text feedback

Each submitted feedback record must store:

- `feedback_instrument_version`
- raw answers
- normalized analysis-ready values if transformation is used

## 13. Export Formats

The system must support at least three export modes.

### 13.1 `cycle_export`

Contains:

- cycle metadata
- participant roster identifiers as allowed
- contributions
- responses
- routing decisions
- digests
- audit events
- telemetry events

### 13.2 `analysis_export`

Contains:

- derived datasets
- metric outputs
- completeness flags

### 13.3 `operator_audit_export`

Contains:

- lifecycle events
- failures
- replay records
- execution timing

## 14. Export Constraints

- exports must preserve canonical ids
- timestamps must remain machine-readable
- participant detail must be minimized to what is necessary for analysis
- missing fields must be explicit, not silently omitted

## 15. Missingness and Quality Flags

Every analysis export must include quality flags for:

- missing participant feedback
- missing digest-open data
- partial routing traces
- replay unavailable
- incomplete baseline logging

Recommended flags:

- `complete`
- `partial`
- `missing`
- `not_applicable`

## 16. Failure Handling

If telemetry is incomplete:

- preserve raw events
- emit operator failure or warning events where appropriate
- annotate affected derived datasets
- do not silently compute metrics from obviously incomplete data without a quality flag

If routing fails:

- emit `routing_job_failed`
- mark the cycle or run status explicitly

If digest generation fails:

- emit a failure event through operator audit
- do not emit `digests_released`

## 17. Standard Analysis Outputs

The pilot-analysis pipeline must be able to produce:

### 17.1 Cycle comparison summary

- intervention vs baseline counts
- participant completion rates
- structural metrics
- feedback metric summaries

### 17.2 Structural attention report

- exposure concentration
- reply concentration
- contributor coverage
- bridge exposure

### 17.3 Operator reliability report

- launch reliability
- routing success rate
- digest generation success rate
- replay availability
- export completeness

### 17.4 Qualitative review packet

- flagged cycles
- abnormal concentration patterns
- high-overload reports
- representative free-text feedback

## 18. Acceptance Criteria

This telemetry and evaluation spec is implementation-ready when:

- all required event names are implemented
- event payloads match this schema
- primary metric formulas are fixed in code
- intervention and baseline exports share a stable structure where applicable
- analysis outputs can be generated for at least one completed cycle in each condition
- incomplete telemetry is surfaced through explicit quality flags

## 19. Open Decisions Inherited From Parent Specs

- exact post-cycle instrument wording
- thresholds for “high overload” or other flagged conditions
- any additional baseline analog for contributor coverage if needed

## 20. Immediate Implementation Tasks

1. Define event schemas in code.
2. Add client-side participant instrumentation to the web app.
3. Add operator event emission to CLI and jobs.
4. Implement derived datasets.
5. Implement metric computations.
6. Implement export modes and quality flags.
