# ACP Execution Status

Status: live control plane for long-running Codex execution  
Owner: ACP senior researcher / engineer  
Primary executor: Codex

## Usage rule

After every meaningful packet, update:

- `Current packet`
- `Objective`
- `Touched files`
- `Verification`
- `Outcome`
- `Blockers`
- `Next packet`

Do not let long runs continue without updating this file.

---

## Current overall status

- Phase: `Skills V3 behavioral study complete; procedural-layer attachment packet active`
- Repo plans:
  - `docs/strategy/ACP_FORESIGHT_SUPERCOOPERATION_MASTER_PLAN.md`
  - `docs/strategy/ACP_SKILLS_V2_MASTER_PLAN.md`
  - `docs/strategy/ACP_SKILLS_V3_EXECUTION_PROVEN_PLAN.md`
- Primary blocker summary:
  1. browser telemetry truth gap — cleared in `P0.1`
  2. flagship evaluation family — frozen in `P0.2` as `public-hearing-triage`
  3. canonical storage evolution path — frozen in `P0.3` as SQLite-first production alpha
  4. production-alpha auth/session hardening — cleared in `P0.4`
  5. criteria-aware evidence, external adopter path, product surfacing, rehearsal bundle, completion audit, and release gate — cleared through `P2.1`
  6. Skills V2 maturity standard, audit gate, flagship skills, new critic/escalation/packaging skills, and robust compositions — cleared in `S2.1`
  7. Skills V3 deterministic harness is hardened to 49 cases; the old synthetic comparison is relabeled as a proxy fixture-policy comparator
  8. Skills V3 now has a behavioral intervention study program: a 35-case within-case measured generation study, dual blinded surrogate adjudication, adherence/fidelity analysis, enriched live cohort, and regenerated conservative claims package
  9. Operator-utility claims remain blocked until actual human reviewer judgments are collected
  10. Skills are being recentered as a constitutional procedural layer with broader cross-domain compositions and stronger machine-readable framing

---

## Current packet

### Packet ID
`Public Release Staging Discipline`

### Objective
Prepare the repo for a deliberate overwrite of the old public `main` branch by tightening artifact curation, path hygiene, and maintainer staging discipline without committing or pushing yet.

### Required work
- tighten `.gitignore` around bulky regenerated artifact trees
- fix public-doc path hygiene issues
- make the conference rehearsal summary public-safe by removing local absolute-path leakage
- add an automated public-package audit command
- write an explicit staging plan with packetized `git add` boundaries

### Touched files
- `.gitignore`
- `README.md`
- `SUBMISSION_REPO_MAP.md`
- `benchmarks/README.md`
- `artifacts/README.md`
- `scripts/conference/build-rehearsal-bundle.mjs`
- `scripts/release/audit-public-package.mjs`
- `package.json`
- `docs/strategy/ACP_PUBLIC_REPO_PACKAGING_PLAN.md`
- `docs/strategy/ACP_PUBLIC_RELEASE_STAGING_PLAN.md`
- `artifacts/conference/rehearsal/README.md`
- `artifacts/conference/rehearsal/rehearsal-summary.json`

### Verification
```bash
npm run --silent conference:rehearsal -- --skip-build --out artifacts/conference/rehearsal
npm run public:package:audit
```

### Outcome
- bulky regenerated artifact trees are now ignored by default while curated reviewer-facing artifacts remain stageable
- the tracked rehearsal summary surface is now free of local absolute-path leakage and aligned to a summary-only public branch policy
- the repo now has a machine-readable public-package audit (`npm run public:package:audit`)
- maintainers now have an explicit packetized staging plan for P1/P2/P3 rather than a risky broad stage-and-push workflow

### Blockers
- the repo is still broadly dirty because many substantive local changes remain intentionally uncommitted
- raw local/generated trees still exist on disk even when ignored from the public branch
- human-review evidence remains uncollected
- final commit selection still requires maintainer judgment across the large dirty tree

### Next packet
Use the new staging plan and audit command to assemble the actual commit set packet by packet, inspect `git diff --cached` after each packet, and only then prepare the final public push.

---

## Upcoming packet queue

- External review: collect human reviewer judgments on the prepared review packet plus Study B/D disagreement cases.
- Rubric repair: use reviewer feedback to decide whether action-label mismatches should be scorer repairs, skill repairs, or acceptable divergence.
- Targeted live expansion: optional, after reviewer review identifies the highest-value live cases.
- Defer any broad live-provider comparative wave until measured outputs, surrogate adjudication, live portability, treatment fidelity, and human review are coherent.

---

## Packet log

#### Packet `Skills V3 Behavioral Intervention Study`
- Objective: Reframe ACP skills as procedural interventions and run a measured behavioral study program with experimental generation, dual surrogate adjudication, adherence/fidelity analysis, live cohort, and conservative claims closure.
- Touched files:
  - `docs/strategy/ACP_SKILLS_V3_STUDY_PROTOCOL.md`
  - `docs/strategy/ACP_SKILLS_V3_STATISTICAL_PLAN.md`
  - `src/skills/`
  - `evals/skills/studies/v3-study-program.json`
  - `scripts/evals/run-skills-study-program.mjs`
  - `tests/skills-study-substrate.test.ts`
  - `tests/skills-study-program.test.ts`
  - `package.json`
  - `artifacts/evals/skills/study-a-experimental/`
  - `artifacts/evals/skills/study-b-adjudication/`
  - `artifacts/evals/skills/study-c-adherence/`
  - `artifacts/evals/skills/study-d-live/`
  - `artifacts/evals/skills/final/`
- Verification:
  - `npx vitest run tests/skills-study-substrate.test.ts tests/skills-study-program.test.ts` — pass, 2 files / 8 tests
  - `npm run --silent skills:study:experimental` — pass with status `review`, 35 cases / 109 attempts / 107 generated outputs / 2 preserved schema failures, estimated cost `$0.633717`
  - `npm run --silent skills:study:adjudication` — pass with status `review`, 107 outputs adjudicated, Judge A/B agreement `0.6636`, 18 arbitrations, estimated cost `$1.985207`
  - `npm run --silent skills:study:adherence` — pass, adherence rate `0.7890`, prohibited leakage count `23`, artifact-class production rate `0.4954`
  - `npm run --silent skills:study:live` — pass, 12 enriched cases / 28 live outputs, 10 arbitrations, estimated cost `$1.002841`
  - `npm run --silent skills:study:claims` — pass, final package regenerated from Studies A-D
  - `npm run --silent skills:study:all` — pass, reused completed studies without re-spending budget
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 30 files / 65 tests
  - `npm run --silent skills:audit -- --out artifacts/skills` — pass, 17 skills / 14 S3+ / 3 S4 / 5 compositions
  - `npm run release:gate` — pass
- Outcome: ACP Skills V3 now has a translational behavioral-study evidence layer. The result is scientifically useful but not overclaimable: `full_skill` narrowly leads Study B primary endpoints (`0.8772`) over `no_skill` (`0.8696`), Study B reliability is moderate (`0.6636` agreement), treatment adherence is imperfect (`0.7890`), and live portability remains bounded.
- Follow-up: Collect human reviewer judgments, then repair the action-label/escalation rubric and treatment-adherence definitions before any larger live comparative wave.

#### Packet `Skills V3 Senior Correction`
- Objective: Replace synthetic comparative overclaim risk with measured outputs, separated blinded surrogate adjudication, conservative live-provider reinterpretation, and reviewer-safe claims.
- Touched files:
  - `evals/skills/README.md`
  - `evals/skills/tasks/v3-measured-heldout.json`
  - `scripts/evals/run-skills-measured-comparative.mjs`
  - `scripts/evals/judge-skills-measured-outputs.mjs`
  - `scripts/evals/adjudicate-skills-live-portability.mjs`
  - `scripts/evals/run-skills-comparative.mjs`
  - `scripts/evals/build-skills-operator-review.mjs`
  - `scripts/evals/build-skills-v3-claims-package.mjs`
  - `tests/skills-evals.test.ts`
  - `tests/skills-live-provider-pilot.test.ts`
  - `tests/skills-v3-claims-package.test.ts`
  - `tests/skills-v3-measured-evidence.test.ts`
  - `artifacts/evals/skills/comparative/`
  - `artifacts/evals/skills/measured-comparative/`
  - `artifacts/evals/skills/live-provider/`
  - `artifacts/evals/skills/operator-review/`
  - `artifacts/evals/skills/final/`
- Verification:
  - `npm run --silent skills:compare -- --out artifacts/evals/skills/comparative` — pass, 49-case proxy fixture-policy comparator relabeled
  - `npm run --silent skills:measured-generate -- --out artifacts/evals/skills/measured-comparative --max-budget-usd 12` — pass, 14 cases / 44 generated outputs / 0 failed outputs, estimated cost `$0.259761`
  - `npm run --silent skills:measured-judge -- --source artifacts/evals/skills/measured-comparative/summary.json --out artifacts/evals/skills/measured-comparative/adjudication --max-budget-usd 14` — pass, 44 outputs adjudicated, 6 arbitrations, estimated cost `$0.488281`
  - `npm run --silent skills:live-adjudicate -- --out artifacts/evals/skills/live-provider --max-budget-usd 4` — pass, 6 review divergences adjudicated, 5 arbitrations, estimated cost `$0.224280`
  - `npm run --silent skills:operator-review -- --out artifacts/evals/skills/operator-review` — pass, 15 cases, 4 seeded disagreements, actual reviewer evidence marked false
  - `npm run --silent skills:claims-package -- --operator-review artifacts/evals/skills/operator-review --out artifacts/evals/skills/final` — pass, conservative final package regenerated
  - `npx vitest run tests/skills-evals.test.ts tests/skills-live-provider-pilot.test.ts tests/skills-v3-claims-package.test.ts tests/skills-v3-measured-evidence.test.ts` — pass, 4 files / 11 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 28 files / 57 tests
  - `npm run --silent skills:audit -- --out artifacts/skills` — pass, 17 skills / 14 S3+ / 3 S4 / 5 compositions
  - `npm run release:gate` — pass
- Outcome: The Skills V3 package is no longer presented as conference-grade proof from synthetic comparison alone. It now has a measured and adjudicated evidence layer, but the measured result remains conservative: composition is strongest in the held-out slice, full-skill superiority is not established, and all operator-utility claims remain blocked pending human review.
- Follow-up: Collect human reviewer judgments and repair the action-label/escalation rubric before any broader live-provider comparative wave.

#### Packet `Skills V3 F4 + F5`
- Objective: Prepare the operator-review layer and close the paper-facing Skills V3 evidence package without overclaiming actual operator utility.
- Touched files:
  - `scripts/evals/build-skills-operator-review.mjs`
  - `scripts/evals/build-skills-v3-claims-package.mjs`
  - `tests/skills-v3-claims-package.test.ts`
  - `package.json`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
  - `artifacts/evals/skills/operator-review/`
  - `artifacts/evals/skills/final/`
- Verification:
  - `npm run --silent skills:operator-review -- --out artifacts/evals/skills/operator-review` — pass, 15 cases, 4 seeded disagreement prompts, actual reviewer evidence marked false
  - `npm run --silent skills:claims-package -- --operator-review artifacts/evals/skills/operator-review --out artifacts/evals/skills/final` — pass, 7 final package artifacts emitted
  - `npx vitest run tests/skills-evals.test.ts tests/skills-live-provider-pilot.test.ts tests/skills-v3-claims-package.test.ts` — pass, 3 files / 8 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 27 files / 54 tests
  - `npm run --silent skills:audit -- --out artifacts/skills` — pass, 17 skills / 14 S3+ / 3 S4 / 5 compositions
  - `npm run release:gate` — pass
- Outcome: Skills V3 now has a reviewer-facing result package: proxy fixture comparative lift, live portability/cost, failure taxonomy, casebook, non-claims, and a prepared operator-review packet.
- Follow-up: Collect actual reviewer judgments before making operator-utility claims or widening the live-provider study.

#### Packet `Skills V3 F3`
- Objective: Re-score the existing narrow live-provider pilot into a portability result surface using the F1 taxonomy, without spending additional provider budget.
- Touched files:
  - `scripts/evals/run-skills-live-provider-portability.mjs`
  - `tests/skills-live-provider-pilot.test.ts`
  - `package.json`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
  - `artifacts/evals/skills/live-provider/portability-summary.json`
  - `artifacts/evals/skills/live-provider/portability-summary.md`
  - `artifacts/evals/skills/live-provider/divergence-taxonomy.md`
  - `artifacts/evals/skills/live-provider/results-table.csv`
  - `artifacts/evals/skills/live-provider/costs.json`
  - `artifacts/evals/skills/live-provider/failures.md`
  - `artifacts/evals/skills/live-provider/traces/`
- Verification:
  - `npm run --silent skills:live-portability -- --out artifacts/evals/skills/live-provider` — pass, 12 cases, 6 pass, 6 review, 0 fail
  - `npx vitest run tests/skills-live-provider-pilot.test.ts` — pass, 4 tests
  - `npx vitest run tests/skills-evals.test.ts tests/skills-live-provider-pilot.test.ts` — pass, 6 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 26 files / 52 tests
  - `npm run --silent skills:audit -- --out artifacts/skills` — pass, 17 skills / 14 S3+ / 3 S4 / 5 compositions
  - `npm run release:gate` — pass
- Outcome: Live-provider evidence now has a paper-relevant portability surface: real model calls, structured outputs, trace preservation, cost/latency, arbitration policy, and divergence taxonomy. The main live weakness is action-label calibration, not substantive failure detection in this pilot.
- Follow-up: Run F4 operator-review packet before any broad live comparative wave or field-efficacy-adjacent claim.

#### Packet `Skills V3 F1 + F2 partial`
- Objective: Harden the deterministic Skills V3 benchmark and add the first reviewer-legible comparative baseline result surface.
- Touched files:
  - `evals/skills/tasks/v3-hard-cases.json`
  - `evals/skills/README.md`
  - `evals/skills/rubrics/v3-rubrics.json`
  - `scripts/evals/run-skills-evals.mjs`
  - `scripts/evals/render-skills-eval-report.mjs`
  - `scripts/evals/run-skills-comparative.mjs`
  - `tests/skills-evals.test.ts`
  - `package.json`
  - `artifacts/evals/skills/deterministic/`
  - `artifacts/evals/skills/comparative/`
- Verification:
  - `npm run --silent skills:eval -- --mode deterministic --out artifacts/evals/skills/deterministic` — pass, 49 cases, V3.1 complete
  - `npm run --silent skills:compare -- --out artifacts/evals/skills/comparative` — pass, full-skill aggregate `1.0000` vs metadata-only `0.6087` vs no-skill `0.3159`
  - `npx vitest run tests/skills-evals.test.ts tests/skills-live-provider-pilot.test.ts` — pass, 5 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 26 files / 51 tests
  - `npm run --silent skills:audit -- --out artifacts/skills` — pass, 17 skills / 14 S3+ / 3 S4 / 5 compositions
  - `npm run release:gate` — pass
- Outcome: F1 is complete and F2 has a deterministic comparative baseline. This supports fixture-level comparative lift claims, not live comparative superiority or field efficacy.
- Follow-up: Run F3 live-provider portability summarization using the new taxonomy before any broader live wave.

#### Packet `V3.0 + V3.1 + V3.1-LP`
- Objective: Freeze the execution-proven Skills V3 research charter, start a deterministic efficacy harness, and run a narrow real live-provider pilot now without widening claims.
- Touched files:
  - `AGENTS.md`
  - `docs/strategy/ACP_SKILLS_V3_EXECUTION_PROVEN_PLAN.md`
  - `docs/strategy/ACP_SKILLS_V3_RESEARCH_QUESTIONS.md`
  - `docs/strategy/ACP_SKILLS_V3_EVAL_MATRIX.md`
  - `docs/strategy/ACP_SKILLS_V3_GOLDEN_PRINCIPLES.md`
  - `docs/evaluation/skills-live-provider-budget.md`
  - `evals/skills/`
  - `scripts/evals/`
  - `tests/skills-evals.test.ts`
  - `tests/skills-live-provider-pilot.test.ts`
  - `src/services/openai-provider.ts`
  - `artifacts/evals/skills/`
- Verification:
  - `npm run --silent skills:eval -- --mode deterministic --out artifacts/evals/skills/deterministic` — pass, 21 cases, V3.1 in progress
  - `npm run --silent skills:live-pilot -- --out artifacts/evals/skills/live-provider --max-budget-usd 15` — completed with `review` status, 12 real API cases, estimated cost `$0.102677`
  - `npx vitest run tests/skills-evals.test.ts tests/skills-live-provider-pilot.test.ts` — pass, 4 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 26 files / 50 tests
  - `npm run --silent skills:audit -- --out artifacts/skills` — pass
  - `npm run release:gate` — pass
- Outcome: ACP now has repo-local Skills V3 charter artifacts, deterministic harness scaffolding with traces, and immediate live-provider portability evidence. Case-level live divergences are preserved for the next scoring/rubric pass.
- Follow-up: Expand deterministic fixture count and refine live-pilot scoring before broad comparative claims.

#### Packet `S2.1`
- Objective: Make `skills/` a core ACP adoption surface with a formal maturity model, audit tooling, upgraded robust skills, flagship skills, new critic/escalation/conference skills, and stronger compositions.
- Touched files:
  - `docs/strategy/ACP_SKILLS_V2_POSITIONING.md`
  - `docs/strategy/ACP_SKILLS_V2_AUDIT.md`
  - `docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md`
  - `scripts/skills/audit-skills.mjs`
  - `skills/`
  - `skills/registry.json`
  - `skills/compositions/`
  - `src/sdk/skills.ts`
  - `protocol/discovery.json`
  - `protocol/acp-bundle.manifest.json`
  - `tests/skill-maturity.test.ts`
  - `tests/agent-runtime-bundles.test.ts`
  - `artifacts/skills/`
  - `artifacts/conference/foresight/`
- Verification:
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 24 files / 46 tests
  - `npm run --silent skills:audit -- --out artifacts/skills` — pass, 17 skills / 14 S3+ / 3 S4 / 5 compositions
  - `npm run --silent conference:foresight -- --out artifacts/conference/foresight` — pass, `ok: true`, 155 indexed artifacts
  - `npm run release:gate` — pass, including `skills-audit`
- Outcome: Skills V2 is now a first-class procedural layer over ACP protocol truth, with enforceable maturity gates and reviewable evidence artifacts.
- Follow-up: Keep protocol semantics in specs/code; use skills for procedural execution, failure handling, examples, and operator/evaluator hooks.

### Template

#### Packet `<id>`
- Objective:
- Touched files:
- Verification:
- Outcome:
- Follow-up:

#### Packet `P0.1`
- Objective: Fix browser telemetry truth and establish execution control discipline.
- Touched files:
  - `public/app.js`
  - `tests/browser-telemetry.test.ts`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npx vitest run tests/browser-telemetry.test.ts` — pass, 2 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 21 files / 39 tests
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
- Outcome: Browser telemetry now emits canonical `participant_web`; legacy `web` is rejected by regression coverage; unload telemetry uses `keepalive` fetch with auth when available and JSON beacon fallback otherwise.
- Follow-up: P0.2 freezes the paper denominator and non-claims before storage/platform work.

#### Packet `P0.2`
- Objective: Freeze paper positioning and flagship evaluation family.
- Touched files:
  - `docs/strategy/ACP_PAPER_POSITIONING.md`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
  - `benchmarks/manifest.json`
  - `scripts/benchmark/run-benchmark.mjs`
  - `scripts/report/build-report-bundle.mjs`
  - `scripts/release/run-release-gate.mjs`
  - `tests/benchmark-harness.test.ts`
  - `tests/report-bundle.test.ts`
- Verification:
  - `npm run --silent benchmark:fixtures` — pass, default and flagship class `public-hearing-triage`
  - `npm run --silent benchmark:compare -- --class public-hearing-triage --out artifacts/benchmarks/flagship/public-hearing-triage` — pass
  - `npm run --silent report:bundle -- --source artifacts/benchmarks/flagship/public-hearing-triage --out artifacts/reports/flagship/public-hearing-triage` — pass, 9 required outputs / 22 evidence files
  - `npx vitest run tests/benchmark-harness.test.ts tests/report-bundle.test.ts` — pass, 5 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
  - `npm test` — pass, 21 files / 39 tests
- Outcome: `public-hearing-triage` is frozen as the flagship conference denominator; participatory budgeting remains a secondary demonstration family; benchmark feedback metrics now read canonical `cycle.feedback` instead of stale `feedbackEntries`.
- Follow-up: P0.3 freezes SQLite-first storage path and begins production-alpha persistence hardening.

#### Packet `P0.3`
- Objective: Freeze the production-alpha storage path and make workspace-aware persistence operational beyond the legacy file store.
- Touched files:
  - `src/services/sqlite-store.ts`
  - `src/services/store-factory.ts`
  - `src/services/cycle-service.ts`
  - `src/core/config.ts`
  - `src/api/app.ts`
  - `src/server.ts`
  - `src/cli.ts`
  - `scripts/workspace/workspace-archive.mjs`
  - `tests/sqlite-store.test.ts`
  - `docs/strategy/ACP_STORAGE_EVOLUTION.md`
  - `docs/specs/RELAY_PRODUCTION_PLATFORM_SPEC.md`
  - `docs/deployment/README.md`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npx vitest run tests/sqlite-store.test.ts tests/file-store.test.ts tests/api.test.ts` — pass, 6 tests
  - SQLite server smoke with `ACP_STORE=sqlite` on port `44317` — pass, `/ready` healthy and cycle persisted to `acp.sqlite`
  - SQLite CLI workspace export/import smoke — pass, 1 cycle exported and imported
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
  - `npm test` — pass, 22 files / 41 tests
- Outcome: ACP now has a SQLite-first production-alpha persistence path with legacy file-store import compatibility, workspace-scoped list/get/export/import behavior, CLI/server wiring through `ACP_STORE`, and deployment documentation. File-store mode remains the compatibility baseline.
- Follow-up: P0.4 hardens session, role, and auth semantics before production-alpha operator polish.

#### Packet `P0.4`
- Objective: Harden auth, role, session, and workspace semantics for the production-alpha surface.
- Touched files:
  - `src/api/security.ts`
  - `src/core/config.ts`
  - `src/server.ts`
  - `tests/api.test.ts`
  - `tests/final-completion.test.ts`
  - `docs/deployment/README.md`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npx vitest run tests/api.test.ts tests/final-completion.test.ts` — pass, 5 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm test` — pass, 22 files / 42 tests
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
- Outcome: Signed sessions now use timing-safe signature checks, reject malformed payloads as authentication failures, enforce role-capability compatibility, require participant invite tokens to be cycle scoped, limit query-token auth to `/v1/session`, support enforced-mode TTL defaults with `ACP_SESSION_TTL_SECONDS`, and expose auth failures through existing ops metrics.
- Follow-up: P1.1 moves from platform blockers into protocol semantics by adding explicit deliberative criteria and shared routing weights.

#### Packet `P1.1`
- Objective: Add explicit deliberative criteria and shared routing weights to ACP coordination semantics.
- Touched files:
  - `docs/specs/ACP_COORDINATION_ENGINE_SPEC.md`
  - `docs/specs/ACP_PROTOCOL_CONTRACT_SPEC.md`
  - `src/core/types.ts`
  - `src/services/pipeline.ts`
  - `protocol/acp-canonical.schema.json`
  - `protocol/examples/intervention-cycle.example.json`
  - `protocol/examples/baseline-cycle.example.json`
  - `tests/pipeline.test.ts`
  - `tests/file-store.test.ts`
  - `tests/sqlite-store.test.ts`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `node -e "JSON.parse(...)"` over canonical schema and examples — pass
  - `npx vitest run tests/pipeline.test.ts tests/cycle-service.test.ts tests/file-store.test.ts tests/sqlite-store.test.ts tests/protocol-bundle.test.ts tests/conformance.test.ts` — pass, 11 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
  - `npm test` — pass, 22 files / 42 tests
- Outcome: Cycles now carry explicit v1 deliberative criteria (`recipient_relevance`, `prompt_relevance`, `bridge_perspective`, `load_balance`); routing decisions expose criterion factors and normalized shared weights; digest explanations identify the dominant criterion; analysis exports include shared weights in the intervention snapshot.
- Follow-up: P1.2 uses the criteria-aware engine in flagship benchmark and report artifacts so the evidence layer is paper-grade rather than merely runnable.

#### Packet `P1.2`
- Objective: Strengthen flagship benchmark and report bundle pipeline around explicit criteria.
- Touched files:
  - `scripts/benchmark/run-benchmark.mjs`
  - `scripts/report/build-report-bundle.mjs`
  - `tests/benchmark-harness.test.ts`
  - `tests/report-bundle.test.ts`
  - `artifacts/benchmarks/flagship/public-hearing-triage/*`
  - `artifacts/reports/flagship/public-hearing-triage/*`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npx vitest run tests/benchmark-harness.test.ts tests/report-bundle.test.ts` — pass, 5 tests
  - `npm run --silent benchmark:compare -- --class public-hearing-triage --out artifacts/benchmarks/flagship/public-hearing-triage` — pass, `criteriaEvidencePresent: true`
  - `npm run --silent report:bundle -- --source artifacts/benchmarks/flagship/public-hearing-triage --out artifacts/reports/flagship/public-hearing-triage` — pass, 9 outputs / 22 evidence files
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
  - `npm test` — pass, 22 files / 42 tests
- Outcome: Benchmark evidence now records criteria, shared weights, average routing factors, and dominant criteria; comparison summaries include a criteria evidence check; research-review reports include a Criteria Snapshot for paper-grade traceability.
- Follow-up: P1.3 hardens the SDK and external adopter path so criteria-aware ACP runs can be consumed without depending on the Relay UI.

#### Packet `P1.3`
- Objective: Ship a stronger SDK and external adopter starter path.
- Touched files:
  - `src/sdk/evidence.ts`
  - `src/sdk/index.ts`
  - `adopters/typescript-http-starter/src/run.ts`
  - `adopters/typescript-http-starter/README.md`
  - `docs/protocol/implementer-checklist.md`
  - `tests/adopter-starter.test.ts`
  - `tests/sdk-smoke.test.ts`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npx vitest run tests/adopter-starter.test.ts tests/sdk-smoke.test.ts tests/http-runner.test.ts` — pass, 7 tests
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
  - `npm test` — pass, 22 files / 42 tests
- Outcome: The SDK now exports `summarizeCycleEvidence`; the TypeScript HTTP adopter starter emits criteria-aware evidence summaries from public HTTP runs; implementer docs now require checking routing factors and shared weights without opening Relay internals.
- Follow-up: P1.4 polishes Relay and visual artifacts so the new criteria evidence is visible and briefable in product surfaces.

#### Packet `P1.4`
- Objective: Polish Relay UI and visual artifacts against the criteria-aware evidence model.
- Touched files:
  - `public/app.js`
  - `public/index.html`
  - `scripts/visual-artifacts/generate-visual-artifact.mjs`
  - `tests/browser-telemetry.test.ts`
  - `tests/visual-artifacts.test.ts`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npx vitest run tests/browser-telemetry.test.ts tests/visual-artifacts.test.ts` — pass, 3 tests
  - Browser smoke at `http://127.0.0.1:44318` — pass, page loads and favicon removes the previous 404 console error
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass
  - `npm test` — pass, 22 files / 42 tests
- Outcome: Operator overview now exposes shared deliberative criteria, routing inspection cards show factor traces, digest inspection cards count explanations, cycle-briefing visual artifacts include shared routing weights, and the browser surface no longer emits favicon 404 noise during local smoke.
- Follow-up: P1.5 generates a first full conference rehearsal bundle from dogfood plus flagship evidence.

#### Packet `P1.5`
- Objective: Run dogfood and export the first full conference rehearsal bundle.
- Touched files:
  - `scripts/conference/build-rehearsal-bundle.mjs`
  - `package.json`
  - `scripts/release/run-release-gate.mjs`
  - `docs/reports/README.md`
  - `docs/README.md`
  - `artifacts/conference/rehearsal/*`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npm run --silent conference:rehearsal -- --out artifacts/conference/rehearsal` — pass, `ok: true`
  - Rehearsal bundle evidence — flagship `criteriaEvidencePresent: true`, dogfood findings `0`, adopter status `pass`, release smoke `ok`
  - `npm run build` — pass
  - `npm run typecheck` — pass
  - `npm run conformance:check` — pass, 349/349 checks
  - `npm run release:smoke` — pass and now requires `conference:rehearsal`
  - `npm test` — pass, 22 files / 42 tests
- Outcome: `npm run conference:rehearsal` now regenerates a conference rehearsal packet with flagship benchmark evidence, institutional report bundle, seeded dogfood run, external adopter run, SQLite runtime data, `rehearsal-summary.json`, and a bundle README. The generated packet is present at `artifacts/conference/rehearsal`.
- Follow-up: P2.1 runs the final completion audit and full release gate.

#### Packet `P2.1`
- Objective: Final completion audit and release gate closure.
- Touched files:
  - `artifacts/completion/final/*`
  - `docs/strategy/ACP_EXECUTION_STATUS.md`
- Verification:
  - `npm run --silent completion:audit -- --out artifacts/completion/final` — pass, 6 claims
  - `npm run release:gate` — pass; build, typecheck, test, conformance, benchmark compare, adopter starter, dogfood relay, workspace export/import, report bundle, and completion audit all passed
- Outcome: Final closure checks passed. The repo remains ACP-first: ACP owns protocol semantics, Relay remains the reference implementation, Relay Blocks/adopters remain operational/proof surfaces, criteria/evidence features are tied to finalized specs, and evidence artifacts exist as generated files rather than aspirational docs.
- Follow-up: Any future work should start by creating a new packet in this status file.

#### Packet `F0-F8`
- Objective: Stabilize the repo boundary, then implement the Foresight Supercooperation Engine V2 pre-packaging track.
- Touched files:
  - `docs/strategy/ACP_ENGINE_V2_POSITIONING.md`
  - `docs/strategy/ACP_REPO_STABILIZATION_PLAN.md`
  - `docs/strategy/ACP_REPO_CLASSIFICATION.md`
  - `docs/strategy/ACP_STABILIZATION_REPORT.md`
  - `docs/specs/ACP_COORDINATION_ENGINE_SPEC.md`
  - `src/core/types.ts`
  - `src/services/engine-v2.ts`
  - `src/services/model-audit.ts`
  - `src/services/model-cache.ts`
  - `src/services/model-provider.ts`
  - `src/services/model-schemas.ts`
  - `src/services/openai-provider.ts`
  - `src/services/cycle-service.ts`
  - `src/services/pipeline.ts`
  - `public/app.js`
  - `protocol/acp-canonical.schema.json`
  - `data/prompts/engine-v2/*`
  - `scripts/benchmark/run-benchmark.mjs`
  - `scripts/conference/build-foresight-package.mjs`
  - `scripts/report/build-report-bundle.mjs`
  - `scripts/visual-artifacts/generate-visual-artifact.mjs`
  - `scripts/completion/run-completion-audit.mjs`
  - `scripts/release/run-release-gate.mjs`
  - `package.json`
  - `tests/engine-v2.test.ts`
  - `tests/benchmark-harness.test.ts`
  - `tests/report-bundle.test.ts`
  - `tests/final-completion.test.ts`
  - `artifacts/benchmarks/ablation/public-hearing-triage/*`
  - `artifacts/benchmarks/scale/public-hearing-triage/*`
  - `artifacts/conference/foresight/*`
- Verification:
  - `npm run release:gate` — pass
  - `npm run --silent completion:audit -- --out /tmp/acp-stabilized-audit` — pass, 7 claims
  - `npm run --silent benchmark:ablation -- --class public-hearing-triage --out artifacts/benchmarks/ablation/public-hearing-triage` — pass
  - `npm run --silent benchmark:scale -- --out artifacts/benchmarks/scale/public-hearing-triage` — pass, Band B and Band C generated
  - `npm run --silent conference:foresight -- --out artifacts/conference/foresight` — pass, `ok: true`, 122 indexed artifacts
  - final `npm run release:gate` — pass
  - `npm run --silent completion:audit -- --out artifacts/completion/foresight` — pass, 7 claims
- Outcome: ACP is now Foresight submission pre-packaging ready as a repo-local artifact package, while the stabilization docs preserve a claims-safe review boundary.
- Follow-up: Split baseline and Foresight work into separate branches before any release-facing commit.
