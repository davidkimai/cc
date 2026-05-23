# ACP Operational Docs

This directory contains non-code operational material that supports the first serious ACP pilot.

The normative source of truth remains `docs/specs/`.
These docs operationalize those specs into concrete runbooks, checklists, instruments, deployment materials, and demo/evidence assets.

If you are approaching the repository from the paper or workshop package, start with [`../REVIEWER_START_HERE.md`](../REVIEWER_START_HERE.md) and then use this directory for the operational and evidence-supporting layer.

## Sections

- `pilot/`: runbooks, checklists, participant communications, operator templates, and prompt packs
- `evaluation/`: survey instruments, interview guides, qualitative coding assets, and evaluation prompt packs
- `reports/`: report review notes and export presentation checks
- `pilot/data-handling/`: pilot artifact capture, retention, missingness, and handoff guidance
- `compatibility/`: practical compatibility notes for future implementers
- `design/`: visual strategy and page-improvement guidance
- `deployment/`: runtime, release, smoke-check, and demo staging materials
- `specs/`: normative product, protocol, telemetry, and orchestration specs

## Ground truth

These materials are derived from:

- `docs/specs/ACP_PILOT_OPERATIONS_SPEC.md`
- `docs/specs/ACP_EVALUATION_INSTRUMENT_SPEC.md`
- `docs/specs/ACP_RELEASE_DEPLOYMENT_SPEC.md`

## Usage rule

If an operational doc conflicts with a spec, revise the operational doc or escalate a spec revision. Do not silently drift.

## Phase-one demoability and evidence materials

These repo-local materials now also include:

- `../demo/`: synthetic seeded demo bundle for intervention and baseline walkthroughs
- `pilot/prompt-packs/`: civic and governance scenario packs for live use
- `evaluation/prompt-packs/`: paired scenario companions for structured review
- `reports/`: export review and presentation guidance

## Protocol bundle

Repo-local protocol bundle materials now also include:

- `../protocol/`: canonical schema bundle and example payloads
- `../fixtures/replay/`: replay fixtures used for ACP conformance checks

## Operational transfer materials

This repo now also includes:

- `pilot/data-handling/`: pilot artifact handling and retention materials
- `../skills/registry.json`: machine-readable Relay Blocks suite index
- `../skills/compositions/`: multi-block operator workflows

## Ecosystem proof materials

This repo now also includes:

- `pilot/democracy-packs/`: reusable civic coordination patterns for live use
- `evaluation/democracy-packs/`: paired evaluation companions for those patterns
- `compatibility/`: practical notes for boundary normalization and extension
- `../protocol/compatibility/`: machine-readable compatibility matrix

## Visual strategy materials

This repo now also includes:

- `design/RELAY_VISUAL_STRATEGY.md`: design guidance grounded in the current Relay page and the `design-taste-frontend` skill

## Agent distribution materials

This repo now also includes:

- `agents/README.md`: runtime-bundle strategy for skills-compatible agents


## External adoption materials

This repo now also includes:

- `../runners/http-client/`: API-driven external consumer example for ACP
- `../protocol/EXTERNAL_IMPLEMENTER_GUIDE.md`: current implementer boundary and validation guide


## Visual artifact and dogfood materials

This repo now also includes:

- `../scripts/visual-artifacts/`: generated HTML explanation artifacts
- `../scripts/dogfood/`: seeded Relay dogfood automation and structured findings
- `../scripts/report/`: institutional report bundles generated from preserved ACP evidence
- `../scripts/conference/`: conference rehearsal bundles combining benchmark, report, dogfood, and adopter evidence
- `../scripts/release/`: release smoke, backup, and gate checks
- `../scripts/completion/`: final technical completion audit and handoff notes
