# ACP Repo Map

Use this file as a short table of contents. Detailed operating rules live in the linked docs, specs, evals, and scripts.

## Source Of Truth

- Protocol truth: `protocol/`, `docs/specs/`, and typed models in `src/core/`.
- Relay implementation truth: `src/`, `public/`, `scripts/`, and tests.
- Skills truth: `skills/`, `skills/registry.json`, and `docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md`.
- Skills V3 proof truth: `evals/skills/`, `artifacts/evals/skills/`, and `docs/strategy/ACP_SKILLS_V3_*`.
- Execution control plane: `docs/strategy/ACP_EXECUTION_STATUS.md`.

## Working Rules

- Keep ACP protocol semantics out of skill prose; skills are procedural execution aids.
- Treat `skills:audit` as structural maturity evidence only.
- Treat `skills:eval` and live-provider pilot artifacts as the Skills V3 behavioral-evidence surfaces.
- Preserve non-claims: no field efficacy, fairness-solved, or broad comparative superiority claims without the matching evidence layer.
- Do not run destructive git cleanup, broad staging, or commits unless explicitly asked.

## Current Direction

Skills V3 asks whether ACP skills materially improve deliberative workflow quality. Work harness-first: fixtures, rubrics, traces, scorecards, failure reports, then broader runtime or provider waves.
