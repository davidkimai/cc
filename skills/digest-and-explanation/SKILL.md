---
name: digest-and-explanation
description: Use this flagship skill to inspect ACP digest items, explanation faithfulness, routing explanations, and release readiness.
category: protocol
maturity: S4
---

# What this skill is for

Use this skill when routed items must become participant-facing digests with clear, faithful, bounded explanations.

# Constitutional purpose

Compress routed material into participant-facing outputs without hiding disagreement, uncertainty, or source-evidence limits.

# Failure modes targeted

- Explanation overclaiming
- False neutrality or false consensus language
- Untraceable digest items
- Release-ready framing unsupported by source evidence

# When to use it

- Reviewing intervention digests before release.
- Checking `DigestItem.explanation_text` and digest-level `routing_explanations`.
- Verifying that participant-facing summaries preserve disagreement and uncertainty.

# When not to use it

- Do not use it to select routing recipients.
- Do not use it for baseline chronological thread review.
- Do not rewrite canonical digest fields in skill prose.

# Inputs expected

- Routed intervention cycle or participant view
- Digest items and routing explanations
- Cycle config and release target
- Optional participant id for focused review

# Required evidence for valid use

- Digest items with source contribution references
- Digest-level and item-level explanation text
- Release context sufficient to know whether the work is review-only or release-authorized
- Critic or routing notes when omission/fairness concerns already exist

# Preflight / prerequisites

1. Confirm routing is complete.
2. Confirm each digest item has a source contribution reference.
3. Confirm whether the work is review-only or release-authorized.
4. Load protocol contract sections for Digest and DigestItem field names.

# Workflow

1. Inspect every digest and item.
2. Confirm item explanations are non-empty and traceable to routing factors.
3. Check digest-level explanations for overclaiming or consensus language.
4. Confirm bridge items are visibly bounded and justified.
5. Recommend release, revise, or escalate.

# Decision rules / judgment criteria

- Explanations must be faithful to actual routing factors.
- Digest compression must preserve unresolved questions.
- Do not hide omitted-but-relevant items when critic evidence flags them.
- Participant reading burden remains a hard constraint.

# Escalation rules

Escalate when explanation text is missing, source references are ambiguous, bridge exposure is unexplained, or the digest implies consensus that the source material does not support.

# Available scripts

- `scripts/inspect-digest.mjs`: inspect digests and normalize item explanations to protocol-facing review fields.

# Produced artifacts

- Digest quality assessment
- Explanation coverage summary
- Release/revise/escalate recommendation
- Participant-facing risk notes

# Allowed claims

- That explanation text is faithful or unfaithful to routing evidence
- That a digest preserves or suppresses unresolved disagreement
- That release should be blocked until explanation or source-trace repair occurs

# Forbidden claims

- That digest language proves consensus
- That explanation polish substitutes for source support
- That omitted concerns are irrelevant without evidence
- That explanation faithfulness alone establishes fairness or legitimacy

# Human override points

- Manual digest revision before participant release
- Source-reference challenge when explanation text is under-supported
- Release hold when compression would misstate disagreement

# Outputs

- Digest quality assessment
- Explanation coverage summary
- Release/revise/escalate recommendation
- Participant-facing risk notes

# Failure handling

If routing is incomplete, return to `epistemic-routing`. If explanation fields are missing, block release and request digest repair.

# Trust / safety notes

Digest explanations affect perceived legitimacy. Treat vague or overconfident explanations as governance risks.

# Composition notes

Use after `epistemic-routing` and before `operator-audit`. It is a flagship dependency for public-hearing and Foresight workflows.

# Examples to inspect next

Read `examples/casebook.md` for flagship digest review cases, including faithful explanation and false-consensus anti-patterns.

# Evaluation hooks

Run `scripts/inspect-digest.mjs` and `npm run skills:audit`. Use `evals/rubric.md` for explanation faithfulness review.
