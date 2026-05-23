---
id: civic-procurement-oversight
title: Procurement Oversight Review
version: v0.1
status: ready
pack_type: pilot
domain: public-procurement
audience: CORDA demo reviewers and pilot operators
primary_use: oversight review and release demo
timebox_minutes: 12
linked_companion: ../../evaluation/prompt-packs/civic-procurement-oversight.md
---

## Scenario

A procurement office is reviewing whether to proceed with a sole-source software renewal or move the work into a short competitive bid. The office wants ACP to assemble a review brief that is careful about risk, timing, and vendor lock-in.

The contract expires in six weeks.

## Civic context

This scenario shows how ACP handles a governance question where speed, continuity, and accountability point in different directions.

## Roles and inputs

- Procurement officer
- Program manager
- Finance analyst
- Information security reviewer
- Vendor management lead

Input constraints:

- contract expiration in six weeks
- service interruption is unacceptable
- the office wants a documented rationale
- the review brief must distinguish facts from assumptions

## Prompt

Prepare an oversight brief that answers:

- whether the renewal should proceed now or be paused for a bid
- what risk is created by staying with the current vendor
- what risk is created by switching
- what information still needs confirmation

Use ACP to surface the accountability structure before the final recommendation is written.

## Output requirements

The cycle should produce:

- a recommendation
- a fact-versus-assumption note
- a short risk comparison
- a list of confirmation questions for the office

## Quality bar

The pack is usable only if:

- the procurement tension is concrete
- the timing pressure is explicit
- the recommendation distinguishes evidence from assumption
- the output is suitable for an internal oversight review

## Operator notes

Use this pack when the demo needs to show how ACP handles governance and accountability under deadline pressure.

Keep the contract deadline and continuity constraint stable across runs.

## CORDA legibility notes

This pack should make ACP legible as a governance aid that can:

- hold timing pressure and accountability together
- separate facts from assumptions
- compare the risk of staying versus switching
- produce a review brief suitable for oversight use
