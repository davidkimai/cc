# school-board-tradeoff-review

This S3 composition applies ACP's constitutional skill stack to school-board tradeoff review under a fixed operating envelope.

It combines:

- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `omission-critic`
- `fairness-contestability-critic`
- `abstention-escalation`
- `operator-audit`

## Constitutional purpose

Show that ACP's procedural safeguards transfer to local governance settings where staffing, support, transparency, and parent/community disagreement must be compressed without collapsing conflict into simplistic agreement.

## Workflow

1. Run the school-board tradeoff benchmark comparison.
2. Build a report bundle from the benchmark outputs.
3. Summarize routing, omission, fairness, and escalation signals.
4. Preserve unresolved tradeoffs and do not claim institutional legitimacy or educational adequacy from benchmark evidence alone.

## Outputs

- `comparison/`
- `report/`
- `composition-summary.json`

## Failure handling

Preserve failed benchmark or report output. Do not smooth unresolved tradeoffs into false agreement.

## Evaluation hooks

- Run the composition against a temporary output directory.
- Run `npm run skills:audit`.
- Inspect whether the generated report preserves unresolved tradeoffs and claim boundaries.

## Command

```sh
bash skills/compositions/school-board-tradeoff-review/run.sh [out-dir]
```
