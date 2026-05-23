# ACP Inspect Mirror — Public Hearing Comparative Run

Generated: 2026-05-23T07:23:38+00:00

Status: success

This is a real provider-backed Inspect AI comparative adjudication run over ACP's flagship `public-hearing-triage` benchmark, using paired A/B orderings over actual benchmark outputs.

- Model: `openai/gpt-5.4-mini`
- Grader model: `openai/gpt-5.4-mini`
- Samples: **2**
- Preferred-label consistency: **2/2**

## Pairwise Results

| Sample | Expected label | Observed label | Final status | Overall | Preference | Bounded attention | Minority concern | Claim boundary |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| public-hearing-flagship-compare-ab | A | A | pass | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| public-hearing-flagship-compare-ba | B | B | pass | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |

## Boundary

- comparative mirror only; not ACP's canonical flagship evidence layer
- model-graded adjudication only; not human review
- not field efficacy, consensus manufacture, or institutional scale proof
