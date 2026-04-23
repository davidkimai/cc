# Relay Web App Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the Relay web application as the primary participant-facing surface and one of the operator-facing surfaces for the first ACP implementation.

Its role is to specify:

- required user flows
- UI states and views
- component responsibilities
- required API dependencies
- telemetry hooks at the web surface
- acceptance criteria for a serious participant/operator web implementation

## 2. Normative Scope

This spec governs:

- the Relay browser-based product surface
- the participant workflow in the web app
- the operator workflow in the web app
- state presentation rules and telemetry instrumentation at the UI layer

This spec does not govern:

- CLI behavior
- engine heuristics beyond what the UI must present
- persistence implementation details
- alternative non-web Relay clients

## 3. Surface Definition

The Relay web app is a single product surface containing two roles:

- operator
- participant

The current implementation may expose both roles in a unified shell, but the semantic distinction must remain clear.

Normative rule:

- the participant experience is the primary user-facing intervention surface for the pilot
- the operator experience supports cycle administration, inspection, and study execution

## 4. Primary User Flows

### 4.1 Operator flow

The operator must be able to:

1. create a cycle
2. choose `intervention` or `baseline_thread`
3. configure participants and bounded-load settings
4. open submissions
5. close submissions
6. run routing when condition is `intervention`
7. release cycle outputs
8. inspect audit events, telemetry, routing, digests, metrics, and exports
9. close reflection
10. archive or replay the cycle

### 4.2 Participant flow

The participant must be able to:

1. select a cycle and participant identity
2. read the prompt
3. submit one primary contribution during `submission_open`
4. wait cleanly when outputs are not yet released
5. read a routed digest in `intervention`
6. read a chronological thread in `baseline_thread`
7. open individual items
8. view explanations when available
9. submit one or more responses after release
10. submit post-cycle feedback

## 5. Required UI Modes

The participant surface must support the canonical modes already implied by ACP:

- `submission`
- `waiting`
- `digest`
- `thread`
- `complete`

Normative rule:

- mode selection must derive from ACP state and condition, not ad hoc UI state

## 6. Required Views And Components

### 6.1 Operator views

Required operator UI regions:

- cycle list
- cycle creation form
- cycle detail panel
- lifecycle action controls
- routing and digest inspection area
- metrics and export inspection area
- audit and telemetry inspection area

### 6.2 Participant views

Required participant UI regions:

- cycle and participant selector
- prompt card
- contribution form
- digest view
- baseline thread view
- explanation panel or expandable explanation content
- response form
- feedback form

### 6.3 Shared UI concerns

Required shared concerns:

- connection status
- empty states
- loading states
- recoverable error presentation
- confirmation feedback for submitted actions

## 7. UI Behavior Rules

The web app must:

- hide or disable invalid lifecycle actions
- preserve semantic clarity between intervention and baseline
- avoid presenting Relay as an AI participant
- clearly explain why digest items were shown in intervention mode
- avoid pretending that baseline thread items were intentionally routed
- preserve the one-primary-contribution-per-cycle rule

## 8. Telemetry Hooks Required At Web Layer

The web app must emit or trigger emission for the required participant events when relevant:

- `prompt_viewed`
- `contribution_started`
- `contribution_abandoned`
- `contribution_submitted`
- `digest_opened`
- `digest_item_opened`
- `bridge_item_engaged`
- `routing_explanation_viewed`
- `thread_opened`
- `thread_item_opened`
- `response_started`
- `response_submitted`
- `feedback_submitted`

Operator actions initiated through the web app must also lead to the corresponding operator events defined in the telemetry spec.

## 9. API Dependencies

The web app depends directly on:

- cycle listing and retrieval endpoints
- lifecycle mutation endpoints
- participant view endpoint
- contribution submission endpoint
- response submission endpoint
- feedback submission endpoint
- participant event endpoint
- routing, metrics, digests, audit, telemetry, and export endpoints

Normative rule:

- the web app may reshape returned data for presentation
- the web app may not invent new protocol semantics absent from the API contract

## 10. File Ownership Guidance

This spec primarily governs work on:

- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `src/api/app.ts` for web-facing shape impacts
- `tests/api.test.ts` where web-surface assumptions are validated indirectly

## 11. Acceptance Criteria

The Relay web app is ready for serious use when:

- an operator can complete the full cycle lifecycle from the web surface
- a participant can complete the end-to-end participant loop without CLI intervention
- intervention and baseline conditions are both clearly presented
- explanations are visible in intervention condition only where appropriate
- web-layer telemetry hooks exist for required participant events
- loading, empty, and error states are not silent failures

## 12. Agent Execution Notes

Use this spec when assigning work on the browser-facing Relay product.

Required task shape:

- reference this spec plus the parent specs
- limit write scope to `public/*` and any explicitly required API contract touchpoints
- preserve ACP-derived modes and conditions
- do not redefine metrics or routing semantics at the UI layer

## 13. Immediate Follow-On Specs

This spec depends especially on:

- `ACP_HTTP_API_SPEC.md`
- `ACP_COORDINATION_ENGINE_SPEC.md`
- `ACP_EVALUATION_INSTRUMENT_SPEC.md`
