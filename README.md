# ACP

ACP stands for `Attention Coordination Protocol`.

This repo is the main home for ACP and for `Relay`, the first working implementation of the protocol.

ACP is built for one simple problem: most group discussion tools show everything to everyone and hope people sort it out themselves. That breaks down fast. Important ideas get buried, early posts get too much attention, and people who are slower or more careful get pushed out.

ACP takes a different approach. It treats discussion as a coordination problem.

Instead of one open feed, ACP runs a discussion in clear stages:
- people submit one main contribution
- the system prepares either a routed digest or a simple thread view
- people respond after release
- the cycle is logged, measured, and exported for review

## What this repo contains

This repo has three connected layers:
- `ACP`: the protocol and source of truth
- `Relay`: the first product built on that protocol
- `Relay Blocks`: reusable operating blocks for agents and operator workflows

In practice, that means this repo includes:
- the protocol contract
- a working web app
- a working CLI
- a local API server
- cycle storage and export logic
- tests
- pilot runbooks and evaluation materials
- reusable Relay Blocks under `skills/`

## What Relay does today

Relay already supports:
- creating discussion cycles
- running both supported conditions:
  - `intervention`: a routed digest with explanations
  - `baseline_thread`: a normal chronological thread on the same cycle model
- collecting one main contribution per participant
- releasing outputs at the right stage
- collecting responses and feedback
- recording audit events and telemetry
- generating exports for analysis and review
- inspecting cycles through both the web app and the CLI

## How to read the repo

If you are new here, use this order:

1. Start with the protocol and implementation specs in `docs/specs/`
2. Look at the web and CLI entry points in `public/` and `src/`
3. Look at pilot and evaluation materials in `docs/pilot/` and `docs/evaluation/`
4. Look at `skills/` for Relay Blocks and agent-facing helpers

## Source of truth

The canonical implementation specs live in `docs/specs/`.

Start with:
- `ACP_TECHNICAL_SPEC.md`
- `ACP_PROTOCOL_CONTRACT_SPEC.md`
- `ACP_TELEMETRY_EVALUATION_SPEC.md`
- `RELAY_BLOCKS_SPEC.md`
- `ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md`

The main implementation-child specs include:
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md`
- `RELAY_WEB_APP_SPEC.md`
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md`
- `ACP_HTTP_API_SPEC.md`
- `ACP_COORDINATION_ENGINE_SPEC.md`
- `ACP_PERSISTENCE_EXPORT_SPEC.md`
- `ACP_PILOT_OPERATIONS_SPEC.md`
- `ACP_EVALUATION_INSTRUMENT_SPEC.md`
- `RELAY_BLOCKS_EXECUTION_SPEC.md`
- `ACP_AGENT_EXECUTION_CONTRACT.md`
- `ACP_RELEASE_DEPLOYMENT_SPEC.md`

If code and older notes disagree, `docs/specs/` wins.

## Main surfaces

### Web app

Relay includes one browser surface with two roles:
- operator view for creating, running, and inspecting cycles
- participant view for reading prompts, submitting contributions, reading outputs, and sending feedback

### CLI

Relay also includes a CLI for headless and scripted work.

It supports:
- cycle creation and lifecycle actions
- participant view lookup
- contribution, response, feedback, and event submission
- inspection of audit events, telemetry, metrics, routing decisions, digests, and exports

## Relay Blocks

The `skills/` directory contains Relay Blocks.

These are reusable helpers for operating Relay and ACP through compatible agents and runtimes. The highest-value blocks now include helper scripts and references for:
- CLI operation
- pilot analysis
- participant surface preflight checks
- runtime loadout validation

## Pilot materials

This repo now includes concrete pilot materials in `docs/`:
- deployment notes and release smoke checks
- pilot runbooks and operator checklists
- participant communication templates
- post-cycle survey and interview guide
- qualitative coding and missingness templates

These materials are here so running the fellowship pilot does not depend on improvised procedure.

## Repository layout

```text
src/                 server, API, core types, services, CLI
public/              Relay web app
skills/              Relay Blocks
tests/               automated tests
docs/specs/          canonical specs
docs/pilot/          pilot runbooks and checklists
docs/evaluation/     survey and interview materials
docs/deployment/     release and deployment notes
```

## Local development

Requirements:
- Node.js 20+

Install and run:

```bash
npm install
npm run dev
```

Default local settings:
- host: `127.0.0.1`
- port: `4317`
- data directory: `.acp-data/`

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

A GitHub Actions workflow also runs the same checks for the repo.

## Current status

This repo is no longer just a proposal scaffold.

It is already:
- a protocol-first codebase
- a working reference implementation
- a spec-driven implementation repo
- a pilot-preparation repo with operational materials

It is still early. The system is usable and coherent, but it is not yet the final fellowship output.

## Naming note

`Beyond Overload` was the original proposal name.

Current naming:
- `ACP` is the protocol
- `Relay` is the first implementation
- `Relay Blocks` are the reusable operating blocks
