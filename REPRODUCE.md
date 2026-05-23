# Reproduce ACP's Load-Bearing Claims

This is the **paper-companion reproduction path** for **_Collective Deliberation Is a Skill Issue_**.

It is designed so a reviewer, engineer, or coding agent can go from **`git clone`** to a **single reproducibility package** with:

- core ACP / Relay checks
- protocol conformance output
- a preserved conference rehearsal bundle
- completion-audit output
- skills structural audit output
- provider-backed measured skills generation
- provider-backed blinded surrogate adjudication
- provider-backed live portability and live divergence adjudication
- a final bounded claims packet

## Important policy

This path uses **real provider calls**.

- It does **not** use dry runs.
- It **requires your own API key**.
- If `OPENAI_API_KEY` is missing, the reproduction command fails closed.

## Requirements

- Node.js 20+
- npm
- git
- an `OPENAI_API_KEY` with access to:
  - `gpt-5.4-mini`
  - `gpt-5.4`

## Fastest copy-paste path

```bash
git clone https://github.com/davidkimai/acp.git
cd acp
npm install
export OPENAI_API_KEY="YOUR_KEY_HERE"
npm run reproduce:claims -- --out /tmp/acp-load-bearing-claims
```

Typical wall-clock time on the current repo state is roughly **7-10 minutes**, depending on provider latency.

When it finishes, open:

- `/tmp/acp-load-bearing-claims/README.md`
- `/tmp/acp-load-bearing-claims/summary.json`

Those two files are the main review surfaces for the reproduced package.

For the conference-facing interpretation boundary, pair them with:

- [`CLAIMS_AND_NON_CLAIMS.md`](CLAIMS_AND_NON_CLAIMS.md)
- [`SUBMISSION_REPO_MAP.md`](SUBMISSION_REPO_MAP.md)

## What the one command does

`npm run reproduce:claims` runs a single end-to-end orchestration that:

1. builds the repo
2. typechecks the repo
3. runs the test suite
4. bootstraps the demo bundle
5. runs ACP protocol conformance and preserves the JSON report
6. runs the technical completion audit and preserves the outputs
7. builds the conference rehearsal bundle and preserves the outputs
8. runs the skills structural audit
9. runs the deterministic skills harness
10. runs the proxy comparative fixture-policy surface
11. runs **real** measured skills generation with `gpt-5.4-mini`
12. runs **real** blinded surrogate adjudication with `gpt-5.4-mini` and `gpt-5.4` arbitration
13. runs the **real** live-provider pilot
14. runs live portability reinterpretation and live surrogate adjudication
15. builds the final bounded skills claims packet
16. writes a package-level `README.md` and machine-readable `summary.json`

## Output structure

A successful run writes a package like this:

```text
/tmp/acp-load-bearing-claims/
  README.md
  summary.json
  conformance/
  completion/
  conference-rehearsal/
  skills/
    audit/
    deterministic/
    comparative/
    measured-comparative/
    live-provider/
    operator-review/
    final/
```

Live-provider outcomes may vary across reruns. The package is designed to preserve that variation honestly as pass / review / fail counts rather than silently forcing a green result.

Relatedly, an individual substep may show a nonzero exit in the generated package when the evidence itself reproduces a review/fail outcome. The top-level reproduction package still completes so reviewers can inspect the result rather than losing it.

## What this package is meant to prove

### Core ACP / Relay claims

The reproduction package is intended to make these claims inspectable:

- ACP can be explained without opening Relay UI code
- ACP can be checked without trusting the authors
- ACP runs outside the main browser surface
- ACP has a clear outside adoption path
- ACP can produce inspectable evidence
- Relay can be exercised with credible production discipline

### Skills-layer claims

The package is also intended to reproduce ACP's bounded skills evidence layer:

- structural maturity is auditable
- deterministic/proxy surfaces are preserved and truthfully labeled
- measured held-out generation can be rerun with real model calls
- blinded surrogate adjudication can be rerun with real model calls
- live-provider portability can be rerun with real model calls under bounded cost
- the final claims packet remains conservative and explicit about non-claims

## Cost note

The script uses conservative per-phase caps, but actual observed spend on this repo state has been much lower than the cap envelope.

Default caps in the reproduction script:

- measured generation: `$2`
- measured adjudication: `$3`
- live pilot: `$1`
- live adjudication: `$1`
- total configured cap: `$7`

Actual spend depends on provider pricing and token usage.

If you need to override local price assumptions, the skills scripts support environment variables such as:

- `ACP_GPT54_MINI_INPUT_USD_PER_1M`
- `ACP_GPT54_MINI_OUTPUT_USD_PER_1M`
- `ACP_GPT54_INPUT_USD_PER_1M`
- `ACP_GPT54_OUTPUT_USD_PER_1M`

## Useful variants

### Custom output directory

```bash
npm run reproduce:claims -- --out /path/to/my-review-package
```

### Higher caps if your provider behavior differs

```bash
npm run reproduce:claims -- \
  --out /tmp/acp-load-bearing-claims \
  --measured-budget-usd 3 \
  --judge-budget-usd 4 \
  --live-budget-usd 2 \
  --live-adjudication-budget-usd 2
```

## After the run

Read in this order:

1. `/tmp/acp-load-bearing-claims/README.md`
2. `/tmp/acp-load-bearing-claims/summary.json`
3. `/tmp/acp-load-bearing-claims/conference-rehearsal/rehearsal-summary.json`
4. `/tmp/acp-load-bearing-claims/completion/technical-completion-audit.md`
5. `/tmp/acp-load-bearing-claims/skills/final/skills-v3-claims-memo.md`
6. `/tmp/acp-load-bearing-claims/skills/final/skills-v3-results-overview.md`
7. `/tmp/acp-load-bearing-claims/skills/final/skills-v3-non-claims.md`

## Boundaries / non-claims

A successful reproduction run does **not** by itself establish:

- field efficacy
- operator utility without human-review evidence
- fairness solved
- institutional legitimacy by default
- broad comparative superiority across all settings

Those boundaries are intentionally preserved in the generated skills claims memo and non-claims packet.
