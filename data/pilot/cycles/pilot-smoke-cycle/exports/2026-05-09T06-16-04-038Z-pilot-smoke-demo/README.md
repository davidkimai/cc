# ACP Relay Demo Bundle

This directory contains the canonical synthetic seed data for ACP-first Relay demos.

Use it to show a governance reviewer what ACP changes:

- `intervention`: a routed digest with explanations
- `baseline_thread`: a chronological thread with no routing layer

## Start Here

From the repository root:

```bash
npm run demo:bootstrap
npm run demo:summary
```

The bootstrap command copies the demo bundle into `.acp-demo/acp-relay-demo` and prints the canonical lifecycle:

```text
draft -> scheduled -> submission_open -> submission_closed -> routing_complete -> digests_released -> reflection_closed -> archived -> failed
```

## Bundle Contents

- `bootstrap-manifest.json`
- `seed/cycles.json`
- `seed/participants.json`
- `seed/lifecycle.json`

## Civic Prompt Packs

The demo bundle is paired with ready civic prompt packs:

- `docs/pilot/prompt-packs/`
- `docs/evaluation/prompt-packs/`

These packs cover municipal budgeting, public hearings, school board tradeoffs, emergency response, and procurement oversight.

## Reviewer Notes

- Sample identities are synthetic.
- No network access or live model call is required to bootstrap the demo data.
- Relay is the reference implementation; ACP is the protocol being demonstrated.

For the deployment walkthrough, see [`docs/deployment/demo/README.md`](/Users/jasontang/acp/docs/deployment/demo/README.md).
