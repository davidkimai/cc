# ACP Batch Runner

This runner is the second ACP-compatible proof surface in this repo.

It executes one cycle from a file-based scenario bundle without using the Relay web UI.

## Run

```bash
npm run batch:run -- runners/batch/examples/intervention.json
npm run batch:run -- runners/batch/examples/baseline.json
```

Optional output directory:

```bash
npm run batch:run -- runners/batch/examples/intervention.json --out /tmp/acp-batch-run
```

## Output bundle

Each run writes:

- `normalized-input.json`
- `cycle.json`
- `exports/`
- `conformance-report.json`
- `run-manifest.json`
