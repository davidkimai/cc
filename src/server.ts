import { buildApp } from './api/app.js';
import { config } from './core/config.js';

const app = await buildApp({ dataDir: config.dataDir });

app.listen({ host: config.host, port: config.port }).then(() => {
  console.log(`acp server listening on http://${config.host}:${config.port}`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
