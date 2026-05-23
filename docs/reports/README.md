# Relay Export And Report Notes

This directory documents what Relay export artifacts are for and how to review them during demos and fellowship pilot runs.

Ground truth for export presentation lives in:

- `docs/specs/RELAY_EXPORT_REPORT_SPEC.md`

## Export modes

- `analysis`: presentation-quality summary for one cycle
- `audit`: operator-facing trace with audit and telemetry detail
- `minimal`: compact snapshot for quick handoff and triage

## Review rule

A report should be understandable without opening the UI. If an export is technically correct but difficult to read in a live walkthrough, it should be improved.

## Institutional report bundles

Use `npm run report:bundle -- --source <bundle-or-run-dir> --out <dir>` to turn preserved ACP evidence into a readable review packet.

The command supports benchmark comparison bundles and dogfood/live-style run bundles. It generates:

- `index.html`
- `cycle-briefing.html`
- `pilot-recap.html`
- `compatibility-proof.html`
- `protocol-explainer.html`
- `evidence-index.json`
- `comparison-summary.json` when present in the source bundle
- `operator-review.md`
- `research-review.md`

The generated pages are reading aids. The source of truth remains the indexed raw artifacts in `evidence-index.json`.

## Conference rehearsal bundle

Use `npm run conference:rehearsal -- --out artifacts/conference/rehearsal` to regenerate the current conference rehearsal packet.

The rehearsal command builds:

- flagship public-hearing benchmark evidence
- an institutional report bundle for that benchmark
- a seeded Relay dogfood run through the public HTTP boundary
- an external adopter starter run through the same HTTP boundary
- `rehearsal-summary.json` and a short bundle `README.md`

The command is intended for internal rehearsal and paper-appendix evidence checks. It is not a substitute for the full release gate.
