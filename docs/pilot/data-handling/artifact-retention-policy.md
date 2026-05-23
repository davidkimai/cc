# Artifact Retention Policy

This policy keeps ACP pilot artifacts usable without creating accidental data loss.

## Retain by default

Keep the following for every pilot cycle until pilot analysis signoff:

- `cycle-manifest.json`
- raw export bundles under `exports/`
- `missingness.jsonl`
- `handoff.md`
- any explicit anomaly or recovery notes for the cycle

## Prune only when all of these are true

- the handoff packet exists
- the analysis owner has acknowledged the cycle bundle
- no unresolved missingness remains
- no hold flag exists for the cycle

## What must never be deleted in place

- raw source exports before they are copied into the cycle bundle
- a cycle bundle that still explains missingness or partial capture
- the latest handoff packet for a cycle under active review

## Hold markers

Treat the cycle as protected if any of these exist:

- `hold.lock`
- `retain.lock`
- `retain=true` in `cycle-manifest.json`

## Recommended retention workflow

1. Run a dry run first.
2. Confirm the cycle list with the analysis owner.
3. Apply retention only to closed cycles.
4. Keep at least one canonical export snapshot for each retained cycle.

