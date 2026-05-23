---
name: omission-critic
description: Use this skill to review whether ACP routing or digest outputs omit important issues, stakeholders, or unresolved questions.
category: protocol
maturity: S3
---

# What this skill is for

Use this skill to catch missing issue coverage before a routed digest or briefing is released.

# Constitutional purpose

Protect material issue coverage and minority-salience against compression loss, loud redundancy, and superficial completeness claims.

# Failure modes targeted

- Material issue omission
- Stakeholder omission
- Late-arriving or minority-salience signal burial
- False completeness claims

# When to use it

- After routing but before digest release.
- When Engine V2 reports missing issue clusters.
- When a minority or late-arriving signal may have been buried.

# When not to use it

- Do not use it to add irrelevant material for balance theater.
- Do not use it as a generic summarizer.
- Do not redefine canonical ACP criteria.

# Inputs expected

- Cycle JSON or issue map
- Contribution records
- Routing decisions or digest items
- Current omission critic output when present

# Required evidence for valid use

- Selected items and excluded-but-relevant material
- Enough issue clustering evidence to compare coverage rather than guess
- A concrete output under review, not only a vague concern about representativeness

# Preflight / prerequisites

1. Confirm the output under review is an intervention or briefing artifact.
2. Identify the selected items and excluded-but-relevant items.
3. Confirm available issue clusters and unresolved questions.

# Workflow

1. Compare selected items against issue clusters.
2. Identify important missing issues and stakeholders.
3. Check whether loud/redundant comments displaced useful dissent.
4. Recommend release, revise, or escalate.

# Decision rules / judgment criteria

- Missing material issues matter more than perfect topical balance.
- Late minority-salience contributions deserve explicit review.
- Unresolved questions should survive compression when decision-relevant.

# Escalation rules

Escalate when a missing issue affects the decision, when a stakeholder class is absent from selected items, or when the digest implies completeness without coverage.

# Available scripts

- `scripts/smoke.mjs`: emits the skill identity and expected review surfaces for audit and composition checks.

# Produced artifacts

- Missing issue list
- Underrepresented stakeholder notes
- Revise/release/escalate recommendation

# Allowed claims

- That specific issues or stakeholder signals appear missing relative to the supplied evidence
- That release should pause because selected material overstates completeness
- That redundancy displaced relevant dissent or unresolved questions

# Forbidden claims

- That every omitted item must be included for fairness theater
- That omission review alone solves representativeness
- That a missingness suspicion counts as proof without supporting evidence

# Human override points

- Materiality judgment on whether an omission changes the decision
- Manual selection repair before release
- Facilitator veto when completeness claims exceed coverage evidence

# Outputs

- Missing issue list
- Underrepresented stakeholder notes
- Revise/release/escalate recommendation

# Failure handling

If issue-map evidence is missing, mark the review incomplete rather than inventing clusters.

# Trust / safety notes

Omission critique can increase complexity. Use it to protect material coverage, not to force every voice into every digest.

# Composition notes

Use with `epistemic-routing`, `digest-and-explanation`, and `abstention-escalation`.

# Examples to inspect next

Read `examples/casebook.md` for omission review cases.

# Evaluation hooks

Run `scripts/smoke.mjs` and `npm run skills:audit`.
