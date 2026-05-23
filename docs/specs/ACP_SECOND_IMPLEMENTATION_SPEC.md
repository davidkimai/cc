# ACP Second Implementation Spec

Status: Ecosystem-proof implementation spec
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This spec defines the first second-proof surface for ACP: a lightweight batch runner.

The batch runner exists to prove that ACP can be executed end to end outside the Relay web app while still using the canonical ACP model and the current Relay implementation engine.

## 2. Scope

This spec governs:

- the batch runner input contract
- batch runner output artifacts
- the lifecycle sequence the runner executes
- the relationship between the batch runner and ACP conformance

This spec does not govern:

- web UI behavior
- notebook workflows
- a fully independent second implementation

## 3. Runner contract

The batch runner is a second ACP-compatible surface, not a second fully independent implementation.

It must:

- accept one JSON scenario bundle
- run against the current `CycleService`
- support both `intervention` and `baseline_thread`
- emit one deterministic output bundle per run
- fail with a non-zero exit code on invalid input, invalid transitions, or failed protocol checks

## 4. Input bundle

Each scenario bundle must include:

- `protocolVersion`
- `scenarioId`
- `title`
- `prompt`
- `condition`
- `participants`
- `contributions`

Optional fields:

- `config`
- `schedule`
- `responses`
- `feedback`
- `exportModes`

### 4.1 Contribution rule

The batch runner assumes one primary contribution per participant.

### 4.2 Response reference rule

Each response references a prior contribution by `parentContributionParticipantId`.
The runner resolves that participant to the contribution submitted for the cycle.

## 5. Lifecycle sequence

The batch runner executes the cycle in this order:

1. create
2. open
3. submit contributions
4. close submissions
5. run routing if `intervention`
6. release
7. submit responses if present
8. submit feedback if present
9. replay
10. close reflection
11. archive
12. export requested modes
13. write output bundle
14. run conformance reporting

## 6. Output bundle

Each run must emit:

- `normalized-input.json`
- `cycle.json`
- `exports/`
- `conformance-report.json`
- `run-manifest.json`

The output bundle should be diff-friendly and human-readable.

## 7. Conformance requirement

The runner must include ACP conformance output in the run bundle.

For ACP v0.1 this means:

- include the current repo-wide conformance result
- include a local run report summarizing whether the produced cycle satisfied the batch-runner contract

## 8. Acceptance criteria

This spec is satisfied when:

- one intervention scenario runs end to end
- one baseline scenario runs end to end
- both runs emit a full output bundle
- the batch surface proves ACP can run outside the Relay web app
