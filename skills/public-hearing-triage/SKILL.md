---
name: public-hearing-triage
description: Use this flagship skill to run ACP's public-hearing triage denominator end to end across baseline, heuristic, recursive-engine, and scale-band evidence.
category: institutional-domain
maturity: S4
---

# What this skill is for

Use this skill for the flagship ACP domain scenario: turning overloaded public-hearing input into inspectable issue maps, routed briefings, critic evidence, and claim-safe artifacts.

# Constitutional purpose

Demonstrate ACP's strongest civic denominator: overloaded public input routed into inspectable, claim-safe decision-support artifacts without pretending that benchmark evidence equals public legitimacy.

# Failure modes targeted

- Hearing overload collapsing into unreadable chronological accumulation
- Minority-signal burial under dominant testimony repetition
- Benchmark overclaiming about civic efficacy or legitimacy
- Missing scale-boundary discipline

# When to use it

- Preparing Foresight or TAIGR-quality evidence.
- Running `public-hearing-triage` benchmarks.
- Demonstrating issue coverage, minority preservation, and scale-band behavior.

# When not to use it

- Do not use it for generic civic marketing.
- Do not claim public opinion measurement.
- Do not claim legal adequacy for hearings.

# Inputs expected

- Public-hearing scenario or benchmark class
- Baseline and intervention condition requirements
- Desired output directory
- Claim boundary for review

# Required evidence for valid use

- Comparable baseline and intervention conditions
- Benchmark outputs or rehearsal artifacts, not only domain rhetoric
- Explicit claim boundary when packaging or summarizing results
- Scale-band context when any scalability language is requested

# Preflight / prerequisites

1. Confirm `public-hearing-triage` remains the frozen denominator.
2. Confirm baseline and intervention conditions are comparable.
3. Confirm whether scale Band B or Band C evidence is required.
4. Read limitations before drafting claims.

# Workflow

1. Run benchmark comparison.
2. Run Engine V2 ablation when research evidence is needed.
3. Run scale-band evidence when making scalability-path claims.
4. Inspect issue maps, critic output, and limitations.
5. Package artifacts with reviewer-facing notes.

# Decision rules / judgment criteria

- Preserve disagreement and unresolved questions.
- Treat issue coverage as a review signal, not a legitimacy guarantee.
- Benchmark evidence supports system behavior, not live civic efficacy.
- S4 quality requires casebook, benchmark, operator, and adopter relevance.

# Escalation rules

Escalate when baseline/intervention counts diverge, scale-band evidence is missing, critic outputs are absent, or requested claims exceed benchmark evidence.

# Available scripts

- `scripts/run-public-hearing-triage.mjs`: runs or points to the flagship benchmark and package surfaces.

# Produced artifacts

- Benchmark summary
- Ablation summary
- Scale-band summary
- Claim-safe domain notes

# Allowed claims

- That the benchmark surfaces inspectable differences between baseline and intervention conditions
- That the output is appropriate as decision-support or review infrastructure
- That scale-band or ablation evidence remains bounded to what was actually run

# Forbidden claims

- That benchmark success proves real-world civic efficacy
- That public-hearing triage measures public opinion or legal adequacy
- That scale-band evidence proves institutional deployment readiness
- That one benchmark resolves fairness or legitimacy concerns

# Human override points

- Claim approval before any public-facing scale or legitimacy language
- Manual review when benchmark and critic evidence conflict
- Maintainer approval before changing the frozen flagship denominator

# Outputs

- Benchmark summary
- Ablation summary
- Scale-band summary
- Claim-safe domain notes

# Failure handling

If any benchmark command fails, preserve the output and do not rewrite the denominator to fit the result.

# Trust / safety notes

Public-hearing triage is institutionally sensitive. It must be framed as decision-support and review infrastructure, not sovereign mediation.

# Composition notes

Use inside `public-hearing-end-to-end` and `foresight-submission-prep`.

# Examples to inspect next

Read `examples/casebook.md` for flagship public-hearing cases and anti-claims.

# Evaluation hooks

Run `scripts/run-public-hearing-triage.mjs`, `npm run benchmark:compare -- --class public-hearing-triage`, and `npm run skills:audit`.
