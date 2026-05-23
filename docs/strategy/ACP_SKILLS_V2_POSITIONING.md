# ACP Skills V2 Positioning

Status: Skills V2 positioning
Owner: senior researcher / engineer

## Position

ACP Skills V2 makes `skills/` a first-class operating layer for ACP.

The split is deliberate:

- `protocol/` and `docs/specs/` define protocol truth
- `src/` implements Relay and ACP engines
- `skills/` codifies procedural judgment for agents, operators, and implementers

Skills are not a second protocol. They are the reusable cognition layer that teaches an agent how to operate ACP without smuggling new semantics into prose.

## Why This Matters

Anthropic's Agent Skills framing treats skills as discoverable folders that combine instructions, scripts, and resources through progressive disclosure. ACP adopts that idea for deliberative infrastructure: a skill should expose compact metadata first, then deeper workflow judgment, examples, scripts, and evaluation hooks only when needed.

For ACP, this turns Relay Blocks into institutional reasoning playbooks:

- run a deliberation cycle
- inspect routing
- review digests and explanations
- detect omission and fairness risk
- package conference evidence
- help an external implementer review protocol conformance

## Design Principles

1. **Progressive disclosure**: `SKILL.md` is the entrypoint; references, examples, checklists, scripts, and evals sit beside it.
2. **Executable judgment**: mature skills include deterministic scripts or reproducible checks.
3. **Failure-aware workflows**: robust skills tell an agent when to stop, escalate, or distrust an output.
4. **Protocol humility**: skills point to canonical specs and code rather than redefining lifecycle, schema, or engine semantics.
5. **Evaluation-ready packaging**: each robust skill has a rubric, smoke hook, or reproducible example.

## Target State

The Skills V2 suite should read as an adoption surface in its own right:

- S4 flagship skills: `epistemic-routing`, `digest-and-explanation`, `public-hearing-triage`
- S3+ operational skills for cycle operation, audits, overload, web operation, pilot analysis, and CLI operation
- critic and escalation skills that match Engine V2's defense-in-depth posture
- compositions that run practical ACP workflows end to end

## Non-Claims

Skills V2 does not claim that skill prose is protocol truth, that agent workflows replace human accountability, or that deterministic smoke hooks prove field efficacy. The layer is operationally important because it makes ACP more usable, auditable, and repeatable.
