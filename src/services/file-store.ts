import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { cycleRecordSchema, type CycleRecord } from '../core/types.js';
import type { ArtifactIndexEntry, CycleStore, WorkspaceBackup } from './store.js';

function sortByUpdatedAt(a: CycleRecord, b: CycleRecord): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

function isCycleRecord(value: CycleRecord | null): value is CycleRecord {
  return value !== null;
}

export class FileStore implements CycleStore {
  private readonly legacyCyclesDir: string;
  private readonly workspacesDir: string;
  private readonly artifactsDir: string;

  constructor(baseDir = path.resolve(process.cwd(), '.acp-data')) {
    this.legacyCyclesDir = path.join(baseDir, 'cycles');
    this.workspacesDir = path.join(baseDir, 'workspaces');
    this.artifactsDir = path.join(baseDir, 'artifacts');
  }

  async ensure(): Promise<void> {
    await mkdir(this.legacyCyclesDir, { recursive: true });
    await mkdir(this.workspacesDir, { recursive: true });
    await mkdir(path.join(this.artifactsDir, 'reports'), { recursive: true });
    await mkdir(path.join(this.artifactsDir, 'evidence'), { recursive: true });
  }

  async listCycles(workspaceId?: string): Promise<CycleRecord[]> {
    await this.ensure();
    const records = workspaceId
      ? await this.listWorkspaceCycles(workspaceId)
      : await this.listAllWorkspaceCycles();
    return records.filter(isCycleRecord).sort(sortByUpdatedAt);
  }

  async getCycle(cycleId: string, workspaceId?: string): Promise<CycleRecord | null> {
    await this.ensure();
    const filePath = workspaceId ? this.workspaceCyclePath(workspaceId, cycleId) : await this.findWorkspaceCyclePath(cycleId);
    const legacyPath = path.join(this.legacyCyclesDir, `${cycleId}.json`);
    try {
      const payload = await readFile(filePath, 'utf8');
      return cycleRecordSchema.parse(JSON.parse(payload));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        try {
          const payload = await readFile(legacyPath, 'utf8');
          const cycle = cycleRecordSchema.parse(JSON.parse(payload));
          if (workspaceId && cycle.workspaceId !== workspaceId) return null;
          return cycle;
        } catch (legacyError) {
          if ((legacyError as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
          }
          throw legacyError;
        }
      }
      throw error;
    }
  }

  async saveCycle(cycle: CycleRecord): Promise<CycleRecord> {
    await this.ensure();
    const filePath = this.workspaceCyclePath(cycle.workspaceId, cycle.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(cycle, null, 2), 'utf8');
    await rename(tempPath, filePath);
    return cycle;
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
    const workspaceId = backup.workspaceId;
    for (const cycle of backup.cycles) {
      await this.saveCycle({ ...cycle, workspaceId });
    }
    return this.exportWorkspace(workspaceId);
  }

  private workspaceCyclePath(workspaceId: string, cycleId: string): string {
    return path.join(this.workspacesDir, workspaceId, 'cycles', `${cycleId}.json`);
  }

  private async listWorkspaceCycles(workspaceId: string): Promise<CycleRecord[]> {
    const dir = path.join(this.workspacesDir, workspaceId, 'cycles');
    const workspaceRecords = await this.readCyclesFromDir(dir);
    const legacyRecords = await this.readCyclesFromDir(this.legacyCyclesDir);
    return [...workspaceRecords, ...legacyRecords.filter((cycle) => cycle.workspaceId === workspaceId && !workspaceRecords.some((record) => record.id === cycle.id))];
  }

  private async listAllWorkspaceCycles(): Promise<CycleRecord[]> {
    const workspaces = await this.safeReaddir(this.workspacesDir);
    const workspaceRecords = (
      await Promise.all(
        workspaces
          .filter((entry) => entry.isDirectory())
          .map((entry) => this.readCyclesFromDir(path.join(this.workspacesDir, entry.name, 'cycles'))),
      )
    ).flat();
    const legacyRecords = await this.readCyclesFromDir(this.legacyCyclesDir);
    return [...workspaceRecords, ...legacyRecords.filter((cycle) => !workspaceRecords.some((record) => record.id === cycle.id))];
  }

  private async readCyclesFromDir(dir: string): Promise<CycleRecord[]> {
    const entries = await this.safeReaddir(dir);
    const records = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map(async (entry) => {
          const payload = await readFile(path.join(dir, entry.name), 'utf8');
          return cycleRecordSchema.parse(JSON.parse(payload));
        }),
    );
    return records;
  }

  private async findWorkspaceCyclePath(cycleId: string): Promise<string> {
    const workspaces = await this.safeReaddir(this.workspacesDir);
    for (const workspace of workspaces.filter((entry) => entry.isDirectory())) {
      const candidate = this.workspaceCyclePath(workspace.name, cycleId);
      try {
        await readFile(candidate, 'utf8');
        return candidate;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
    return path.join(this.legacyCyclesDir, `${cycleId}.json`);
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

  private async safeReaddir(dir: string) {
    try {
      return await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
