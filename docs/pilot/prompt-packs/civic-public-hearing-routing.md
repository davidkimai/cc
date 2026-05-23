---
id: civic-public-hearing-routing
title: Public Hearing Issue Routing
version: v0.1
status: ready
pack_type: pilot
domain: land-use and public-process
audience: CORDA demo reviewers and pilot operators
primary_use: hearing prep and issue routing demo
timebox_minutes: 12
linked_companion: ../../evaluation/prompt-packs/civic-public-hearing-routing.md
---

## Scenario

A planning commission is holding a public hearing on a mixed-use development near a transit corridor. The chair wants ACP to route the major concerns before the hearing so the commission can focus on the actual decision points.

The hearing is tomorrow evening. The concern set includes traffic, shadows, affordable housing set-asides, noise, and transit access.

## Civic context

The goal is not to advocate for the project. The goal is to surface the issues in a way that helps the commission hear the right people in the right order.

## Roles and inputs

- Planning commissioner chair
- City planner
- Neighborhood resident association
- Transit agency representative
- Affordable housing advocate

Input constraints:

- one hearing packet only
- no more than five routed issues
- chair wants a short opening script
- public comments will be limited by time

## Prompt

Prepare a hearing-routing brief that does four things:

- groups the public concerns into a small number of decision-relevant buckets
- identifies which concerns are factual, which are value-based, and which are procedural
- suggests an opening script for the chair
- flags what the commission still needs to resolve after the hearing

Use ACP to separate noise from decision-relevant attention.

## Output requirements

The cycle should produce:

- a routed issue list
- a chair opening script
- a short decision checklist
- a note on which questions need follow-up after testimony

## Quality bar

The pack is usable only if:

- the hearing context is realistic
- the issues are specific enough to route
- the output helps the commission manage attention, not debate the merits in the abstract
- the prompt can run without inventing missing local facts

## Operator notes

Use this pack when the demo needs to show structured issue routing rather than final policy recommendation.

Keep the issue buckets stable across runs so evaluation can compare routing quality.

## CORDA legibility notes

This pack should make ACP legible as a process tool that can:

- reduce hearing overload
- preserve procedural fairness
- route testimony into decision-relevant buckets
- keep unresolved facts visible
