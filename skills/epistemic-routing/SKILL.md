---
name: epistemic-routing
description: Use this flagship skill to compute, inspect, and challenge ACP routing decisions, including bridge exposure and Engine V2 critic traces.
category: protocol
maturity: S4
---

# What this skill is for

Use this skill for ACP intervention routing: deciding who should see which contribution, why, under what load, and with what bridge or omission risk.

# Constitutional purpose

Coordinate participant attention without laundering disagreement into consensus or hiding the governance significance of routing choices.

# Failure modes targeted

- False consensus through dominant-view overexposure
- Unbounded or tokenistic bridge exposure
- Material issue omission hidden by polished routing output
- Unsafe release of low-confidence or unexplained routes

# When to use it

- Routing an `intervention` cycle after submissions close.
- Reviewing Engine V2 routing traces, issue clusters, and critic findings.
- Checking whether bridge exposure is bounded and justified.
- Comparing recursive routing against heuristic routing.

# When not to use it

- Do not use it for baseline thread release.
- Do not use it to rewrite protocol semantics.
- Do not use it to generate final participant-facing digest prose; use `digest-and-explanation`.

# Inputs expected

- Closed intervention cycle or cycle JSON
- Contribution list
- Participant roster
- Routing criteria and cycle config
- Existing routing decisions when reviewing rather than computing

# Required evidence for valid use

- A closed `intervention` cycle or equivalent benchmark fixture
- Routing criteria or objective weights
- Contribution and participant evidence sufficient to justify recipient selection
- Routing trace, explanation fields, or comparable evidence when reviewing rather than computing

# Preflight / prerequisites

1. Confirm cycle condition is `intervention`.
2. Confirm status is `submission_closed` before new routing, or `routing_complete`/later for review.
3. Load `docs/specs/ACP_COORDINATION_ENGINE_SPEC.md` for objective weights and Engine V2 posture.
4. Decide whether the work is compute, inspect, or red-team review.

# Workflow

1. Run or fetch routing decisions.
2. Inspect recipient relevance, prompt relevance, bridge perspective, and load balance.
3. Review issue coverage and stakeholder diversity when Engine V2 trace exists.
4. Run omission and fairness judgment before recommending release.
5. Record unresolved questions and low-confidence routes instead of smoothing them into consensus.

# Decision rules / judgment criteria

- Select sets, not independent top-k lists.
- Preserve minority-salience when it is relevant and bounded.
- Prefer lower redundancy over repeated exposure to the same dominant view.
- Do not over-explain beyond available evidence.
- If omission or fairness risk is medium/high, recommend review or abstention rather than release.

# Escalation rules

Escalate when bridge items exceed budget, when omitted issue clusters are material, when the routing trace lacks explanations, or when the route would create false consensus.

# Available scripts

- `scripts/run-routing.mjs`: inspect routing decisions from cycle JSON or generate a local demo intervention cycle.

# Produced artifacts

- Routing decision summary
- Bridge exposure assessment
- Omission/fairness notes
- Release, revise, or escalate recommendation

# Allowed claims

- That a routed set appears justified or unjustified under the supplied criteria
- That bridge exposure is bounded or unbounded relative to the provided trace
- That release should be revised or escalated because evidence is incomplete

# Forbidden claims

- That routing proves public consensus
- That bridge exposure by itself solves fairness
- That a low-confidence route is safe to release because it looks balanced
- That routing evidence alone establishes institutional legitimacy

# Human override points

- Facilitator review of bridge-budget exceptions
- Release veto when routing trace evidence is incomplete
- Manual challenge to recipient selection or omission judgments

# Outputs

- Routing decision summary
- Bridge exposure assessment
- Omission/fairness notes
- Release, revise, or escalate recommendation

# Failure handling

If the cycle is baseline, submissions are open, or routing evidence is missing, stop and report the blocking protocol condition.

# Trust / safety notes

Routing changes participant attention. Treat low-confidence routing as a governance event, not a minor scoring defect.

# Composition notes

Pair with `omission-critic`, `fairness-contestability-critic`, `abstention-escalation`, and `digest-and-explanation`. It is a flagship dependency for `public-hearing-end-to-end`.

# Examples to inspect next

Read `examples/casebook.md` for flagship routing casebook entries, including golden and anti-pattern cases.

# Evaluation hooks

Run `scripts/run-routing.mjs` and `npm run skills:audit`. Use the rubric in `evals/rubric.md` when judging whether an agent used this skill well.
