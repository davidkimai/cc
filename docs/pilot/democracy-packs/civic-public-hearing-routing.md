---
id: civic-public-hearing-routing
title: Public Hearing Routing and Summary
version: v0.1
status: ready
pack_type: pilot
domain: civic-hearing
decision_archetype: public comment routing
audience: CORDA demo reviewers and pilot operators
primary_use: hearing routing demo
timebox_minutes: 15
reusable_knobs:
  - comment volume
  - hearing deadline
  - stakeholder mix
  - summary length
linked_companion: ../../evaluation/democracy-packs/civic-public-hearing-routing.md
---

## Scenario

A planning board has to prepare for a public hearing on a mixed-use rezoning proposal and needs ACP to route a large set of comments into a concise issue map before the next agenda lock.

The board does not need a legal determination from ACP. It needs a transparent way to show which themes were heard, which are unresolved, and which deserve follow-up before the vote.

## Democratic function

This pack tests whether ACP can turn public comment into a legible democratic routing layer instead of a generic summary.

The core question is how to preserve the public record while making the decision path usable for board members and staff.

## Civic context

The hearing packet closes tomorrow at noon.

Staff expect a heavy mix of neighborhood safety concerns, traffic concerns, accessibility concerns, and housing supply arguments.

## Reusable knobs

- number of comments
- number of speakers
- hearing deadline
- required summary length
- stakeholder mix

## Roles and inputs

- planning director
- board chair
- neighborhood resident
- accessibility advocate
- transportation planner
- project applicant

Input constraints:

- agenda lock at noon tomorrow
- no fabricated comment data
- summary must fit in 160 words
- each major theme must be represented at least once

## Prompt

Prepare a civic briefing that answers the following:

- what the major themes in the hearing are
- which themes should be elevated for board attention
- which questions should be held open until the next session
- what public-facing language keeps the routing fair and readable

Use ACP routing to surface the relevant perspectives before writing the final summary.

## Output requirements

The cycle should produce:

- an issue map of the hearing
- a routed question set for staff follow-up
- a release-ready public summary
- a list of unresolved items
- a note explaining which perspective most changed the recommendation

## Quality bar

The pack is usable only if:

- the hearing deadline is explicit
- the routing logic is concrete
- the public record is preserved without becoming verbose
- the prompt can run without inventing missing facts

## Operator notes

Use this pack when the operator needs a repeatable public-hearing demo that can be adapted by changing only comment volume, stakeholder mix, and deadline.

Keep the routing legible to a reviewer who is not inside the planning team.

## CORDA legibility notes

This pack should make ACP legible as a civic coordination layer that can:

- preserve public input without flattening it
- route comments into decision-ready themes
- produce a releaseable hearing summary
- keep unresolved questions visible to the board
