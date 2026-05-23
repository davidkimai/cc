# ACP External Implementer Guide

## 1. What ACP owns

ACP owns the protocol meaning:

- the shared cycle model
- condition semantics
- lifecycle semantics
- routing, digest, release, response, feedback, audit, telemetry, export, and replay meaning

ACP does not own a particular UI.

## 2. What Relay owns

Relay is the first implementation of ACP.

Relay owns:

- persisted cycle state
- the current operator and participant surfaces
- current lifecycle execution
- exports, telemetry, audit events, metrics, and replay support

Relay is not the protocol itself.

## 3. What Relay Blocks own

Relay Blocks package operational workflows over ACP and Relay.

They own:

- operator guidance
- helper scripts
- runtime-specific workflow packaging
- composition helpers

They do not own canonical cycle state or protocol meaning.

## 4. Minimum support for an ACP-compatible second surface

A second ACP-compatible surface for v0.1 must support:

- one shared cycle model across `intervention` and `baseline_thread`
- both condition values with exact spelling
- create/open/close/release/archive semantics
- routing and digests only for `intervention`
- exports sufficient for review
- telemetry/audit retention sufficient for replay and inspection

It does not need:

- UI parity with Relay
- Relay Blocks support
- OpenClaw-specific packaging

## 5. Boundary normalization rules

Two current boundary rules matter:

- Relay cycle status tokens should match the ACP contract at implementation boundaries.
- Operator and telemetry event names are a separate vocabulary from cycle status values.

Normalize at the boundary. Do not treat these as separate meanings.

## 6. Reference artifacts

Use these artifacts as the current ACP v0.1 implementation anchor:

- `protocol/acp-canonical.schema.json`
- `protocol/examples/`
- `protocol/compatibility/compatibility-matrix.json`
- `docs/compatibility/RELAY_COMPATIBILITY_NOTES.md`
- `fixtures/replay/`

## 7. How to validate compatibility

Validation path:

1. align your surface to the schema bundle
2. preserve the shared cycle model and condition semantics
3. check replay and export expectations against the fixture and compatibility layers
4. run `npm run conformance:check`

If your surface changes ACP semantics, it is not ACP-compatible.

## 8. Second proof surface in this repo

This repo includes one second ACP-compatible proof surface beyond the Relay web app:

- the lightweight batch runner under `runners/batch/`

The batch runner proves that ACP can operate outside the main Relay browser surface while still relying on the canonical ACP model.

## 9. API-driven external adopter example

This repo now also includes one stronger external-consumer path:

- the HTTP client runner under `runners/http-client/`
- the TypeScript HTTP starter under `adopters/typescript-http-starter/`

The HTTP client runner uses the public Relay HTTP API instead of the in-process service layer.
That makes it the first serious external implementer example in this repo.

The TypeScript HTTP starter is the recommended first path for adopters. It starts from the protocol bundle, validates the local ACP workspace, runs a scenario through the public HTTP API, and writes an evidence index.

Use it when you want to validate:

- ACP lifecycle semantics across the public implementation boundary
- participant-view and export capture outside the browser UI
- whether an external consumer can drive ACP without importing the current engine directly

Starter path:

1. inspect `protocol/acp-bundle.manifest.json`
2. inspect `protocol/discovery.json`
3. inspect `protocol/compatibility/compatibility-matrix.json`
4. start Relay with `npm run dev`
5. run `npm run adopter:starter -- --base-url http://127.0.0.1:4317 --out /tmp/acp-adopter-run`
6. inspect `evidence-index.json`
7. run `npm run conformance:check`

## 10. Recommended extension path

If you are building another ACP-compatible surface:

1. preserve ACP meaning first
2. localize boundary mappings
3. keep workflow packaging separate from canonical state
4. use the compatibility matrix to state what is native, mapped, wrapped, or assumed
5. add examples and validation artifacts before broadening the feature set
