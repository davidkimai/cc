# ACP Protocol Guide

This directory is the public-facing entrypoint for teams that want to understand or implement ACP without treating Relay as the protocol.

ACP is the protocol. Relay is the reference implementation. Relay Blocks are operational helpers around ACP workflows.

## What ACP Provides

ACP defines a shared cycle model for small-group deliberation under attention load:

- one `Cycle` shape across intervention and baseline-thread conditions
- canonical condition values: `intervention` and `baseline_thread`
- canonical lifecycle statuses: `draft`, `scheduled`, `submission_open`, `submission_closed`, `routing_complete`, `digests_released`, `reflection_closed`, `archived`, `failed`
- intervention-only routing decisions and digests
- baseline-thread comparability without routing artifacts
- audit, telemetry, export, and replay evidence for inspection

## Implementation Path

Start with these artifacts:

- `protocol/acp-bundle.manifest.json`
- `protocol/acp-canonical.schema.json`
- `protocol/examples/`
- `fixtures/replay/`
- `protocol/compatibility/compatibility-matrix.json`

Then validate with:

```sh
npm run conformance:check -- --json
```

The conformance report includes a counted `checks` array and should report more than zero checks with all checks passing.

## Proof Surfaces

The repository includes more than the Relay browser flow:

- Relay browser and CLI: the reference implementation surface
- batch runner: file-driven ACP execution without the browser UI
- HTTP API runner and TypeScript starter: external-consumer paths that drive ACP through public HTTP boundaries

These surfaces exist to show that ACP is a reusable coordination primitive, not only a single web app.

## Boundary Rules

- Do not redefine lifecycle statuses locally.
- Keep `routing_completed` as an operator event token, not a cycle status.
- Keep Relay Blocks as workflow packaging, not canonical state ownership.
- Keep adapters responsible for local runtime assumptions only.
- Add replay fixtures and conformance checks before claiming new protocol behavior.
