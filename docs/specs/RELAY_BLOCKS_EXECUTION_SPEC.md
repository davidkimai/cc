# Relay Blocks Execution Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `RELAY_BLOCKS_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1
- `ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md` v0.3

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines what it means for Relay Blocks to be implemented rather than merely declared.

Its role is to specify:

- executable expectations for blocks
- required `scripts/` and `references/` support where appropriate
- how blocks compose with Relay surfaces
- what counts as done for the initial Relay Blocks layer

## 2. Normative Scope

This spec governs:

- executable operationalization of Relay Blocks
- file structure expectations under `skills/`
- integration expectations between blocks and Relay runtime behavior

This spec does not govern:

- the ACP protocol contract itself
- internal app modules except where blocks invoke them

## 3. Execution Principle

A Relay Block is not fully implemented merely because `SKILL.md` exists.

For the initial serious implementation, blocks should include:

- canonical trigger description in `SKILL.md`
- explicit references in `references/` when long guidance is needed
- executable helpers in `scripts/` when deterministic behavior can be automated

## 4. v1 Block Expectations

### 4.1 Protocol-oriented blocks

For blocks such as:

- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `operator-audit`

The minimum v1 expectation is:

- canonical `SKILL.md`
- at least one reference document for non-trivial workflow guidance where applicable
- scripts for deterministic helper tasks where those tasks can be automated cleanly

### 4.2 Surface/workflow blocks

For blocks such as:

- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`

The v1 expectation is stronger:

- the block should map to actual Relay workflows that already exist
- scripts should exist where command automation is deterministic and useful
- output expectations must be explicit enough for agent use

### 4.3 Runtime adapter blocks

For blocks such as:

- `relay-openclaw`

The v1 expectation is:

- runtime-specific assumptions are documented clearly
- install/use instructions are concrete
- referenced Relay workflows actually exist

## 5. Recommended Initial Script Targets

High-value initial script targets include:

- cycle creation helpers
- cycle export wrappers
- replay wrappers
- pilot analysis wrappers
- validation helpers for skill assumptions

## 6. Composition Rules

Relay Blocks must:

- compose over Relay rather than replace it
- prefer invoking stable CLI/API paths or deterministic scripts
- avoid embedding hidden protocol semantics not present in ACP specs

## 7. File Ownership Guidance

This spec primarily governs work on:

- `skills/*`
- helper scripts under block directories
- block-facing documentation

## 8. Acceptance Criteria

The initial Relay Blocks layer is ready for serious use when:

- every initial block has canonical naming and trigger descriptions
- non-trivial blocks include references and/or scripts where appropriate
- at least the highest-value workflow blocks have executable helper support
- blocks teach agents real workflows that exist in the Relay implementation

## 9. Agent Execution Notes

Use this spec when assigning work under `skills/`.

Required task shape:

- assign ownership of specific block directories
- require final outputs to list files changed
- forbid silent redefinition of ACP semantics inside block docs or scripts
