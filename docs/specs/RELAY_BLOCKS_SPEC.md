# Relay Blocks Spec

Status: Child spec derived from canonical technical spec  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3

Version: 0.3  
Date: 2026-04-23

## 1. Purpose

This document defines the Agent Skills-standard package architecture for `Relay Blocks`, the modular operational layer over `Attention Coordination Protocol (ACP)`.

Its role is to specify:

- package categories
- per-skill responsibilities
- canonical trigger descriptions
- `SKILL.md` conventions
- `references/` and `scripts/` layout
- runtime adapter rules
- installation and distribution strategy
- acceptance criteria for the initial Relay Blocks layer

Relay Blocks are the packaging and workflow layer over the canonical protocol contract. It is not the protocol contract itself.

## 2. Normative Principles

- The protocol contract remains the source of truth for domain semantics.
- Skills package reusable procedural knowledge, workflows, and adapter behavior.
- Skills must not become the hidden canonical source of protocol state.
- Each skill must be one coherent unit of work.
- Progressive disclosure is mandatory: keep `SKILL.md` lean and move long detail into `references/`.
- Reusable logic belongs in `scripts/`.

## 3. Relationship to Core Architecture

Relay Blocks sit above the coordination engine and product surfaces.

They exist to:

- package ACP coordination workflows in a portable, reusable format
- teach compatible agents when and how to invoke those workflows
- support participant-surface and operator-surface operation
- support future portability across compatible runtimes

They do not:

- replace backend state or schemas
- replace the canonical state machine
- serve as the only implementation of routing, digesting, or auditing

## 4. Package Categories

The initial suite has 4 package categories.

### 4.1 Protocol skills

These package reusable social-coordination workflows.

Canonical packages:

- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `operator-audit`

### 4.2 Surface and workflow skills

These teach agents how to operate the product surfaces and study workflows.

Canonical packages:

- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`

### 4.3 Runtime adapter skills

These package runtime-specific assumptions and usage patterns for Relay as the first ACP implementation.

Canonical packages:

- `relay-openclaw`
- `relay-hermes` later

### 4.4 Future optional packages

Out of scope for initial implementation, but plausible later:

- `policy-committee-mode`
- `research-team-mode`
- `governance-audit-pack`

## 5. Repository Layout

Canonical repository structure inside the `acp` repo:

```text
acp/
  README.md
  docs/
    specs/
      ACP_TECHNICAL_SPEC.md
      ACP_PROTOCOL_CONTRACT_SPEC.md
      ACP_TELEMETRY_EVALUATION_SPEC.md
      RELAY_BLOCKS_SPEC.md
      ACP_IMPLEMENTATION_ORCHESTRATION_SPEC.md
  skills/
    deliberation-cycle/
      SKILL.md
      references/
      scripts/
    epistemic-routing/
      SKILL.md
      references/
      scripts/
    digest-and-explanation/
      SKILL.md
      references/
      scripts/
    overload-governance/
      SKILL.md
      references/
      scripts/
    operator-audit/
      SKILL.md
      references/
      scripts/
    participant-web-operator/
      SKILL.md
      references/
      scripts/
    research-cli-operator/
      SKILL.md
      references/
      scripts/
    baseline-thread-runner/
      SKILL.md
      references/
      scripts/
    pilot-analysis/
      SKILL.md
      references/
      scripts/
    relay-openclaw/
      SKILL.md
      references/
    relay-hermes/
      SKILL.md
      references/
```

## 6. Global `SKILL.md` Rules

Every skill must contain valid YAML frontmatter with at least:

- `name`
- `description`

Recommended optional fields:

- `compatibility`
- `metadata`
- `allowed-tools` only where the target client supports it

### 6.1 Naming rules

- lowercase letters, numbers, and hyphens only
- directory name must match skill name

### 6.2 Description rules

- must be written as trigger guidance
- preferred format: `Use this skill when...`
- must describe user intent, not internal implementation only

### 6.3 Body rules

Every `SKILL.md` should contain:

- what the skill is for
- when to use it
- when not to use it
- workflow steps
- available scripts
- references loading instructions
- output expectations

## 7. Shared Package Conventions

### 7.1 `references/`

Use for:

- heuristics notes
- protocol sub-guides
- operator procedures
- examples
- failure playbooks

Rules:

- do not preload references implicitly
- the skill must explicitly say when to load each file

### 7.2 `scripts/`

Use for:

- deterministic helper logic
- parsing
- validation
- export formatting
- metrics computation

Rules:

- scripts must be runnable from the skill root using relative paths
- scripts must be named in `SKILL.md`
- scripts should prefer clean machine-readable output for agent use

### 7.3 `assets/`

Optional.
Use only if needed for templates or fixtures.

## 8. Canonical Skill Definitions

## 8.1 `deliberation-cycle`

Purpose:

- orchestrate a full intervention cycle from setup through closure

Canonical description:

- Use this skill when running or coordinating a full ACP intervention cycle from prompt setup through closure, especially when the task involves sequencing submission, routing, digest release, reflection, or feedback collection.

Responsibilities:

- sequence cycle stages
- call subordinate skills in the correct order
- enforce phase ordering
- surface blocked preconditions

Non-goals:

- compute routing directly
- compute pilot metrics directly

Suggested references:

- `references/cycle-lifecycle.md`
- `references/failure-recovery.md`

## 8.2 `epistemic-routing`

Purpose:

- determine recipient allocation for contributions

Canonical description:

- Use this skill when contributions in a ACP cycle need to be routed to recipients using relevance, diversity, bridge-exposure, and load constraints, or when routing decisions need to be inspected or replayed.

Responsibilities:

- score contribution-recipient candidates
- apply routing heuristics
- apply bridge-exposure logic
- enforce load constraints
- record routing decisions

Suggested scripts:

- `scripts/score_routing.py`
- `scripts/validate_routing_output.py`

Suggested references:

- `references/routing-heuristics.md`
- `references/bridge-exposure.md`

## 8.3 `digest-and-explanation`

Purpose:

- produce participant-ready digests and routing explanations

Canonical description:

- Use this skill when routed contributions must be assembled into a participant digest with lightweight synthesis and clear plain-language explanations of why each item was shown.

Responsibilities:

- order digest items
- compose a digest summary
- preserve source material
- generate explanation text
- retain bridge flags

Suggested scripts:

- `scripts/build_digest_payload.py`

Suggested references:

- `references/explanation-style.md`
- `references/digest-quality-checks.md`

## 8.4 `overload-governance`

Purpose:

- enforce bounded attention and pacing

Canonical description:

- Use this skill when a ACP cycle needs reading-burden limits, pacing controls, attention caps, or checks that prevent the discussion from turning back into an overloaded feed.

Responsibilities:

- determine digest caps
- estimate reading time
- enforce pacing rules
- identify overload violations

Suggested references:

- `references/overload-thresholds.md`

## 8.5 `operator-audit`

Purpose:

- support operator inspection, replay, and failure analysis

Canonical description:

- Use this skill when operators need to inspect cycle state, replay routing or digest runs, export traces, diagnose failures, or verify that a ACP cycle followed the protocol correctly.

Responsibilities:

- inspect state transitions
- export audit traces
- support replay workflows
- classify failure states

Suggested scripts:

- `scripts/export_audit_bundle.py`

Suggested references:

- `references/replay-procedure.md`
- `references/failure-codes.md`

## 8.6 `participant-web-operator`

Purpose:

- teach an agent how to exercise and validate the participant web app

Canonical description:

- Use this skill when the ACP participant web surface must be exercised, validated, or documented through browser-based flows such as onboarding, submission, digest reading, routing explanation viewing, and feedback capture.

Responsibilities:

- validate prompt display
- validate submission flow
- validate digest reading flow
- validate explanation visibility
- validate feedback flow

Rules:

- should compose existing browser tools rather than reimplement browser logic in prompt text

## 8.7 `research-cli-operator`

Purpose:

- teach an agent how to use the project CLI

Canonical description:

- Use this skill when the ACP CLI must be used to create cycles, trigger routing, generate or inspect outputs, export telemetry, replay runs, or compare intervention and baseline conditions.

Responsibilities:

- invoke CLI commands
- validate command outputs
- run reproducible operator workflows

Suggested references:

- `references/cli-command-reference.md`
- `references/replay-and-export.md`

## 8.8 `baseline-thread-runner`

Purpose:

- run and inspect the baseline condition using the same prompt family and measurement conventions

Canonical description:

- Use this skill when a chronological-thread baseline cycle must be created, run, inspected, or compared against the ACP intervention using the same prompt family and measurement conventions.

Responsibilities:

- create baseline cycles
- expose baseline thread behavior
- preserve measurement comparability

## 8.9 `pilot-analysis`

Purpose:

- compute pilot outputs and comparison summaries

Canonical description:

- Use this skill when ACP pilot data must be summarized into structural attention metrics, participant outcome summaries, operator reliability metrics, or a standard comparison readout across conditions.

Responsibilities:

- compute structural metrics
- summarize participant outcomes
- summarize operator reliability
- produce a standard comparison packet

Suggested scripts:

- `scripts/compute_metrics.py`
- `scripts/build_analysis_export.py`

## 8.10 `relay-openclaw`

Purpose:

- package the suite for OpenClaw

Canonical description:

- Use this skill when ACP must run inside OpenClaw and the agent needs the OpenClaw-specific assumptions, tool usage, skill locations, and workflow conventions for the project.

Responsibilities:

- document expected OpenClaw tool usage
- map workflow skills to OpenClaw conventions
- define installation assumptions

## 8.11 `relay-hermes`

Purpose:

- future runtime adapter for Hermes

Canonical description:

- Use this skill when ACP must run inside Hermes and the agent needs Hermes-specific conventions, tool assumptions, and workflow packaging for the same protocol suite.

Status:

- planned, not required for initial implementation

## 9. Engine vs Skill Boundary

The coordination engine performs the real implementation work of:

- routing
- digest generation
- explanation
- overload checks
- audit trace production

Relay Blocks teach agents:

- when to invoke those capabilities
- how to sequence workflows
- how to load references
- how to run deterministic helper scripts
- how to operate participant and operator surfaces

This distinction must remain explicit throughout implementation.

## 10. Installation and Distribution Strategy

### 10.1 Project-local installation

Primary implementation target:

- project-local skills committed with the repository

Expected locations by client:

- `.agents/skills/` where applicable
- runtime-specific project skill directories if needed

### 10.2 Runtime-local installation

Supported as needed for OpenClaw-managed skill loading.

### 10.3 Distribution

Initial distribution should support:

- direct repository checkout
- direct local loading in the main project repo

Future distribution may support:

- `skills.sh`
- OpenClaw-native installation flows

## 11. Runtime Adapter Rules

Runtime adapters must:

- preserve canonical skill names where possible
- document runtime-specific tool assumptions
- avoid redefining protocol semantics

Runtime adapters must not:

- fork the protocol
- silently weaken required workflows
- hide runtime constraints from operators

## 12. Acceptance Criteria

The initial Relay Blocks layer is implementation-ready when:

- all core packages above exist
- each package has a valid `SKILL.md`
- each package has a canonical trigger description
- package responsibilities align with the parent specs
- at least the OpenClaw adapter is documented
- `references/` and `scripts/` layout is standardized
- the suite can be used to support both participant-surface and operator-surface workflows

## 13. Immediate Implementation Tasks

1. Create repository skeleton.
2. Create `SKILL.md` stubs with canonical descriptions.
3. Add reference files for routing, digesting, overload, and audit.
4. Add deterministic helper scripts where needed.
5. Add OpenClaw adapter package.
6. Validate naming and description consistency across all packages.
