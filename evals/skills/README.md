# ACP Skills V3 Evals

Status: hardened deterministic Skills V3 harness, proxy comparator, measured held-out slice, and live-provider portability pilot

This directory is the repo-local system of record for evaluating whether ACP skills improve deliberative workflow execution.

## Evidence Boundary

The deterministic harness supports fixture-level claims only. It can show that skill selection, escalation, claim-boundary checks, and artifact expectations are encoded and replayable. The old comparative output is a proxy fixture-policy comparator, not measured comparative proof. The measured held-out slice uses real model generation plus separated blinded surrogate adjudication, but it is still not human review and does not prove field efficacy.

## Layout

- `families/`: family definitions and reviewer questions
- `tasks/`: deterministic task fixtures
- `rubrics/`: scoring dimensions and thresholds
- `goldens/`: expected outcomes for fixtures
- `casebooks/`: human-readable failure and edge-case notes

## Commands

```sh
npm run skills:eval -- --mode deterministic --out artifacts/evals/skills/deterministic
npm run skills:compare -- --out artifacts/evals/skills/comparative
npm run skills:measured-generate -- --out artifacts/evals/skills/measured-comparative --max-budget-usd 12
npm run skills:measured-judge -- --source artifacts/evals/skills/measured-comparative/summary.json --out artifacts/evals/skills/measured-comparative/adjudication --max-budget-usd 14
npm run skills:live-adjudicate -- --out artifacts/evals/skills/live-provider --max-budget-usd 4
```

Outputs:

- `summary.json`
- `report.md`
- `failure-casebook.md`
- `divergence-taxonomy.md`
- `traces/*.json`

## Current Status

V3.1 is complete at the deterministic fixture level: 49 cases, all 7 families, all negative-control families, and live-divergence-seeded hard cases. The comparative baseline is a simulated fixture-policy comparator and must not be described as measured baseline proof. The V3 correction layer adds a 14-case measured held-out slice with 44 generated outputs, separated blinded surrogate adjudication, and a live-provider divergence adjudication layer. These artifacts improve evidence quality but do not establish broad full-skill superiority, operator utility, field efficacy, fairness solved, or institutional readiness.
