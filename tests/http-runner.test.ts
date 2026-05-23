import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildApp } from '../src/api/app.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);

async function runScenario(exampleName: string) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-http-data-'));
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-http-out-'));
  const app = await buildApp({ dataDir });
  const address = await app.listen({ port: 0, host: '127.0.0.1' });

  try {
    const scenarioPath = path.join('runners', 'http-client', 'examples', exampleName);
    await execFileAsync('node', [path.join('scripts', 'http-client', 'run-http-scenario.mjs'), scenarioPath, '--base-url', address, '--out', outDir], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return { outDir, app, dataDir };
  } catch (error) {
    await app.close();
    await rm(outDir, { recursive: true, force: true });
    await rm(dataDir, { recursive: true, force: true });
    throw error;
  }
}

describe('ACP HTTP external consumer runner', () => {
  it('executes an intervention scenario through the public API', async () => {
    const { outDir, app, dataDir } = await runScenario('intervention.json');
    const cycle = JSON.parse(await readFile(path.join(outDir, 'cycle.json'), 'utf8'));
    const manifest = JSON.parse(await readFile(path.join(outDir, 'run-manifest.json'), 'utf8'));
    const views = JSON.parse(await readFile(path.join(outDir, 'participant-views.json'), 'utf8'));

    expect(cycle.condition).toBe('intervention');
    expect(cycle.routingDecisions.length).toBeGreaterThan(0);
    expect(cycle.digests.length).toBeGreaterThan(0);
    expect(views.length).toBeGreaterThan(0);
    expect(manifest.baseUrl).toContain('127.0.0.1');

    await app.close();
    await rm(outDir, { recursive: true, force: true });
    await rm(dataDir, { recursive: true, force: true });
  });

  it('executes a baseline scenario through the public API', async () => {
    const { outDir, app, dataDir } = await runScenario('baseline.json');
    const cycle = JSON.parse(await readFile(path.join(outDir, 'cycle.json'), 'utf8'));
    const report = JSON.parse(await readFile(path.join(outDir, 'conformance-report.json'), 'utf8'));

    expect(cycle.condition).toBe('baseline_thread');
    expect(cycle.routingDecisions.length).toBe(0);
    expect(cycle.digests.length).toBe(0);
    expect(report.result).toBe('pass');

    await app.close();
    await rm(outDir, { recursive: true, force: true });
    await rm(dataDir, { recursive: true, force: true });
  });
});
