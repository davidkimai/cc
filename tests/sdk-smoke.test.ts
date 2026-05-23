import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildApp } from '../src/api/app.js';
import { runHttpScenario, runReplayConformance, summarizeCycleEvidence } from '../src/sdk/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('ACP SDK smoke', () => {
  it('runs ACP conformance through the thin SDK helper', async () => {
    const report = await runReplayConformance(repoRoot);

    expect(report.status).toBe('pass');
    expect(report.protocolVersion).toBe('0.1.0');
    expect(report.replayCases).toHaveLength(2);
  });

  it('drives a public HTTP run through the thin SDK helper', async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-sdk-data-'));
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-sdk-http-'));
    const app = await buildApp({ dataDir });
    const address = await app.listen({ port: 0, host: '127.0.0.1' });

    try {
      const run = await runHttpScenario({
        repoRoot,
        scenarioPath: 'runners/http-client/examples/intervention.json',
        baseUrl: address,
        outDir,
        actorId: 'sdk-smoke',
      });
      const cycle = JSON.parse(await readFile(path.join(run.outDir, 'cycle.json'), 'utf8'));
      const manifest = JSON.parse(await readFile(path.join(run.outDir, 'run-manifest.json'), 'utf8'));

      expect(run.baseUrl).toContain('127.0.0.1');
      expect(cycle.condition).toBe('intervention');
      expect(cycle.routingDecisions.length).toBeGreaterThan(0);
      expect(summarizeCycleEvidence(cycle).criteria.decisionsWithCriteriaWeights).toBe(cycle.routingDecisions.length);
      expect(summarizeCycleEvidence(cycle).proceduralLayer.present).toBe(true);
      expect(summarizeCycleEvidence(cycle).proceduralLayer.selectedProcedureCount).toBeGreaterThan(0);
      expect(manifest.conformanceResult).toBe('pass');
    } finally {
      await app.close();
      await rm(outDir, { recursive: true, force: true });
      await rm(dataDir, { recursive: true, force: true });
    }
  });
});
