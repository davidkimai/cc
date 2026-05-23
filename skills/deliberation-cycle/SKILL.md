---
name: deliberation-cycle
description: Use this skill to run or inspect a complete ACP cycle from draft through archive without bypassing lifecycle guardrails.
category: protocol
maturity: S3
---

# What this skill is for

Use this skill when the task is about the whole ACP cycle: creation, submission, routing when applicable, release, reflection, archive, and audit handoff.

# When to use it

- A user asks to run a complete demo or pilot cycle.
- A cycle is stuck and the next valid lifecycle action must be identified.
- A reviewer needs to understand the end-to-end ACP workflow.

# When not to use it

- Use `epistemic-routing` for routing-only inspection.
- Use `digest-and-explanation` for digest-only review.
- Use `pilot-analysis` for metric comparison after cycles are complete.

# Inputs expected

- Cycle condition: `intervention` or `baseline_thread`
- Title and prompt
- Participant roster or participant seed file
- Current cycle status
- Desired next operator action

# Preflight / prerequisites

1. Confirm the canonical lifecycle in `docs/specs/ACP_PROTOCOL_CONTRACT_SPEC.md`.
2. Build the repo before CLI execution when `dist/` may be stale.
3. Confirm whether the task is review-only or allowed to mutate cycle state.
4. For intervention cycles, confirm submissions are closed before routing.

# Workflow

1. Inspect the cycle state and condition.
2. Identify the next valid lifecycle transition.
3. For `intervention`, route before digest release.
4. For `baseline_thread`, keep output chronological and do not invent routing evidence.
5. Run audit/export review before claiming the cycle is demonstration-ready.
6. Archive only after reflection or review requirements are satisfied.

# Decision rules / judgment criteria

- Lifecycle validity beats operator convenience.
- Baseline and intervention conditions must remain comparable.
- Never convert a baseline thread into routed evidence.
- Missing audit/export evidence blocks claims, even when the UI looks correct.

# Escalation rules

Escalate to a maintainer when the requested action would skip a lifecycle state, erase condition comparability, or require interpreting missing participant data.

# Available scripts

- `scripts/check-lifecycle.mjs`: inspects a cycle JSON file or demo lifecycle seed for canonical status vocabulary and next-action notes.

# Outputs

- Next valid lifecycle action
- Cycle readiness notes
- Audit-ready handoff summary

# Failure handling

Stop on invalid transitions. Report the current status, requested action, and the canonical transition that must happen first.

# Trust / safety notes

This skill can guide lifecycle-changing commands. Treat it as operator-sensitive and do not mutate a cycle unless the user explicitly requested execution.

# Composition notes

Use this before `pilot-cycle-review` when the cycle state is uncertain. Use `operator-audit` after lifecycle actions to prove what happened.

# Examples to inspect next

Read `examples/casebook.md` for happy path, failure path, ambiguity, and anti-pattern examples.

# Evaluation hooks

Run `scripts/check-lifecycle.mjs` or `npm run skills:audit` to verify this skill's structure and lifecycle vocabulary.
