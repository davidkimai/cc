# ACP Relay Demo Deployment

This guide explains the canonical local demo bundle for ACP-first Relay.

## What this bundle is

The demo bundle is synthetic data that makes it easy to show two ACP conditions:

- `intervention`
- `baseline_thread`

The bundle is intentionally small and disposable. It is meant for local demos, operator rehearsals, and documentation examples.

## Bootstrap path

From the repo root:

```bash
bash scripts/demo/bootstrap-demo.sh
```

That command copies the tracked demo bundle into the default target directory:

```text
./.acp-demo/acp-relay-demo
```

To choose a different target directory:

```bash
bash scripts/demo/bootstrap-demo.sh --target /tmp/acp-relay-demo
```

## Summary path

To inspect the seeded bundle after bootstrap:

```bash
bash scripts/demo/demo-summary.sh --target /tmp/acp-relay-demo
```

If you skip `--target`, the summary script reads directly from the tracked `demo/` bundle.

## Expected bundle contents

- `bootstrap-manifest.json`
- `seed/cycles.json`
- `seed/participants.json`
- `seed/lifecycle.json`

## Demo expectations

- the intervention cycle shows a routed digest and routing explanations
- the baseline cycle shows a chronological thread with no digest layer
- all sample identities are synthetic
- no network access is required to bootstrap the demo data

## Operator note

The demo bundle is data-only. It does not replace Relay startup, API wiring, or runtime deployment; it just makes the ACP story easier to stage and explain.
