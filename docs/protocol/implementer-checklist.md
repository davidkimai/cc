# ACP Implementer Checklist

Use this checklist before calling a new surface ACP-compatible.

## Required Objects

- Cycle
- Participant
- Contribution
- RoutingDecision for intervention cycles
- Digest and DigestItem for intervention cycles
- Response
- AuditEvent
- TelemetryEvent
- Replay expectation or export evidence

## Required Behavior

- Preserve `intervention` and `baseline_thread` exactly.
- Use canonical lifecycle statuses at cycle boundaries.
- Emit routing decisions and digests only for intervention cycles.
- Preserve deliberative criteria, routing factors, and shared weights when routing is performed.
- Keep baseline-thread cycles comparable but routing-free.
- Capture enough audit and telemetry evidence to inspect the run later.
- Export evidence in a reviewer-readable form.

## Minimum Validation

```sh
npm run conformance:check -- --json
npm run benchmark:replay
```

For an external HTTP consumer, also run:

```sh
npm run adopter:starter -- --base-url http://127.0.0.1:4317 --out /tmp/acp-adopter-run
```

Then inspect `/tmp/acp-adopter-run/evidence-index.json` and confirm `summary.criteria.decisionsWithFactors` matches the routed decision count for intervention runs.

## Non-Goals

- UI parity with Relay
- Relay Blocks support
- social-platform features outside ACP coordination
- local status mappings that compete with ACP vocabulary
