import path from 'node:path';

import { FileStore } from './file-store.js';
import { SQLiteStore } from './sqlite-store.js';
import type { CycleStore } from './store.js';

export type CycleStoreMode = 'file' | 'sqlite';

export interface CycleStoreFactoryConfig {
  mode?: string;
  dataDir?: string;
  sqlitePath?: string;
}

export function createCycleStore(config: CycleStoreFactoryConfig = {}): CycleStore {
  const dataDir = config.dataDir ?? path.resolve(process.cwd(), '.acp-data');
  const mode = (config.mode ?? 'file') as CycleStoreMode;
  if (mode === 'file') {
    return new FileStore(dataDir);
  }
  if (mode === 'sqlite') {
    return new SQLiteStore(config.sqlitePath ?? path.join(dataDir, 'acp.sqlite'), {
      legacyDataDir: dataDir,
      importLegacyOnOpen: true,
    });
  }
  throw new Error(`Unsupported ACP store mode: ${mode}`);
}
