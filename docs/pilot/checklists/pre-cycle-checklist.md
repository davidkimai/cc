# Pre-Cycle Checklist

Complete this before opening any cycle.

## Cycle identity

- [ ] Cycle id assigned and recorded
- [ ] Condition confirmed as `intervention` or `baseline_thread`
- [ ] Prompt text finalized and copied into the setup sheet
- [ ] Planned open and close times recorded

## Participant readiness

- [ ] Participant roster finalized
- [ ] Stable participant ids prepared
- [ ] Expected attendance assumptions recorded
- [ ] Fallback communication path prepared

## Runtime and release readiness

- [ ] Current commit passed `build`, `typecheck`, and `test`
- [ ] `ACP_HOST` and `ACP_PORT` confirmed for the run target
- [ ] `ACP_DATA_DIR` points to writable retained storage
- [ ] Relay starts cleanly in the intended environment

## Condition-specific readiness

### Intervention

- [ ] Load settings reviewed
- [ ] Operator knows the routing and release path
- [ ] Explanation behavior expectations reviewed

### Baseline Thread

- [ ] Baseline prompt comparability checked
- [ ] No intervention-only assumptions are present in the cycle plan

## Documentation readiness

- [ ] Setup sheet row completed
- [ ] Anomaly log ready
- [ ] Failure recovery log ready
- [ ] Participant communications draft prepared

## Gate

Do not open submissions until every required item is complete or an explicit risk is recorded.
