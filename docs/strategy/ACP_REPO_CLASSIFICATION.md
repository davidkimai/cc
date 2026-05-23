# ACP Repo Classification

Status: stabilization classification
Date: 2026-05-20

## 1. Top-Level Path Classification

| Path | Bucket | Rationale |
| --- | --- | --- |
| `.github/` | `COMMIT_NOW` | CI workflow changes are claim-bearing release discipline source. |
| `README.md` | `COMMIT_NOW` | Public entrypoint and reviewer/adopter framing. |
| `package.json` | `COMMIT_NOW` | Script surface defines release, benchmark, report, conformance, and demo gates. |
| `package-lock.json` | `COMMIT_NOW` | Dependency lock for reproducible Node install. |
| `tsconfig.json` | `COMMIT_NOW` | Typecheck boundary. |
| `vitest.config.ts` | `COMMIT_NOW` | Test boundary. |
| `vitest.config.js` | `MANUAL_REVIEW` | Built or legacy config duplicate; review before freezing. |
| `src/` | `MANUAL_REVIEW` | Mixed current claim-bearing source and fresh Engine V2 work; split before claims-freeze commit. |
| `public/` | `MANUAL_REVIEW` | Claim-bearing Relay UI plus fresh Engine V2 operator surface changes; review in Foresight branch. |
| `tests/` | `MANUAL_REVIEW` | Claim-bearing regression tests plus fresh Engine V2 tests; split stable tests from Foresight work. |
| `docs/` | `MANUAL_REVIEW` | Contains claim-bearing specs/strategy docs and new stabilization/Foresight docs; freeze by reviewed subpath. |
| `protocol/` | `MANUAL_REVIEW` | Claim-bearing protocol bundle; schema now includes fresh Engine V2 fields and needs review before baseline claim freeze. |
| `benchmarks/` | `COMMIT_NOW` | Source benchmark scenarios and manifest support paper/evidence claims. |
| `fixtures/` | `COMMIT_NOW` | Replay fixtures support conformance and checkability claims. |
| `runners/` | `COMMIT_NOW` | Batch and HTTP proof surfaces support non-browser execution claims. |
| `scripts/` | `MANUAL_REVIEW` | Claim-bearing automation plus fresh Foresight package/ablation/scale additions; split by packet. |
| `adopters/` | `COMMIT_NOW` | External adopter starter supports outside-adoption claims. |
| `demo/` | `COMMIT_NOW` | Seeded demo source and bootstrap manifest support demoable ACP claims. |
| `artifacts/` | `FREEZE_AS_EVIDENCE` | Generated evidence; freeze selected summaries only, not whole tree. |
| `skills/` | `MANUAL_REVIEW` | Relay Blocks source is claim-bearing; `skills/**/out/` is ignored local output. |
| `.playwright-mcp/` | `IGNORE_LOCAL` | Browser automation traces/logs; reproducible and non-claim-bearing. |
| `.acp-demo/` | `IGNORE_LOCAL` | Generated local demo bundle; reproducible from `demo/` and scripts. |
| `.acp-data/` | `IGNORE_LOCAL` | Local runtime persistence already ignored. |
| `.owes-data/` | `IGNORE_LOCAL` | Local runtime persistence already ignored. |
| `dist/` | `IGNORE_LOCAL` | Build output already ignored. |
| `node_modules/` | `IGNORE_LOCAL` | Dependency install output already ignored. |
| `data/` | `MANUAL_REVIEW` | Contains pilot runtime data plus fresh Engine V2 prompt registry; split prompts from generated/runtime data. |

## 2. Completion-Audit Claim Support Files

These files directly support the current completion-audit claim set and should be reviewed as claim-bearing source:

| Claim | Supporting files |
| --- | --- |
| ACP can be explained without Relay UI code | `docs/protocol/README.md`, `protocol/acp-bundle.manifest.json`, `protocol/discovery.json`, `protocol/EXTERNAL_IMPLEMENTER_GUIDE.md` |
| ACP can be checked without trusting authors | `scripts/conformance/check-acp.mjs`, `fixtures/replay/manifest.json`, `tests/conformance.test.ts` |
| ACP runs outside the main browser flow | `scripts/batch/run-batch.ts`, `scripts/http-client/run-http-scenario.mjs`, `adopters/typescript-http-starter/src/run.ts` |
| ACP has an outside adoption path | `adopters/typescript-http-starter/README.md`, `src/sdk/index.ts`, `protocol/compatibility/compatibility-matrix.json` |
| ACP produces inspectable evidence | `benchmarks/manifest.json`, `scripts/benchmark/run-benchmark.mjs`, `scripts/report/build-report-bundle.mjs` |
| Relay has production discipline | `src/api/ops.ts`, `scripts/release/run-release-gate.mjs`, `scripts/workspace/workspace-archive.mjs` |

Fresh Engine V2 completion-audit expansion is classified as `MANUAL_REVIEW` until the Foresight branch is intentionally promoted into the claim-bearing baseline.

## 3. Selected Evidence Freeze Set

Classify these as `FREEZE_AS_EVIDENCE`:

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

Classify all nested runtime data under generated benchmark/report/conference output as `MANUAL_REVIEW` unless a reviewer explicitly promotes a specific file.

## 4. Fresh Foresight / Engine V2 Work

These paths are valuable but should not be silently included in a claims-freeze commit:

- `docs/strategy/ACP_ENGINE_V2_POSITIONING.md`
- Engine V2 sections in `docs/specs/ACP_COORDINATION_ENGINE_SPEC.md`
- `data/prompts/engine-v2/`
- `src/services/engine-v2.ts`
- `src/services/model-audit.ts`
- `src/services/model-cache.ts`
- `src/services/model-provider.ts`
- `src/services/model-schemas.ts`
- `src/services/openai-provider.ts`
- Engine V2 additions in `src/core/types.ts`, `src/services/cycle-service.ts`, `src/services/pipeline.ts`, `public/app.js`, `protocol/acp-canonical.schema.json`, `scripts/benchmark/run-benchmark.mjs`, `scripts/report/build-report-bundle.mjs`, `scripts/visual-artifacts/generate-visual-artifact.mjs`, `scripts/completion/run-completion-audit.mjs`, and `package.json`
- `tests/engine-v2.test.ts`

Recommendation: keep these on `foresight/engine-v2-recursive-deliberation` until they pass the full gate and are reviewed as new claims.

