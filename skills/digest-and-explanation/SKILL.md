---
name: digest-and-explanation
description: Use this skill when you need to inspect ACP digest outputs, participant explanations, or intervention release state after routing is complete.
---

# When to use this skill

Use this skill for intervention-cycle digest review, explanation inspection, and participant digest validation.

# When not to use this skill

Do not use this skill to choose recipients or to analyze baseline thread release.

# Inputs expected

- cycle id
- intervention cycle with routing completed
- optional participant id

# Steps

1. Fetch the cycle or participant view.
2. Inspect the generated digest summary and items.
3. Check that every digest item has a reason and explanation.
4. Release the cycle when operator review is complete.

# Outputs

- digest payloads
- explanation text per item
- participant-facing intervention views

# Failure handling

If routing has not completed yet, stop and route back to the routing workflow.
