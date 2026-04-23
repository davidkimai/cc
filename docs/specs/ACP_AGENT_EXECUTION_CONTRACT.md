# ACP Agent Execution Contract

Status: Child spec derived from ACP orchestration and implementation specs  
Parent specs:

- `ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md` v0.3
- `ACP_TECHNICAL_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines how autonomous coding agents must execute work against the ACP spec stack.

Its role is to specify:

- task intake rules
- ownership rules
- required outputs
- escalation rules when specs conflict or are incomplete
- integration discipline for parallel agent work

## 2. Core Rule

Agents implement ACP and Relay by reading and following the repo-local spec stack.

Agents do not redefine the system locally.

## 3. Required Task Input Shape

Every agent task must include:

- the governing spec or specs
- exact write scope
- success criteria
- whether the task is read-only, implementation, or verification
- any blocked upstream dependencies

## 4. Ownership Rules

- Each agent must have a bounded write scope.
- Parallel agents must have disjoint write scopes unless explicitly coordinated.
- Shared parent specs must not be edited casually during implementation work.
- If a parent spec needs revision, the revision must be escalated rather than improvised in code.

## 5. Output Contract

Every implementation agent must return:

- what it changed
- which files it changed
- any unresolved issues
- whether it encountered spec ambiguity
- any recommended follow-on work in its owned area

## 6. Escalation Rules

An agent must escalate rather than guess when:

- two parent specs conflict
- a required field or invariant is missing
- a requested change would alter ACP semantics
- a task depends on another unfinished spec or workstream

## 7. Integration Rules

The integrating orchestrator must:

- review returned changes against the governing spec
- reject work that silently changes semantics
- patch parent or child specs first when ambiguity is real
- avoid merging code that depends on unstated behavior

## 8. Verification Rules

Verification should be scoped to the task.

At minimum:

- API work must update or preserve endpoint tests
- engine work must update or preserve deterministic engine tests
- web or CLI work must preserve surface behavior and contract assumptions
- blocks work must validate that referenced files and workflows exist

## 9. Acceptance Criteria

The ACP agent execution layer is ready when:

- agents can be assigned work from named specs rather than conversational interpretation
- ownership and escalation rules are explicit
- the orchestrator can integrate parallel work without semantic drift

## 10. Immediate Application

Use this contract for all future agent tasks in the ACP repo.
