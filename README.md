# ACP

ACP stands for **Attention Coordination Protocol**.

This repository is the main public home for:

- **ACP**: the protocol and canonical object model
- **Relay**: the first working reference implementation
- **ACP skills / Relay Blocks**: reusable procedural modules for agent and operator workflows

ACP is a protocol-first system for **AI-assisted collective deliberation under bounded attention**. Instead of showing every participant the same undifferentiated feed, ACP treats discussion as a coordination problem: collect contributions, route or summarize them under explicit criteria, release outputs at the right stage, and preserve the resulting trace for audit, review, and downstream analysis.

This repo also serves as the paper companion for **_Collective Deliberation Is a Skill Issue_**.

## Three ways to use this repo

### 1) Review ACP in 5 minutes
Start here if you are reading the repository alongside a paper, workshop submission, or review packet.

1. Read [`REVIEWER_START_HERE.md`](REVIEWER_START_HERE.md)
2. Read [`SUBMISSION_REPO_MAP.md`](SUBMISSION_REPO_MAP.md)
3. Read [`CLAIMS_AND_NON_CLAIMS.md`](CLAIMS_AND_NON_CLAIMS.md)
4. Read [`REPRODUCE.md`](REPRODUCE.md) for the copy-paste reproduction path
5. Read [`protocol/README.md`](protocol/README.md)
6. Inspect the flagship rehearsal summary surface in [`artifacts/conference/rehearsal/README.md`](artifacts/conference/rehearsal/README.md) and [`artifacts/conference/rehearsal/rehearsal-summary.json`](artifacts/conference/rehearsal/rehearsal-summary.json)
7. Inspect the skills evidence packet in [`artifacts/evals/skills/final/`](artifacts/evals/skills/final/)

### 2) Run the reference implementation
Start here if you want to run Relay locally.

```bash
npm install
npm run dev
```

Helpful next steps:

```bash
npm run demo:bootstrap
npm run demo:summary
npm run release:smoke
```

### 3) Inspect benchmarks and study evidence
Start here if you care about evaluation, portability, or workshop evidence.

- [`benchmarks/README.md`](benchmarks/README.md)
- [`evals/skills/README.md`](evals/skills/README.md)
- [`evals/inspect/README.md`](evals/inspect/README.md) for the Inspect AI mirror of the measured skills slice and flagship public-hearing benchmark
- [`artifacts/evals/inspect/`](artifacts/evals/inspect/) for the real-run mirror summaries and public-hearing comparative packet
- [`artifacts/completion/final/`](artifacts/completion/final/)
- [`artifacts/evals/skills/final/`](artifacts/evals/skills/final/)
- [`skills/CONSTITUTIONAL_SKILLS.md`](skills/CONSTITUTIONAL_SKILLS.md)
- [`artifacts/skills/constitutional-skills-map.md`](artifacts/skills/constitutional-skills-map.md)
- [`docs/evaluation/skills-live-provider-budget.md`](docs/evaluation/skills-live-provider-budget.md)

## Paper-companion reproduction

If you want the shortest copy-paste reproduction path for the load-bearing claims package, run:

```bash
git clone https://github.com/davidkimai/acp.git
cd acp
npm install
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run reproduce:claims -- --out /tmp/acp-load-bearing-claims
```

This path uses **real provider calls** for the skills evidence surfaces. It does **not** use dry runs. When it finishes, start with:

- `/tmp/acp-load-bearing-claims/README.md`
- `/tmp/acp-load-bearing-claims/summary.json`
- [`REPRODUCE.md`](REPRODUCE.md) for fuller notes, budgets, and interpretation boundaries
- [`CLAIMS_AND_NON_CLAIMS.md`](CLAIMS_AND_NON_CLAIMS.md) for the conference-facing claim boundary

## What is in this repository

This repository combines four layers that are intentionally kept distinct:

1. **Protocol truth**: the ACP contract, canonical schema bundle, compatibility boundaries, and implementer guidance
2. **Reference implementation truth**: Relay's web app, CLI, API server, storage layer, release gates, and tests
3. **Procedural skill layer**: reusable ACP skills / Relay Blocks, with a constitutional core for public reasoning, package metadata, compositions, and protocol-adjacent procedural governance attachments
4. **Evidence layer**: benchmarks, study harnesses, rehearsal bundles, audits, and curated claim-bearing artifacts

In practice, that means this repo includes:

- the ACP schema bundle and compatibility matrix
- a working web app, CLI, and local API server
- seeded demo data for intervention vs baseline walkthroughs
- benchmark and replay harnesses
- adopter and runner proof surfaces beyond the browser UI
- reusable skills and compositions for agent/operator workflows
- completion audits, rehearsal bundles, and skills-study artifacts

## What Relay currently does

Relay supports two comparable discussion conditions built on the same cycle model:

- `intervention`: routed digests with explanations and review traces
- `baseline_thread`: chronological thread presentation on the same cycle shell

Across those conditions, Relay already supports:

- cycle creation and lifecycle control
- participant contribution, response, and feedback capture
- routing decisions and digest production for intervention cycles
- audit events, telemetry, and export generation
- inspection through both the web app and the CLI

## Source-of-truth hierarchy

If files disagree, use this order:

1. **Protocol semantics**: [`protocol/`](protocol/) and [`docs/specs/`](docs/specs/)
2. **Typed implementation semantics**: [`src/core/`](src/core/) and implementation code under [`src/`](src/)
3. **Operational and evaluation material**: [`docs/`](docs/), [`benchmarks/`](benchmarks/), [`evals/`](evals/), [`artifacts/`](artifacts/)
4. **Skills**: procedural execution aids, not the protocol itself

A shorter repo map is available in [`AGENTS.md`](AGENTS.md).

## Fast local setup

Requirements:

- Node.js 20+

Install and run:

```bash
npm install
npm run build
npm run typecheck
npm test
npm run dev
```

Default local settings:

- host: `127.0.0.1`
- port: `4317`
- data directory: `.acp-data/`

Environment variables:

- `ACP_HOST`
- `ACP_PORT`
- `ACP_DATA_DIR`

## Reproduce the main evidence surfaces

For the full paper-companion reproduction path, including real provider-backed skills results, use [`REPRODUCE.md`](REPRODUCE.md).

Use repo-local outputs only when you intentionally want to refresh tracked artifacts. For ordinary inspection, prefer temporary output paths.

### Demo bundle

```bash
npm run demo:bootstrap
npm run demo:summary
```

See [`demo/README.md`](demo/README.md).

### Technical and release checks

```bash
npm run release:smoke
npm run release:gate
npm run completion:audit -- --out /tmp/acp-completion-audit
```

### Flagship benchmark / rehearsal surface

```bash
npm run benchmark:compare -- --class public-hearing-triage
npm run conference:rehearsal
```

Primary artifacts:

- [`artifacts/conference/rehearsal/rehearsal-summary.json`](artifacts/conference/rehearsal/rehearsal-summary.json)
- [`artifacts/conference/rehearsal/README.md`](artifacts/conference/rehearsal/README.md)

### Skills structural audit and study surfaces

```bash
npm run skills:audit -- --out /tmp/acp-skills-audit
npm run skills:compare -- --out /tmp/acp-skills-comparative
```

For the current claims package, read:

- [`artifacts/evals/skills/final/reviewer-start-here.md`](artifacts/evals/skills/final/reviewer-start-here.md)
- [`artifacts/evals/skills/final/skills-v3-claims-memo.md`](artifacts/evals/skills/final/skills-v3-claims-memo.md)
- [`artifacts/evals/skills/final/skills-v3-results-overview.md`](artifacts/evals/skills/final/skills-v3-results-overview.md)

## Optional live-provider reproduction

Some evaluation paths make real provider calls and incur cost.

Before running them, read:

- [`docs/evaluation/skills-live-provider-budget.md`](docs/evaluation/skills-live-provider-budget.md)

Model policy for these runs:

- default: `gpt-5.4-mini`
- arbitration / hard cases only: `gpt-5.4`

Set credentials through environment variables such as `OPENAI_API_KEY`. Do not commit secrets or paste them into tracked artifacts.

## Claims boundary

This repository is intended to support a conservative, inspectable submission package.

What the current repo supports well:

- ACP as a protocol-first coordination system
- Relay as a functioning reference implementation
- benchmark, audit, and rehearsal surfaces that preserve inspectable traces
- a procedural skills layer with structural audits and behavioral-study artifacts

What the current repo does **not** justify on its own:

- field efficacy claims
- claims that fairness is solved
- claims of institutional legitimacy by default
- broad superiority claims across all tasks and settings
- operator-utility claims without human review evidence

For the current bounded non-claims, see [`artifacts/evals/skills/final/skills-v3-non-claims.md`](artifacts/evals/skills/final/skills-v3-non-claims.md).

## Repository layout

```text
src/                 server, API, core types, services, CLI, study substrate
public/              Relay web app
protocol/            schema bundle, examples, discovery, compatibility matrix
skills/              ACP skills / Relay Blocks, manifests, compositions
benchmarks/          seeded benchmark classes and comparison harnesses
evals/               evaluation fixtures, studies, and task sets
demo/                synthetic demo bundle for intervention vs baseline walkthroughs
runners/             batch and API-driven proof surfaces
adopters/            external-adopter starter example(s)
scripts/             release, reporting, benchmarks, skills, and conference tooling
docs/specs/          normative product, protocol, and platform specs
docs/compatibility/  practical compatibility notes for implementers
docs/evaluation/     evaluation instruments and live-provider budget policy
artifacts/           curated claim-bearing outputs checked into the repo
```

## Additional entry points

- [`protocol/EXTERNAL_IMPLEMENTER_GUIDE.md`](protocol/EXTERNAL_IMPLEMENTER_GUIDE.md)
- [`docs/README.md`](docs/README.md)
- [`benchmarks/README.md`](benchmarks/README.md)
- [`demo/README.md`](demo/README.md)
- [`artifacts/README.md`](artifacts/README.md)

## Naming note

- **ACP** = the protocol
- **Relay** = the first implementation
- **ACP skills / Relay Blocks** = the reusable procedural layer
