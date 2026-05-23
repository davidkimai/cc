# ACP Conference Rehearsal Bundle

Generated: 2026-05-23T01:58:29.007Z

This bundle is a reproducible local rehearsal packet for conference, institutional, and partner review.

The **public branch** is expected to keep this README plus `rehearsal-summary.json` as the high-signal reviewer surfaces. Re-run `npm run conference:rehearsal` locally when you need the full nested benchmark, report, adopter, and dogfood directories.

## Local regenerated contents

- `flagship-benchmark/`: public-hearing intervention-vs-baseline benchmark bundle
- `flagship-report/`: institutional report generated from the flagship benchmark
- `dogfood-run/`: seeded Relay dogfood run through the public HTTP boundary
- `adopter-http-run/`: external adopter starter run through the public HTTP boundary
- `runtime-data/`: disposable SQLite runtime data used during rehearsal
- `rehearsal-summary.json`: command outputs and artifact pointers

## High-Signal Checks

- Flagship criteria evidence: true
- Dogfood findings: 0
- Adopter status: unknown
- Release smoke: true
