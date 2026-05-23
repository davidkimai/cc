# Relay Blocks Packaging Spec

Status: Finalized Phase 4 Relay Blocks packaging spec  
Parent framing:
- `ACP` is the protocol
- `Relay` is the first implementation
- `Relay Blocks` are reusable operational units over ACP

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This spec defines a compact packaging layer for Relay Blocks so the `skills/` tree is easier to inspect, index, and reuse without treating `SKILL.md` files as the only discovery surface.

## 2. Packaging model

The packaging layer consists of:
- `skills/registry.json`: canonical machine-readable block index
- `skills/packages/<block>/manifest.json`: one manifest per current Relay Block
- `skills/README.md`: human-facing packaging overview

The packaging layer does not replace:
- ACP protocol specs
- `SKILL.md` trigger guidance
- Relay implementation code

## 3. Package manifest contract

Each block manifest must include:
- `name`
- `displayName`
- `packageVersion`
- `layer`
- `category`
- `status`
- `summary`
- `blockRoot`
- `skillFile`
- `references`
- `scripts`
- `implements`
- `dependsOn`
- `surfaces`
- `runtimeTargets`

## 4. Category values

Allowed categories for the current suite:
- `protocol`
- `surface-workflow`
- `runtime-adapter`

## 5. Layer value

The layer value for this suite is always:
- `relay-block`

## 6. Status values

Recommended status values:
- `declared`
- `packaged`
- `executable`

Use `executable` when the block has a real `SKILL.md` plus deterministic helper support under `scripts/`.

## 7. Registry rules

`skills/registry.json` is the canonical packaging index for the current repo state.

It must include:
- suite metadata
- framing metadata
- package directory root
- list of all current Relay Blocks
- manifest path for each block

## 8. Current suite rule

The current suite must describe exactly these blocks:
- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `bridge-exposure`
- `operator-audit`
- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`
- `relay-openclaw`

## 9. Reuse goal

This packaging layer exists to make Relay Blocks:
- easier to enumerate
- easier to inspect programmatically
- easier to hand to agents without scanning the entire tree
- clearer as operational packages over ACP

## 10. Acceptance Criteria

The Relay Blocks packaging layer is accepted when all requirements below pass.

| Requirement | Acceptance test |
|---|---|
| Canonical registry | `skills/registry.json` lists every current Relay Block exactly once, including `bridge-exposure` |
| Manifest coverage | Every registry entry points to an existing manifest and every manifest points to an existing `SKILL.md` |
| Executable core blocks | `epistemic-routing`, `digest-and-explanation`, `overload-governance`, `bridge-exposure`, and `operator-audit` have deterministic helper scripts under their own `scripts/` directories |
| Manifest status | A block with helper scripts is marked `executable`; declared-only manifests are not used for core Phase 4 workflows |
| Runtime target clarity | Each manifest declares whether it is intended for Relay, OpenClaw, or both |
| ACP-first framing | Manifests describe operational helpers over ACP and do not redefine protocol truth |

Mechanical requirements:

- OpenClaw validation can enumerate the package registry without scanning unrelated files
- generated runtime wrappers use `skills/registry.json` as the source of truth
- helper scripts must work without network access or live LLM calls
