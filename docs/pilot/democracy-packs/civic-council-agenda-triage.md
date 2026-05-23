---
id: civic-council-agenda-triage
title: Council Agenda Triage and Release
version: v0.1
status: ready
pack_type: pilot
domain: civic-governance
decision_archetype: agenda triage
audience: CORDA demo reviewers and pilot operators
primary_use: governance routing demo
timebox_minutes: 15
reusable_knobs:
  - agenda length
  - meeting time
  - notice window
  - number of hold items
linked_companion: ../../evaluation/democracy-packs/civic-council-agenda-triage.md
---

## Scenario

A city council office needs ACP to triage a packed agenda before release.

The agenda has six items, two of which are politically sensitive, and staff need a clear recommendation on what should stay on consent, what needs a separate discussion slot, and what must be held for more information.

## Democratic function

This pack tests whether ACP can coordinate internal governance attention before a meeting without hiding the real reasons for prioritization.

The core question is not just what gets scheduled. It is what gets explained to the public and what gets deferred with an honest reason.

## Civic context

The agenda packet is due by end of day, and notice requirements prevent late improvisation.

Council members want the triage to be fair, legible, and resistant to hidden policy changes inside routine items.

## Reusable knobs

- agenda item count
- meeting time
- notice window
- public sensitivity level
- number of hold items

## Roles and inputs

- city clerk
- council president
- department lead
- legal or ethics liaison
- community liaison
- public works representative

Input constraints:

- meeting time: 90 minutes
- agenda packet release by end of day
- no hidden policy changes inside consent items
- held items must have a stated reason

## Prompt

Prepare a civic briefing that answers the following:

- which items should stay on consent
- which items need separate discussion
- which items should be held until more information is available
- what public-facing explanation should accompany the triage

Use ACP routing to surface the strongest governance and public-facing perspectives before writing the final summary.

## Output requirements

The cycle should produce:

- a triage recommendation
- a hold-item list with reasons
- a release-ready agenda explanation
- a list of unresolved questions
- a note explaining which perspective most changed the recommendation

## Quality bar

The pack is usable only if:

- the meeting constraint is explicit
- the triage logic is concrete
- the public explanation is readable by non-specialists
- the prompt can run without additional scenario invention

## Operator notes

Use this pack when the operator needs a repeatable council-routing demo that can be adapted by changing only the agenda items, time limit, and notice window.

Keep the distinction between triage and policy judgment intact.

## CORDA legibility notes

This pack should make ACP legible as a civic coordination layer that can:

- preserve meeting time as a real constraint
- route items into a transparent agenda path
- produce a releaseable public explanation
- keep the reason for deferral visible
