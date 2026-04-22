import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { cycleRecordSchema, type CycleRecord } from '../core/types.js';

function sortByUpdatedAt(a: CycleRecord, b: CycleRecord): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

function isCycleRecord(value: CycleRecord | null): value is CycleRecord {
  return value !== null;
}

export class FileStore {
  private readonly cyclesDir: string;

  constructor(baseDir = path.resolve(process.cwd(), '.acp-data')) {
    this.cyclesDir = path.join(baseDir, 'cycles');
  }

  async ensure(): Promise<void> {
    await mkdir(this.cyclesDir, { recursive: true });
  }

  async listCycles(): Promise<CycleRecord[]> {
    await this.ensure();
    const entries = await readdir(this.cyclesDir, { withFileTypes: true });
    const records = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => this.getCycle(entry.name.replace(/\.json$/, ''))),
    );
    return records.filter(isCycleRecord).sort(sortByUpdatedAt);
  }

  async getCycle(cycleId: string): Promise<CycleRecord | null> {
    await this.ensure();
    const filePath = path.join(this.cyclesDir, `${cycleId}.json`);
    try {
      const payload = await readFile(filePath, 'utf8');
      return cycleRecordSchema.parse(JSON.parse(payload));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async saveCycle(cycle: CycleRecord): Promise<CycleRecord> {
    await this.ensure();
    const filePath = path.join(this.cyclesDir, `${cycle.id}.json`);
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(cycle, null, 2), 'utf8');
    await rename(tempPath, filePath);
    return cycle;
  }
}
