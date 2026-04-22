---
name: pilot-analysis
description: Use this skill when you need to compute or inspect ACP metrics, telemetry, or export outputs for intervention and baseline cycles.
---

# When to use this skill

Use this skill for metric review, cycle export inspection, and condition comparison.

# When not to use this skill

Do not use this skill to manage lifecycle transitions or author participant content.

# Inputs expected

- cycle id
- desired export mode

# Steps

1. Generate the relevant export through the API or CLI.
2. Inspect the metrics block on the cycle.
3. Compare exposure concentration, reply concentration, contributor coverage, bridge exposure, explanation engagement, and abandonment.

# Outputs

- metrics summary
- analysis export
- audit or minimal export when needed

# Failure handling

If telemetry is incomplete, report metric incompleteness explicitly instead of inventing values.
