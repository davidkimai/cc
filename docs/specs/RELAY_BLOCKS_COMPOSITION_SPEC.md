# Relay Blocks Composition Spec

Status: Finalized Phase 4 Relay Blocks composition spec  
Parent specs:

- `RELAY_BLOCKS_SPEC.md` v0.3
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md` v0.1
- `RELAY_WEB_APP_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the composition layer for Relay Blocks.

Its role is to specify:

- what a composition is
- how compositions package multiple Relay Blocks into one operator workflow
- the required file shape for the first practical compositions
- the initial composition set for ACP v0.1

## 2. Normative Scope

This spec governs:

- composition artifacts under `skills/compositions/`
- composition structure
- composition inputs, outputs, and execution expectations

This spec does not govern:

- the internal logic of the underlying Relay Blocks
- ACP protocol semantics
- product-surface changes outside composition execution

## 3. Definition

A Relay Blocks composition is a concrete multi-block workflow that packages:

- one operator intent
- the Relay Blocks involved
- one runnable entrypoint
- one compact machine-readable manifest

Compositions sit above individual Relay Blocks.

They exist to make common ACP operator workflows repeatable without forcing an agent or operator to rediscover block order.

## 4. Composition Rules

Every composition must live in its own folder under `skills/compositions/` and include:

- `composition.yaml`
- `README.md`
- `run.sh` or another explicitly named runnable entrypoint

Compositions should:

- compose existing Relay Blocks rather than redefine them
- prefer deterministic CLI or HTTP calls over browser-only steps
- be practical for local operator use
- write outputs to an explicit operator-chosen output directory when artifacts are produced

Compositions must not:

- change ACP semantics
- force lifecycle transitions that violate protocol guardrails
- rely on undocumented runtime assumptions

## 5. Manifest Contract

Each `composition.yaml` must define at least:

- `name`
- `description`
- `intent`
- `blocks`
- `entrypoint`
- `inputs`
- `outputs`

## 6. Initial Composition Set

The initial composition layer includes:

- `pilot-cycle-review`
- `export-generation`
- `surface-preflight`

### 6.1 `pilot-cycle-review`

Purpose:

- produce a practical review bundle for one cycle by combining lifecycle inspection, metrics inspection, and export generation

Primary blocks:

- `research-cli-operator`
- `operator-audit`
- `pilot-analysis`

### 6.2 `export-generation`

Purpose:

- generate one or more canonical export modes for a cycle in a repeatable operator workflow

Primary blocks:

- `research-cli-operator`
- `operator-audit`

### 6.3 `surface-preflight`

Purpose:

- confirm server readiness and optionally verify the participant-view payload that should back the Relay surface before browser work

Primary blocks:

- `participant-web-operator`
- `research-cli-operator`

## 7. Output Expectations

Compositions should emit one of:

- machine-readable JSON to stdout
- captured artifact files in an output directory
- a compact operator-readable summary

If a required upstream invariant is missing, the composition should fail explicitly instead of inferring missing state.

## 8. Acceptance Criteria

The Relay Blocks composition layer is accepted when all requirements below pass.

| Requirement | Acceptance test |
|---|---|
| Initial composition set | `pilot-cycle-review`, `export-generation`, and `surface-preflight` exist under `skills/compositions/` |
| Required composition files | Each composition includes `composition.yaml`, `README.md`, and executable `run.sh` |
| No-argument smoke path | `npm run blocks:pilot-review`, `npm run blocks:export-generation`, and `npm run blocks:surface-preflight` run locally without extra setup |
| Deterministic outputs | Each composition writes artifacts to its own `out/` directory and prints machine-readable JSON or captured report JSON |
| Block composition | Composition scripts call or package existing Relay workflows and helper scripts; they do not introduce new ACP semantics |
| Failure clarity | Missing upstream state, unavailable server readiness, or invalid mode failures are explicit command failures |

Mechanical requirements:

- composition entrypoints require no network access or live LLM calls
- default no-argument paths are demo/smoke paths, not production pilot runs
- operator-provided arguments continue to support real cycle review, export generation, and surface preflight

## 9. Agent Execution Notes

Use this spec when assigning Relay Blocks composition work.

Agents implementing compositions must:

- stay within `skills/compositions/` and this spec
- compose existing block behavior instead of inventing new protocol rules
- keep compositions compact, local, and runnable
