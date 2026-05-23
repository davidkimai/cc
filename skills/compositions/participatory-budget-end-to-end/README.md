# participatory-budget-end-to-end

This S3 composition applies ACP's constitutional skill stack to participatory-budget priority review.

It combines:

- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `omission-critic`
- `fairness-contestability-critic`
- `abstention-escalation`
- `pilot-analysis`

## Constitutional purpose

Show that ACP's procedural safeguards transfer beyond the flagship hearing denominator to another civic setting where compression can easily erase distributional tradeoffs and minority priorities.

## Workflow

1. Run the participatory-budget benchmark comparison.
2. Build a report bundle from the benchmark outputs.
3. Summarize whether routing, explanation, omission, and contestability evidence are present.
4. Preserve claim boundaries rather than overstating budget legitimacy or public consensus.

## Outputs

- `comparison/`
- `report/`
- `composition-summary.json`

## Failure handling

Preserve failed benchmark or report output. Do not rewrite the task framing to make the composition appear more successful than the evidence supports.

## Evaluation hooks

- Run the composition against a temporary output directory.
- Run `npm run skills:audit`.
- Inspect whether the generated report preserves claim boundaries around fairness, representation, and allocation legitimacy.

## Command

```sh
bash skills/compositions/participatory-budget-end-to-end/run.sh [out-dir]
```
