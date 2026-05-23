# ACP Evaluation Data Handling

This directory defines how the evaluation side consumes pilot data-handling outputs.

## Inputs from pilot operations

- cycle manifest
- raw export bundle
- missingness log
- operator handoff packet

## Evaluation rules

- treat the pilot export bundle as immutable
- use missingness entries as analysis metadata, not as an excuse to rewrite the raw record
- keep derived evaluation artifacts outside the pilot raw tree
- document any cycle-level exclusion directly against the handoff packet or missingness log

## What the analyst should look for

- whether the export bundle is complete enough to analyze
- whether missingness changes interpretation
- whether the cycle should be included, flagged, or excluded
- whether the operator handoff exposes follow-up work

