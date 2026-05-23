---
name: protocol-implementer-review
description: Use this skill to review whether an external implementation or adapter follows ACP protocol semantics and discovery expectations.
category: ecosystem-adopter
maturity: S3
---

# What this skill is for

Use this skill when an external adopter, SDK user, or second surface needs protocol-oriented review.

# Constitutional purpose

Keep interoperability honest by separating protocol compatibility from local convenience names, README optimism, or adapter-specific drift.

# Failure modes targeted

- Protocol drift
- Compatibility overclaiming
- Competing naming layers
- Missing conformance or discovery evidence

# When to use it

- Reviewing an adapter or starter kit.
- Checking external implementation claims.
- Preparing adopter feedback.

# When not to use it

- Do not use it to redesign ACP.
- Do not use it for Relay-only UI QA.
- Do not accept skill prose as protocol truth.

# Inputs expected

- Implementation or adapter path
- Protocol bundle/discovery references
- Conformance output when available
- Claimed supported surfaces

# Required evidence for valid use

- Discovery or schema references sufficient to compare semantics
- Claimed support boundary for the adopter or adapter
- Conformance evidence when compatibility is claimed rather than merely explored

# Preflight / prerequisites

1. Load `protocol/discovery.json`.
2. Load canonical schema and implementer guide.
3. Identify the adopter's claimed support level.

# Workflow

1. Check discovery and schema references.
2. Review lifecycle and condition vocabulary.
3. Confirm conformance or fixture compatibility.
4. Identify gaps without expanding ACP semantics.

# Decision rules / judgment criteria

- External support must be stated precisely.
- Canonical fields beat local convenience names.
- Compatibility proof requires artifacts, not only README claims.

# Escalation rules

Escalate when the implementation changes lifecycle meanings, omits conformance evidence, or introduces a competing naming layer.

# Available scripts

- `scripts/smoke.mjs`: emits the protocol review checklist.

# Produced artifacts

- Implementer review notes
- Compatibility gaps
- Conformance recommendation

# Allowed claims

- That compatibility appears supported, unsupported, or unverified under the provided evidence
- That a local field or lifecycle name drifts from ACP semantics
- That more evidence is required before public compatibility claims are made

# Forbidden claims

- That an adopter is ACP-compatible based only on README language
- That local convenience names automatically become protocol truth
- That skill prose can redefine schema semantics

# Human override points

- Spec-level compatibility approval
- Maintainer review of disputed lifecycle or field meanings
- Manual decision on whether a public compatibility note is acceptable

# Outputs

- Implementer review notes
- Compatibility gaps
- Conformance recommendation

# Failure handling

If conformance cannot run, record the blocker and avoid compatibility claims.

# Trust / safety notes

This skill protects ACP as an open protocol. It should make adopter gaps clear without overstating maturity.

# Composition notes

Use after SDK/adopter starter runs and before public compatibility claims.

# Examples to inspect next

Read `examples/casebook.md` for adopter review cases.

# Evaluation hooks

Run `scripts/smoke.mjs`, `npm run conformance:check`, and `npm run skills:audit`.
