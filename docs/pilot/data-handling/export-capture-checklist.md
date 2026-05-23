# Export Capture Checklist

Use this checklist after closing a cycle phase in Relay.

## Before capture

- confirm the cycle id
- confirm the export source path
- confirm the cycle is closed enough to capture
- confirm the raw export should be preserved as-is

## Capture steps

1. Copy the raw export into the cycle directory.
2. Record the capture time.
3. Record the file list and checksums.
4. Save the cycle manifest update.

Example:

```bash
node scripts/pilot/pilot-data-handling.mjs capture-export \
  --cycle-id CYCLE_001 \
  --source /path/to/relay/export \
  --label relay
```

## After capture

- open the export bundle and confirm it is readable
- log any missing or partial files immediately
- include the bundle path in the handoff packet

