# Submission Repo Map

This is the shortest map to the final conference/workshop submission repository for **_Collective Deliberation Is a Skill Issue_**.

Use it when you want to know:

- what to read first
- what to run first
- which paths matter for protocol, implementation, interoperability, and evidence
- which commands require an API key

## One-screen summary

ACP is presented in this repo as four distinct layers:

1. **Protocol**
   - [`protocol/`](protocol/)
   - [`docs/specs/`](docs/specs/)
2. **Reference implementation**
   - [`src/`](src/)
   - [`public/`](public/)
   - tests
3. **Interoperability / ecosystem surfaces**
   - [`runners/`](runners/)
   - [`adopters/`](adopters/)
   - [`protocol/compatibility/compatibility-matrix.json`](protocol/compatibility/compatibility-matrix.json)
4. **Evidence / paper-companion surfaces**
   - [`artifacts/conference/rehearsal/README.md`](artifacts/conference/rehearsal/README.md)
   - [`artifacts/conference/rehearsal/rehearsal-summary.json`](artifacts/conference/rehearsal/rehearsal-summary.json)
   - [`artifacts/completion/final/`](artifacts/completion/final/)
   - [`artifacts/evals/skills/final/`](artifacts/evals/skills/final/)
   - [`REPRODUCE.md`](REPRODUCE.md)

## If you only have 5 minutes

Read in this order:

1. [`README.md`](README.md)
2. [`CLAIMS_AND_NON_CLAIMS.md`](CLAIMS_AND_NON_CLAIMS.md)
3. [`REVIEWER_START_HERE.md`](REVIEWER_START_HERE.md)
4. [`protocol/README.md`](protocol/README.md)
5. [`artifacts/conference/rehearsal/README.md`](artifacts/conference/rehearsal/README.md)
6. [`skills/CONSTITUTIONAL_SKILLS.md`](skills/CONSTITUTIONAL_SKILLS.md)
7. [`artifacts/evals/skills/final/reviewer-start-here.md`](artifacts/evals/skills/final/reviewer-start-here.md)

## If you want the exact copy-paste reproduction path

Use:

- [`REPRODUCE.md`](REPRODUCE.md)

Fastest command block:

```bash
git clone https://github.com/davidkimai/acp.git
cd acp
npm install
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run reproduce:claims -- --out /tmp/acp-load-bearing-claims
```

Requires API key? **Yes**.

## If you want an offline first-pass check

Use this when you want to inspect the repo without spending provider budget.

```bash
npm install
npm run build
npm run typecheck
npm test
npm run demo:bootstrap
npm run benchmark:compare -- --class public-hearing-triage --out /tmp/acp-benchmark
npm run --silent conference:rehearsal -- --out /tmp/acp-rehearsal
npm run --silent completion:audit -- --out /tmp/acp-completion-audit
npm run --silent skills:audit -- --out /tmp/acp-skills-audit
```

Requires API key? **No**.

## If you care most about interoperability

Read:

- [`protocol/EXTERNAL_IMPLEMENTER_GUIDE.md`](protocol/EXTERNAL_IMPLEMENTER_GUIDE.md)
- [`protocol/compatibility/compatibility-matrix.json`](protocol/compatibility/compatibility-matrix.json)
- [`runners/batch/README.md`](runners/batch/README.md)
- [`runners/http-client/README.md`](runners/http-client/README.md)
- [`adopters/typescript-http-starter/README.md`](adopters/typescript-http-starter/README.md)

Then run:

```bash
npm run demo:bootstrap
npm run batch:run -- runners/batch/examples/intervention.json
npm run --silent conference:rehearsal -- --out /tmp/acp-rehearsal
```

Requires API key? **No**.

## If you care most about the skills evidence

Read:

- [`skills/CONSTITUTIONAL_SKILLS.md`](skills/CONSTITUTIONAL_SKILLS.md)
- [`artifacts/skills/constitutional-skills-map.md`](artifacts/skills/constitutional-skills-map.md)
- [`artifacts/evals/skills/final/reviewer-start-here.md`](artifacts/evals/skills/final/reviewer-start-here.md)
- [`artifacts/evals/skills/final/skills-v3-claims-memo.md`](artifacts/evals/skills/final/skills-v3-claims-memo.md)
- [`artifacts/evals/skills/final/skills-v3-results-overview.md`](artifacts/evals/skills/final/skills-v3-results-overview.md)
- [`artifacts/evals/skills/final/skills-v3-non-claims.md`](artifacts/evals/skills/final/skills-v3-non-claims.md)
- [`docs/evaluation/skills-live-provider-budget.md`](docs/evaluation/skills-live-provider-budget.md)

For full rerun:

```bash
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run reproduce:claims -- --out /tmp/acp-load-bearing-claims
```

Requires API key? **Yes**.

## Map from paper-style questions to repo paths

### What is ACP?

- [`README.md`](README.md)
- [`protocol/README.md`](protocol/README.md)
- [`docs/specs/ACP_TECHNICAL_SPEC.md`](docs/specs/ACP_TECHNICAL_SPEC.md)

### What is the implementation?

- [`src/`](src/)
- [`public/`](public/)
- [`docs/specs/RELAY_REFERENCE_IMPLEMENTATION_SPEC.md`](docs/specs/RELAY_REFERENCE_IMPLEMENTATION_SPEC.md)

### How is it checked?

- [`scripts/conformance/check-acp.mjs`](scripts/conformance/check-acp.mjs)
- [`tests/conformance.test.ts`](tests/conformance.test.ts)
- [`artifacts/completion/final/technical-completion-audit.md`](artifacts/completion/final/technical-completion-audit.md)

### How is it demonstrated outside the browser?

- [`runners/batch/`](runners/batch/)
- [`runners/http-client/`](runners/http-client/)
- [`adopters/typescript-http-starter/`](adopters/typescript-http-starter/)

### Where is the flagship benchmark / rehearsal evidence?

- [`artifacts/conference/rehearsal/README.md`](artifacts/conference/rehearsal/README.md)
- [`artifacts/conference/rehearsal/rehearsal-summary.json`](artifacts/conference/rehearsal/rehearsal-summary.json)
- [`benchmarks/README.md`](benchmarks/README.md)

### Where is the bounded skills evidence?

- [`artifacts/evals/skills/final/`](artifacts/evals/skills/final/)
- [`evals/skills/`](evals/skills/)
- [`docs/strategy/ACP_SKILLS_V3_STUDY_PROTOCOL.md`](docs/strategy/ACP_SKILLS_V3_STUDY_PROTOCOL.md)
- [`docs/strategy/ACP_SKILLS_V3_STATISTICAL_PLAN.md`](docs/strategy/ACP_SKILLS_V3_STATISTICAL_PLAN.md)

## Interpretation rule

This repo is designed to be:

- inspectable
- reproducible
- bounded in its claims
- honest about mixed live-provider outcomes

It is **not** designed to make every reproduced surface look maximally green. Review/fail variation in the provider-backed layers is preserved because it is part of the evidence story.
