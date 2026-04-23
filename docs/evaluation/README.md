# ACP Evaluation Kit

This directory contains the human-instrument layer for the ACP pilot.

## Contents

- `instruments/post-cycle-survey-v1.md`: canonical v1 survey wording
- `instruments/interview-guide-v1.md`: lightweight follow-up interview guide
- `templates/qualitative-coding-sheet.csv`: coding template for qualitative review
- `templates/feedback-missingness-log.csv`: explicit missingness tracking sheet

## Rules

- Preserve comparability across `intervention` and `baseline_thread`.
- Do not silently impute participant-reported outcomes.
- If wording changes, version the instrument rather than editing history in place.
