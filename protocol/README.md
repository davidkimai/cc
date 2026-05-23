# ACP Protocol Canonical Objects

This directory contains the compact protocol bundle for the ACP canonical objects used by the current Relay implementation.

## What is here

- `acp-bundle.manifest.json`: versioned machine-readable list of the canonical ACP bundle artifacts.
- `discovery.json`: machine-readable registry for ACP artifacts, proof surfaces, and runtime distribution roots.
- `acp-canonical.schema.json`: a human-readable JSON Schema bundle with the canonical object definitions in one place.
- `examples/intervention-cycle.example.json`: a small intervention-mode cycle payload.
- `examples/baseline-cycle.example.json`: a small baseline-thread cycle payload.
- `EXTERNAL_IMPLEMENTER_GUIDE.md`: decision-complete guidance for building another ACP-compatible surface.
- `compatibility/compatibility-matrix.json`: machine-readable proof-surface and compatibility boundary summary.
- `../skills/registry.json`: machine-readable Relay Blocks / ACP Skills registry for agent and operator workflow discovery.
- `../skills/CONSTITUTIONAL_SKILLS.md`: human-readable account of the constitutional procedural layer over the protocol.

## Canonical object model

The bundle is centered on `CycleRecord`, which carries the full Relay cycle state:

- cycle metadata: `id`, `title`, `prompt`, `condition`, `status`, timestamps
- configuration and schedule: `config`, `schedule`
- actors: `participants`
- content: `contributions`, `responses`, `feedback`
- routing layer: `routingDecisions`, `digests`
- instrumentation: `telemetryEvents`, `auditEvents`
- exports and rollups: `exports`, `metrics`
- procedural governance attachments: `proceduralLayer`

## Relay behavior reflected here

- `intervention` cycles may populate routing decisions, digests, and routing explanations.
- `baseline_thread` cycles keep the same cycle contract, but those routing artifacts stay empty.
- Timestamps use ISO 8601 strings.
- The schema follows the current core model in `src/core/types.ts` and stays intentionally compact.

## How to use it

- Load `acp-bundle.manifest.json` first when you need machine-readable discovery of ACP protocol artifacts.
- Load `discovery.json` when you need implementation listings, proof surfaces, and runtime distribution metadata.
- Load `../skills/registry.json` when you need the agent-operable procedural layer over the protocol.
- Treat `acp-canonical.schema.json` as the reference contract for ACP protocol-facing payloads.
- Use `proceduralLayer` when you need protocol-adjacent metadata about procedure references, artifact expectations, contest points, adherence markers, and escalation provenance.
- Use the examples as copyable payload templates when wiring integrations or writing tests.
- Keep extensions conservative so the bundle remains easy to read and diff.

## External implementer path

Use `docs/protocol/README.md`, `docs/protocol/implementer-checklist.md`, and `EXTERNAL_IMPLEMENTER_GUIDE.md` when building another ACP-compatible surface.
The current repo now includes a second proof surface via the batch runner under `runners/batch/`.
