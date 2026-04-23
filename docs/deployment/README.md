# ACP Release And Deployment Notes

This document captures the minimum release and deployment discipline for the first serious ACP implementation, following:

- `docs/specs/ACP_RELEASE_DEPLOYMENT_SPEC.md`
- `docs/specs/ACP_AGENT_EXECUTION_CONTRACT.md`

Supporting operational materials live in:

- `docs/deployment/checklists/pilot-release-smoke-checklist.md`
- `docs/pilot/`
- `docs/evaluation/`

## Release gate

A change is release-ready only when it passes the repo verification gate:

- `npm run build`
- `npm run typecheck`
- `npm test`

The same gate is enforced in GitHub Actions by `.github/workflows/ci.yml`.

## Runtime assumptions

Relay is the first implementation of ACP. The current runtime assumptions are:

- Node.js with `npm`
- writable local data directory for persisted cycle artifacts
- static assets served from `public/`
- process startup from the repository root

## Environment variables

The current runtime contract is:

- `ACP_HOST`: server bind host, defaults to `127.0.0.1`
- `ACP_PORT`: server port, defaults to `4317`
- `ACP_DATA_DIR`: writable data directory, defaults to `.acp-data` in the repo root

## Local start commands

For development:

```sh
npm install
npm run dev
```

For a verification run without watch mode:

```sh
npm run build
npm run start:dist
```

## Environment model

The current implementation should be treated as supporting three modes:

- local development
- staging or demo environment with reproducible setup
- pilot environment with retained cycle artifacts and export outputs

## Data retention and rollback expectations

The first implementation uses file-backed persistence under `ACP_DATA_DIR`.

Operational expectations:

- do not delete cycle artifacts as part of ordinary deploys
- preserve the data directory independently from application code where practical
- allow application rollback without rewriting stored cycle data
- retain exported artifacts long enough for pilot inspection and replay

## Deployment checklist

Before using a build for a demo or pilot:

1. Run the release gate locally or confirm CI passed on the exact commit.
2. Confirm `ACP_DATA_DIR` points to a writable location with retained storage.
3. Confirm the server starts from the repository root with expected `ACP_HOST` and `ACP_PORT`.
4. Confirm the deploy target preserves `.acp-data` or the configured data directory across restarts where required.
5. Run the checklist in `docs/deployment/checklists/pilot-release-smoke-checklist.md`.

## Scope note

This scaffold intentionally documents the minimum serious-use path.
Cloud topology, secrets management, and multi-instance deployment can be specified later without changing ACP semantics.
