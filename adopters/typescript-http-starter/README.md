# ACP TypeScript HTTP Starter

This is the smallest external-style starter for ACP.

It does not import Relay internals. It validates the protocol bundle, then drives a full ACP cycle through the public Relay HTTP API.

## 1. Install

From the repo root:

```sh
npm install
```

## 2. Inspect the protocol bundle

Start with the machine-readable ACP bundle:

- `protocol/acp-bundle.manifest.json`
- `protocol/discovery.json`
- `protocol/compatibility/compatibility-matrix.json`

These files describe the protocol artifacts, proof surfaces, and supported implementation boundaries.

## 3. Start Relay

In one terminal:

```sh
npm run dev
```

By default Relay runs at:

```text
http://127.0.0.1:4317
```

## 4. Run a scenario

In another terminal:

```sh
npm run adopter:starter -- --base-url http://127.0.0.1:4317 --out /tmp/acp-adopter-run
```

To run the baseline example:

```sh
npm run adopter:starter -- --scenario adopters/typescript-http-starter/examples/baseline.json --base-url http://127.0.0.1:4317 --out /tmp/acp-adopter-baseline
```

## 5. Inspect evidence

The starter writes:

- `normalized-input.json`
- `cycle.json`
- `participant-views.json`
- `conformance-report.json`
- `run-manifest.json`
- `evidence-index.json`
- `exports/*.md`

`evidence-index.json` includes a compact `summary` with lifecycle counts, routing/digest counts, and criteria evidence:

- configured deliberative criteria count
- routed decisions with factor traces
- routed decisions with shared criteria weights
- bridge-decision count

Use these artifacts to inspect what happened without opening the Relay UI.

## 6. Run conformance

```sh
npm run conformance:check
```

The starter also runs the same conformance path during execution and records the result in `conformance-report.json`.
