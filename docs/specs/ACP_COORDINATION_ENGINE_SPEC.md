# ACP Coordination Engine Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the coordination engine behavior for ACP v1.

Its role is to specify:

- routing behavior
- digest generation behavior
- explanation behavior
- overload governance behavior
- baseline parity rules
- deterministic acceptance expectations for the first Relay implementation

## 2. Normative Scope

This spec governs:

- engine-level semantics for intervention cycles
- baseline-related comparison semantics where engine behavior matters
- derived engine outputs such as routing decisions and digests

This spec does not govern:

- UI presentation details
- CLI syntax
- persistence layout except where engine outputs must be stored

## 3. Engine Responsibilities

The ACP coordination engine must implement:

- routing
- digest construction
- explanation generation
- overload governance
- bridge exposure
- metric-computable outputs suitable for evaluation

## 4. Intervention Routing Rules

The routing engine must:

- exclude a participant's own contribution from their recipient set
- work over participant-authored contributions only
- produce a bounded set of routed items per participant
- record a score and a plain-language reason for each routing decision
- preserve `bridgeFlag` on decisions intended to widen perspective exposure

### 4.1 v1 routing heuristic allowance

The first Relay implementation may use heuristic routing rather than model-heavy routing, provided it:

- is inspectable
- is bounded
- yields deterministic outputs for the same fixture input
- supports bridge exposure selection

### 4.2 v1 required routing outputs

Each routing decision must include:

- contribution id
- author id
- recipient id
- score
- reason
- bridge flag
- timestamp

## 5. Digest Generation Rules

Digests must:

- be generated only for `intervention`
- derive from routing decisions rather than recomputing selection ad hoc
- preserve source material visibility
- present items in a meaningful order
- include a digest-level summary

### 5.1 v1 digest ordering

The first implementation may order by descending routing score.

### 5.2 v1 bounded-load rule

Digest size must respect the cycle config limits.

## 6. Explanation Rules

Each digest item must include explanation content that:

- is plain language
- distinguishes strong overlap from bridge-style inclusion where possible
- does not claim invisible model reasoning beyond what the engine actually computed

Normative rule:

- explanations must remain faithful to the routing mechanism used

## 7. Overload Governance Rules

The engine must enforce:

- `maxDigestItems`
- `maxBridgeItems`
- one primary contribution per participant per cycle
- phase ordering that prevents premature release

The engine may later evolve richer overload logic, but v1 must preserve bounded reading burden as an enforceable contract.

## 8. Bridge Exposure Rules

The engine must support bridge exposure as a first-class output dimension.

For v1, this means:

- some routed items may be intentionally selected from lower-similarity candidates
- those items must remain relevant to the prompt
- those items must be marked explicitly with `bridgeFlag`

## 9. Baseline Parity Rules

For `baseline_thread`:

- no intervention routing decisions are required
- no intervention digest generation is required
- cycle release must still occur on the same canonical lifecycle
- exposure and reply metrics must remain computable under baseline conventions defined in parent specs

## 10. Determinism And Testability

The first Relay engine should prioritize:

- deterministic fixture behavior
- inspectable scoring
- bounded output
- ease of explanation and audit

Normative rule:

- v1 should prefer transparent heuristics over opaque sophistication where tradeoffs arise

## 11. Failure Semantics

The engine must fail loudly when:

- routing is requested for an invalid cycle state
- required contribution references are missing during digest generation
- generated outputs violate bounded-load constraints

Failures must remain observable to audit and telemetry layers according to parent specs.

## 12. File Ownership Guidance

This spec primarily governs work on:

- `src/services/pipeline.ts`
- `src/services/cycle-service.ts`
- `src/core/types.ts` where engine outputs are represented
- engine-facing tests

## 13. Acceptance Criteria

The coordination engine is ready for serious use when:

- intervention routing produces bounded, inspectable outputs
- digest generation produces stable payloads from routing outputs
- explanations exist and are semantically faithful
- bridge exposure is marked explicitly
- baseline and intervention conditions remain comparable on the same cycle model
- engine behavior is covered by deterministic tests

## 14. Agent Execution Notes

Use this spec when assigning engine work.

Required task shape:

- declare exact engine functions or modules in scope
- preserve deterministic fixture behavior unless a parent spec is revised
- do not introduce opaque model dependence without explicit spec revision
