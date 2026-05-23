Status: product-quality and evidence spec
Version: 0.1
Date: 2026-04-24

# ACP Visual Artifacts and Dogfood Spec

## 1. Purpose

This spec defines one consolidated execution layer for:

- richer visual explanation artifacts around ACP
- repeatable dogfood automation for Relay
- deterministic surface checks tied to seeded cycle flows

The goal is to improve ACP legibility and Relay product quality without collapsing product UI and explainer UI into the same thing.

## 2. Scope

This spec governs:

- generated HTML artifacts for review and explanation
- dogfood automation that exercises seeded ACP flows
- deterministic checks for operator flow, participant load flow, and export generation flow
- the relationship between app UI and richer explainer/report surfaces

This spec does not govern:

- a framework migration
- replacing the live Relay UI with explainer pages
- freeform visual experimentation disconnected from protocol evidence

## 3. Separation rule

Keep the layers separate:

- `Relay app` stays restrained, task-focused, and operational
- `explainer and report artifacts` can be richer, longer-form, and more visual

Do not turn the product UI into a slide deck.
Do not force report-style layouts into participant submission flows.

## 4. Required generated artifacts

ACP v0.1 should be able to generate these HTML artifacts:

1. `cycle briefing`
- summarizes one cycle, status, metrics, audit trail, participant views, and exports

2. `pilot recap`
- summarizes one seeded or live run, its checks, artifacts, and issues

3. `compatibility proof`
- summarizes the compatibility matrix, proof surfaces, and runtime validation layer

4. `protocol explainer`
- explains ACP, Relay, Relay Blocks, core lifecycle, and proof surfaces in plain language

## 5. Dogfood workflow

The dogfood path must:

1. run a seeded ACP scenario
2. exercise the operator flow through the public Relay boundary
3. exercise participant-view loading
4. confirm export generation
5. collect structured findings
6. emit both machine-readable and human-readable outputs
7. emit richer HTML artifacts around the run

## 6. Deterministic checks

The deterministic checks should validate at minimum:

- operator surface availability
- participant surface framing availability
- session endpoint availability
- seeded cycle execution success
- participant views captured
- exports generated
- expected lifecycle audit coverage

These checks may use the public API and browser-surface markers even when a fully interactive browser-control path is unavailable.

## 7. External skills guidance

The best external skills for this layer are:

- `dogfood` for exploratory product review with evidence
- `agent-browser` for browser operations and screenshots
- `playwright`-style skills for deterministic browser automation

These skills support QA and workflow automation.
They do not redefine ACP semantics.

## 8. Acceptance criteria

This spec is satisfied when:

- one dogfood command runs a seeded scenario end to end
- it produces a structured report in JSON and Markdown
- it generates all four visual artifact types
- it confirms operator flow, participant load flow, and export generation flow
- the repo documents how to use the workflow without conflating product UI and explainer UI
