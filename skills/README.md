# Relay Blocks

The `skills/` directory packages the coordination layer as reusable blocks.

Each block teaches a compatible agent how to operate one bounded part of the ACP and Relay stack without becoming the source of truth for protocol semantics.

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
