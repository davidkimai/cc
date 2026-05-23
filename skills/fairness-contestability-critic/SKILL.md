---
name: fairness-contestability-critic
description: Use this skill to review minority-erasure, tokenistic bridge exposure, explanation overclaiming, and contestability risks.
category: protocol
maturity: S3
---

# What this skill is for

Use this skill to review whether an ACP output preserves fair exposure and contestable reasoning under load.

# Constitutional purpose

Surface minority-erasure, tokenistic bridge exposure, and false-neutrality risks before compressed outputs are released as if they were settled or fully fair.

# Failure modes targeted

- Minority erasure
- Tokenistic bridge exposure
- False neutrality or false consensus framing
- Missing contestability notes or source references

# When to use it

- Before releasing routed digests.
- When bridge exposure may be tokenistic.
- When explanations could overstate neutrality or consensus.

# When not to use it

- Do not use it to force symmetric exposure to every claim.
- Do not use it to decide legal adequacy.
- Do not use it to rewrite protocol schema.

# Inputs expected

- Digest items
- Routing decisions
- Bridge flags
- Explanation text
- Critic outputs when present

# Required evidence for valid use

- Source references for the items under review
- Bridge flags or comparable signs of minority-salience handling
- Explanation text sufficient to inspect neutrality or overclaiming
- Enough context to distinguish fairness review from political agreement

# Preflight / prerequisites

1. Confirm bridge and explanation fields are present.
2. Identify minority-salience and underrepresented stakeholder signals.
3. Keep fairness review distinct from political agreement.

# Workflow

1. Inspect selected bridge items and omitted relevant items.
2. Check for tokenistic bridge exposure.
3. Check explanation overclaiming and false neutrality.
4. Recommend release, revise, or escalate.

# Decision rules / judgment criteria

- Contestability requires source references and uncertainty.
- Bridge exposure must be relevant, bounded, and justified.
- Fairness review should surface risks, not pretend to solve institutional legitimacy.

# Escalation rules

Escalate on minority-erasure risk, unexplained bridge items, overconfident explanations, or claims that ACP discovered consensus.

# Available scripts

- `scripts/smoke.mjs`: emits a review scaffold for fairness and contestability checks.

# Produced artifacts

- Fairness risk notes
- Contestability gaps
- Release/revise/escalate recommendation

# Allowed claims

- That a release carries contestability or fairness risk under the supplied evidence
- That bridge exposure appears bounded, tokenistic, or under-justified
- That release should be revised or escalated to preserve contestability

# Forbidden claims

- That fairness is solved
- That minority concerns were fully handled by one bridge item
- That contestability review establishes institutional legitimacy
- That disagreement with a claim is itself fairness proof

# Human override points

- Review of bridge justification and minority-salience handling
- Manual release veto when contestability notes are missing
- Human determination of whether an identified risk is acceptable or must block release

# Outputs

- Fairness risk notes
- Contestability gaps
- Release/revise/escalate recommendation

# Failure handling

If source references are missing, block fairness conclusions and return to digest repair.

# Trust / safety notes

This skill is a review ritual, not a guarantee of fairness.

# Composition notes

Use after `omission-critic` and before `abstention-escalation`.

# Examples to inspect next

Read `examples/casebook.md` for fairness, escalation, and anti-pattern cases.

# Evaluation hooks

Run `scripts/smoke.mjs` and `npm run skills:audit`.
