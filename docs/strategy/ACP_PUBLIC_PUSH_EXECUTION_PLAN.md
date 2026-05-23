# ACP Public Push Execution Plan

Status: execution plan for final public branch update  
Remote target: `origin` → `https://github.com/davidkimai/acp`  
Branch target: `main`

## Release posture

This push should present ACP as a **protocol-first, auditable infrastructure repo** with a **constitutional procedural layer** and a **bounded evidence stack**.

The public branch should optimize for:

- reviewer legibility
- conservative claims discipline
- reproducibility with real provider-backed reruns
- explicit protocol / implementation / skills boundaries
- compact curated artifacts rather than raw artifact dumping

This is not a “ship everything that exists locally” push.
It is a **curated overwrite by fast-forward commits** from the existing `main` base.

## Success criteria

Before pushing, all of the following must be true:

1. `origin/main` still points to the expected base or is fast-forward compatible.
2. `npm run build` passes.
3. `npm run typecheck` passes.
4. `npm test` passes.
5. `npm run release:gate` passes.
6. `npm run public:package:audit` passes.
7. Curated public artifacts contain no local absolute path leaks.
8. No ignored bulky artifact trees or local runtime debris are accidentally staged.
9. The final history is split into a small number of reviewer-legible commits, not one giant blob.

## Strategic framing for the commits

Use three commits that mirror how a serious external reviewer will understand the repo:

1. **Public core**  
   ACP protocol, Relay implementation, reviewer entrypoints, release discipline.
2. **Evaluation and ecosystem proof**  
   benchmarks, fixtures, runners, SDK/adopter paths, pilot/deployment/evaluation docs.
3. **Skills and curated evidence**  
   constitutional skills layer, behavioral-study substrate, curated claims artifacts, public packaging docs.

This preserves legibility for workshop reviewers, implementers, and future collaborators.

## Packet P1 — Public core

### Intent

Establish the canonical public substrate first:

- reviewer entrypoints
- OSS metadata
- protocol bundle and examples
- Relay implementation core
- prompt registry for engine v2
- public runtime surfaces
- release and conformance discipline

### Paths

```bash
git add \
  .github/workflows/ci.yml \
  .gitignore \
  AGENTS.md \
  README.md REVIEWER_START_HERE.md SUBMISSION_REPO_MAP.md CLAIMS_AND_NON_CLAIMS.md REPRODUCE.md \
  CONTRIBUTING.md SECURITY.md CITATION.cff LICENSE \
  package.json package-lock.json \
  data/prompts/engine-v2/ \
  docs/README.md \
  protocol/ \
  public/ \
  src/api/app.ts src/api/ops.ts src/api/security.ts \
  src/cli.ts src/server.ts \
  src/core/config.ts src/core/types.ts \
  src/services/cycle-service.ts src/services/file-store.ts src/services/pipeline.ts \
  src/services/store.ts src/services/store-factory.ts src/services/sqlite-store.ts \
  src/services/engine-v2.ts \
  src/services/model-audit.ts src/services/model-cache.ts src/services/model-provider.ts src/services/model-schemas.ts src/services/openai-provider.ts \
  scripts/completion/run-completion-audit.mjs \
  scripts/conference/build-rehearsal-bundle.mjs \
  scripts/conformance/check-acp.mjs \
  scripts/release/run-release-gate.mjs \
  scripts/release/audit-public-package.mjs \
  tests/api.test.ts tests/conformance.test.ts tests/cycle-service.test.ts tests/engine-v2.test.ts \
  tests/file-store.test.ts tests/pipeline.test.ts tests/protocol-bundle.test.ts tests/sqlite-store.test.ts
```

### Review checks

```bash
git diff --cached --stat
git diff --cached --name-only
```

### Commit message

```text
public core: protocol, runtime, and reviewer entrypoints
```

## Packet P2 — Evaluation and ecosystem proof

### Intent

Prove ACP is not only a browser demo:

- benchmark harnesses
- replay fixtures
- batch and HTTP runners
- external adopter starter
- SDK surface
- pilot, deployment, protocol-guide, and evaluation docs
- visual/reporting/demo support materials

### Paths

```bash
git add \
  adopters/ benchmarks/ demo/ evals/ fixtures/ runners/ \
  docs/agents/ docs/compatibility/ docs/deployment/ docs/design/ docs/evaluation/ docs/pilot/ docs/protocol/ docs/reports/ docs/specs/ \
  src/sdk/ \
  scripts/agents/build-runtime-bundles.mjs \
  scripts/batch/run-batch.ts \
  scripts/benchmark/run-benchmark.mjs \
  scripts/conference/build-foresight-package.mjs \
  scripts/demo/bootstrap-demo.sh scripts/demo/demo-summary.sh \
  scripts/dogfood/run-relay-dogfood.mjs \
  scripts/http-client/run-http-scenario.mjs \
  scripts/pilot/pilot-data-handling.mjs \
  scripts/report/build-report-bundle.mjs \
  scripts/visual-artifacts/generate-visual-artifact.mjs \
  scripts/workspace/workspace-archive.mjs \
  tests/adopter-starter.test.ts tests/agent-runtime-bundles.test.ts tests/batch-runner.test.ts \
  tests/benchmark-harness.test.ts tests/browser-telemetry.test.ts tests/ecosystem-proof.test.ts \
  tests/external-implementer-guide.test.ts tests/final-completion.test.ts tests/http-runner.test.ts \
  tests/relay-dogfood.test.ts tests/report-bundle.test.ts tests/sdk-smoke.test.ts tests/visual-artifacts.test.ts
```

### Review checks

```bash
git diff --cached --stat
git diff --cached --name-only
```

### Commit message

```text
public eval: benchmarks, runners, adopters, sdk, and reporting surfaces
```

## Packet P3 — Skills and curated evidence

### Intent

Make the strongest distinctive contribution legible:

- ACP Skills as constitutional workflow modules
- thin `src/skills/` runtime/study substrate
- behavioral-study protocol and statistical plan
- final curated public evidence instead of raw generated debris
- packaging and reproduction guidance for reviewers

### Paths

```bash
git add \
  skills/ src/skills/ \
  docs/strategy/ \
  artifacts/README.md \
  artifacts/completion/final/ \
  artifacts/conference/rehearsal/README.md \
  artifacts/conference/rehearsal/rehearsal-summary.json \
  artifacts/evals/skills/final/ \
  artifacts/skills/ \
  scripts/evals/ \
  scripts/repro/build-load-bearing-claims-package.mjs \
  scripts/skills/ \
  tests/relay-blocks.test.ts tests/skill-maturity.test.ts \
  tests/skills-evals.test.ts tests/skills-live-provider-pilot.test.ts \
  tests/skills-study-program.test.ts tests/skills-study-substrate.test.ts \
  tests/skills-v3-claims-package.test.ts tests/skills-v3-measured-evidence.test.ts
```

### Review checks

```bash
git diff --cached --stat
git diff --cached --name-only
npm run public:package:audit
```

### Commit message

```text
public skills: constitutional layer and curated claims artifacts
```

## Final push sequence

After the three commits exist locally:

```bash
git status -sb
git log --oneline --decorate -n 6
npm run public:package:audit
git push origin main
```

## Stop conditions

Stop and repair before pushing if any of the following appears in the staged diff:

- `artifacts/conference/foresight/`
- `artifacts/reports/`
- `artifacts/evals/skills/live-provider/`
- `artifacts/evals/skills/measured-comparative/`
- `artifacts/evals/skills/study-*`
- `artifacts/conference/rehearsal/runtime-data/`
- `artifacts/conference/rehearsal/flagship-benchmark/`
- `artifacts/conference/rehearsal/flagship-report/`
- `artifacts/conference/rehearsal/dogfood-run/`
- `artifacts/conference/rehearsal/adopter-http-run/`
- `skills/**/out/`
- secrets, local machine paths, or disposable debug files

## Why this shape is correct

This commit structure matches how a serious Supercooperation or workshop reviewer will read the repo:

- first: what ACP is
- second: whether it works beyond one UI
- third: what is distinctive about the skills / procedural layer and what evidence backs it

That is the right order for a project whose claim is **not** “AI solves democracy,” but rather “public reasoning under bounded attention needs inspectable protocol and procedure.”
