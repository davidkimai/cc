# Pilot Release Smoke Checklist

Use this after deploy and before running a real ACP cycle.

## Build and runtime

- [ ] Exact commit passed CI or local release gate
- [ ] Server starts with intended `ACP_HOST`, `ACP_PORT`, and `ACP_DATA_DIR`
- [ ] Data directory is writable and retained
- [ ] Static assets load in the intended environment

## Core operator flow

- [ ] Health endpoint responds
- [ ] Operator can create a cycle
- [ ] Operator can open submissions
- [ ] Operator can close submissions
- [ ] Operator can inspect routing outputs
- [ ] Operator can release results
- [ ] Operator can export cycle artifacts

## Participant flow

- [ ] Participant can reach the intended cycle view
- [ ] Participant can submit a contribution
- [ ] Participant can view released material for the relevant condition
- [ ] Participant can submit feedback

## Data and replay

- [ ] Cycle data persists after restart if expected for the environment
- [ ] Export artifacts land in the expected location
- [ ] Retained artifacts are sufficient for replay and inspection

## Gate

Do not run a fellowship pilot cycle until every required item passes or an explicit exception is recorded.
