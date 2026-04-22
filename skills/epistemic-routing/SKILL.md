---
name: epistemic-routing
description: Use this skill when you need to compute or inspect ACP routing decisions, including bridge exposure and recipient load constraints.
---

# When to use this skill

Use this skill for intervention-cycle recipient selection, routing inspection, or bridge exposure review.

# When not to use this skill

Do not use this skill for baseline cycles or for final participant digest rendering.

# Inputs expected

- cycle id
- intervention condition
- submissions already closed

# Steps

1. Confirm the cycle is `intervention` and `submission_closed`.
2. Run `node dist/cli.js cycle run-routing <cycleId>` after build, or call `POST /v1/cycles/:cycleId/routing`.
3. Inspect routing decisions in the cycle record.
4. Verify bridge-flagged items remain bounded by the cycle config.

# Outputs

- routing decisions
- bridge exposure flags
- operator audit trail for routing completion

# Failure handling

If the cycle is baseline or submissions are still open, stop and return the protocol error.
