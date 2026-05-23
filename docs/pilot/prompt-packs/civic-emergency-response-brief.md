---
id: civic-emergency-response-brief
title: Heat Emergency Response Brief
version: v0.1
status: ready
pack_type: pilot
domain: emergency-management
audience: CORDA demo reviewers and pilot operators
primary_use: coordination brief and release demo
timebox_minutes: 12
linked_companion: ../../evaluation/prompt-packs/civic-emergency-response-brief.md
---

## Scenario

A city is entering a three-day heat emergency. The emergency manager needs a short coordination brief that helps align public works, transit, public health, and communications before the first high-risk afternoon.

The problem is not whether to act. The problem is how to coordinate the response so residents get clear guidance and the most vulnerable neighborhoods are covered first.

## Civic context

This scenario shows ACP in a high-stakes but bounded coordination setting where timing and release order matter.

## Roles and inputs

- Emergency manager
- Public health officer
- Transit operations lead
- Public works supervisor
- Communications lead

Input constraints:

- first release is due in one hour
- cooling centers have limited capacity
- transit adjustments must be explained publicly
- the message must prioritize vulnerable residents

## Prompt

Prepare a coordination brief that:

- identifies the first three operational actions
- names the most important public message
- flags the one constraint most likely to break the response
- states what needs human confirmation before release

Use ACP to surface the operational sequence and the public release order.

## Output requirements

The cycle should produce:

- a three-step action list
- a public-facing message draft
- a risk note about the weakest constraint
- a human-confirmation checklist

## Quality bar

The pack is usable only if:

- the emergency context feels operational, not hypothetical
- the output is time-sensitive
- the message and the action plan are both explicit
- the cycle can run without inventing missing emergency conditions

## Operator notes

Use this pack for a demo that needs to show ACP under urgency.

Keep the emergency type and capacity constraint stable across runs unless the evaluation purpose changes.

## CORDA legibility notes

This pack should make ACP legible as a civic coordination layer that can:

- sequence urgent actions
- protect the public message from drift
- highlight the weakest operational constraint
- preserve a human-confirmation step before release
