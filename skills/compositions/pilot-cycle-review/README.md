# pilot-cycle-review

This S3 composition packages a practical operator review of one ACP cycle.

It combines:

- `research-cli-operator`
- `operator-audit`
- `pilot-analysis`

## Workflow

1. Capture cycle state, metrics, audit events, telemetry, digests, routing decisions, and export index.
2. Generate analysis and audit exports.
3. Write a compact `review-summary.md`.
4. Preserve gaps rather than forcing recovery.

## Command

```sh
bash skills/compositions/pilot-cycle-review/run.sh <cycle-id> [out-dir]
```

With no arguments, this composition runs a demo intervention fixture and writes to:

```text
skills/compositions/pilot-cycle-review/out/demo-pilot-review
```

## Outputs

- `cycle.json`
- `metrics.json`
- `audit-events.json`
- `telemetry-events.json`
- `digests.json`
- `routing-decisions.json`
- `exports-index.json`
- `analysis-export.json`
- `audit-export.json`
- `review-summary.md`

## Failure handling

Stop on CLI or lifecycle failures. Do not hand-edit missing export or telemetry files.

## Evaluation hooks

- Run the composition with no arguments for a deterministic local smoke.
- Run `npm run skills:audit` to verify composition packaging.
