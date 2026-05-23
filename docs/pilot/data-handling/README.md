# ACP Pilot Data Handling

This directory translates the pilot data-handling spec into operator-facing materials.

## What lives here

- `export-capture-checklist.md`: what to verify before and after export capture
- `missingness-log-template.md`: a lightweight log for incomplete or absent data
- `artifact-retention-policy.md`: when raw pilot artifacts may be kept or pruned
- `operator-handoff.md`: what the operator passes to the next owner after a cycle

## Workflow

1. Close the cycle phase in Relay.
2. Capture the export bundle with `scripts/pilot/pilot-data-handling.mjs capture-export`.
3. Log any missingness with `scripts/pilot/pilot-data-handling.mjs log-missingness`.
4. Generate the handoff packet with `scripts/pilot/pilot-data-handling.mjs build-handoff`.
5. Apply retention only after handoff and analysis signoff with `scripts/pilot/pilot-data-handling.mjs apply-retention`.

## Folder contract

Each cycle should resolve to:

- `cycle-manifest.json`
- `exports/<timestamp>/...`
- `missingness.jsonl`
- `handoff.md`

The raw export bundle stays immutable. Any derived analysis output belongs outside the pilot raw artifact tree.

