import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function runScenario(exampleName: string) {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-batch-'));
  const scenarioPath = path.join('runners', 'batch', 'examples', exampleName);
  execFileSync('npm', ['run', '--silent', 'batch:run', '--', scenarioPath, '--out', outDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return outDir;
}

describe('ACP batch runner', () => {
  it('executes an intervention example end to end', async () => {
    const outDir = await runScenario('intervention.json');
    const cycle = JSON.parse(await readFile(path.join(outDir, 'cycle.json'), 'utf8'));
    const manifest = JSON.parse(await readFile(path.join(outDir, 'run-manifest.json'), 'utf8'));
    const report = JSON.parse(await readFile(path.join(outDir, 'conformance-report.json'), 'utf8'));

    expect(cycle.condition).toBe('intervention');
    expect(cycle.routingDecisions.length).toBeGreaterThan(0);
    expect(cycle.digests.length).toBeGreaterThan(0);
    expect(manifest.exports.length).toBeGreaterThan(0);
    expect(report.result).toBe('pass');

    await rm(outDir, { recursive: true, force: true });
  });

  it('executes a baseline example end to end', async () => {
    const outDir = await runScenario('baseline.json');
    const cycle = JSON.parse(await readFile(path.join(outDir, 'cycle.json'), 'utf8'));
    const manifest = JSON.parse(await readFile(path.join(outDir, 'run-manifest.json'), 'utf8'));
    const report = JSON.parse(await readFile(path.join(outDir, 'conformance-report.json'), 'utf8'));

    expect(cycle.condition).toBe('baseline_thread');
    expect(cycle.routingDecisions.length).toBe(0);
    expect(cycle.digests.length).toBe(0);
    expect(manifest.exports.length).toBeGreaterThan(0);
    expect(report.result).toBe('pass');

    await rm(outDir, { recursive: true, force: true });
  });
});
