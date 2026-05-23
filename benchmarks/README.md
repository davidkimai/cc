# ACP Benchmark and Comparison Harness

This directory holds seeded civic and governance scenarios for deterministic ACP comparisons.

The harness pairs the same discussion shell across:

- `intervention`
- `baseline_thread`

Use it when you need a stable run bundle for demos, dogfood loops, export review, or later publication artifacts.

Primary commands:

- `npm run benchmark:fixtures`
- `npm run benchmark:demo`
- `npm run benchmark:compare -- --class participatory-budget-priorities`
- `npm run benchmark:replay`

The source of truth for available scenario classes is [`manifest.json`](manifest.json).
