---
name: relay-openclaw
description: Use this skill when you need OpenClaw-specific guidance for loading or operating Relay Blocks in an Agent Skills-compatible runtime.
---

# When to use this skill

Use this skill when the runtime environment is OpenClaw or another closely compatible Agent Skills host.

# When not to use this skill

Do not use this skill to redefine ACP or Relay behavior.

# Inputs expected

- local skill root
- runtime-specific tool availability

# Steps

1. Load the relevant Relay Block from the local `skills/` directory.
2. Keep protocol truth in the application and specs, not in the runtime adapter.
3. Use the CLI, API, or web surface according to the narrower package selected.

# Outputs

- runtime-specific loading guidance
- correct package selection for OpenClaw-compatible use

# Failure handling

If a required tool is unavailable in the runtime, stop and report the capability gap rather than changing protocol semantics.
