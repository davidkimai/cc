# ACP Paper Positioning

Status: frozen Phase 0 positioning  
Owner: senior researcher / engineer  
Flagship denominator: `public-hearing-triage`

## 1. Central Claim

ACP is an open protocol for bounded shared reasoning under attention load.

Relay, the reference implementation, tests whether explicit attention coordination can make a public-hearing style deliberation easier to inspect, compare, and brief than a chronological baseline thread without pretending to manufacture consensus.

## 2. Flagship Evaluation Family

The flagship family is:

- benchmark class: `public-hearing-triage`
- democracy pack: `civic-public-hearing-routing`
- intervention scenario: `benchmarks/scenarios/public-hearing-triage/intervention.json`
- baseline scenario: `benchmarks/scenarios/public-hearing-triage/baseline.json`

### Why This Family

Public-hearing triage is the right paper denominator because it concentrates ACP's real thesis:

- public input can be high-volume, uneven, and time-constrained
- chronological order is inspectable but not sufficient for decision preparation
- minority or quieter concerns can be important without being the loudest
- institutions need release-ready explanations, not just summaries
- the public record must remain legible and contestable

Participatory budgeting remains a secondary demonstration family. It should not be used as the primary denominator for workshop claims unless this file is intentionally revised.

## 3. Working Title

Selected working title:

- Collective Deliberation Is a Skill Issue

Backup title directions if venue tone requires a more literal alternative:

- Attention as Democratic Infrastructure: An Open Protocol for Bounded Shared Reasoning
- ACP: A Protocol for Auditable Attention Coordination in Public Deliberation
- Public Reasoning Is an Attention Problem

## 4. Primary Hypotheses

### H1 — Bounded Routing Improves Deliberative Usability

Compared with a chronological baseline thread, an ACP intervention cycle should make the public-hearing record easier to turn into a decision-ready issue map while preserving unresolved questions.

Primary indicators:

- routing contrast exists only in intervention
- digest contrast exists only in intervention
- contributor coverage does not collapse
- bridge exposure is present and bounded
- generated reports include inspectable evidence links

### H2 — Bridge Exposure Improves Pluralism Without Randomness

Bridge-marked items should surface relevant but non-obvious concerns, especially minority or quieter testimony, while respecting digest-size and load budgets.

Primary indicators:

- bridge item count is nonzero in intervention
- bridge exposure remains within configured limits
- routing explanations are non-empty and human-readable

### H3 — Explanation Increases Institutional Legitimacy

Operators and reviewers should be able to see why an item was routed and what public-facing function it served.

Primary indicators:

- digest items include explanation text
- routing and audit artifacts are preserved
- report bundle includes operator and research review surfaces

## 5. Primary Metrics

Use these as the first paper-grade metric table:

- routing decision count
- digest count
- bridge exposure rate
- contributor coverage
- exposure concentration
- response count
- feedback averages for overload, usefulness, exchange quality, explanation clarity, and return willingness
- audit event count
- telemetry event count
- export artifact count
- conformance result and check count

## 6. Claims Allowed Now

The current repo can support these modest claims after the flagship bundle is regenerated:

- ACP can execute matched intervention and baseline-thread public-hearing scenarios through the same cycle model.
- The intervention condition produces routed digests and explanation-bearing artifacts that are absent from the baseline condition.
- The evidence layer preserves audit, telemetry, export, benchmark, and conformance artifacts for inspection.
- ACP is structured as a protocol plus reference implementation, not as a single proprietary deliberation product.

## 7. Non-Claims

Do not claim:

- statistically significant deliberation quality improvement
- real-world civic impact from synthetic benchmark data alone
- legal adequacy for public hearing administration
- consensus generation
- representative public opinion measurement
- neutrality of all routing choices
- production-scale deployment readiness for consumer social use

## 8. Limitation Language

Use this wording until stronger pilot evidence exists:

> Current evidence is prototype and benchmark evidence. It demonstrates that ACP can preserve a matched intervention/baseline comparison surface and produce inspectable evidence artifacts. It does not yet establish field efficacy or statistically significant democratic outcomes.

## 9. Required Paper Artifacts

The flagship paper packet should be generated from:

```bash
npm run benchmark:compare -- --class public-hearing-triage --out artifacts/benchmarks/flagship/public-hearing-triage
npm run report:bundle -- --source artifacts/benchmarks/flagship/public-hearing-triage --out artifacts/reports/flagship/public-hearing-triage
npm run conformance:check -- --json
```

The paper should cite generated artifacts, not hand-copied metrics.

## 10. Decision Record

Decision: freeze `public-hearing-triage` as the flagship denominator.

Reason: it best demonstrates ACP as attention coordination for public input overload while keeping institutional accountability, minority-signal preservation, and public-record legibility central.

Date: 2026-05-20
