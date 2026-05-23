---
id: civic-school-board-tradeoff
title: School Board Program Tradeoff
version: v0.1
status: ready
pack_type: pilot
domain: public-education
audience: CORDA demo reviewers and pilot operators
primary_use: board briefing and tradeoff demo
timebox_minutes: 12
linked_companion: ../../evaluation/prompt-packs/civic-school-board-tradeoff.md
---

## Scenario

A school board is choosing between expanding counseling staff or keeping a set of after-school tutoring slots that are currently oversubscribed. The superintendent wants a recommendation that explains the tradeoff to families without sounding evasive.

The decision must be ready for the next board packet.

## Civic context

This scenario shows how ACP handles a policy choice where every option leaves some students less served than before.

## Roles and inputs

- Superintendent
- Board chair
- School counselor
- Parent advisory member
- After-school program coordinator

Input constraints:

- only one program can be expanded this term
- budget cannot exceed the existing allocation
- family-facing language must be plain and calm
- the board wants a clear rationale for the choice

## Prompt

Prepare a board-ready brief that answers:

- which program should be expanded first
- who benefits most from the choice
- what harm or downside should be stated openly
- what follow-up metric should be watched next term

Use ACP to keep the student-welfare tradeoff visible instead of turning the brief into a generic program summary.

## Output requirements

The cycle should produce:

- a recommendation
- a family-facing explanation
- one comparison point that justifies the recommendation
- one metric to revisit after implementation

## Quality bar

The pack is usable only if:

- the choice is constrained and realistic
- the student impact is described concretely
- the explanation is understandable to families
- the output makes the tradeoff explicit instead of hiding it

## Operator notes

Use this pack for a board packet style demo where the final release needs to be careful and non-technical.

Keep the program choice and budget constraint stable across runs.

## CORDA legibility notes

This pack should make ACP legible as a governance aid that can:

- hold a student-centered decision under constraint
- surface the downside of each option honestly
- produce language a board can use directly
- leave a measurable follow-up item in view
