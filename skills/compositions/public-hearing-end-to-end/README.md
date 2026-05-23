# public-hearing-end-to-end

This S3 composition runs the flagship public-hearing triage evidence path.

It combines:

- `public-hearing-triage`
- `epistemic-routing`
- `digest-and-explanation`
- `omission-critic`
- `fairness-contestability-critic`
- `abstention-escalation`

## Constitutional purpose

Show how ACP's constitutional skill stack behaves on the frozen flagship denominator where overload, dissent preservation, issue coverage, and claim-safe packaging all matter at once.

## Workflow

1. Run public-hearing benchmark comparison.
2. Run Engine V2 ablation.
3. Run Band B and Band C scale evidence.
4. Write an end-to-end summary.

## Command

```sh
bash skills/compositions/public-hearing-end-to-end/run.sh [out-dir]
```

## Outputs

- `comparison/`
- `ablation/`
- `scale/`
- `composition-summary.json`

## Failure handling

Preserve failed benchmark output. Do not change the frozen denominator to make a run pass.

## Human override points

- claim approval before public-facing summary language
- escalation review when critic output and benchmark posture conflict
- denominator freeze review if a proposed change would alter comparability rather than improve evidence

## Evaluation hooks

- Run the composition against a temporary output directory.
- Run `npm run skills:audit`.
