# ACP Release And Deployment Spec

Status: Child spec derived from ACP implementation specs  
Parent specs:

- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md` v0.1
- `ACP_PERSISTENCE_EXPORT_SPEC.md` v0.1
- `ACP_AGENT_EXECUTION_CONTRACT.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines release and deployment expectations for the first serious ACP implementation.

Its role is to specify:

- environment assumptions
- release gates
- deploy expectations
- rollback and artifact retention expectations
- CI alignment targets

## 2. Normative Scope

This spec governs:

- release readiness for Relay
- deployment discipline for the first implementation
- environment distinctions relevant to ACP execution

This spec does not govern:

- cloud vendor choice for future scaling
- large-scale production SRE practice

## 3. Environment Model

The first implementation should assume at least:

- local development environment
- one reproducible staging/demo environment
- one deployable pilot environment or equivalent run target

## 4. Release Gates

A release candidate should pass:

- build
- typecheck
- tests
- required spec alignment for modified areas
- manual smoke coverage for the primary affected surface where appropriate

## 5. Deployment Expectations

The deploy path should preserve:

- stable environment variable naming
- writable data directory assumptions
- reproducible start command
- predictable artifact paths for exports and cycle data

## 6. Rollback And Retention

The implementation should preserve:

- ability to retain prior persisted cycle data
- ability to revert application code independently from stored cycle artifacts where practical
- enough retained artifacts to support pilot inspection and replay

## 7. CI Alignment Targets

The repo should eventually support automated checks for:

- build
- typecheck
- tests
- optional lint or docs validation later

## 8. File Ownership Guidance

This spec primarily governs:

- CI configs when added
- deployment docs or scripts
- environment variable and startup documentation

## 9. Acceptance Criteria

Release/deployment is ready for serious use when:

- the repo has a repeatable verification gate
- startup assumptions are documented clearly
- data retention and rollback expectations are explicit enough for pilot use

## 10. Agent Execution Notes

Use this spec when assigning CI, deployment, or release-readiness work.

Required task shape:

- identify environment or release files in scope
- preserve existing runtime assumptions unless explicitly revised
- avoid introducing deployment-only behavior that changes ACP semantics
