---
name: research-cli-operator
description: Use this skill to run deterministic Relay CLI workflows for cycle management, export, replay, and participant-view inspection.
category: surface-workflow
maturity: S3
---

# What this skill is for

Use this skill when ACP work should be performed through deterministic local CLI commands instead of browser operation.

# When to use it

- Cycle lifecycle control from the CLI.
- Export generation.
- Replay and participant-view inspection.
- Batch-friendly research workflows.

# When not to use it

- Do not use it for manual participant browsing behavior.
- Do not use it to force invalid lifecycle transitions.
- Do not use it as a substitute for protocol conformance checks.

# Inputs expected

- Cycle id when applicable
- JSON payload for create, contribution, response, feedback, or event commands
- Export mode when exporting
- Data directory or server context if non-default

# Preflight / prerequisites

1. Run through `scripts/relay-cli.sh --build` when `dist/` may be stale.
2. Validate payload shape before invoking mutating commands.
3. Decide whether the workflow is read-only or state-changing.

# Workflow

1. Use `scripts/relay-cli.sh` for raw CLI access.
2. Use `scripts/export-cycle.sh` for deterministic export generation.
3. Capture stdout as evidence when the command supports JSON output.
4. Stop on lifecycle errors and inspect state before retrying.

# Decision rules / judgment criteria

- CLI success is not enough if the resulting cycle state violates ACP semantics.
- Exports should be generated through Relay, not hand-assembled.
- Use the narrowest command that proves the requested behavior.

# Escalation rules

Escalate when CLI output and server state disagree, when payload validation fails, or when the only path forward would require forcing state.

# Available scripts

- `scripts/relay-cli.sh`
- `scripts/export-cycle.sh <cycle-id> [analysis|audit|minimal]`

# Outputs

- CLI-managed lifecycle results
- Export artifacts
- Participant view payloads
- Machine-readable command evidence

# Failure handling

Preserve failing command output. Do not retry with broader flags until the lifecycle or payload reason is understood.

# Trust / safety notes

CLI workflows can mutate real cycles. Keep operator intent explicit before running state-changing commands.

# Composition notes

This is the backbone for `pilot-cycle-review`, `export-generation`, and `public-hearing-end-to-end`.

# Examples to inspect next

Read `examples/casebook.md` for CLI success, lifecycle failure, ambiguity, and anti-pattern examples.

# Evaluation hooks

Run `scripts/relay-cli.sh --help` through the repo CLI path, run `scripts/export-cycle.sh` on a known cycle, and run `npm run skills:audit`.
