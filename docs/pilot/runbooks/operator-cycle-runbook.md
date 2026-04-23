# Relay Operator Cycle Runbook

Use this runbook to execute one ACP pilot cycle in Relay.

## 1. Scope

This runbook applies to both `intervention` and `baseline_thread` cycles.
It assumes the operator is using Relay as the first ACP implementation and must preserve comparability across conditions.

## 2. Inputs required before cycle creation

Prepare these inputs before touching the app or CLI:

- final prompt text
- cycle condition: `intervention` or `baseline_thread`
- cycle identifier and target schedule
- participant roster with stable participant ids
- any load setting choices or notes for the intervention condition
- fallback communication channel if Relay becomes unavailable

Record them in `templates/cycle-setup-template.csv`.

## 3. Pre-launch procedure

1. Confirm the exact prompt text and condition assignment.
2. Confirm the participant roster and expected attendance status.
3. Verify that the current commit has passed the release gate.
4. Verify `ACP_DATA_DIR` is writable and retained.
5. Open the pre-cycle checklist and complete every item.
6. If any item fails, do not open submissions until it is resolved or recorded as an explicit risk.

## 4. Cycle launch procedure

1. Create the cycle using the chosen condition and prompt.
2. Record the cycle id in the setup sheet.
3. Announce the start to participants using `templates/participant-comms.md`.
4. Open submissions at the scheduled time.
5. Confirm that the cycle state reflects that submissions are open.

## 5. Active monitoring procedure

While submissions are open:

1. Monitor that new contributions are being recorded.
2. Do not intervene in content unless there is a clear operational need.
3. Log anomalies immediately if submissions fail, participant access breaks, or state transitions behave unexpectedly.
4. If the system fails, prefer an explicit pause or recovery decision over silent ad hoc fixes.

Complete `checklists/live-cycle-checklist.md` during the run.

## 6. Submission close and routing procedure

1. Close submissions at the planned time.
2. Confirm no new contributions are being accepted.
3. For `intervention`, run routing only after submissions are closed.
4. Inspect routing outputs before release where appropriate.
5. Record anomalies if routing fails, produces empty outputs unexpectedly, or requires rerun.

## 7. Release and reflection procedure

For `intervention`:

1. Confirm digests exist.
2. Release digests only after routing and digest generation have succeeded.
3. Announce digest availability to participants.

For `baseline_thread`:

1. Confirm the thread view is available.
2. Announce discussion visibility to participants.

For both conditions:

1. Keep the reflection window bounded.
2. Confirm responses and feedback are being recorded.
3. Close reflection at the planned time.

## 8. Post-cycle closeout

1. Generate and retain exports.
2. Confirm telemetry and audit traces exist.
3. Complete the post-cycle checklist.
4. Record any anomalies, manual interventions, or partial data issues.
5. Archive the cycle only after required artifacts are retained.

## 9. Failure rule

Never silently change cycle semantics to keep the session moving.
If a failure forces a pause, rerun, or partial completion, document it in both:

- `templates/operator-anomaly-log.md`
- `templates/failure-recovery-log.md`

## 10. Output package per cycle

Each cycle should leave behind:

- one completed setup row
- completed checklists
- anomaly and recovery logs if needed
- retained exports
- retained telemetry and audit traces
- captured participant feedback
- links to any follow-up interview notes
