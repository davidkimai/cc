# ACP Public Release Staging Plan

Status: ready-to-execute staging checklist  
Owner: maintainer / senior research engineer

## Goal

Prepare a clean public-facing push to `https://github.com/davidkimai/acp` without accidentally publishing bulky regenerated trees, local runtime data, or reviewer-confusing internal debris.

## Staging principle

Use **three explicit staging packets**.

Do **not** stage the whole dirty tree at once.

1. public core
2. evaluation + ecosystem proof
3. skills + curated artifacts

## Pre-stage verification

Run this exact sequence first:

```bash
npm run build
npm run typecheck
npm test
npm run release:gate
npm run public:package:audit
```

Release if and only if all five are green.

## Curated artifact policy for the public branch

### Keep in git

- `artifacts/completion/final/`
- `artifacts/conference/rehearsal/README.md`
- `artifacts/conference/rehearsal/rehearsal-summary.json`
- `artifacts/evals/skills/final/`
- `artifacts/skills/`

### Regenerate locally, do not stage casually

- `artifacts/conference/foresight/`
- `artifacts/reports/`
- `artifacts/benchmarks/demo/`
- `artifacts/benchmarks/ablation/`
- `artifacts/benchmarks/scale/`
- `artifacts/evals/skills/study-*`
- `artifacts/evals/skills/measured-comparative/`
- `artifacts/evals/skills/live-provider/`
- `artifacts/evals/skills/deterministic/`
- `artifacts/evals/skills/comparative/`
- `artifacts/conference/rehearsal/flagship-benchmark/`
- `artifacts/conference/rehearsal/flagship-report/`
- `artifacts/conference/rehearsal/dogfood-run/`
- `artifacts/conference/rehearsal/adopter-http-run/`
- `artifacts/conference/rehearsal/runtime-data/`
- `skills/**/out/`

## Packet P1 — Public core

Stage:

```bash
git add \
  .github/workflows/ci.yml \
  .gitignore \
  AGENTS.md \
  README.md REVIEWER_START_HERE.md SUBMISSION_REPO_MAP.md CLAIMS_AND_NON_CLAIMS.md REPRODUCE.md \
  CONTRIBUTING.md SECURITY.md CITATION.cff LICENSE \
  package.json package-lock.json \
  public/ src/ protocol/ docs/README.md docs/specs/
```

Intent:
- protocol truth
- implementation truth
- public OSS metadata
- reviewer entrypoints

## Packet P2 — Evaluation and ecosystem proof

Stage:

```bash
git add \
  benchmarks/ evals/ fixtures/ runners/ adopters/ demo/ \
  src/sdk/ \
  docs/compatibility/ docs/deployment/ docs/pilot/ docs/reports/
```

Intent:
- out-of-browser proof
- reproducibility surfaces
- evaluator-facing inputs

## Packet P3 — Skills and curated evidence

Stage:

```bash
git add \
  skills/ src/skills/ \
  docs/strategy/ACP_PUBLIC_REPO_PACKAGING_PLAN.md \
  docs/strategy/ACP_PUBLIC_RELEASE_STAGING_PLAN.md \
  docs/strategy/ACP_EXECUTION_STATUS.md \
  docs/strategy/ACP_SKILLS_V3_STUDY_PROTOCOL.md \
  docs/strategy/ACP_SKILLS_V3_STATISTICAL_PLAN.md \
  artifacts/README.md \
  artifacts/completion/final/ \
  artifacts/conference/rehearsal/README.md \
  artifacts/conference/rehearsal/rehearsal-summary.json \
  artifacts/evals/skills/final/ \
  artifacts/skills/
```

Intent:
- constitutional skills layer
- behavioral-study-facing final claims surfaces
- compact public evidence

## Final pre-commit audit

Before commit, confirm:

```bash
git diff --cached --stat
git diff --cached --name-only
npm run public:package:audit
```

Manual checks:
- no accidental `runtime-data/`
- no `skills/**/out/`
- no bulky `artifacts/conference/foresight/`
- no absolute local machine paths in curated public surfaces
- no secrets or provider keys

## Commit discipline

Prefer three commits matching P1/P2/P3 rather than one monolithic commit.

Suggested commit subjects:

- `public core: protocol, implementation, and reviewer entrypoints`
- `public eval: benchmarks, runners, adopters, and SDK surfaces`
- `public skills: constitutional layer and curated claims artifacts`

## Push discipline

Do not push until:
- `npm run public:package:audit` is green
- staged diff is legible by packet
- reviewer entrypoints still match the committed artifact set
- maintainers have done a final `git diff --cached`
