# ACP Technical Completion Audit

Generated: 2026-05-19T16:36:45.857Z

## Result

- Status: pass
- Passing claims: 6/6

## Claims

| Claim | Status | Statement | Evidence |
| --- | --- | --- | --- |
| explainable-without-relay | pass | ACP can be explained without opening Relay UI code. | docs/protocol/README.md<br>protocol/acp-bundle.manifest.json<br>protocol/discovery.json<br>protocol/EXTERNAL_IMPLEMENTER_GUIDE.md |
| checkable-without-trust | pass | ACP can be checked without trusting the authors. | scripts/conformance/check-acp.mjs<br>fixtures/replay/manifest.json<br>tests/conformance.test.ts |
| runs-outside-browser | pass | ACP can be run outside the main Relay browser flow. | scripts/batch/run-batch.ts<br>scripts/http-client/run-http-scenario.mjs<br>adopters/typescript-http-starter/src/run.ts |
| clear-outside-adoption-path | pass | ACP can be adopted through a clear outside path. | adopters/typescript-http-starter/README.md<br>src/sdk/index.ts<br>protocol/compatibility/compatibility-matrix.json |
| inspectable-evidence | pass | ACP can produce evidence others can inspect. | benchmarks/manifest.json<br>scripts/benchmark/run-benchmark.mjs<br>scripts/report/build-report-bundle.mjs |
| production-discipline | pass | Relay can be operated with credible production discipline. | src/api/ops.ts<br>scripts/release/run-release-gate.mjs<br>scripts/workspace/workspace-archive.mjs |
