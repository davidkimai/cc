# acp

Attention Coordination Protocol.

`acp` stands for `Attention Coordination Protocol`.

This repository is the protocol-first home for `Relay`, the product implementation of ACP.

Relay helps groups reason together under load.

It is a thin coordination layer for running bounded discussion cycles with two comparable conditions:
- `intervention`: routed participant digests with plain-language explanations
- `baseline_thread`: a chronological thread on the same canonical cycle model

Relay is built around a single ACP contract, two operator surfaces, and a set of reusable Relay Blocks packaged as Agent Skills-compatible units.

## Why ACP exists

Most discussion systems still default to broadcast feeds and let salience sort itself out after the fact.
ACP takes a different approach: it treats discussion as an attention-allocation problem.

The protocol defines how a cycle moves from prompt to contribution, from contribution to release, and from release to reflection, audit, telemetry, and export.
Relay is the working product surface over that protocol.

## What the product does

- creates and manages discussion cycles
- collects one primary contribution per participant during the submission window
- runs intervention routing and digest generation under bounded load constraints
- releases either routed digests or a baseline thread depending on condition
- captures participant responses, feedback, telemetry, audit events, and exports
- exposes both a web surface and a CLI over the same protocol core
- packages reusable Relay Blocks in `skills/`

## Naming hierarchy

Use this repository with a 3-layer framing:
- Protocol: `Attention Coordination Protocol (ACP)`
- Product: `Relay`
- Blocks: `Relay Blocks`

## Product framing

`Relay` is not a social platform and not an AI discussant.

The system acts as a coordinator at the attention-allocation layer:
- routing
- digest construction
- explanation
- overload governance
- operator audit
- baseline condition parity

The blocks in `skills/` are best understood as Relay Blocks over ACP, not as the source of truth for protocol semantics.

## Repository layout

```text
src/
  api/                HTTP API
  core/               canonical schemas and runtime config
  services/           cycle orchestration, persistence, routing, metrics
public/               participant + operator SPA
tests/                API, service, pipeline, and persistence coverage
skills/               Agent Skills-compatible Relay Blocks
```

## Key runtime surfaces

### Web app

The web surface provides:
- operator cycle creation and lifecycle control
- participant prompt reading and contribution submission
- participant digest or thread reading depending on condition
- participant response and feedback flows
- metrics, audit, and export inspection

### CLI

The CLI provides:
- cycle create/list/show/open/close/release/archive/replay/export
- participant view
- contribution, response, feedback, and telemetry event submission

Examples:

```bash
npm run cli -- cycle create '{"title":"Housing tradeoffs","prompt":"What tradeoffs matter most?","condition":"intervention","participants":[{"id":"p1","name":"Alice","role":"participant"},{"id":"p2","name":"Bob","role":"participant"}]}'
npm run cli -- cycle list
npm run cli -- participant view <cycleId> <participantId>
```

## Relay Blocks

The initial Relay Blocks are:
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

These are packaged as Agent Skills-compatible Relay Blocks so the coordination layer can be reused across compatible agents and runtimes without collapsing the application into prompt text.

## Local development

Requirements:
- Node.js 20+

Install and run:

```bash
npm install
npm run dev
```

The server defaults to:
- host: `127.0.0.1`
- port: `4317`
- data dir: `.acp-data/`

Environment variables:
- `ACP_HOST`
- `ACP_PORT`
- `ACP_DATA_DIR`

## Build and test

```bash
npm run build
npm run typecheck
npm test
```

## Current scope

This repository contains the product implementation.
It does not include the original proposal positioning as the product identity.
`Beyond Overload` was the initial proposal name; `Relay` is the product name, and `acp` is the protocol-first repository name.
