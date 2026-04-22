---
name: participant-web-operator
description: Use this skill when you need to operate the Relay web app, the first ACP implementation, for participant submission, digest reading, baseline thread reading, response flow, or operator UI QA.
---

# When to use this skill

Use this skill for browser-driven workflow execution against the Relay web surface.

# When not to use this skill

Do not use this skill for protocol logic that can be executed directly through the CLI or API.

# Inputs expected

- local app URL
- cycle id
- participant id or operator intent

# Steps

1. Open the app and select participant or operator mode.
2. Navigate to the target cycle.
3. Execute the intended workflow without bypassing server-side transitions.
4. Verify the UI matches the current cycle state and condition.

# Outputs

- executed browser workflow
- participant or operator UI observations

# Failure handling

If the browser surface disagrees with the server state, trust the server contract and report the mismatch.
