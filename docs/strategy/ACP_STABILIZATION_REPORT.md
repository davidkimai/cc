# ACP Stabilization Report

Status: complete
Date: 2026-05-20

## 1. Snapshot

Created non-git snapshot:

- `/tmp/acp-stabilization-snapshot-20260520-134847/`

Excluded:

- `.git/`
- `node_modules/`
- `dist/`
- `.DS_Store`

## 2. Classification Outcome

The dirty tree is not a single clean commit unit.

It contains:

- claim-bearing source and tests from the completed conference-production ecosystem run
- selected generated evidence worth freezing
- clearly local debris now ignored by `.gitignore`
- fresh Foresight / Engine V2 implementation work that should continue on a separate branch/worktree after stabilization

Detailed classification lives in:

- `docs/strategy/ACP_REPO_CLASSIFICATION.md`

## 3. Ignore Update

Applied minimal ignore rules:

```gitignore
.playwright-mcp/
.acp-demo/
skills/**/out/
```

No generated evidence directory was globally ignored.

## 4. Claims-Safe Branch Boundary

Recommended baseline branch:

- `stabilization/claims-freeze-20260520`

Recommended Foresight continuation branch:

- `foresight/engine-v2-recursive-deliberation`

The baseline branch should commit reviewed `COMMIT_NOW` source and the selected `FREEZE_AS_EVIDENCE` files only. The Foresight branch should carry Engine V2 work until it is reviewed and promoted.

## 5. Verification

Completed:

```bash
npm run release:gate
npm run --silent completion:audit -- --out /tmp/acp-stabilized-audit
```

### `npm run release:gate`

Result: `pass`

Key output:

```json
{
  "ok": true,
  "smoke": false,
  "checks": [
    { "name": "release-smoke", "status": "pass" },
    { "name": "build", "status": "pass" },
    { "name": "typecheck", "status": "pass" },
    { "name": "test", "status": "pass" },
    { "name": "conformance", "status": "pass" },
    { "name": "benchmark-compare", "status": "pass" },
    { "name": "adopter-starter", "status": "pass" },
    { "name": "dogfood-relay", "status": "pass" },
    { "name": "workspace-export", "status": "pass" },
    { "name": "workspace-import", "status": "pass" },
    { "name": "report-bundle", "status": "pass" },
    { "name": "completion-audit", "status": "pass" }
  ]
}
```

### Stabilized completion audit

Result: `pass`

Output:

```json
{
  "outDir": "/tmp/acp-stabilized-audit",
  "status": "pass",
  "claims": 7
}
```

## 6. Result

The stabilization packet is complete.

Current claim-bearing source, selected generated evidence, local debris, and manual-review Foresight / Engine V2 paths are classified. Local debris ignore rules are in place. The mixed working tree still passes the release gate and completion audit, but the classification explicitly prevents treating the fresh Engine V2 work as automatically promoted baseline claims.

After stabilization, the Foresight package was generated at:

- `artifacts/conference/foresight/`

Key package outputs:

- `artifacts/conference/foresight/foresight-package-summary.json`
- `artifacts/conference/foresight/artifact-index.json`
- `artifacts/conference/foresight/venue-framing-memo.md`
- `artifacts/conference/foresight/reviewer-start-here.md`
- `artifacts/conference/foresight/draft-abstract.md`
- `artifacts/conference/foresight/contribution-list.md`
- `artifacts/conference/foresight/omission-fairness-casebook.md`
- `artifacts/conference/foresight/figure-plan.md`
- `artifacts/conference/foresight/limitations-and-non-claims.md`
- `artifacts/conference/foresight/demo-script.md`

Foresight package result: `ok: true`, with 136 indexed artifacts.

Final post-package gates:

```bash
npm run release:gate
npm run --silent completion:audit -- --out artifacts/completion/foresight
```

Results:

- `release:gate`: pass
- `completion:audit`: pass, 7 claims, output at `artifacts/completion/foresight`

Recommended next move:

1. Create `stabilization/claims-freeze-20260520` for the reviewed baseline.
2. Selectively commit `COMMIT_NOW` paths and the selected `FREEZE_AS_EVIDENCE` files.
3. Continue Foresight / Engine V2 implementation on `foresight/engine-v2-recursive-deliberation`.
