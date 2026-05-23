# surface-preflight

This composition packages practical preflight checks before Relay browser work.

It combines:

- `participant-web-operator`
- `research-cli-operator`

## Workflow

1. Check local release smoke when no live URL is supplied.
2. For live URLs, fetch `/health`, `/ready`, and `/v1/session`.
3. Optionally fetch participant view payload for a cycle and participant.
4. Write `preflight.json`.

## Command

```sh
bash skills/compositions/surface-preflight/run.sh [base-url] [cycle-id] [participant-id] [out-dir]
```

Defaults:

- `base-url`: required only for live server preflight
- `out-dir`: `skills/compositions/surface-preflight/out`

## Outputs

- `preflight.json`
- optional `health.json`
- optional `ready.json`
- optional `session.json`
- optional participant view payload

## Failure handling

Stop on failed readiness calls. If browser behavior disagrees with this preflight, treat it as a server/browser mismatch.

## Evaluation hooks

- Run with no arguments for release-smoke-backed local preflight.
- Run `npm run skills:audit` to verify packaging.
