# ACP Repo Stabilization Plan

Status: claims-safe stabilization packet
Owner: senior researcher / engineer
Date: 2026-05-20

## 1. Purpose

This packet creates a reviewable boundary between claim-bearing ACP source, claim-bearing generated evidence, local ephemeral debris, and ambiguous paths that need manual review before any freeze or commit.

This is not a feature packet. No broad Foresight / Engine V2 implementation should continue until this packet has:

- preserved a non-git snapshot
- classified the dirty tree
- tightened only clearly safe ignore rules
- identified small evidence artifacts worth freezing
- rerun the release gate and completion audit

## 2. Safety Snapshot

Snapshot path:

- `/tmp/acp-stabilization-snapshot-20260520-134847/`

Snapshot command:

```bash
rsync -a --delete --exclude '.git/' --exclude 'node_modules/' --exclude 'dist/' --exclude '.DS_Store' ./ /tmp/acp-stabilization-snapshot-20260520-134847/
```

The snapshot preserves the working tree, including untracked source and generated evidence, while excluding obvious heavyweight dependency/build output.

## 3. Classification Buckets

Use exactly four buckets:

- `COMMIT_NOW`: source, tests, docs, fixtures, scripts, or small config files that are needed for current claims and should be reviewed as source.
- `FREEZE_AS_EVIDENCE`: generated outputs that directly support current claims and are small enough to review.
- `IGNORE_LOCAL`: reproducible local debris or tool traces.
- `MANUAL_REVIEW`: mixed or ambiguous paths, especially broad generated output, runtime data, or fresh Foresight / Engine V2 work that should move to a separate branch before becoming claim-bearing.

## 4. Minimal Ignore Update

Applied local-debris ignore rules:

```gitignore
.playwright-mcp/
.acp-demo/
skills/**/out/
```

Rationale:

- `.playwright-mcp/` contains browser automation logs/traces.
- `.acp-demo/` is a generated local demo copy.
- `skills/**/out/` contains reproducible block run outputs.

`artifacts/` is intentionally not ignored wholesale because selected summary artifacts may be claim-bearing.

## 5. Evidence Freeze Policy

Do not commit all generated output. Freeze only small summary files that are necessary to review claims.

Recommended freeze set:

- `artifacts/completion/final/technical-completion-audit.json`
- `artifacts/completion/final/technical-completion-audit.md`
- `artifacts/completion/final/remaining-human-layer-work.md`
- `artifacts/conference/rehearsal/rehearsal-summary.json`
- `artifacts/conference/rehearsal/README.md`
- `artifacts/benchmarks/flagship/public-hearing-triage/bundle-manifest.json`
- `artifacts/benchmarks/flagship/public-hearing-triage/comparison-summary.json`
- `artifacts/benchmarks/flagship/public-hearing-triage/comparison-summary.md`
- `artifacts/reports/flagship/public-hearing-triage/evidence-index.json`
- `artifacts/reports/flagship/public-hearing-triage/research-review.md`
- `artifacts/reports/flagship/public-hearing-triage/operator-review.md`

Runtime databases, full cycle dumps, HTML pages, and nested generated run directories should remain reviewable but should not be blindly committed.

## 6. Branch Boundary Recommendation

Recommended frozen baseline branch:

- `stabilization/claims-freeze-20260520`

Recommended Foresight continuation branch:

- `foresight/engine-v2-recursive-deliberation`

The baseline branch should include current claim-bearing source plus the selected evidence freeze set. Fresh Engine V2 implementation files should be reviewed separately before merging into the baseline claim surface.

## 7. Required Gates

Run after stabilization docs and ignore rules are in place:

```bash
npm run release:gate
npm run --silent completion:audit -- --out /tmp/acp-stabilized-audit
```

The stabilization report must record exact outcomes before Foresight work resumes.

