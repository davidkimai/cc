import type { CycleRecord } from '../core/types.js';

export interface ArtifactIndexEntry {
  cycleId: string;
  artifactId: string;
  mode: string;
  createdAt: string;
}

export interface WorkspaceBackup {
  workspaceId: string;
  generatedAt: string;
  cycles: CycleRecord[];
  artifactIndex: ArtifactIndexEntry[];
}

export interface CycleStore {
  listCycles(workspaceId?: string): Promise<CycleRecord[]>;
  getCycle(cycleId: string, workspaceId?: string): Promise<CycleRecord | null>;
  saveCycle(cycle: CycleRecord): Promise<CycleRecord>;
  exportWorkspace(workspaceId: string): Promise<WorkspaceBackup>;
  importWorkspace(backup: WorkspaceBackup): Promise<WorkspaceBackup>;
}
