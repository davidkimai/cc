# Claims and Non-Claims

This file is the conference-facing claim boundary for the ACP repository.

Use it with:

- [`README.md`](README.md)
- [`REVIEWER_START_HERE.md`](REVIEWER_START_HERE.md)
- [`REPRODUCE.md`](REPRODUCE.md)
- [`artifacts/evals/skills/final/skills-v3-claims-memo.md`](artifacts/evals/skills/final/skills-v3-claims-memo.md)

## How to use this file

For each load-bearing claim below, this file tells you:

- what the claim actually is
- where to inspect it quickly in the repo
- how to reproduce it
- whether an API key is needed
- what the claim does **not** imply

## Load-bearing claims ACP can support now

### 1. ACP can be explained without opening Relay UI code

**Meaning**

ACP is legible as a protocol and implementation boundary, not only as a web app.

**Inspect quickly**

- [`protocol/README.md`](protocol/README.md)
- [`protocol/discovery.json`](protocol/discovery.json)
- [`protocol/EXTERNAL_IMPLEMENTER_GUIDE.md`](protocol/EXTERNAL_IMPLEMENTER_GUIDE.md)
- [`artifacts/completion/final/technical-completion-audit.md`](artifacts/completion/final/technical-completion-audit.md)

**Reproduce**

```bash
npm run --silent completion:audit -- --out /tmp/acp-completion-audit
```

**API key required?** No.

**Does not imply**

- that the protocol is institutionally adopted
- that the UI is irrelevant
- that semantic questions are fully settled forever

---

### 2. ACP can be checked without trusting the authors

**Meaning**

The repo includes a machine-readable conformance path rather than only narrative claims.

**Inspect quickly**

- [`scripts/conformance/check-acp.mjs`](scripts/conformance/check-acp.mjs)
- [`fixtures/replay/manifest.json`](fixtures/replay/manifest.json)
- [`tests/conformance.test.ts`](tests/conformance.test.ts)

**Reproduce**

```bash
npm run --silent conformance:check -- --json
```

**API key required?** No.

**Does not imply**

- that conformance equals field efficacy
- that every future adapter is automatically conformant

---

### 3. ACP runs outside the main browser surface

**Meaning**

ACP is not only a browser demo. It can be exercised through non-UI proof surfaces.

**Inspect quickly**

- [`runners/batch/README.md`](runners/batch/README.md)
- [`runners/http-client/README.md`](runners/http-client/README.md)
- [`adopters/typescript-http-starter/README.md`](adopters/typescript-http-starter/README.md)
- [`artifacts/conference/rehearsal/README.md`](artifacts/conference/rehearsal/README.md)

**Reproduce**

Minimal runner path:

```bash
npm run demo:bootstrap
npm run batch:run -- runners/batch/examples/intervention.json
```

Or reproduce the fuller conference packet:

```bash
npm run --silent conference:rehearsal -- --out /tmp/acp-conference-rehearsal
```

**API key required?** No.

**Does not imply**

- that every external surface is mature in the same way
- that browser/UI questions no longer matter

---

### 4. ACP has a clear outside adoption path

**Meaning**

A third party has enough protocol, compatibility, SDK, and runner material to build against ACP without treating the Relay internals as the only path.

**Inspect quickly**

- [`protocol/compatibility/compatibility-matrix.json`](protocol/compatibility/compatibility-matrix.json)
- [`protocol/EXTERNAL_IMPLEMENTER_GUIDE.md`](protocol/EXTERNAL_IMPLEMENTER_GUIDE.md)
- [`adopters/typescript-http-starter/README.md`](adopters/typescript-http-starter/README.md)

**Reproduce**

The simplest full proof is included in:

```bash
npm run --silent conference:rehearsal -- --out /tmp/acp-conference-rehearsal
```

Then inspect:

- `/tmp/acp-conference-rehearsal/adopter-http-run/`
- `/tmp/acp-conference-rehearsal/rehearsal-summary.json`

**API key required?** No.

**Does not imply**

- that the ecosystem is already broad
- that compatibility questions are closed

---

### 5. ACP can produce inspectable evidence

**Meaning**

The repo can generate benchmark, report, audit, and rehearsal outputs that others can inspect directly.

**Inspect quickly**

- [`artifacts/conference/rehearsal/rehearsal-summary.json`](artifacts/conference/rehearsal/rehearsal-summary.json)
- [`artifacts/completion/final/technical-completion-audit.md`](artifacts/completion/final/technical-completion-audit.md)
- [`artifacts/evals/skills/final/`](artifacts/evals/skills/final/)

**Reproduce**

```bash
npm run benchmark:compare -- --class public-hearing-triage --out /tmp/acp-benchmark
npm run report:bundle -- --source /tmp/acp-benchmark --out /tmp/acp-report
```

**API key required?** No.

**Does not imply**

- that every artifact is equally strong evidence
- that a generated artifact substitutes for human interpretation

---

### 6. Relay can be exercised with credible production discipline

**Meaning**

The reference implementation includes release smoke checks, completion audits, storage discipline, and operational surfaces.

**Inspect quickly**

- [`scripts/release/run-release-gate.mjs`](scripts/release/run-release-gate.mjs)
- [`src/api/ops.ts`](src/api/ops.ts)
- [`artifacts/completion/final/technical-completion-audit.json`](artifacts/completion/final/technical-completion-audit.json)

**Reproduce**

```bash
npm run release:smoke
npm run --silent completion:audit -- --out /tmp/acp-completion-audit
```

**API key required?** No.

**Does not imply**

- enterprise production readiness
- real-world deployment success

---

### 7. The ACP skills suite is structurally auditable

**Meaning**

The skills layer is not just a loose folder of prompts; it has a bounded structural maturity standard, audit surface, and protocol-adjacent procedural-governance role.

**Inspect quickly**

- [`skills/CONSTITUTIONAL_SKILLS.md`](skills/CONSTITUTIONAL_SKILLS.md)
- [`docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md`](docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md)
- [`artifacts/skills/skills-maturity-report.md`](artifacts/skills/skills-maturity-report.md)
- [`artifacts/skills/constitutional-skills-map.md`](artifacts/skills/constitutional-skills-map.md)
- [`skills/registry.json`](skills/registry.json)

**Reproduce**

```bash
npm run --silent skills:audit -- --out /tmp/acp-skills-audit
```

**API key required?** No.

**Does not imply**

- behavioral superiority
- human utility by itself
- protocol semantics living inside skill prose

---

### 8. ACP can reproduce a bounded measured skills evidence surface

**Meaning**

The repo can rerun measured held-out generation plus blinded surrogate adjudication using real provider calls.

**Inspect quickly**

- [`artifacts/evals/skills/measured-comparative/summary.json`](artifacts/evals/skills/measured-comparative/summary.json)
- [`artifacts/evals/skills/measured-comparative/adjudication/summary.json`](artifacts/evals/skills/measured-comparative/adjudication/summary.json)
- [`artifacts/evals/skills/final/skills-v3-claims-memo.md`](artifacts/evals/skills/final/skills-v3-claims-memo.md)

**Reproduce**

Full paper-companion path:

```bash
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run reproduce:claims -- --out /tmp/acp-load-bearing-claims
```

Or the narrower measured path:

```bash
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run --silent skills:measured-generate -- --out /tmp/acp-measured --max-budget-usd 2
npm run --silent skills:measured-judge -- --source /tmp/acp-measured/summary.json --out /tmp/acp-measured/adjudication --max-budget-usd 3 --max-arbitrations 6
```

**API key required?** Yes.

**Does not imply**

- human operator utility
- field efficacy
- fairness solved
- broad superiority across all tasks/settings

---

### 9. ACP can reproduce a narrow live-provider portability evidence surface under bounded cost

**Meaning**

The repo can rerun real provider-backed live cases and preserve both successes and divergences for later adjudication.

**Inspect quickly**

- [`artifacts/evals/skills/live-provider/pilot-summary.json`](artifacts/evals/skills/live-provider/pilot-summary.json)
- [`artifacts/evals/skills/live-provider/portability-summary.json`](artifacts/evals/skills/live-provider/portability-summary.json)
- [`artifacts/evals/skills/final/skills-v3-results-overview.md`](artifacts/evals/skills/final/skills-v3-results-overview.md)

**Reproduce**

Full paper-companion path:

```bash
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run reproduce:claims -- --out /tmp/acp-load-bearing-claims
```

**API key required?** Yes.

**Interpretation rule**

This surface is intentionally allowed to reproduce mixed outcomes. A rerun may yield pass/review/fail variation. That variation is part of the evidence, not a bug to hide.

**Does not imply**

- broad live superiority
- field readiness
- that live-provider adjudication equals human review

## Non-claims ACP does not support now

The current repo and evidence package do **not** support these claims:

- real-world civic efficacy
- operator utility without collected human-review evidence
- fairness solved
- institutional legitimacy by default
- broad comparative superiority across all tasks and institutions
- field readiness as a settled conclusion
- surrogate adjudication as a substitute for human review

## Fastest end-to-end reproduction path

If you want the single command that most closely matches the paper-companion reproduction route:

```bash
git clone https://github.com/davidkimai/acp.git
cd acp
npm install
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run reproduce:claims -- --out /tmp/acp-load-bearing-claims
```

Then open:

- `/tmp/acp-load-bearing-claims/README.md`
- `/tmp/acp-load-bearing-claims/summary.json`
