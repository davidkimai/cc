# Skills V3 Live-Provider Budget

Status: V3.1-LP pilot budget policy

## Budget

- V3.1-LP pilot target: `$10-$15`
- Total Skills V3 default live-provider budget: `$30`
- Absolute ceiling: `$50`, only with documented strategic justification

## Model Policy

- Default: `gpt-5.4-mini`
- Arbitration / hard cases only: `gpt-5.4`

## Required Artifacts

Live pilot runs must write:

- `pilot-summary.json`
- `pilot-summary.md`
- `costs.json`
- `failures.md`
- `traces/*.json`

## Claim Boundary

The live pilot may show that ACP skills can be exercised through real provider calls with structured outputs, traces, costs, latency, and failure capture.

It must not claim real-world civic efficacy, full comparative superiority, fairness solved, or field readiness.

## Cost Accounting Note

Costs are local estimates from token usage and repo-local pricing defaults or environment overrides. They are not provider invoices. Override rates with:

- `ACP_GPT54_MINI_INPUT_USD_PER_1M`
- `ACP_GPT54_MINI_OUTPUT_USD_PER_1M`
- `ACP_GPT54_INPUT_USD_PER_1M`
- `ACP_GPT54_OUTPUT_USD_PER_1M`
