# Missingness Log Template

Log missingness when the raw cycle record is incomplete, delayed, or partly absent.

## Entry rules

- one row per missingness event
- do not paper over the gap with a manual rewrite
- describe the observable effect, not just the suspected cause

| Timestamp | Cycle ID | Artifact / Field | Kind | Scope | Severity | Operator | Status | Reason | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `capture-missing` / `partial-export` / `participant-missing` / `routing-missing` |  | `low` / `medium` / `high` / `critical` |  | `open` / `resolved` |  |  |

## Suggested kinds

- `capture-missing`: expected artifact was never captured
- `partial-export`: artifact exists but is incomplete
- `participant-missing`: participant record is absent or unusable
- `routing-missing`: routing or release output did not materialize

