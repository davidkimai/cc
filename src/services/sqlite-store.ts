import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { cycleRecordSchema, type CycleRecord } from '../core/types.js';
import { FileStore } from './file-store.js';
import type { ArtifactIndexEntry, CycleStore, WorkspaceBackup } from './store.js';

interface SQLiteCycleRow {
  payload: string;
}

export interface SQLiteStoreOptions {
  legacyDataDir?: string;
  importLegacyOnOpen?: boolean;
}

function sortByUpdatedAt(a: CycleRecord, b: CycleRecord): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export class SQLiteStore implements CycleStore {
  private readonly db: DatabaseSync;
  private readonly legacyDataDir?: string;
  private readonly importLegacyOnOpen: boolean;
  private initialized = false;
  private legacyImported = false;

  constructor(dbPath = path.resolve(process.cwd(), '.acp-data', 'acp.sqlite'), options: SQLiteStoreOptions = {}) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.legacyDataDir = options.legacyDataDir;
    this.importLegacyOnOpen = options.importLegacyOnOpen ?? Boolean(options.legacyDataDir);
  }

  async listCycles(workspaceId?: string): Promise<CycleRecord[]> {
    await this.ensure();
    const rows = workspaceId
      ? this.db.prepare('SELECT payload FROM cycles WHERE workspace_id = ? ORDER BY updated_at DESC').all(workspaceId)
      : this.db.prepare('SELECT payload FROM cycles ORDER BY updated_at DESC').all();
    return rows.map((row) => this.parseRow(row as unknown as SQLiteCycleRow)).sort(sortByUpdatedAt);
  }

  async getCycle(cycleId: string, workspaceId?: string): Promise<CycleRecord | null> {
    await this.ensure();
    const row = workspaceId
      ? this.db.prepare('SELECT payload FROM cycles WHERE cycle_id = ? AND workspace_id = ?').get(cycleId, workspaceId)
      : this.db.prepare('SELECT payload FROM cycles WHERE cycle_id = ? ORDER BY updated_at DESC LIMIT 1').get(cycleId);
    return row ? this.parseRow(row as unknown as SQLiteCycleRow) : null;
  }

  async saveCycle(cycle: CycleRecord): Promise<CycleRecord> {
    await this.ensure();
    return this.upsertCycle(cycle);
  }

  async exportWorkspace(workspaceId: string): Promise<WorkspaceBackup> {
    const cycles = await this.listCycles(workspaceId);
    return {
      workspaceId,
      generatedAt: new Date().toISOString(),
      cycles,
      artifactIndex: this.artifactIndex(cycles),
    };
  }

  async importWorkspace(backup: WorkspaceBackup): Promise<WorkspaceBackup> {
    await this.ensure();
    for (const cycle of backup.cycles) {
      this.upsertCycle({ ...cycle, workspaceId: backup.workspaceId });
    }
    return this.exportWorkspace(backup.workspaceId);
  }

  close(): void {
    this.db.close();
  }

  private async ensure(): Promise<void> {
    if (!this.initialized) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS cycles (
          workspace_id TEXT NOT NULL,
          cycle_id TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          payload TEXT NOT NULL,
          PRIMARY KEY (workspace_id, cycle_id)
        );
        CREATE INDEX IF NOT EXISTS idx_cycles_cycle_id ON cycles (cycle_id);
        CREATE INDEX IF NOT EXISTS idx_cycles_workspace_updated ON cycles (workspace_id, updated_at);
      `);
      this.initialized = true;
    }
    if (this.importLegacyOnOpen && this.legacyDataDir && !this.legacyImported) {
      this.legacyImported = true;
      const legacyStore = new FileStore(this.legacyDataDir);
      for (const cycle of await legacyStore.listCycles()) {
        if (!this.getCycleWithoutEnsure(cycle.id, cycle.workspaceId)) {
          this.upsertCycle(cycle);
        }
      }
    }
  }

  private getCycleWithoutEnsure(cycleId: string, workspaceId: string): CycleRecord | null {
    const row = this.db.prepare('SELECT payload FROM cycles WHERE cycle_id = ? AND workspace_id = ?').get(cycleId, workspaceId);
    return row ? this.parseRow(row as unknown as SQLiteCycleRow) : null;
  }

  private upsertCycle(cycle: CycleRecord): CycleRecord {
    const parsed = cycleRecordSchema.parse(cycle);
    this.db.prepare(`
      INSERT INTO cycles (workspace_id, cycle_id, updated_at, payload)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(workspace_id, cycle_id)
      DO UPDATE SET updated_at = excluded.updated_at, payload = excluded.payload
    `).run(parsed.workspaceId, parsed.id, parsed.updatedAt, JSON.stringify(parsed));
    return parsed;
  }

  private parseRow(row: SQLiteCycleRow): CycleRecord {
    return cycleRecordSchema.parse(JSON.parse(row.payload));
  }

  private artifactIndex(cycles: CycleRecord[]): ArtifactIndexEntry[] {
    return cycles.flatMap((cycle) =>
      cycle.exports.map((artifact) => ({
        cycleId: cycle.id,
        artifactId: artifact.id,
        mode: artifact.mode,
        createdAt: artifact.createdAt,
      })),
    );
  }
}
