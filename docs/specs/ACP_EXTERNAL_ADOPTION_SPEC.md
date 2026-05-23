Status: Ecosystem-proof external adoption spec
Version: 0.1
Date: 2026-04-24

# ACP External Adoption Spec

## 1. Purpose

This spec defines the first serious external-adoption path for ACP beyond:

- the Relay browser surface
- the in-process batch runner
- thin skills-runtime wrapper distribution

The goal is to prove that ACP can be consumed through a stable public interface by an external implementer without importing the current Relay engine directly.

## 2. Scope

This spec governs:

- the API-driven external consumer example
- the second adapter path that runs against the public Relay API
- the relationship between external consumers, ACP conformance, and compatibility artifacts
- the validation role of skills-compatible wrappers for frontier agents

This spec does not govern:

- a fully independent second ACP engine
- third-party production deployments
- UI parity with Relay

## 3. Strategic framing

The hierarchy remains:

- `ACP` = protocol contract
- `Relay` = first implementation
- `Relay Blocks` = reusable operational units
- runtime wrappers = distribution layer for frontier agents

Skills-compatible wrappers prove operational transferability.
They do not, by themselves, prove a full protocol ecosystem.

## 4. Required external-adoption path

ACP v0.1 must ship one API-driven external consumer path that:

- accepts the same scenario shape as the batch runner
- talks only to the Relay HTTP API
- supports both `intervention` and `baseline_thread`
- emits a diff-friendly run bundle
- includes conformance reporting

This consumer is a second adapter path, not the protocol source of truth.

## 5. Runner contract

The external HTTP runner must:

- target a provided `baseUrl`
- drive the canonical lifecycle using only public HTTP routes
- resolve response parent references from API-returned contribution ids
- fetch participant views after release
- write:
  - `normalized-input.json`
  - `cycle.json`
  - `participant-views.json`
  - `exports/`
  - `conformance-report.json`
  - `run-manifest.json`

## 6. Compatibility requirement

The compatibility matrix must distinguish:

- first implementation surface
- in-process batch proof surface
- API-driven external consumer surface
- skills-compatible runtime wrapper distribution

The API-driven consumer should be recorded as a proof surface because it validates ACP meaning across the public Relay boundary rather than the internal service layer.

## 7. Runtime-wrapper requirement

ACP should continue to validate Relay Blocks through skills-compatible agents with thin wrappers where discovery roots are stable and documented.

Current safe targets:

- OpenClaw
- Claude Code
- OpenCode
- Codex-compatible runtimes

Do not add runtimes by aspiration alone.
Leave runtimes such as `Pi` out of the matrix until a stable discovery or extension contract exists.

## 8. Acceptance criteria

This spec is satisfied when:

- one API-driven external consumer exists
- it runs one `intervention` scenario end to end
- it runs one `baseline_thread` scenario end to end
- it emits a full artifact bundle
- the external implementer guide points to it
- the compatibility layer records it explicitly
