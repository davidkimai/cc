# ACP Agent Runtime Bundles

ACP can be validated through Agent Skills-compatible runtimes using thin wrapper bundles generated from the canonical `skills/` tree.

## Why this exists

ACP decomposed its operational layer into Relay Blocks so the protocol can be exercised beyond one app surface.

This directory-level distribution story keeps the source of truth in the ACP repo while allowing different agents to discover the same block suite in their preferred skill locations.

## Current targets

- `claude-code`
- `opencode`
- `openclaw`
- `codex-compatible`

## Generate a bundle

```bash
npm run agents:bundle -- --runtime claude-code --out /tmp/acp-agent-bundle
```

Supported runtime values:

- `claude-code`
- `opencode`
- `openclaw`
- `codex-compatible`
- `all`

## Source of truth

- protocol meaning: ACP specs and protocol bundle
- operational packaging: `skills/`
- runtime wrappers: generated artifacts only

## Validation intent

These bundles are meant to prove that ACP can be exercised through skills-compatible agent ecosystems with only minor wrappers.


## Recommended external skills

Useful additions from the broader skills ecosystem should focus on validation and operator leverage, not protocol truth.

The highest-value categories are:

- `agent-browser` for exploratory browser checks, screenshot capture, and quick operator-flow validation
- `dogfood` for structured product audits with reproducible evidence
- a Playwright-style browser automation skill for deterministic regression checks when exploratory testing is not enough

Use those skills around Relay.
Do not let them redefine ACP semantics.

Safe rule:

- ACP owns protocol meaning
- Relay owns the current product boundary
- Relay Blocks own operational packaging
- external skills strengthen QA and workflow automation

Do not add unsupported runtimes such as `Pi` to the compatibility matrix until a documented discovery or extension contract exists.
