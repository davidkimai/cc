import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { readFile, rm, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { buildApp } from '../src/api/app.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);

async function runStarter(args: string[]) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-adopter-data-'));
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-adopter-out-'));
  const app = await buildApp({ dataDir });
  const address = await app.listen({ port: 0, host: '127.0.0.1' });

  try {
    const { stdout } = await execFileAsync(
      'npm',
      ['run', 'adopter:starter', '--', '--base-url', address, '--out', outDir, ...args],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );
    return { stdout, outDir, app, dataDir };
  } catch (error) {
    await app.close();
    await rm(outDir, { recursive: true, force: true });
    await rm(dataDir, { recursive: true, force: true });
    throw error;
  }
}

describe('TypeScript HTTP adopter starter', () => {
  it('runs an intervention scenario through the public API only', async () => {
    const { stdout, outDir, app, dataDir } = await runStarter([]);

    try {
      const result = JSON.parse(stdout.slice(stdout.indexOf('{')));
      const cycle = JSON.parse(await readFile(path.join(outDir, 'cycle.json'), 'utf8'));
      const evidence = JSON.parse(await readFile(path.join(outDir, 'evidence-index.json'), 'utf8'));
      const conformance = JSON.parse(await readFile(path.join(outDir, 'conformance-report.json'), 'utf8'));

      expect(result.status).toBe('pass');
      expect(cycle.condition).toBe('intervention');
      expect(cycle.routingDecisions.length).toBeGreaterThan(0);
      expect(evidence.generatedBy).toBe('@acp/typescript-http-starter');
      expect(evidence.protocol.manifest).toContain('protocol/acp-bundle.manifest.json');
      expect(evidence.artifacts.exports.length).toBeGreaterThan(0);
      expect(evidence.summary.criteria.criteriaCount).toBeGreaterThanOrEqual(4);
      expect(evidence.summary.criteria.decisionsWithFactors).toBe(cycle.routingDecisions.length);
      expect(conformance.result).toBe('pass');
    } finally {
      await app.close();
      await rm(outDir, { recursive: true, force: true });
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  it('runs the baseline example through the same public API path', async () => {
    const { outDir, app, dataDir } = await runStarter([
      '--scenario',
      'adopters/typescript-http-starter/examples/baseline.json',
    ]);

    try {
      const cycle = JSON.parse(await readFile(path.join(outDir, 'cycle.json'), 'utf8'));
      const evidence = JSON.parse(await readFile(path.join(outDir, 'evidence-index.json'), 'utf8'));

      expect(cycle.condition).toBe('baseline_thread');
      expect(cycle.routingDecisions.length).toBe(0);
      expect(cycle.digests.length).toBe(0);
      expect(evidence.summary.criteria.criteriaCount).toBeGreaterThanOrEqual(4);
      expect(evidence.artifacts.exports.length).toBeGreaterThan(0);
    } finally {
      await app.close();
      await rm(outDir, { recursive: true, force: true });
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  it('includes an executable baseline scenario and avoids Relay service imports', async () => {
    const runSource = await readFile(
      path.join(repoRoot, 'adopters', 'typescript-http-starter', 'src', 'run.ts'),
      'utf8',
    );
    const baseline = JSON.parse(
      await readFile(path.join(repoRoot, 'adopters', 'typescript-http-starter', 'examples', 'baseline.json'), 'utf8'),
    );

    expect(runSource).not.toContain('CycleService');
    expect(runSource).not.toContain('src/services');
    expect(baseline.condition).toBe('baseline_thread');
    expect(baseline.contributions.length).toBeGreaterThan(0);
  });
});
