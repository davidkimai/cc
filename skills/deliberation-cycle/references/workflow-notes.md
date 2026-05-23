# Deliberation Cycle Workflow Notes

The cycle skill is the lifecycle coordinator. It should not invent ACP state names or skip transitions.

Use the canonical specs for semantics:

- `docs/specs/ACP_PROTOCOL_CONTRACT_SPEC.md`
- `docs/specs/RELAY_DEMO_DATA_SPEC.md`

Review order:

1. current condition and status
2. requested operator action
3. next valid transition
4. required evidence before archive

