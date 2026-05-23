---
name: relay-openclaw
description: Use this skill when you need OpenClaw-specific guidance for loading or operating Relay Blocks over ACP in an Agent Skills-compatible runtime.
category: runtime-adapter
maturity: S2
---

# What this block is for

Use this block when the runtime environment is OpenClaw or another closely compatible Agent Skills host.

# When to use this block

Use this block when you need to:
- validate that Relay Blocks are present and shaped correctly for a local OpenClaw-style runtime
- select the right narrower Relay Block for an ACP task
- keep runtime-specific guidance separate from ACP semantics

Load `references/openclaw-runtime-notes.md` for the runtime adapter checklist.
Use `scripts/validate-openclaw-loadout.mjs` to inspect the local Relay Blocks tree before runtime use.

# When not to use this block

Do not use this block to redefine ACP or Relay behavior.

# Inputs expected

- local `skills/` root
- runtime-specific tool availability

# Workflow

1. Validate the local block tree with `scripts/validate-openclaw-loadout.mjs`.
2. Select the narrower Relay Block that matches the task.
3. Keep protocol truth in the application and ACP specs, not in the runtime adapter.
4. Use the CLI, API, or web surface according to the narrower package selected.

# Available scripts

- `scripts/validate-openclaw-loadout.mjs`: validate local Relay Block packaging for OpenClaw-style use and emit a manifest summary

# Outputs

- runtime-specific loading guidance
- block manifest summary
- missing-file warnings when packaging is incomplete

# Failure handling

If a required tool is unavailable in the runtime, stop and report the capability gap rather than changing protocol semantics.
