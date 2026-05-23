# ACP Agent Runtime Bundle Spec

Status: Ecosystem distribution spec
Version: 0.1
Date: 2026-04-23

## 1. Purpose

This spec defines how ACP and Relay Blocks are distributed to Agent Skills-compatible runtimes through thin wrapper bundles.

The goal is to validate ACP through frontier-agent surfaces without cloning protocol meaning into multiple incompatible trees.

## 2. Scope

This spec governs:

- runtime-specific skill wrapper bundles
- wrapper generation from the canonical `skills/` tree
- supported runtime targets for the current repository
- validation rules for generated bundles

This spec does not govern:

- ACP protocol semantics
- Relay implementation behavior
- per-runtime proprietary features beyond light wrapper metadata

## 3. Canonical source rule

The canonical source for ACP operational packaging remains the repository `skills/` tree.

Runtime bundles must be generated from that source.

Do not fork ACP logic into separate runtime-specific copies.

## 4. Supported runtime targets

Current targets:

- `claude-code`
- `opencode`
- `openclaw`
- `codex-compatible`

## 5. Wrapper model

Each wrapper bundle must:

- preserve block names
- preserve block descriptions closely enough for runtime discovery
- point back to the ACP repo as the source of truth
- include only runtime-specific placement or metadata differences required for discovery

## 6. Output layout

The generator must produce one runtime-specific install tree under a caller-provided output directory.

Expected roots:

- Claude Code: `.claude/skills/`
- OpenCode: `.opencode/skills/`
- OpenClaw: `skills/`
- Codex-compatible: `.agents/skills/`

## 7. Validation bar

A runtime bundle is valid when:

- all current Relay Blocks are present
- every generated block has a `SKILL.md`
- the generated wrapper declares ACP/Relay/Relay Blocks framing
- generation is deterministic from the current `skills/registry.json`

## 8. Acceptance criteria

This spec is satisfied when:

- the repo can generate runtime bundles for all supported targets
- the generated bundles reflect the current block registry
- validation tests confirm expected skill placement for each target
