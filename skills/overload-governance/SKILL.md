---
name: overload-governance
description: Use this skill to enforce ACP digest size limits, bridge budgets, pacing, and bounded participant reading burden.
category: protocol
maturity: S3
---

# What this skill is for

Use this skill to keep ACP deliberation usable under load by checking digest size, bridge exposure, and reading burden before release.

# When to use it

- Reviewing a cycle config before routing or release.
- Checking whether digest item counts exceed configured limits.
- Interpreting overload metrics in benchmark or pilot evidence.

# When not to use it

- Do not use it for generic analytics.
- Do not use it to suppress minority views solely because they add complexity.
- Do not use it as a substitute for routing or fairness review.

# Inputs expected

- Cycle config
- Digests or routing outputs
- Participant count and contribution count
- Optional benchmark metrics

# Preflight / prerequisites

1. Confirm configured `maxDigestItems` and `maxBridgeItems`.
2. Confirm whether the cycle is baseline or intervention.
3. Inspect the actual digest set, not only aggregate counts.

# Workflow

1. Count digest items per participant.
2. Count bridge items per digest.
3. Compare counts to cycle config.
4. Look for repeated dominant-view items that consume attention budget.
5. Recommend release, revise, or escalate.

# Decision rules / judgment criteria

- Hard config limits block release.
- Bridge exposure must be bounded, justified, and not tokenistic.
- Lower reading burden is not acceptable if it erases material issues.
- Load governance must be paired with omission review.

# Escalation rules

Escalate when digest budget is exceeded, bridge budget is exceeded, unresolved questions are dropped for space, or load reductions erase a minority signal.

# Available scripts

- `scripts/check-load.mjs`: inspect digest item counts and bridge counts against cycle load limits.

# Outputs

- Load budget assessment
- Bridge budget assessment
- Overload risk notes
- Release/revise/escalate recommendation

# Failure handling

If config is missing or invalid, stop and repair the cycle definition before judging release readiness.

# Trust / safety notes

Load limits are constitutional constraints, not UX preferences. They must be explicit and inspectable.

# Composition notes

Use with `epistemic-routing`, `digest-and-explanation`, and `omission-critic` in any high-volume workflow.

# Examples to inspect next

Read `examples/casebook.md` for budget pass, budget failure, escalation, and anti-pattern cases.

# Evaluation hooks

Run `scripts/check-load.mjs` and `npm run skills:audit`.
