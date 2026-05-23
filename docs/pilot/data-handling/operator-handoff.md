# Operator Handoff

Use this after the cycle export is captured and the missingness log is current.

## Handoff contents

- cycle id
- condition
- export bundle path
- cycle manifest path
- missingness log path
- hold or retention status
- analysis owner
- next action required

## Handoff checklist

1. Capture the export bundle.
2. Log any missingness or partial capture.
3. Build the handoff packet.
4. Confirm the raw artifact tree is read-only from the operator perspective.
5. Send the handoff to the next owner with the cycle links.

## Example command

```bash
node scripts/pilot/pilot-data-handling.mjs build-handoff \
  --cycle-id CYCLE_001 \
  --operator "operator-name" \
  --analysis-owner "analysis-owner"
```

## Handoff rule

If the handoff cannot be completed, do not prune the cycle. Mark the cycle as still open for review.

