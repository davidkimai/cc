---
name: operator-audit
description: Use this skill when you need to inspect ACP audit events, telemetry, exports, or replay behavior for a Relay operator workflow.
---

# When to use this skill

Use this skill for operational review, replay, export generation, and failure inspection.

# When not to use this skill

Do not use this skill for participant-side composition or submission tasks.

# Inputs expected

- cycle id
- desired export mode or inspection target

# Steps

1. Fetch the cycle, audit events, telemetry events, or metrics endpoints.
2. Generate the export needed: `analysis`, `audit`, or `minimal`.
3. Use replay only as an inspection action; do not mutate protocol semantics.
4. Report missing telemetry or invalid lifecycle transitions explicitly.

# Outputs

- audit timeline
- telemetry event stream
- export artifacts
- replay trace

# Failure handling

If export generation or replay fails, return the failure and preserve the cycle state for investigation.
