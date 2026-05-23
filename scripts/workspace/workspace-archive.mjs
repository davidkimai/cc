import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCycleStore } from '../../dist/src/services/store-factory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token.startsWith('--')) {
      flags[token.slice(2)] = rest[i + 1];
      i += 1;
    }
  }
  return { command, flags };
}

function usage() {
  return [
    'Usage:',
    '  npm run workspace:export -- --workspace local-workspace --out <dir>',
    '  npm run workspace:import -- --file <workspace-backup.json>',
  ].join('\n');
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const dataDir = process.env.ACP_DATA_DIR ? path.resolve(process.env.ACP_DATA_DIR) : path.join(repoRoot, '.acp-data');
  const store = createCycleStore({
    mode: process.env.ACP_STORE ?? 'file',
    dataDir,
    sqlitePath: process.env.ACP_SQLITE_PATH ? path.resolve(process.env.ACP_SQLITE_PATH) : undefined,
  });

  if (command === 'export') {
    const workspaceId = flags.workspace || 'local-workspace';
    if (!flags.out) throw new Error(`Missing --out.\n${usage()}`);
    const outDir = path.resolve(flags.out);
    await mkdir(outDir, { recursive: true });
    const backup = await store.exportWorkspace(workspaceId);
    const filePath = path.join(outDir, 'workspace-backup.json');
    await writeFile(filePath, JSON.stringify(backup, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: true, workspaceId, filePath, cycleCount: backup.cycles.length }, null, 2));
    return;
  }

  if (command === 'import') {
    if (!flags.file) throw new Error(`Missing --file.\n${usage()}`);
    const filePath = path.resolve(flags.file);
    const backup = JSON.parse(await readFile(filePath, 'utf8'));
    const imported = await store.importWorkspace(backup);
    console.log(JSON.stringify({ ok: true, workspaceId: imported.workspaceId, cycleCount: imported.cycles.length }, null, 2));
    return;
  }

  throw new Error(usage());
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
