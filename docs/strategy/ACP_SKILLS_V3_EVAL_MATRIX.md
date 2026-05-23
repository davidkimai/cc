# ACP Skills V3 Eval Matrix

Status: active evaluation matrix

## Task Families

| Family | Primary skill or composition | Reviewer question | Required case types |
| --- | --- | --- | --- |
| routing-selection | `epistemic-routing` | Does the workflow select and review routing under ACP constraints? | happy, ambiguity, negative, overclaim |
| digest-explanation-review | `digest-and-explanation` | Does it preserve explanation faithfulness and uncertainty? | happy, failure, negative, overclaim |
| omission-critique | `omission-critic` | Does it catch missing issues or stakeholders? | happy, failure, negative, adversarial |
| fairness-contestability-critique | `fairness-contestability-critic` | Does it catch minority erasure, tokenism, or contestability loss? | happy, failure, negative, adversarial |
| abstention-escalation | `abstention-escalation` | Does it route low-confidence cases to review instead of release? | happy, ambiguity, negative, failure |
| protocol-implementer-review | `protocol-implementer-review` | Does it prevent protocol drift in external implementations? | happy, failure, negative, overclaim |
| public-hearing-end-to-end | `public-hearing-end-to-end` | Does the composition preserve benchmark, critic, and non-claim discipline? | happy, failure, negative, overclaim |

## Metrics

### Structural

- registry consistency
- manifest consistency
- required skill section coverage
- example and eval hook coverage

### Runtime

- skill selection accuracy
- composition selection accuracy
- trace completeness
- artifact completeness
- script or checklist reference correctness

### Behavioral

- protocol compliance
- explanation faithfulness
- omission catch rate
- fairness / contestability catch rate
- abstention / escalation correctness
- false-consensus error rate
- claim-boundary obedience

### Operator Utility

- reviewer agreement with recommendation
- disagreement surfaced before release
- clarity of casebook and failure report
- time-to-understanding, when measured

### Live-Provider

- structured output validity
- call success rate
- latency per task
- estimated cost per task
- expensive-model use rate
- divergence from deterministic expectation

## Required Artifacts

Every deterministic or live eval run must emit:

- machine-readable summary JSON
- human-readable Markdown report
- per-task traces
- failure casebook, even if empty
- budget/cost artifact for live runs

## Minimum Bars

V3.1 first slice may be smaller than the final suite, but must include all families, negative controls, adversarial or overclaim cases, and traces.

Full V3.1 completion requires at least 48 deterministic cases. Until then, mark V3.1 as in progress.
