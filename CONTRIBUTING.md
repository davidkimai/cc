# Contributing to ACP

Thanks for helping improve ACP.

This repository mixes protocol work, reference-implementation work, procedural skills, benchmarks, and claim-bearing research artifacts. Good contributions preserve those boundaries instead of collapsing them.

## Before you change anything

Read:

1. [`README.md`](README.md)
2. [`AGENTS.md`](AGENTS.md)
3. [`protocol/README.md`](protocol/README.md)
4. [`docs/README.md`](docs/README.md)

## Source-of-truth hierarchy

When files disagree, use this order:

1. **Protocol truth**: [`protocol/`](protocol/) and [`docs/specs/`](docs/specs/)
2. **Typed implementation truth**: [`src/core/`](src/core/) and implementation code under [`src/`](src/)
3. **Operational and evaluation material**: [`docs/`](docs/), [`benchmarks/`](benchmarks/), [`evals/`](evals/), [`artifacts/`](artifacts/)
4. **Skills**: procedural execution aids, not the protocol itself

Two key rules:

- Keep ACP protocol semantics out of skill prose.
- Do not casually edit claim-bearing artifacts without also updating the generating logic or documenting why the artifact is intentionally hand-maintained.

## Local setup

Requirements:

- Node.js 20+

Setup:

```bash
npm install
npm run build
npm run typecheck
npm test
```

Run the app:

```bash
npm run dev
```

## Preferred contributor workflow

1. make the smallest coherent change
2. update tests or fixtures when behavior changes
3. run the narrowest relevant command first
4. run broader gates before proposing a release-bound change
5. document non-obvious claim or evidence implications

Useful commands:

```bash
npm run build
npm run typecheck
npm test
npm run release:smoke
npm run release:gate
npm run demo:bootstrap
npm run benchmark:compare -- --class public-hearing-triage
npm run skills:audit -- --out /tmp/acp-skills-audit
npm run completion:audit -- --out /tmp/acp-completion-audit
```

## Artifact policy

This repository intentionally versions **curated, claim-bearing artifacts**, not every raw output.

### Good to commit

- source code and tests
- protocol bundle changes
- benchmark definitions and eval fixtures
- small summary JSON/CSV/Markdown artifacts referenced by the paper or reviewer flows
- study protocols and statistical plans

### Usually do not commit

- bulky scratch outputs
- repeated raw traces
- local runtime stores
- browser logs
- provider secrets or credentials
- ad hoc `out/` folders unless they are part of a reviewed workflow

Prefer one of these for local runs:

- `/tmp/...`
- `artifacts/local/...` (ignored)
- another clearly local scratch path

See [`artifacts/README.md`](artifacts/README.md) for the public artifact policy.

## Claims discipline

Contributions should preserve ACP's current bounded-claims posture.

Do not introduce unsupported claims such as:

- field efficacy
- fairness solved
- institutional legitimacy by default
- broad comparative superiority across all tasks/settings
- operator utility without human review evidence

If you improve an evidence surface, update the relevant summary or claims memo so reviewers can see the new boundary clearly.

## Live-provider work

Some scripts call external model providers and incur cost.

Before running them, read:

- [`docs/evaluation/skills-live-provider-budget.md`](docs/evaluation/skills-live-provider-budget.md)

Current default policy:

- `gpt-5.4-mini` for most judging/scoring/critique
- `gpt-5.4` only for arbitration or hard cases

Provide credentials through environment variables such as `OPENAI_API_KEY`. Never commit secrets.

## Pull request checklist

Before opening a PR, make sure you can honestly say:

- the change respects the source-of-truth hierarchy
- changed behavior has tests, fixtures, or an explained reason why not
- docs reflect the new public/reviewer story when needed
- generated artifacts are curated and intentional
- claims remain within the evidence boundary
