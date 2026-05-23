# ACP Inspect Mirror — Skills Measured Real Run

Generated: 2026-05-23T07:23:23+00:00

Status: success

This is a real provider-backed Inspect AI mirror run of ACP's measured held-out skills slice.
The canonical ACP harness remains the source of truth; this artifact demonstrates that the measured slice can be exercised through Inspect with preserved condition structure and bounded judging logic.

The current scorer is **calibrated**, not purely permissive model grading: it blends model judgment with deterministic heuristics and condition-discipline penalties so that skill leakage, missed escalation boundaries, and missing artifacts lower the comparative score.

- Model: `openai/gpt-5.4-mini`
- Grader model: `openai/gpt-5.4-mini`
- Total tasks: **14**
- Total outputs: **44**
- Families covered: **abstention-escalation, digest-explanation-review, fairness-contestability-critique, omission-critique, protocol-implementer-review, public-hearing-end-to-end, routing-selection**
- Conditions: **composition, full_skill, metadata_only, no_skill**

## By Condition

| Condition | Outputs | Calibrated overall | Pre-penalty quality | Substantive | Escalation | Claim boundary | Artifact trace | Adherence | Leakage count | Pass / Review / Fail |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| full_skill | 14 | 0.8979 | 0.9199 | 0.9134 | 0.9643 | 0.9643 | 1.0000 | 0.8571 | 2 | 7 / 7 / 0 |
| metadata_only | 14 | 0.8578 | 0.8666 | 0.8955 | 0.8643 | 0.8214 | 1.0000 | 0.8571 | 2 | 7 / 5 / 2 |
| no_skill | 14 | 0.5634 | 0.8414 | 0.8884 | 0.7857 | 0.8571 | 1.0000 | 0.0714 | 13 | 0 / 4 / 10 |
| composition | 2 | 0.9593 | 0.9375 | 0.7500 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0 | 1 / 1 / 0 |

## Boundary

- Inspect mirror only; not the canonical ACP evidence surface
- surrogate/model-graded evaluation only; not human review
- not field efficacy
- not fairness solved
- not operator utility
