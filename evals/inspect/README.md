# ACP Inspect AI Mirror

Status: thin compatibility layer, not canonical evaluation truth

ACP's primary evaluation harness remains repo-native.
This directory provides an **Inspect AI mirror** for the most load-bearing ACP slices so evaluators who read modern AI safety evals through Inspect can exercise ACP in a familiar interface.

## Boundary

The Inspect layer does **not** replace:

- `evals/skills/`
- `scripts/evals/`
- `src/skills/`
- curated ACP claims artifacts

ACP's source of truth remains the repo-native civic / procedural harness.

## What is mirrored now

### 1. Skills measured held-out slice

Canonical sources:
- `evals/skills/tasks/v3-measured-heldout.json`
- `src/skills/materialize.ts`
- `src/skills/adherence.ts`
- `scripts/evals/run-skills-measured-comparative.mjs`
- `scripts/evals/judge-skills-measured-outputs.mjs`

Inspect mirror task:
- `acp_inspect/tasks/skills_measured_eval.py@acp_skills_measured`

### 2. Flagship public-hearing benchmark mirror

Canonical sources:
- `benchmarks/scenarios/public-hearing-triage/`
- `scripts/benchmark/run-benchmark.mjs`

Inspect mirror task:
- `acp_inspect/tasks/public_hearing_eval.py@acp_public_hearing_flagship`

## Prepare exports

```bash
npm run inspect:export
```

This writes normalized mirror inputs to:

- `artifacts/tmp/inspect/exports/skills-measured.json`
- `artifacts/tmp/inspect/exports/public-hearing.json`

## Run a no-cost mock smoke

```bash
npm run inspect:smoke
```

This uses `mockllm/model` so the mirror can be verified without provider spend.

## Run the real Inspect packet

Bring your own `OPENAI_API_KEY`.

### Measured skills mirror run

```bash
npm run inspect:eval:skills:real
```

Writes summary artifacts to:

- `artifacts/evals/inspect/skills-measured-real-run/summary.json`
- `artifacts/evals/inspect/skills-measured-real-run/summary.md`

### Mirror-fidelity summary against native ACP artifacts

```bash
npm run inspect:mirror:summary
```

Writes:

- `artifacts/evals/inspect/skills-measured-mirror-summary.json`
- `artifacts/evals/inspect/skills-measured-mirror-summary.md`

### Flagship public-hearing comparative adjudication

```bash
npm run inspect:eval:public-hearing:real
```

This uses paired A/B orderings over actual benchmark outputs, not only scenario definitions.

Writes:

- `artifacts/evals/inspect/public-hearing-comparative/summary.json`
- `artifacts/evals/inspect/public-hearing-comparative/summary.md`

### End-to-end packet

```bash
npm run inspect:packet
```

## Claims discipline

The Inspect mirror does **not** upgrade ACP's claims.
It should be interpreted with the same boundaries as the native ACP evidence stack:

- not field efficacy
- not fairness solved
- not operator utility
- not institutional legitimacy
- not broad full-skill superiority

What this layer adds is **ecosystem legibility**, not magical extra evidence.
