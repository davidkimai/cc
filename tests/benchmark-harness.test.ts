import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('ACP benchmark harness', () => {
  it('exposes at least five seeded benchmark classes', async () => {
    const { stdout } = await execFileAsync('node', [path.join('scripts', 'benchmark', 'run-benchmark.mjs'), 'fixtures'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    const payload = JSON.parse(stdout);
    expect(payload.classCount).toBeGreaterThanOrEqual(5);
    expect(payload.defaultClass).toBe('public-hearing-triage');
    expect(payload.flagshipClass).toBe('public-hearing-triage');
  });

  it('builds a normalized intervention-vs-baseline comparison bundle', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-benchmark-'));

    try {
      await execFileAsync(
        'node',
        [
          path.join('scripts', 'benchmark', 'run-benchmark.mjs'),
          'comparison',
          '--class',
          'public-hearing-triage',
          '--out',
          outDir,
        ],
        {
          cwd: repoRoot,
          encoding: 'utf8',
        },
      );

      const bundleManifest = JSON.parse(await readFile(path.join(outDir, 'bundle-manifest.json'), 'utf8'));
      const summary = JSON.parse(await readFile(path.join(outDir, 'comparison-summary.json'), 'utf8'));
      const interventionEvidence = JSON.parse(await readFile(path.join(outDir, 'intervention', 'evidence.json'), 'utf8'));
      const baselineEvidence = JSON.parse(await readFile(path.join(outDir, 'baseline', 'evidence.json'), 'utf8'));
      const markdown = await readFile(path.join(outDir, 'comparison-summary.md'), 'utf8');

      expect(bundleManifest.scenarioClass).toBe('public-hearing-triage');
      expect(summary.pairSignals.routingContrast).toBe(true);
      expect(summary.pairSignals.digestContrast).toBe(true);
      expect(summary.pairSignals.criteriaEvidencePresent).toBe(true);
      expect(summary.pairSignals.engineV2TracePresent).toBe(true);
      expect(summary.pairSignals.engineV2CriticsPresent).toBe(true);
      expect(summary.pairSignals.proceduralLayerPresent).toBe(true);
      expect(summary.pairSignals.proceduralContestPointsPresent).toBe(true);
      expect(summary.criteria.sharedWeights.recipient_relevance).toBeGreaterThan(0);
      expect(summary.criteria.averageFactors.promptRelevance).toBeGreaterThanOrEqual(0);
      expect(summary.engineV2.issueClusterCount).toBeGreaterThan(0);
      expect(summary.engineV2.escalation.recommendedAction).toMatch(/release|review|revise_digest|abstain/);
      expect(summary.proceduralLayer.referenceCount).toBeGreaterThan(0);
      expect(interventionEvidence.digestCount).toBeGreaterThan(0);
      expect(interventionEvidence.criteria.decisionsWithFactors).toBe(interventionEvidence.routingDecisionCount);
      expect(baselineEvidence.digestCount).toBe(0);
      expect(interventionEvidence.feedbackCount).toBeGreaterThan(0);
      expect(baselineEvidence.feedbackCount).toBeGreaterThan(0);
      expect(summary.comparison.overloadDelta).not.toBeNull();
      expect(summary.comparison.usefulnessDelta).not.toBeNull();
      expect(markdown).toContain('ACP comparison summary');
      expect(markdown).toContain('Shared criteria');
      expect(markdown).toContain('Engine V2');
      expect(markdown).toContain('Procedural Layer');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  }, 30000);

  it('exports replay fixture summaries through the same command surface', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-benchmark-replay-'));

    try {
      await execFileAsync(
        'node',
        [path.join('scripts', 'benchmark', 'run-benchmark.mjs'), 'replay', '--out', outDir],
        {
          cwd: repoRoot,
          encoding: 'utf8',
        },
      );

      const summary = JSON.parse(await readFile(path.join(outDir, 'replay-summary.json'), 'utf8'));
      expect(summary.caseCount).toBeGreaterThanOrEqual(2);
      expect(summary.cases.some((entry: { condition: string }) => entry.condition === 'intervention')).toBe(true);
      expect(summary.cases.some((entry: { condition: string }) => entry.condition === 'baseline_thread')).toBe(true);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('builds an Engine V2 ablation bundle against heuristic and baseline modes', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-benchmark-ablation-'));

    try {
      await execFileAsync(
        'node',
        [
          path.join('scripts', 'benchmark', 'run-benchmark.mjs'),
          'ablation',
          '--class',
          'public-hearing-triage',
          '--out',
          outDir,
        ],
        {
          cwd: repoRoot,
          encoding: 'utf8',
        },
      );

      const summary = JSON.parse(await readFile(path.join(outDir, 'ablation-summary.json'), 'utf8'));
      const markdown = await readFile(path.join(outDir, 'ablation-summary.md'), 'utf8');
      expect(summary.signals.recursiveTracePresent).toBe(true);
      expect(summary.signals.heuristicTraceAbsent).toBe(true);
      expect(summary.signals.baselineDigestAbsent).toBe(true);
      expect(summary.signals.recursiveHasCritics).toBe(true);
      expect(markdown).toContain('ACP Engine V2 Ablation Summary');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  }, 30000);
});
