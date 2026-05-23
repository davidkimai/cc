import { buildApp } from './api/app.js';
import { config } from './core/config.js';

const app = await buildApp({
  dataDir: config.dataDir,
  storeMode: config.storeMode,
  sqlitePath: config.sqlitePath,
  security: {
    mode: config.authMode,
    authSecret: config.authSecret,
    sessionTtlSeconds: config.sessionTtlSeconds,
    defaultWorkspaceId: config.workspaceId,
  },
} as Parameters<typeof buildApp>[0] & {
  security: {
    mode: string;
    authSecret: string;
    sessionTtlSeconds: number | undefined;
    defaultWorkspaceId: string;
  };
});

app.listen({ host: config.host, port: config.port }).then(() => {
  console.log(`acp server listening on http://${config.host}:${config.port}`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
