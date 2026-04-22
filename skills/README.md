# Relay Blocks

The `skills/` directory packages ACP as reusable Relay Blocks.

Each block teaches a compatible agent how to operate one bounded part of the ACP and Relay stack without becoming the source of truth for protocol semantics.

Read the hierarchy this way:
- `ACP` is the protocol
- `Relay` is the first implementation
- `Relay Blocks` are reusable operational units over ACP

Current blocks:
- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `operator-audit`
- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`
- `relay-openclaw`

These blocks are meant to compose over the application runtime, not replace it.
