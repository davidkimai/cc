# ACP Storage Evolution Decision

Status: frozen Phase 0 decision  
Decision: SQLite-first production alpha with explicit Postgres migration path  
Date: 2026-05-20

## 1. Decision

Relay will use this storage evolution path:

1. file-backed store remains the compatibility and local-reference baseline
2. SQLite becomes the production-alpha canonical store for small institutional pilots
3. Postgres remains the later multi-instance / hosted production target

This avoids two bad outcomes:

- treating local JSON files as production infrastructure
- forcing Postgres operational complexity before the institutional-alpha product is ready

## 2. Production-Alpha Meaning

For this program, production means:

- institutional production alpha
- small trusted groups
- retained audit and evidence artifacts
- workspace-scoped operation
- predictable backup / export / restore

It does not mean:

- consumer-scale social platform infrastructure
- public social graph support
- open-ended chat hosting
- multi-region or high-volume deployment

## 3. Implementation Boundary

The storage boundary is `CycleStore`.

Current implementations:

- `FileStore`: reference and backward-compatible local file persistence
- `SQLiteStore`: production-alpha database-backed store

Configuration:

- `ACP_STORE=file` uses `FileStore`
- `ACP_STORE=sqlite` uses `SQLiteStore`
- `ACP_SQLITE_PATH` optionally overrides the SQLite database path

When SQLite starts with a legacy `ACP_DATA_DIR`, it imports existing file-backed cycles into the database without changing ACP object meaning.

## 4. Postgres Migration Path

The SQLite table model intentionally stores:

- `workspace_id`
- `cycle_id`
- `updated_at`
- canonical cycle JSON payload

That gives a conservative migration path to Postgres:

- preserve the same workspace/cycle primary key
- move JSON payloads to `jsonb`
- add projected indexes for audit, telemetry, export, and metric queries as load requires
- keep ACP conformance checks independent of the database engine

## 5. Acceptance Criteria

This decision is implemented when:

- Relay can start with `ACP_STORE=sqlite`
- SQLite import preserves existing `.acp-data` cycles
- workspace-scoped list/get/export/import behavior matches the file store
- backup/export scripts respect the selected store mode
- the release smoke path remains green with the default file store
