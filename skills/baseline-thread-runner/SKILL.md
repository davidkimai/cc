---
name: baseline-thread-runner
description: Use this skill when you need to run or inspect the Relay baseline thread condition under the same canonical cycle model.
---

# When to use this skill

Use this skill for baseline-condition cycles where participants should receive a chronological thread instead of routed digests.

# When not to use this skill

Do not use this skill for intervention routing or digest workflows.

# Inputs expected

- baseline cycle id

# Steps

1. Confirm the cycle condition is `baseline_thread`.
2. Run the cycle through open, submission, close-submissions, release, close-reflection, and archive.
3. Use participant views to inspect thread output.
4. Use exports and metrics for comparison against intervention cycles.

# Outputs

- baseline participant thread views
- condition-correct audit and telemetry data

# Failure handling

If an intervention-only action is requested, reject it and keep the baseline semantics intact.
