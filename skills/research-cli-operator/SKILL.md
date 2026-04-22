---
name: research-cli-operator
description: Use this skill when you need to run Relay CLI workflows, the first ACP implementation, for cycle management, export, or participant-view operations.
---

# When to use this skill

Use this skill for local operator execution without the web surface.

# When not to use this skill

Do not use this skill if the task requires manual participant browsing behavior.

# Inputs expected

- cycle id when applicable
- JSON payload for create, contribution, response, feedback, or event commands

# Steps

1. Build the project if needed.
2. Use `node dist/cli.js cycle ...`, `participant view`, `contribution submit`, `response submit`, `feedback submit`, or `event record`.
3. Keep payloads aligned with the canonical cycle contract.

# Outputs

- CLI-managed lifecycle actions
- export artifacts
- participant view payloads

# Failure handling

If a command fails due to lifecycle guardrails, stop and fix the cycle state rather than forcing the command.
