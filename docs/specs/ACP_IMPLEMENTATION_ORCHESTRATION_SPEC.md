# ACP Implementation Orchestration Spec

Status: Implementation planning artifact  
Ground truth:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `RELAY_BLOCKS_SPEC.md` v0.3

Version: 0.3  
Date: 2026-04-23

## 1. Purpose

This document defines how to build `Attention Coordination Protocol (ACP)` end to end using spec-driven development and subagent orchestration, with `Relay` as the first implementation and `Relay Blocks` as the modular operational layer.

Its role is to specify:

- implementation workstreams
- dependency order
- subagent roles
- ownership boundaries
- handoff contracts
- integration rules
- review and verification gates

The main principle is:

`Parent specs govern implementation. Subagents execute bounded work against those specs and do not redefine the system.`

## 2. Ground Truth Hierarchy

The following hierarchy must be followed strictly.

### 2.1 Normative source of truth

1. `ACP_TECHNICAL_SPEC.md`
2. `ACP_PROTOCOL_CONTRACT_SPEC.md`
3. `ACP_TELEMETRY_EVALUATION_SPEC.md`
4. `RELAY_BLOCKS_SPEC.md`

### 2.2 Derived implementation artifacts

- Product requirements
- Web app spec
- CLI spec
- backend schemas
- API contracts
- skills packages
- tests

### 2.3 Rule

If an implementation artifact conflicts with a higher-level spec, the higher-level spec wins until explicitly revised.

## 3. Delivery Strategy

Build in layers, not by screen.

Recommended order:

1. protocol contract and storage skeleton
2. core intervention engine
3. participant web flow
4. operator CLI and replay/export
5. telemetry and metrics
6. baseline condition
7. Relay Blocks packaging
8. pilot hardening

This avoids building a surface before the underlying contract is stable.

## 4. Workstreams

The full product can be decomposed into 7 workstreams.

### 4.1 Workstream A: Protocol and persistence

Owns:

- canonical schemas
- cycle state machine enforcement
- storage models
- core operations

Outputs:

- database or persistence schema
- internal service interfaces
- migration or seed strategy

### 4.2 Workstream B: Coordination engine

Owns:

- routing
- digest generation
- explanation generation
- overload controls
- bridge exposure logic

Outputs:

- routing job implementation
- digest generation job
- engine-level tests

### 4.3 Workstream C: Participant web app

Owns:

- onboarding
- prompt view
- contribution submission
- digest view
- explanation view
- response / feedback flow

Outputs:

- routes and UI states
- participant instrumentation

### 4.4 Workstream D: Operator CLI and headless jobs

Owns:

- cycle creation
- run / inspect / replay / export flows
- job orchestration

Outputs:

- CLI commands
- structured outputs
- operational audit hooks

### 4.5 Workstream E: Telemetry and evaluation

Owns:

- event emission
- derived datasets
- metrics computations
- export formats

Outputs:

- telemetry schemas
- analysis pipeline
- reporting stubs

### 4.6 Workstream F: Baseline condition

Owns:

- baseline thread model over the same Cycle contract
- baseline UI and telemetry compatibility
- baseline analysis comparability

Outputs:

- baseline execution path
- baseline comparison support

### 4.7 Workstream G: Relay Blocks and runtime packaging

Owns:

- skills repository
- `SKILL.md` packages
- helper scripts and references
- OpenClaw adapter

Outputs:

- installable local suite
- runtime adapter package

## 5. Subagent Topology

The implementation process should use a small number of long-lived bounded subagents, not many short-lived overlapping ones.

Recommended topology:

### 5.1 Spec steward

Role:

- main orchestrator

Responsibilities:

- maintain spec hierarchy
- assign tasks
- review outputs for spec compliance
- integrate workstreams
- approve or reject deviations

### 5.2 Protocol worker

Owns Workstream A.

Write scope:

- schema definitions
- internal service interfaces
- state machine code

### 5.3 Engine worker

Owns Workstream B.

Write scope:

- routing implementation
- digest generation
- explanation code
- overload checks

### 5.4 Web worker

Owns Workstream C.

Write scope:

- participant web UI
- web interaction states
- web telemetry hooks

### 5.5 CLI worker

Owns Workstream D.

Write scope:

- CLI commands
- headless runner
- replay / export pathways

### 5.6 Evaluation worker

Owns Workstream E.

Write scope:

- telemetry pipeline
- metric computations
- exports

### 5.7 Baseline worker

Owns Workstream F.

Write scope:

- baseline execution behavior
- baseline UI adjustments if needed
- baseline comparability logic

### 5.8 Relay Blocks worker

Owns Workstream G.

Write scope:

- skills repository
- package definitions
- references and scripts
- OpenClaw adapter

## 6. Ownership Rules

- Each subagent must have a disjoint write scope whenever possible.
- Shared contract files are modified only by the spec steward.
- If a worker requires a contract change, it proposes the change; it does not silently patch the parent spec.
- No worker may redefine canonical domain terms locally.

## 7. Dependency Graph

The workstreams have this dependency order:

### 7.1 Hard dependencies

- Workstream A before B, C, D, E, F, G
- Workstream B before full C and D integration
- Workstream E depends on A and event-producing slices of C, D, F
- Workstream G depends on A, B, C, D enough to know real workflows

### 7.2 Safe parallelism

Can run in parallel after Protocol and persistence start stabilizing:

- B and C
- B and D
- C and F
- E can begin schema work early but not finalize until C/D/F emit real events

## 8. Handoff Contracts

Every subagent output must include:

- what spec sections it implemented
- what files it changed
- what assumptions it made
- what remains blocked
- whether any parent-spec change is requested

No handoff is complete without that summary.

## 9. Spec-Driven Task Template

Every implementation task should be framed like this:

1. `Target spec`
- exact parent doc and section

2. `Scope`
- what must be implemented
- what is explicitly out of scope

3. `Write scope`
- exact files or modules owned

4. `Acceptance criteria`
- copied or derived from the parent spec

5. `Open questions`
- unresolved items that cannot be decided locally

## 10. Recommended Delivery Phases

### Phase 1: Contract and skeleton

Deliver:

- persistence schema
- state machine
- internal interfaces
- project skeleton

Subagents active:

- spec steward
- protocol worker
- minimal skills worker for scaffolding

### Phase 2: Core engine

Deliver:

- routing
- digest generation
- explanation
- overload controls

Subagents active:

- engine worker
- protocol worker
- evaluation worker for schema alignment

### Phase 3: Product surfaces

Deliver:

- participant web flow
- operator CLI flow
- headless jobs

Subagents active:

- web worker
- CLI worker
- engine worker

### Phase 4: Measurement and baseline

Deliver:

- telemetry
- metrics pipeline
- baseline condition
- exports

Subagents active:

- evaluation worker
- baseline worker
- CLI worker
- web worker

### Phase 5: Packaging and pilot readiness

Deliver:

- Relay Blocks layer
- OpenClaw adapter
- documentation for running a full pilot

Subagents active:

- skills worker
- spec steward
- selective support from web/CLI/evaluation workers

## 11. Review Gates

Each phase must pass a review gate before the next phase expands.

### 11.1 Contract gate

Pass criteria:

- domain objects implemented
- state machine enforced
- both conditions represented on same Cycle model

### 11.2 Engine gate

Pass criteria:

- routing output exists
- digest generation exists
- explanations exist
- overload constraints enforced

### 11.3 Surface gate

Pass criteria:

- participant can complete one cycle
- operator can create/run/export a cycle

### 11.4 Measurement gate

Pass criteria:

- required events emitted
- metrics computed
- exports generated

### 11.5 Pilot gate

Pass criteria:

- intervention and baseline both runnable
- replay available
- Relay Blocks layer packaged

## 12. Verification Strategy

Verification should also be layered.

### 12.1 Contract verification

- schema checks
- state transition tests
- operation precondition checks

### 12.2 Engine verification

- deterministic fixture-based routing checks
- digest payload validation
- explanation presence and shape validation

### 12.3 Surface verification

- participant flow completion
- operator flow completion

### 12.4 Measurement verification

- event completeness
- metric reproducibility on fixture data
- export integrity

### 12.5 Packaging verification

- skills load successfully
- skill descriptions are canonical
- scripts referenced in `SKILL.md` exist

## 13. Spec Steward Workflow

The main orchestrator should follow this loop:

1. Read relevant parent spec sections.
2. Define bounded task with write scope.
3. Dispatch to worker.
4. Review output against parent spec.
5. Integrate or reject.
6. If parent spec ambiguity is found, patch the spec first.
7. Continue only after truth is restored.

This is the recursive improvement mechanism for the build.

## 14. When to Revise Parent Specs

Revise a parent spec only when:

- two workers produce conflicting valid interpretations
- implementation reveals a missing invariant
- a required metric cannot be computed under the current contract
- a required workflow cannot be represented without changing the model

Do not revise parent specs:

- for convenience-only implementation shortcuts
- to match substrate quirks unless those quirks become accepted design constraints

## 15. Immediate Next Implementation Docs

The first required implementation-child specs are now:

1. `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md`
2. `RELAY_WEB_APP_SPEC.md`
3. `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md`

The remaining required child specs are now:

4. `ACP_HTTP_API_SPEC.md`
5. `ACP_COORDINATION_ENGINE_SPEC.md`
6. `ACP_PERSISTENCE_EXPORT_SPEC.md`
7. `ACP_PILOT_OPERATIONS_SPEC.md`
8. `ACP_EVALUATION_INSTRUMENT_SPEC.md`
9. `RELAY_BLOCKS_EXECUTION_SPEC.md`
10. `ACP_AGENT_EXECUTION_CONTRACT.md`
11. `ACP_RELEASE_DEPLOYMENT_SPEC.md`

## 16. Immediate Execution Plan

Recommended first implementation sprint:

1. Protocol worker
- implement Cycle, Contribution, RoutingDecision, Digest, Response, AuditEvent, TelemetryEvent schemas

2. Engine worker
- implement routing and digest jobs against fixture data

3. Web worker
- implement prompt -> contribution -> digest shell flow

4. CLI worker
- implement cycle create / open / close / route / export command shells

5. Evaluation worker
- implement event schema and metric computation scaffolding

6. Skills worker
- scaffold all skill packages with canonical descriptions

## 17. Success Condition

This orchestration plan is working if:

- subagents produce bounded outputs without redefining system truth
- integration decisions are made against specs rather than intuition
- implementation progresses in dependency order
- contract drift is caught early
- the full product can be assembled incrementally without architectural collapse into substrate work
