# ACP Evaluation Instrument Spec

Status: Child spec derived from ACP parent specs  
Parent specs:

- `ACP_TELEMETRY_EVALUATION_SPEC.md` v0.3
- `ACP_PILOT_OPERATIONS_SPEC.md` v0.1
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-23

## 1. Purpose

This document defines the human-facing evaluation instruments required for the ACP pilot.

Its role is to specify:

- post-cycle survey structure
- item wording targets
- interview guide structure
- qualitative coding expectations
- data completeness rules for participant-reported outcomes

## 2. Normative Scope

This spec governs:

- participant-reported post-cycle outcomes
- interview/question guide structure
- mapping from human instruments to evaluation outputs

This spec does not govern:

- structural telemetry metrics already defined in parent specs
- product implementation details outside required data capture hooks

## 3. Required Post-Cycle Survey Outcomes

The instrument must capture at minimum:

- perceived overload
- usefulness of encountered perspectives
- perceived exchange quality
- explanation clarity where applicable
- willingness to use the system again

## 4. v1 Instrument Shape

The first instrument may use a concise Likert-style form with a consistent numeric scale, provided:

- the scale is applied consistently
- wording is legible to participants
- intervention-only items are clearly scoped
- baseline participants are not asked irrelevant explanation questions without a valid fallback rule

## 5. Minimum Survey Contract

Every completed feedback record must include:

- participant id
- cycle id
- instrument version
- answers for the required outcome dimensions
- completion timestamp

## 6. Qualitative Follow-Up Contract

The pilot should support a lightweight qualitative layer capturing:

- what felt useful
- what felt confusing
- whether routing/explanations felt helpful or paternalistic
- whether quieter cycles felt healthier or simply less engaging

The exact interview instrument may remain concise in v1, but the guide must remain stable enough to compare across cycles.

## 7. Missingness Rules

If participant-reported outcomes are missing:

- preserve partial records where possible
- annotate missingness explicitly
- do not impute responses silently

## 8. Mapping To Analysis Outputs

The evaluation instrument must map cleanly into:

- cycle comparison summaries
- participant-level summaries
- qualitative review packets

## 9. File Ownership Guidance

This spec primarily governs:

- feedback schema fields if revised
- web or CLI feedback collection flows
- evaluation docs and later analysis scripts

## 10. Acceptance Criteria

The evaluation instrument layer is ready when:

- required participant-reported outcomes are clearly specified
- baseline and intervention conditions can both be measured fairly
- missingness handling is explicit
- qualitative follow-up guidance exists

## 11. Agent Execution Notes

Use this spec when assigning work that affects feedback collection or study evaluation inputs.

Required task shape:

- identify which participant-reported measure is affected
- preserve comparability across conditions
- avoid ad hoc wording drift unless the spec is revised explicitly
