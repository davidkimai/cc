import { mkdirSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const dataDir = process.env.ACP_DATA_DIR
  ? path.resolve(process.env.ACP_DATA_DIR)
  : path.join(repoRoot, '.acp-data');
const publicDir = path.join(repoRoot, 'public');

mkdirSync(dataDir, { recursive: true });
mkdirSync(path.join(dataDir, 'cycles'), { recursive: true });

export const config = {
  repoRoot,
  dataDir,
  publicDir,
  host: process.env.ACP_HOST ?? '127.0.0.1',
  port: Number(process.env.ACP_PORT ?? 4317),
  storeMode: process.env.ACP_STORE ?? 'file',
  sqlitePath: process.env.ACP_SQLITE_PATH ? path.resolve(process.env.ACP_SQLITE_PATH) : path.join(dataDir, 'acp.sqlite'),
  authMode: process.env.ACP_AUTH_MODE ?? 'development',
  authSecret: process.env.ACP_AUTH_SECRET ?? 'acp-local-dev-secret',
  sessionTtlSeconds: process.env.ACP_SESSION_TTL_SECONDS ? Number(process.env.ACP_SESSION_TTL_SECONDS) : undefined,
  workspaceId: process.env.ACP_WORKSPACE_ID ?? 'local-workspace',
} as const;
