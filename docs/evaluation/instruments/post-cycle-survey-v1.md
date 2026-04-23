# Post-Cycle Survey v1

Instrument version: `v1`

Use a consistent 1--5 scale for all Likert items.

Scale anchors:

- `1`: strongly disagree
- `2`: disagree
- `3`: neither agree nor disagree
- `4`: agree
- `5`: strongly agree

## Required metadata

- participant id
- cycle id
- condition
- instrument version
- completion timestamp

## Core items for all conditions

1. I felt overloaded by the amount of material I had to process in this cycle.
2. I encountered perspectives that were useful to think with.
3. The exchange in this cycle felt thoughtful rather than purely reactive.
4. I would be willing to use this system again for a future discussion.

## Intervention-only item

Ask this only for `intervention` cycles:

5. The explanation of why items were shown to me was clear.

## Open-response prompts

Ask these for both conditions:

- What part of this cycle felt most useful?
- What part of this cycle felt most confusing, frustrating, or weak?
- Did the discussion feel quieter in a healthy way, or just less engaging? Why?

## Administration notes

- Do not show the explanation-clarity item to baseline participants.
- Preserve partial responses if a participant exits early.
- Record missingness explicitly in `templates/feedback-missingness-log.csv`.
