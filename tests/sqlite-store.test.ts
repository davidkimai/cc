import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { defaultDeliberativeCriteria, type CycleRecord } from '../src/core/types.js';
import { SQLiteStore } from '../src/services/sqlite-store.js';

const dirs: string[] = [];

function cycle(id: string, workspaceId: string): CycleRecord {
  return {
    id,
    workspaceId,
    title: `SQLite ${id}`,
    prompt: 'What should persist in the production-alpha store?',
    condition: 'baseline_thread',
    status: 'draft',
    createdAt: '2026-05-20T00:00:00.000Z',
    updatedAt: `2026-05-20T00:00:0${id.endsWith('b') ? 2 : 1}.000Z`,
    schedule: {},
    config: { maxDigestItems: 4, maxBridgeItems: 1, deliberativeCriteria: defaultDeliberativeCriteria },
    participants: [
      { id: 'p1', name: 'Avery', role: 'participant' },
      { id: 'p2', name: 'Mina', role: 'participant' },
    ],
    contributions: [],
    routingDecisions: [],
    digests: [],
    responses: [],
    feedback: [],
    telemetryEvents: [],
    auditEvents: [],
    exports: [],
  };
}

afterEach(async () => {
  while (dirs.length) {
    const dir = dirs.pop();
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

describe('SQLiteStore', () => {
  it('stores canonical cycles by workspace and round-trips workspace backups', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'acp-sqlite-store-'));
    dirs.push(dir);
    const store = new SQLiteStore(path.join(dir, 'acp.sqlite'), { importLegacyOnOpen: false });

    await store.saveCycle(cycle('cycle_a', 'workspace_a'));
    await store.saveCycle(cycle('cycle_b', 'workspace_b'));

    expect((await store.listCycles('workspace_a')).map((item) => item.id)).toEqual(['cycle_a']);
    expect(await store.getCycle('cycle_a', 'workspace_b')).toBeNull();

    const backup = await store.exportWorkspace('workspace_a');
    expect(backup.cycles).toHaveLength(1);
    expect(backup.cycles[0].workspaceId).toBe('workspace_a');
    store.close();

    const importDir = await mkdtemp(path.join(os.tmpdir(), 'acp-sqlite-import-'));
    dirs.push(importDir);
    const target = new SQLiteStore(path.join(importDir, 'acp.sqlite'), { importLegacyOnOpen: false });
    await target.importWorkspace(backup);
    expect((await target.listCycles('workspace_a')).map((item) => item.id)).toEqual(['cycle_a']);
    target.close();
  });

  it('imports legacy file-store cycles from .acp-data on first open', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'acp-sqlite-legacy-'));
    dirs.push(dir);
    const legacyDir = path.join(dir, 'cycles');
    await mkdir(legacyDir, { recursive: true });
    const legacyCycle = cycle('cycle_legacy', 'workspace_legacy');
    await writeFile(path.join(legacyDir, 'cycle_legacy.json'), JSON.stringify(legacyCycle, null, 2), 'utf8');

    const store = new SQLiteStore(path.join(dir, 'acp.sqlite'), { legacyDataDir: dir });
    expect((await store.listCycles('workspace_legacy')).map((item) => item.id)).toEqual(['cycle_legacy']);
    await store.saveCycle({ ...legacyCycle, title: 'Updated in SQLite' });
    expect((await store.getCycle('cycle_legacy', 'workspace_legacy'))?.title).toBe('Updated in SQLite');
    store.close();
  });
});
