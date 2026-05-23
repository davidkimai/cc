---
name: abstention-escalation
description: Use this skill when ACP outputs have low confidence, medium/high critic risk, or require facilitator review before release.
category: protocol
maturity: S3
---

# What this skill is for

Use this skill to decide when ACP should abstain, request revision, or route a decision to a human facilitator.

# Constitutional purpose

Preserve safe refusal and human-steerable escalation when evidence, confidence, or institutional authority is insufficient for automatic release.

# Failure modes targeted

- Unsafe automation under uncertainty
- Low-confidence release
- Critic override pressure
- Authority mismatch between system output and human responsibility

# When to use it

- Engine confidence is low.
- Omission or fairness critic severity is medium or high.
- Release would exceed load, bridge, or explanation constraints.

# When not to use it

- Do not use it to hide inconvenient outputs.
- Do not use it as a generic error handler.
- Do not use it to bypass operator accountability.

# Inputs expected

- Critic severities
- Confidence score
- Release recommendation
- Operator review context

# Required evidence for valid use

- Concrete critic or confidence signals, not only vague discomfort
- The proposed action whose safety is under review
- Enough operator context to know whether escalation is evidence-related, fairness-related, or authority-related

# Preflight / prerequisites

1. Confirm critic outputs are present.
2. Confirm the proposed action has not already been taken.
3. Identify whether the escalation is about evidence, safety, fairness, or operator authority.

# Workflow

1. Read critic findings and confidence.
2. Classify action: release, review, revise, abstain.
3. Name the concrete reason.
4. Produce operator handoff notes.

# Decision rules / judgment criteria

- High critic severity means no automatic release.
- Low confidence requires review even if the digest looks polished.
- Abstention should preserve unresolved disagreement.

# Escalation rules

Escalate to facilitator review when confidence is low, critic severity is high, source references are missing, or institutional authority is required.

# Available scripts

- `scripts/smoke.mjs`: emits escalation action labels and expected inputs.

# Produced artifacts

- Action classification
- Escalation reason
- Operator handoff notes

# Allowed claims

- That ACP should release, revise, abstain, or escalate under the supplied evidence
- That the remaining uncertainty requires human review
- That confidence or critic severity is insufficient for automatic release

# Forbidden claims

- That abstention is unnecessary because the output looks polished
- That escalation can be skipped because a benchmark or model score is high
- That abstention by itself resolves the underlying civic disagreement

# Human override points

- Facilitator signoff on release after escalation
- Manual abstention confirmation when authority is contested
- Human decision on whether revision is enough or full escalation is required

# Outputs

- Action classification
- Escalation reason
- Operator handoff notes

# Failure handling

If critic evidence is missing, state that confidence cannot be assessed.

# Trust / safety notes

Abstention is a strength of ACP. Do not frame it as system failure when the evidence is genuinely uncertain.

# Composition notes

Use after omission and fairness review, before release or conference packaging.

# Examples to inspect next

Read `examples/casebook.md` for release, review, abstain, and anti-pattern examples.

# Evaluation hooks

Run `scripts/smoke.mjs` and `npm run skills:audit`.
