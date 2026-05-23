---
id: civic-budget-reallocation
title: Neighborhood Safety Budget Reallocation
version: v0.1
status: ready
pack_type: pilot
domain: municipal-budget
audience: CORDA demo reviewers and pilot operators
primary_use: council briefing and routing demo
timebox_minutes: 12
linked_companion: ../../evaluation/prompt-packs/civic-budget-reallocation.md
---

## Scenario

A city manager has asked ACP to prepare a short recommendation on whether to move $1.8M from overtime and vacancy savings into neighborhood violence prevention, street lighting, and caseworker coordination.

The request is urgent because the next council work session is tomorrow morning. The team needs a concise recommendation that recognizes fiscal limits, public safety concerns, and neighborhood trust.

## Civic context

This scenario is designed to show how ACP handles a budget decision with competing public interests.

The decision must stay within the current fiscal year and cannot assume new revenue.

## Roles and inputs

- Finance director
- Police operations lead
- Neighborhood coalition representative
- Community violence prevention director
- Council staff lead

Input constraints:

- total reallocation cap: $1.8M
- no new headcount
- public summary must fit in 120 words
- council members want the main tradeoff stated plainly

## Prompt

Prepare a civic briefing that answers the following:

- what allocation you recommend
- which stakeholder concern is strongest in favor of the change
- which operational risk is strongest against it
- what question should be held open until the council session

Use the routing and release behavior of ACP to surface the relevant perspectives before writing the final summary.

## Output requirements

The cycle should produce:

- a recommendation in plain language
- a short release-ready public summary
- a list of unresolved questions
- a note explaining which perspective most changed the recommendation

## Quality bar

The pack is usable only if:

- the budget constraint is explicit
- the policy tradeoff is concrete
- the civic audience can understand the recommendation without jargon
- the prompt can run without additional scenario invention

## Operator notes

Use this pack when you need a crisp council-briefing style demo.

Keep the scenario intact across runs. If the local budget number changes, update only the numeric input and leave the decision frame unchanged.

## CORDA legibility notes

This pack should make ACP legible as a civic coordination layer that can:

- hold a fiscal constraint in view
- route conflicting stakeholder claims
- produce a releaseable public summary
- preserve the unresolved question instead of hiding it
