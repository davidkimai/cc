---
name: overload-governance
description: Use this skill when you need to enforce ACP digest size limits, pacing, and bounded participant reading burden.
---

# When to use this skill

Use this skill when reviewing cycle configuration or validating that a release respects the configured load budget.

# When not to use this skill

Do not use this skill for unrelated UI styling or generic analytics tasks.

# Inputs expected

- cycle config
- digest or routing outputs

# Steps

1. Read the cycle config.
2. Confirm digest item counts do not exceed the configured cap.
3. Confirm bridge items remain within the configured bridge budget.
4. Flag releases that exceed the budget before participant delivery.

# Outputs

- overload risk assessment
- config-aligned release decision

# Failure handling

If config is missing or invalid, stop and repair the cycle definition before release.
