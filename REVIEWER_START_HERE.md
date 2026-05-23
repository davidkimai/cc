# Reviewer Start Here

This repository is designed to be legible both as software and as a paper companion to **_Collective Deliberation Is a Skill Issue_**.

ACP is a **protocol-first system for AI-assisted collective deliberation under bounded attention**. Relay is the first reference implementation. The skills layer adds procedural interventions that can be evaluated separately from the core protocol, and ACP now exposes a protocol-adjacent procedural layer for procedure references, contest points, artifact expectations, and escalation provenance.

If you want the shortest copy-paste reproduction path, go directly to [`REPRODUCE.md`](REPRODUCE.md). That path uses real provider calls and requires your own `OPENAI_API_KEY`.

For the final submission-facing map and bounded claim surface, also read:

- [`SUBMISSION_REPO_MAP.md`](SUBMISSION_REPO_MAP.md)
- [`CLAIMS_AND_NON_CLAIMS.md`](CLAIMS_AND_NON_CLAIMS.md)

## Recommended reading order

### 1. Understand the system

1. [`README.md`](README.md)
2. [`SUBMISSION_REPO_MAP.md`](SUBMISSION_REPO_MAP.md)
3. [`CLAIMS_AND_NON_CLAIMS.md`](CLAIMS_AND_NON_CLAIMS.md)
4. [`protocol/README.md`](protocol/README.md)
5. [`docs/specs/ACP_TECHNICAL_SPEC.md`](docs/specs/ACP_TECHNICAL_SPEC.md)
6. [`docs/specs/ACP_COORDINATION_ENGINE_SPEC.md`](docs/specs/ACP_COORDINATION_ENGINE_SPEC.md)
7. [`docs/specs/RELAY_REFERENCE_IMPLEMENTATION_SPEC.md`](docs/specs/RELAY_REFERENCE_IMPLEMENTATION_SPEC.md)

### 2. Inspect the strongest repo-local evidence

#### Flagship protocol / rehearsal surface

- [`artifacts/conference/rehearsal/README.md`](artifacts/conference/rehearsal/README.md)
- [`artifacts/conference/rehearsal/rehearsal-summary.json`](artifacts/conference/rehearsal/rehearsal-summary.json)

#### Skills / procedural intervention surface

- [`skills/CONSTITUTIONAL_SKILLS.md`](skills/CONSTITUTIONAL_SKILLS.md)
- [`artifacts/evals/skills/final/reviewer-start-here.md`](artifacts/evals/skills/final/reviewer-start-here.md)
- [`artifacts/evals/skills/final/skills-v3-claims-memo.md`](artifacts/evals/skills/final/skills-v3-claims-memo.md)
- [`artifacts/evals/skills/final/skills-v3-results-overview.md`](artifacts/evals/skills/final/skills-v3-results-overview.md)
- [`artifacts/evals/skills/final/skills-v3-non-claims.md`](artifacts/evals/skills/final/skills-v3-non-claims.md)

#### Completion / release discipline

- [`artifacts/completion/final/technical-completion-audit.md`](artifacts/completion/final/technical-completion-audit.md)
- [`artifacts/completion/final/technical-completion-audit.json`](artifacts/completion/final/technical-completion-audit.json)

## Offline reproduction path

These steps avoid live-provider cost and are the best first-pass reproduction route.

```bash
npm install
npm run build
npm run typecheck
npm test
npm run demo:bootstrap
npm run demo:summary
npm run benchmark:compare -- --class public-hearing-triage
npm run conference:rehearsal
npm run skills:audit -- --out /tmp/acp-skills-audit
npm run completion:audit -- --out /tmp/acp-completion-audit
```

## Optional provider-backed reproduction

Some study and portability paths make real provider calls.

Before running any of them, read:

- [`docs/evaluation/skills-live-provider-budget.md`](docs/evaluation/skills-live-provider-budget.md)

Current policy:

- default model: `gpt-5.4-mini`
- arbitration / hard cases only: `gpt-5.4`
- live-provider work is informative but cost-controlled and explicitly bounded

Provide credentials via environment variables such as `OPENAI_API_KEY`. Do not commit secrets, raw keys, or accidental provider traces.

## How to interpret the repo

The repository intentionally separates:

- **protocol truth** in [`protocol/`](protocol/) and [`docs/specs/`](docs/specs/)
- **reference-implementation truth** in [`src/`](src/), [`public/`](public/), and tests
- **procedural skill truth** in [`skills/`](skills/) and [`skills/registry.json`](skills/registry.json)
- **evaluation truth** in [`benchmarks/`](benchmarks/), [`evals/`](evals/), and curated [`artifacts/`](artifacts/)

## Claims boundary

This repo supports a credible submission package for:

- protocol-first coordination infrastructure
- an inspectable reference implementation
- benchmark and rehearsal evidence
- a conservative study layer for ACP skills as procedural interventions

This repo does **not** by itself establish:

- real-world civic efficacy
- operator utility without human-review evidence
- that fairness is solved
- broad comparative superiority across all tasks and institutions

If you only read one bounded-claims artifact, read:

- [`artifacts/evals/skills/final/skills-v3-claims-memo.md`](artifacts/evals/skills/final/skills-v3-claims-memo.md)
