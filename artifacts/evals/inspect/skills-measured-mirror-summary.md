# ACP Inspect Mirror Fidelity Summary

Generated: 2026-05-23T07:23:23+00:00

This summary compares ACP's canonical measured skills slice artifacts with the calibrated real provider-backed Inspect AI mirror run.

## Structural fidelity

- Native cases: **14**
- Inspect tasks: **14**
- Native outputs: **44**
- Inspect outputs: **44**
- Conditions match: **True**
- Families match: **True**

## By condition

| Condition | Native outputs | Inspect outputs | Native overall | Inspect calibrated overall | Δ overall | Inspect pre-penalty quality | Native status mix | Inspect status mix | Inspect adherence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |
| composition | 2 | 2 | 0.8125 | 0.9593 | +0.1468 | 0.9375 | 0/2/0 | 1/1/0 | 1.0000 |
| full_skill | 14 | 14 | 0.6488 | 0.8979 | +0.2491 | 0.9199 | 1/13/0 | 7/7/0 | 0.8571 |
| metadata_only | 14 | 14 | 0.6261 | 0.8578 | +0.2317 | 0.8666 | 1/13/0 | 7/5/2 | 0.8571 |
| no_skill | 14 | 14 | 0.6514 | 0.5634 | -0.0880 | 0.8414 | 0/14/0 | 0/4/10 | 0.0714 |

## Interpretation

The Inspect layer should be read as a **mirror** of the load-bearing measured slice, not a replacement for ACP's canonical harness. The mirror shows strong structural fidelity when counts, conditions, and families match. The calibrated Inspect scorer now blends model judgment with deterministic condition-discipline checks, which reduces some of the earlier permissive drift while preserving the mirror's ecosystem-legibility role.

## Known drift sources

- native ACP adjudication still uses a richer adjudication stack with arbitration
- Inspect mirror generation and native generation are comparable surfaces, not identical output traces
- score alignment is improved but not isomorphic; remaining drift should be interpreted as calibration work, not hidden

## Boundary

- mirror fidelity, not field validation
- model-graded evidence only, not human review
- no new efficacy claims created by the Inspect layer
