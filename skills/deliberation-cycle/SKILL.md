---
name: deliberation-cycle
description: Use this skill when you need to run or inspect a full ACP cycle from creation through archive using the canonical cycle lifecycle.
---

# When to use this skill

Use this skill when the task is about running the end-to-end ACP lifecycle rather than one isolated step.

# When not to use this skill

Do not use this skill for standalone routing inspection, digest generation review, or metrics-only analysis. Use the narrower package instead.

# Inputs expected

- cycle condition: `intervention` or `baseline_thread`
- title and prompt
- participant roster
- desired next lifecycle action

# Steps

1. Create or fetch the cycle through the CLI or HTTP API.
2. Respect the canonical order: `draft -> submission_open -> submission_closed -> routing_completed (intervention only) -> digests_released -> reflection_closed -> archived`.
3. For intervention cycles, run routing before release.
4. For baseline cycles, skip routing and release the thread view after submissions close.
5. Use operator audit and export flows to inspect the result.

# Outputs

- canonical cycle record
- participant view payloads
- audit-ready lifecycle state

# Failure handling

If the requested action violates lifecycle guardrails, stop and report the invalid transition instead of improvising.
