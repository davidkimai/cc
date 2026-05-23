---
name: participant-web-operator
description: Use this skill to operate and QA the Relay web app for participant submission, digest reading, baseline thread reading, response flow, and operator review.
category: surface-workflow
maturity: S3
---

# What this skill is for

Use this skill when ACP must be verified through the rendered Relay web surface rather than only CLI or API outputs.

# When to use it

- Participant submission workflow QA.
- Digest or baseline thread reading workflow QA.
- Operator UI inspection of Engine V2 issue maps, critics, and release state.
- Browser/server mismatch investigation.

# When not to use it

- Do not use it for protocol logic that can be checked directly through CLI or schema.
- Do not use it to bypass server lifecycle transitions.
- Do not use it when no web surface is involved.

# Inputs expected

- Local app URL
- Cycle id when targeting a specific workflow
- Participant id when inspecting participant views
- Expected server-side state

# Preflight / prerequisites

1. Confirm server readiness.
2. Run `scripts/surface-preflight.mjs --base-url <url>` when state is uncertain.
3. Know whether the task is observation-only or action-authorized.
4. Keep screenshots or notes tied to the cycle id.

# Workflow

1. Inspect server readiness and participant view payloads.
2. Open the app in the browser.
3. Execute the specific participant or operator path.
4. Compare rendered state against server contract.
5. Report any mismatch with URL, cycle id, participant id, and expected server state.

# Decision rules / judgment criteria

- Server contract beats visual assumption.
- UI polish is not success if lifecycle state is wrong.
- Do not submit participant content unless the user asked for that action.
- A browser-only observation is not enough for claim-bearing evidence.

# Escalation rules

Escalate when the browser and API disagree, when a participant can see the wrong condition surface, or when a UI path permits lifecycle bypass.

# Available scripts

- `scripts/surface-preflight.mjs --base-url <url> [--cycle-id <id>] [--participant-id <id>]`

# Outputs

- Readiness snapshot
- Browser workflow observations
- Server/browser mismatch report
- Operator QA notes

# Failure handling

If the browser surface fails but the server is healthy, preserve both observations. If the server contract fails, stop browser QA and fix the backend surface first.

# Trust / safety notes

Participant-facing UI can alter trust in ACP. Treat condition leakage, stale digests, and misleading status labels as serious review findings.

# Composition notes

Use in `surface-preflight`, `pilot-cycle-review`, and Foresight demo rehearsals.

# Examples to inspect next

Read `examples/casebook.md` for happy path, failure path, ambiguity, and anti-pattern examples.

# Evaluation hooks

Run `scripts/surface-preflight.mjs` and `npm run skills:audit`.
