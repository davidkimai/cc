# ACP Coordination Engine Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1

Version: 0.3  
Date: 2026-05-20

## 1. Purpose

This document defines the coordination engine behavior for ACP v1.

Its role is to specify:

- routing behavior
- digest generation behavior
- explanation behavior
- overload governance behavior
- deliberative criteria and shared routing weights
- Engine V2 recursive critic and escalation behavior
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
- explicit deliberative criteria
- shared weights used by the routing heuristic
- metric-computable outputs suitable for evaluation
- model-ops-ready traces for contribution understanding, issue maps, set-level critiques, critic findings, and escalation recommendations
- procedure-readable outputs that can populate the cycle's `proceduralLayer` attachment with contest points, artifact expectations, adherence markers, and escalation provenance

## 3.2 Engine Modes

Relay must preserve two explicit engine modes:

| Engine mode | Meaning |
| --- | --- |
| `heuristic` | Deterministic v1-compatible routing using explicit factors and shared weights. |
| `recursive_engine_v2` | Defense-in-depth routing that adds contribution understanding, issue maps, set-level selection, omission/fairness critics, and escalation signals. |

`recursive_engine_v2` is the default for new intervention cycles. `heuristic` remains available for ablation and fallback evidence, not as the research target.

## 3.3 Engine V2 Trace

An Engine V2 run must preserve an `engineV2` trace on the cycle when the recursive engine is used.

The trace must include:

- engine version
- engine mode
- provider and model policy
- prompt versions
- contribution understanding records
- issue-map clusters
- digest set critique
- omission critic findings
- fairness critic findings
- confidence and escalation recommendation
- model audit summary without secrets

Trace fields may be produced deterministically for offline demo and benchmark runs. If a live provider is used, the same trace shape must be validated before persistence.

## 3.4 Procedural layer attachment

When Relay is operating with a declared procedural profile, the engine should preserve enough metadata for a cycle-level `proceduralLayer` attachment to answer four questions:

- which procedures governed the run
- which artifact classes were expected
- where a human could contest, revise, or abstain
- what escalation signal the engine actually produced

This attachment is protocol-adjacent rather than protocol-defining: it exposes workflow governance without collapsing ACP semantics into skill prose.

## 3.1 Deliberative Criteria

Every ACP cycle must carry an explicit `deliberativeCriteria` config array. Criteria make visible what the routing engine is trying to preserve.

The v1 default criteria are:

| Criterion id | Meaning | Default weight |
| --- | --- | --- |
| `recipient_relevance` | Route items that connect to the recipient's own contribution or likely concern. | `0.55` |
| `prompt_relevance` | Keep routed items anchored to the shared prompt rather than only interpersonal similarity. | `0.25` |
| `bridge_perspective` | Reserve bounded room for relevant but less-obvious perspectives. | `0.15` |
| `load_balance` | Preserve bounded reading burden and avoid overloading recipients. | `0.05` |

Normative rules:

- weights must be non-negative numbers
- the total configured weight must be greater than zero
- implementations may normalize weights internally for scoring
- exported routing decisions must expose the factors used to justify the score
- explanations must reference the criteria actually used, not invented rationale

## 4. Intervention Routing Rules

The routing engine must:

- exclude a participant's own contribution from their recipient set
- work over participant-authored contributions only
- produce a bounded set of routed items per participant
- record a score and a plain-language reason for each routing decision
- preserve `bridgeFlag` on decisions intended to widen perspective exposure
- record criterion factors for recipient relevance, prompt relevance, bridge perspective, and load cost
- preserve the shared criterion weights used for a routing run

### 4.1 v1 routing heuristic allowance

The first Relay implementation may use heuristic routing rather than model-heavy routing, provided it:

- is inspectable
- is bounded
- yields deterministic outputs for the same fixture input
- supports bridge exposure selection

### 4.2 Engine V2 routing requirements

Engine V2 routing must:

- build contribution understanding records before candidate selection
- cluster contributions into issue-map groups
- avoid selecting only redundant high-similarity items when a digest budget can cover multiple issue clusters
- preserve at least one relevant minority-salience or bridge item when the configured bridge budget allows it
- record issue-cluster provenance on routing decisions where available
- record judge confidence where available
- produce omission and fairness critique before release
- produce an escalation recommendation when confidence is low or critic severity is high

### 4.3 Required routing outputs

Each routing decision must include:

- contribution id
- author id
- recipient id
- score
- factors
- criteria weights
- reason
- bridge flag
- timestamp
- engine version when produced by Engine V2
- issue cluster id when available
- judge confidence when available

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
- identifies the dominant criterion behind the routing decision
- does not claim invisible model reasoning beyond what the engine actually computed

Normative rule:

- explanations must remain faithful to the routing mechanism used

Engine V2 explanations must also distinguish:

- recipient relevance
- prompt relevance
- bridge exposure
- issue coverage
- unresolved-question retention
- escalation or abstention when the engine is not confident enough to release without review

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
- bridge items must be explained as bounded bridge exposure, not as highest-similarity matches

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

Normative rules:

- v1 should prefer transparent heuristics over opaque sophistication where tradeoffs arise
- Engine V2 must keep deterministic offline execution available for release gates, demos, and benchmark reproducibility
- live model providers must be environment-configured and must not be required for local conformance or release smoke
- model outputs must be schema-validated before they influence persisted ACP objects
- prompt versions must be stable and visible in evidence artifacts

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
- routing decisions expose criterion factors and shared weights
- explanations exist and are semantically faithful to the criteria and heuristic used
- bridge exposure is marked explicitly
- baseline and intervention conditions remain comparable on the same cycle model
- engine behavior is covered by deterministic tests
- Engine V2 traces expose issue maps, critic findings, and escalation status
- benchmark evidence can compare baseline thread, heuristic routing, and recursive Engine V2 routing

## 14. Agent Execution Notes

Use this spec when assigning engine work.

Required task shape:

- declare exact engine functions or modules in scope
- preserve deterministic fixture behavior unless a parent spec is revised
- do not introduce opaque model dependence without explicit spec revision
