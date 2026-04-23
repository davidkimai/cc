# ACP canonical specs

This directory is the canonical source of truth for ACP-first implementation work inside the `acp` repo.

Read the stack in this order:
- `ACP_TECHNICAL_SPEC.md`
- `ACP_PROTOCOL_CONTRACT_SPEC.md`
- `ACP_TELEMETRY_EVALUATION_SPEC.md`
- `RELAY_BLOCKS_SPEC.md`
- `ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md`

Implementation child specs:
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md`
- `RELAY_WEB_APP_SPEC.md`
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md`
- `ACP_HTTP_API_SPEC.md`
- `ACP_COORDINATION_ENGINE_SPEC.md`
- `ACP_PERSISTENCE_EXPORT_SPEC.md`
- `ACP_PILOT_OPERATIONS_SPEC.md`
- `ACP_EVALUATION_INSTRUMENT_SPEC.md`
- `RELAY_BLOCKS_EXECUTION_SPEC.md`
- `ACP_AGENT_EXECUTION_CONTRACT.md`
- `ACP_RELEASE_DEPLOYMENT_SPEC.md`

Hierarchy:
- `ACP` is the protocol and primary contribution.
- `Relay` is the first implementation used to validate ACP.
- `Relay Blocks` are the reusable operational units packaged over ACP.

Rule:
- if implementation, README copy, or old proposal-era docs diverge from this stack, this directory wins until explicitly revised.

Historical note:
- `Beyond Overload` was the proposal-era name before the repo was reframed around ACP-first positioning.
