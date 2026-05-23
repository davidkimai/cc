---
name: operator-audit
description: Use this skill to inspect ACP audit events, telemetry, exports, replay evidence, and claim-safe operator traces.
category: protocol
maturity: S3
---

# What this skill is for

Use this skill to determine whether an ACP cycle has reviewable evidence for what happened.

# When to use it

- Before declaring a demo, pilot, or benchmark run complete.
- When an export, replay, or lifecycle claim needs evidence.
- When a failure needs a preserved audit trail.

# When not to use it

- Do not use it to optimize routing.
- Do not use it to infer missing metrics.
- Do not use it to mutate protocol history.

# Inputs expected

- Cycle id or cycle JSON
- Desired export mode
- Claim boundary being evaluated

# Preflight / prerequisites

1. Confirm whether the review is source, generated evidence, or local debris.
2. Confirm exports are generated through Relay, not hand-authored.
3. Keep audit review separate from field-efficacy claims.

# Workflow

1. Fetch cycle, audit events, telemetry events, metrics, digests, routing decisions, and exports.
2. Generate missing canonical exports if explicitly requested.
3. Check for lifecycle anomalies, telemetry gaps, and missing output evidence.
4. Produce a compact review summary with gaps and next actions.

# Decision rules / judgment criteria

- Claims require artifacts, not memory.
- Missing telemetry is a gap, not a value to infer.
- Generated evidence must be classified before commit or freeze.
- Replay is an inspection path, not a semantic source of truth.

# Escalation rules

Escalate when audit events contradict cycle state, export modes are missing, telemetry is absent for claim-bearing flows, or generated evidence is too broad to freeze safely.

# Available scripts

- `scripts/build-audit-summary.mjs`: inspect audit, telemetry, export, and lifecycle evidence from cycle JSON or a local demo cycle.

# Outputs

- Audit timeline
- Telemetry summary
- Export readiness report
- Claim-safe evidence notes

# Failure handling

Preserve failure outputs. Do not clean, rewrite, or regenerate evidence until the failure has been classified.

# Trust / safety notes

Audit skills protect claim boundaries. They should make uncertainty more visible, not make the project look cleaner than it is.

# Composition notes

Use inside `pilot-cycle-review`, `foresight-submission-prep`, and release evidence workflows.

# Examples to inspect next

Read `examples/casebook.md` for audit success, missing export, ambiguous telemetry, and overclaiming examples.

# Evaluation hooks

Run `scripts/build-audit-summary.mjs` and `npm run skills:audit`.
