# Relay Export Report Spec

Status: Finalized Phase 2 child spec derived from ACP parent specs  
Parent specs:

- `ACP_TECHNICAL_SPEC.md` v0.3
- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `ACP_PILOT_OPERATIONS_SPEC.md` v0.1
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the presentation-quality export and report expectations for Relay as the first implementation of ACP.

Its role is to specify:

- export artifact presentation goals
- report structure for analysis, audit, and compact exports
- readability expectations for demos, pilot operations, and fellowship reporting

## 2. Normative Scope

This spec governs:

- human-readable export structure produced by Relay
- section ordering and minimum report content for exported cycle artifacts
- readability expectations for operator-facing and demo-facing artifacts

This spec does not govern:

- the canonical protocol contract itself
- raw persistence formats
- telemetry semantics beyond what must be presented in exported reports

## 3. Export Modes

Relay v1 should continue to support three export modes:

- `analysis`: presentation-quality cycle summary with metrics and readable interpretation aids
- `audit`: operator-facing trace with legible audit and telemetry sections
- `minimal`: compact snapshot for quick review, handoff, or demo use

## 4. Presentation Principles

All Relay export artifacts should be:

- ACP-first in framing
- clearly tied to a single cycle
- readable without opening the application UI
- suitable for demo walkthroughs and pilot artifact retention
- concise enough for human review but complete enough to support later analysis

## 5. Required Report Structure

### Analysis export

Must include at minimum:

- clear ACP/Relay title
- cycle snapshot
- headline metrics
- interpretation aids or operator-facing reading guidance
- condition-specific section for intervention or baseline
- participant contribution listing

### Audit export

Must include at minimum:

- clear ACP/Relay title
- cycle snapshot
- audit event count
- telemetry event count
- ordered audit event list
- ordered telemetry event list

### Minimal export

Must include at minimum:

- compact title
- cycle id
- title
- condition
- status
- participant, contribution, and response counts
- enough artifact counts to support quick triage

## 6. Language And Framing

Presentation-quality exports should:

- refer to Relay as the first implementation of ACP
- avoid stale Beyond Overload or generic app framing
- preserve the distinction between intervention and baseline conditions
- prefer section headings and short prose over dense raw dumps where possible

## 7. Operator Use Cases

These exports should support at least:

- demo walkthroughs
- post-cycle pilot review
- anomaly investigation
- qualitative handoff to researchers
- fellowship reporting snapshots

## 8. Acceptance Criteria

Export/report presentation is accepted when it satisfies all requirements below.

| Fixture | Requirement |
|---|---|
| Export modes | `analysis`, `audit`, and `minimal` remain available for a completed cycle |
| Report bundle command | `npm run report:bundle` works with no required flags by generating a local demo report bundle |
| Required report files | Report bundle includes `index.html`, `cycle-briefing.html`, `pilot-recap.html`, `compatibility-proof.html`, `protocol-explainer.html`, `operator-review.md`, `research-review.md`, and `evidence-index.json` |
| Evidence traceability | `evidence-index.json` lists source artifacts with byte counts and hashes |
| Human legibility | HTML and markdown reports can be read without opening the Relay UI or raw JSON first |
| ACP framing | Reports describe Relay as the reference implementation and ACP as the protocol |
| Condition clarity | Baseline and intervention outputs remain distinguishable in reports |

Mechanical requirements:

- report generation requires no network access or live model call
- report generation must not mutate raw source artifacts
- report output may be regenerated safely into the same default artifact directory

## 9. Agent Execution Notes

Use this spec when assigning work that affects export wording, section structure, or report readability.

Required task shape:

- identify which export mode is in scope
- preserve ACP semantics while improving legibility
- avoid removing fields that operators or evaluators rely on unless the spec is revised explicitly
