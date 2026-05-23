# ACP Evidence and Reporting System Spec

## Status

Draft v0.1

## Purpose

This spec defines the evidence and reporting system for the Attention Coordination Protocol (ACP). It covers how ACP runs are turned into inspectable evidence, how intervention and baseline conditions are compared, how seeded scenarios and benchmarks are organized, how operator and researcher review surfaces are generated, and how outputs are packaged into publication-ready artifacts.

This spec is execution-facing. It is meant to drive implementation work, not just describe research intent.

## Scope

This spec covers:

- seeded scenarios used for demos, regression checks, and benchmark comparisons
- benchmark and evaluation harness behavior
- live run evidence capture
- comparison protocol between ACP intervention and baseline thread conditions
- institutional reporting artifacts
- operator and researcher review surfaces
- publication-ready output bundles
- acceptance criteria for the full evidence and reporting layer

This spec does not define:

- the ACP core lifecycle contract
- Relay web app interaction design
- Relay operator CLI semantics outside reporting and evidence capture
- detailed survey item wording
- external distribution strategy

Those are controlled by other ACP and Relay specs.

## Why this system exists

The practical problem is simple: ACP can look good in a demo while still leaving behind weak evidence. That is not enough. The system needs to leave behind artifacts that make it possible to inspect what happened, compare conditions, catch failure, and communicate results to operators, researchers, and institutions.

The evidence layer should reduce three common failures:

- false confidence from anecdotal success
- blurry interpretation of what changed between conditions
- outputs that are too raw for real review or too polished to audit

## System goals

The evidence and reporting system must:

- turn every meaningful ACP run into a recoverable evidence bundle
- support side-by-side comparison between intervention and baseline conditions
- make missing data and ambiguous results visible
- separate raw evidence from summary and interpretation layers
- support both internal dogfooding and external-facing reporting
- produce artifacts that are readable by operators, researchers, and institutional audiences

## Core evidence objects

The evidence and reporting system owns these objects:

- `Seeded Scenario`
- `Scenario Bundle`
- `Benchmark Run`
- `Live Run`
- `Evidence Bundle`
- `Comparison Bundle`
- `Operator Review Surface`
- `Research Review Surface`
- `Institutional Report`
- `Publication Bundle`

These names are canonical within this layer.

## Evidence architecture

The system has 6 layers:

1. scenario layer
2. run capture layer
3. comparison layer
4. review surface layer
5. reporting layer
6. publication layer

Each layer must be able to operate without corrupting the layer beneath it.

That means:

- raw captured data must remain inspectable
- summaries must point back to source artifacts
- publication outputs must be derived from preserved bundles, not handwritten reconstructions

## Layer 1: seeded scenarios

### Purpose

Seeded scenarios provide stable, repeatable inputs for:

- demos
- regression checks
- conformance checks
- benchmark comparisons
- operator training
- reporting examples

### Required seeded scenario types

The system must support at least these scenario classes:

- `civic_budget`
- `public_hearing`
- `committee_tradeoff`
- `governance_conflict`
- `emergency_response`

Each scenario class must include both:

- `intervention` condition
- `baseline_thread` condition

### Scenario bundle requirements

A scenario bundle must include:

- scenario id
- scenario title
- short context paragraph
- discussion prompt
- participant roster
- participant role labels where relevant
- condition
- contributions
- optional responses
- optional feedback
- expected lifecycle outline
- expected export modes

### Scenario invariants

Each scenario must:

- run end to end without manual editing
- be usable from both CLI and automated harnesses
- be stable enough for replay and comparison
- include enough participant diversity to make routing and overload behavior visible

### Scenario storage

Scenario bundles must live in a repo-local, versioned directory and be treated as fixtures.

Required directory shape:

```text
demo/
fixtures/
docs/pilot/
docs/evaluation/
```

The exact scenario placement can vary, but seeded scenarios must remain:

- inspectable
- versioned
- machine-runnable
- easy to reference from reporting outputs

## Layer 2: benchmark and evaluation harness

### Purpose

The benchmark and evaluation harness executes stable scenario inputs, captures outputs, and produces comparable evidence across conditions.

### Harness responsibilities

The harness must:

- run seeded intervention scenarios
- run seeded baseline scenarios
- normalize output locations
- capture lifecycle and export artifacts
- capture failures explicitly
- support replayable, scriptable execution

### Harness modes

The harness must support:

- `fixture mode`
- `demo mode`
- `comparison mode`
- `live replay mode`

Definitions:

- `fixture mode`: deterministic run against a seeded scenario
- `demo mode`: deterministic run optimized for briefings or walkthroughs
- `comparison mode`: paired or grouped run comparison across conditions
- `live replay mode`: regenerate review artifacts from previously captured live runs

### Harness outputs

Every harness run must produce:

- run manifest
- normalized input copy
- final cycle state
- exports
- lifecycle event capture
- telemetry capture
- conformance result or validation result
- machine-readable summary

### Harness failure behavior

The harness must fail clearly on:

- invalid scenario input
- lifecycle transition failure
- export generation failure
- missing required evidence artifact
- comparison pairing failure

Failures must produce:

- exit code
- short error summary
- machine-readable error payload

## Layer 3: live run evidence capture

### Purpose

Live runs need stronger evidence discipline than seeded runs. This layer controls what gets captured, what gets retained, and what gets flagged as missing.

### Required live run evidence

Every live run must capture:

- cycle metadata
- condition
- prompt text
- participant roster snapshot
- contributions
- responses
- feedback
- lifecycle events
- routing decisions where applicable
- digests where applicable
- exports generated during or after run
- missingness records
- operator anomaly notes

### Live run rules

The evidence capture layer must:

- preserve raw run outputs before interpretation
- track missing survey or feedback data explicitly
- record operator interventions and anomalies
- preserve enough state for replay or after-action review

### Missingness handling

Missingness must be classified at minimum as:

- `not_collected`
- `not_submitted`
- `capture_failed`
- `withheld`
- `unknown`

Missingness must appear in:

- raw logs
- review surfaces
- reporting summaries

### Evidence bundle contract

Each live run must produce an evidence bundle containing:

- raw data directory
- normalized summary directory
- exports directory
- review surface directory
- bundle manifest

The manifest must include:

- run id
- cycle id
- condition
- scenario id if applicable
- timestamps
- generated artifact list
- missing artifact list
- retention classification

## Layer 4: comparison protocol

### Purpose

ACP makes a causal claim about structured attention and discussion quality. Comparison must therefore be explicit and repeatable.

### Comparison unit

The default comparison unit is:

- one `intervention` run
- matched against one `baseline_thread` run

Where possible, the pair should share:

- prompt family
- participant population or equivalent population
- timing window
- measurement and export settings

### Comparison types

The system must support:

- `paired comparison`
- `matched comparison`
- `series comparison`

Definitions:

- `paired comparison`: same participant cohort across conditions
- `matched comparison`: comparable but not identical cohorts
- `series comparison`: repeated cycle comparison over time

### Comparison measures

The comparison layer must support at minimum:

- exposure concentration
- reply concentration
- contributor coverage
- bridge exposure
- perceived overload
- perceived usefulness
- perceived exchange quality
- explanation clarity
- operator reliability measures

### Comparison outputs

A comparison bundle must include:

- comparison manifest
- source evidence bundle references
- metric summary table
- missingness summary
- operator notes summary
- concise interpretation section
- caveat section

### Comparison discipline

The system must never silently flatten:

- missingness
- unequal participation
- anomalous operator interventions
- partial export failures

Comparison outputs must show where the comparison is weak.

## Layer 5: operator and researcher review surfaces

### Purpose

Operators and researchers need a review layer that is richer than raw logs but still traceable.

### Operator review surface

The operator review surface must answer:

- what happened in the run
- what failed or drifted
- what was exported
- what needs follow-up

It must include:

- run summary
- lifecycle timeline
- anomaly summary
- missingness summary
- export inventory
- next-action checklist

### Research review surface

The research review surface must answer:

- what condition was run
- what differences were observed
- what evidence is strong
- what interpretation remains weak

It must include:

- scenario or run framing
- comparison metrics
- source links to evidence bundles
- limitations summary
- open-question section

### Review surface form factors

The system must support:

- machine-readable JSON outputs
- Markdown review outputs
- self-contained HTML review artifacts

The HTML artifacts are especially important for:

- operator briefings
- pilot recaps
- protocol explainers
- compatibility proof pages

## Layer 6: institutional reporting artifacts

### Purpose

Institutional audiences do not want raw run dumps. They need interpretable artifacts that remain anchored to evidence.

### Required artifact classes

The reporting system must support at least:

- `Cycle Briefing`
- `Pilot Recap`
- `Comparison Report`
- `Compatibility Proof`
- `Protocol Explainer`

### Cycle Briefing

A cycle briefing must include:

- prompt and condition
- what happened in plain language
- key metrics
- operator flags
- missingness note
- links to underlying evidence

### Pilot Recap

A pilot recap must include:

- run set summary
- condition comparison summary
- what appears promising
- what appears weak or unclear
- operational reliability summary
- recommended next actions

### Comparison Report

A comparison report must include:

- intervention vs baseline summary
- metric tables
- caution flags
- interpretation summary
- method note

### Compatibility Proof

A compatibility proof artifact must include:

- proof surfaces covered
- compatibility matrix reference
- fixtures and conformance references
- caveats about what was and was not validated

### Protocol Explainer

A protocol explainer must include:

- ACP object summary
- lifecycle summary
- condition summary
- how evidence is captured
- where Relay fits as the first implementation

## Publication-ready outputs

### Purpose

The publication layer turns internal evidence into shareable outputs without severing traceability.

### Required publication bundle

A publication bundle must contain:

- one lead summary artifact
- one methods or protocol note
- one evidence appendix or artifact index
- one comparison summary
- one limitations section

### Publication bundle constraints

A publication bundle must:

- preserve links or references to evidence bundles
- distinguish observed findings from interpretation
- surface limitations clearly
- be renderable without repo-local tribal knowledge

### Publication audiences

The system should support outputs for:

- internal team review
- pilot partners
- research readers
- governance or institutional readers

## Data flow

The evidence and reporting system follows this flow:

1. scenario selected or live run launched
2. run executed through supported surface
3. evidence captured into bundle
4. exports and summaries generated
5. comparison bundle generated where applicable
6. operator and researcher review surfaces generated
7. institutional or publication outputs generated

Every downstream layer must be reproducible from preserved upstream artifacts.

## Required commands and automation support

The implementation must expose scriptable entry points for:

- running seeded scenarios
- capturing live run evidence
- generating review surfaces
- generating institutional reports
- generating publication bundles
- rebuilding reporting artifacts from preserved evidence bundles

The exact command names may vary, but the above capabilities are mandatory.

## Storage and retention requirements

The evidence system must support retention classes for:

- demo artifacts
- benchmark artifacts
- pilot artifacts
- publication artifacts

Retention metadata must be explicit in manifests. Reporting outputs must never depend on silently deleted raw artifacts.

## Traceability rules

Every summary artifact must be traceable back to:

- run ids
- cycle ids
- source evidence bundles
- scenario ids where relevant
- comparison bundle ids where relevant

Traceability is mandatory for:

- metrics
- operator notes summaries
- condition claims
- reported caveats

## Quality rules

The system must not:

- treat missing data as zero
- present partial comparisons as complete
- hide export failures
- claim causal clarity where the comparison is weak
- collapse operator notes into narrative without source reference

The system should:

- preserve uncertainty
- show when the evidence is thin
- separate raw capture from summary and interpretation

## Implementation guidance

The implementation should be decomposed into these technical surfaces:

- scenario registry and loaders
- run harness
- evidence bundle builder
- comparison bundle builder
- review surface generator
- report generator
- publication bundle generator

These surfaces may share code, but their outputs should remain logically distinct.

## Suggested file and directory structure

One acceptable implementation shape is:

```text
demo/
fixtures/
docs/pilot/
docs/evaluation/
docs/reports/
scripts/
protocol/
```

One acceptable artifact shape is:

```text
artifacts/
  benchmark/
  live/
  comparison/
  reports/
  publication/
```

The exact directory names may differ, but the logical separation must remain visible.

## Acceptance criteria

The evidence and reporting system is complete for v0.1 only if all of the following are true:

1. At least 3 seeded scenario classes can run end to end in both intervention and baseline conditions.
2. A repeatable harness can execute seeded scenarios and produce normalized evidence bundles without manual editing.
3. Live runs generate evidence bundles with manifests, exports, lifecycle capture, and missingness records.
4. A comparison pipeline can produce intervention vs baseline comparison bundles with metric summaries and caveat sections.
5. Operator review surfaces can be generated from captured evidence without manual reconstruction.
6. Research review surfaces can be generated from captured evidence without manual reconstruction.
7. The system can generate at least these HTML artifacts:
   - cycle briefing
   - pilot recap
   - comparison report
   - protocol explainer
8. Publication-ready bundles can be generated from preserved evidence bundles.
9. Every generated summary artifact includes traceable references back to source run or comparison identifiers.
10. Missingness and anomaly data appear in both machine-readable and human-readable outputs.
11. Partial failures are surfaced explicitly in generated reports.
12. The full evidence and reporting flow can be rerun from preserved artifacts for audit or review.

## Non-goals for v0.1

The following are explicitly out of scope for this version:

- polished public dashboards
- automated statistical significance claims
- external hosting or publishing infrastructure
- multi-tenant evidence access control
- fully automated paper generation

These may be added later, but they are not required to complete the ACP evidence and reporting system for v0.1.

## Open implementation questions

These should be resolved during implementation without broadening scope:

- exact canonical artifact directory layout
- exact command names for reporting generators
- how much HTML generation should be shared across artifact classes
- where benchmark summary tables should live by default
- how publication bundles should be versioned

None of these should block implementation of the evidence and reporting layer itself.
