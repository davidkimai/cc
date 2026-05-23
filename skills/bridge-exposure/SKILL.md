---
name: bridge-exposure
description: Use this skill when you need to inspect bridge exposure in ACP routing decisions and participant digests.
category: protocol
maturity: S2
---

# When to use this skill

Use this skill for bridge-perspective review after intervention routing or before operator release.

# When not to use this skill

Do not use this skill to add generic recommendation logic or to change ACP lifecycle semantics.

# Inputs expected

- intervention cycle record or batch output
- routing decisions and digests
- configured bridge budget when available

# Steps

1. Confirm the cycle is `intervention`.
2. Inspect routing decisions for `bridgeFlag` or `bridge_flag`.
3. Inspect digest items for bridge-marked contributions.
4. Confirm bridge exposure is present but bounded by the cycle config.

# Available scripts

- `scripts/check-bridge-exposure.mjs`: inspect bridge exposure from a cycle JSON file or generate a local demo intervention cycle when no input is provided

# Outputs

- bridge decision count
- bridge digest item count
- participant-level bridge exposure summary

# Failure handling

If bridge exposure is absent in an intervention cycle, return a failed summary for operator review instead of rewriting routing output.
