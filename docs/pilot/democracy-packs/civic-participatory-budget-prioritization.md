---
id: civic-participatory-budget-prioritization
title: Participatory Budget Prioritization
version: v0.1
status: ready
pack_type: pilot
domain: civic-budget
decision_archetype: resident-facing budget prioritization
audience: CORDA demo reviewers and pilot operators
primary_use: public deliberation and release demo
timebox_minutes: 15
reusable_knobs:
  - budget size
  - program list
  - equity floor
  - deadline
linked_companion: ../../evaluation/democracy-packs/civic-participatory-budget-prioritization.md
---

## Scenario

A city is preparing the next round of participatory budgeting and needs a short recommendation on how to narrow a $3.2M resident ballot into a final shortlist of projects.

The city manager wants ACP to help balance neighborhood safety, youth opportunity, and heat resilience without making the process feel pre-decided.

## Democratic function

This pack tests whether ACP can help transform resident input into a transparent, releaseable prioritization path.

The goal is not to choose winners by fiat. The goal is to show how ACP keeps the public process legible while preserving the tradeoffs that staff and residents need to see.

## Civic context

The final shortlist must be ready before ballot language is locked on Friday afternoon.

The city cannot add new funding, and each project must be described in plain language that residents can understand without reading the full budget packet.

## Reusable knobs

- total participatory budget
- number of project proposals
- required equity constraint
- language limit for ballot summaries
- deadline for release

## Roles and inputs

- budget office lead
- resident advisory member
- public health planner
- parks and recreation representative
- school transit coordinator

Input constraints:

- cap: $3.2M
- no new headcount
- public summary must fit in 140 words
- at least one project must benefit a lower-income neighborhood

## Prompt

Prepare a civic briefing that answers the following:

- which projects should stay on the ballot shortlist
- what tradeoff most strongly supports the shortlist you choose
- what concern should be kept open until the resident session
- what language should be used so residents can see the constraint, not just the recommendation

Use ACP routing to surface the strongest resident-facing and operational perspectives before writing the final summary.

## Output requirements

The cycle should produce:

- a recommendation in plain language
- a ballot-ready shortlist note
- a release-ready public summary
- a list of unresolved questions
- a note explaining which perspective most changed the recommendation

## Quality bar

The pack is usable only if:

- the budget constraint is explicit
- the prioritization logic is concrete
- the civic audience can understand the result without jargon
- the prompt can run without additional scenario invention

## Operator notes

Use this pack when the operator needs a repeatable participatory-budgeting demo that can be adapted by changing only the budget, project list, and deadline.

Keep the decision frame intact across runs. Do not turn this into a generic "community priorities" prompt.

## CORDA legibility notes

This pack should make ACP legible as a civic coordination layer that can:

- hold a fiscal constraint in view
- route conflicting resident and staff claims
- produce a releaseable public summary
- preserve unresolved questions instead of collapsing them too early
