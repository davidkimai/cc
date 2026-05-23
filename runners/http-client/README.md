# ACP HTTP client runner

This runner is the first serious external-consumer example for ACP.

It uses:

- the public Relay HTTP API
- the canonical ACP scenario shape already used by the batch runner

It does not import the Relay engine directly.

## Why it exists

The batch runner proves ACP can run outside the Relay browser surface.

This HTTP runner proves something stronger:

- an external consumer can drive ACP through the public implementation boundary
- ACP meaning survives outside the in-process service layer

## Run it

Start Relay locally, then run:

```bash
npm run http:run -- runners/http-client/examples/intervention.json --base-url http://127.0.0.1:4317 --out /tmp/acp-http-run
```

You can also run the baseline example:

```bash
npm run http:run -- runners/http-client/examples/baseline.json --base-url http://127.0.0.1:4317 --out /tmp/acp-http-run-baseline
```

## Output bundle

Each run writes:

- `normalized-input.json`
- `cycle.json`
- `participant-views.json`
- `exports/`
- `conformance-report.json`
- `run-manifest.json`

## Relationship to ACP

- `ACP` owns protocol meaning
- `Relay` owns the current API surface
- this runner is an external consumer example
- `Relay Blocks` remain the operational packaging layer
