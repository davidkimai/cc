# acp

Attention Coordination Protocol.

`acp` stands for `Attention Coordination Protocol`.

This repository is the protocol-first home for `Relay`, the first working implementation of ACP.

ACP is a reusable democratic coordination primitive for discussion under load.
Relay is the reference implementation used to validate that primitive in practice.

The system is designed around bounded discussion cycles with two comparable conditions:
- `intervention`: routed participant digests with plain-language explanations
- `baseline_thread`: a chronological thread on the same canonical cycle model

Relay is built around a single ACP contract, two operator surfaces, and a set of reusable Relay Blocks packaged as Agent Skills-compatible units.

## Why ACP exists

Most discussion systems still default to broadcast feeds and let salience sort itself out after the fact.
ACP takes a different approach: it treats discussion as an attention-allocation problem.

ACP defines how a cycle moves from prompt to contribution, from contribution to release, and from release to reflection, audit, telemetry, and export.
Relay is the first implementation used to validate ACP through a working participant surface, operator surface, and empirical comparison against a baseline thread.

## Strategic framing

This repository should be read using a 3-layer hierarchy:
- Protocol: `Attention Coordination Protocol (ACP)`
- Reference implementation: `Relay`
- Modular layer: `Relay Blocks`

That distinction is deliberate.
ACP is the reusable standardizing layer.
Relay is the first implementation, not the whole conceptual object.
Relay Blocks are reusable operational units over ACP rather than the source of truth for protocol semantics.

## What Relay does

- creates and manages discussion cycles
- collects one primary contribution per participant during the submission window
- runs intervention routing and digest generation under bounded load constraints
- releases either routed digests or a baseline thread depending on condition
- captures participant responses, feedback, telemetry, audit events, and exports
- exposes both a web surface and a CLI over the same protocol core
- packages reusable Relay Blocks in `skills/`

## Relay framing

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

## Reference implementation surfaces

### Web app

The Relay web surface provides:
- operator cycle creation and lifecycle control
- participant prompt reading and contribution submission
- participant digest or thread reading depending on condition
- participant response and feedback flows
- metrics, audit, and export inspection

### CLI

The Relay CLI provides:
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

These are packaged as Agent Skills-compatible Relay Blocks so ACP can be operationalized across compatible agents and runtimes without collapsing the protocol into prompt text.

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

This repository contains:
- the ACP contract as the primary framing object
- Relay as the first implementation
- Relay Blocks as the modular operational layer

`Beyond Overload` was the initial proposal name.
`Relay` is the implementation name.
`acp` is the protocol-first repository name.
