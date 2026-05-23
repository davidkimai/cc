import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../src/api/app.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('Relay dogfood automation', () => {
  it('runs a seeded dogfood flow and emits structured artifacts', async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-dogfood-data-'));
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-dogfood-out-'));
    const app = await buildApp({ dataDir });
    const address = await app.listen({ port: 0, host: '127.0.0.1' });

    try {
      await execFileAsync('node', [path.join('scripts', 'dogfood', 'run-relay-dogfood.mjs'), 'runners/http-client/examples/intervention.json', '--base-url', address, '--out', outDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      const report = JSON.parse(await readFile(path.join(outDir, 'report.json'), 'utf8'));
      const reportMd = await readFile(path.join(outDir, 'report.md'), 'utf8');
      const recapHtml = await readFile(path.join(outDir, 'pilot-recap.html'), 'utf8');

      expect(report.checks.length).toBeGreaterThanOrEqual(6);
      expect(report.checks.some((check: { id: string }) => check.id === 'report-bundle-generation')).toBe(true);
      expect(report.browserAutomation.status).toBe('skipped');
      expect(report.evidencePointers.length).toBeGreaterThan(0);
      expect(report.generatedArtifacts.length).toBeGreaterThanOrEqual(4);
      expect(reportMd).toContain('Relay Dogfood Report');
      expect(recapHtml).toContain('Pilot recap');
    } finally {
      await app.close();
      await rm(outDir, { recursive: true, force: true });
      await rm(dataDir, { recursive: true, force: true });
    }
  }, 20000);
});
