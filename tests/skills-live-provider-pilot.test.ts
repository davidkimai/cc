import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface LivePilotSummary {
  status: string;
  provider: string;
  totalCases: number;
  passingCases: number;
  failedCases: number;
  costs: {
    actualEstimatedCostUsd: number;
    maxBudgetUsd: number;
    modelSplit: Record<string, { calls: number }>;
  };
}

interface LivePortabilitySummary {
  status: string;
  totalCases: number;
  passCases: number;
  reviewCases: number;
  failCases: number;
  divergenceCounts: Record<string, number>;
  costEnvelope: {
    actualEstimatedCostUsd: number;
    modelSplit: Record<string, { calls: number }>;
  };
  nonClaims: string[];
}

describe('Skills V3 live-provider pilot harness', () => {
  it('emits dry-run traces, costs, and reports without spending provider budget', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-live-pilot-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:live-pilot', '--', '--dry-run', '--out', outDir, '--max-budget-usd', '15'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const summary = JSON.parse(await readFile(path.join(outDir, 'pilot-summary.json'), 'utf8')) as LivePilotSummary;
      const costs = await readFile(path.join(outDir, 'costs.json'), 'utf8');
      const failures = await readFile(path.join(outDir, 'failures.md'), 'utf8');
      const trace = await readFile(path.join(outDir, 'traces', 'lp-routing-001.json'), 'utf8');

      expect(summary.status).toBe('pass');
      expect(summary.provider).toBe('dry-run');
      expect(summary.totalCases).toBeGreaterThanOrEqual(10);
      expect(summary.passingCases).toBe(summary.totalCases);
      expect(summary.failedCases).toBe(0);
      expect(summary.costs.actualEstimatedCostUsd).toBeLessThan(summary.costs.maxBudgetUsd);
      expect(summary.costs.modelSplit['gpt-5.4-mini'].calls).toBeGreaterThan(0);
      expect(summary.costs.modelSplit['gpt-5.4'].calls).toBe(1);
      expect(costs).toContain('actualEstimatedCostUsd');
      expect(failures).toContain('No live-pilot case failures');
      expect(trace).toContain('skillContextPaths');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('refuses non-dry-run execution when OPENAI_API_KEY is absent', async () => {
    const env = { ...process.env };
    delete env.OPENAI_API_KEY;
    await expect(execFileAsync('npm', ['run', '--silent', 'skills:live-pilot', '--', '--out', path.join(os.tmpdir(), 'acp-no-key-live-pilot')], {
      cwd: repoRoot,
      encoding: 'utf8',
      env,
    })).rejects.toMatchObject({ stderr: expect.stringContaining('OPENAI_API_KEY is required') });
  });

  it('fails closed before execution when projected cost exceeds the cap', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-live-budget-'));
    try {
      await expect(execFileAsync('npm', ['run', '--silent', 'skills:live-pilot', '--', '--dry-run', '--out', outDir, '--max-budget-usd', '0.000001'], {
        cwd: repoRoot,
        encoding: 'utf8',
      })).rejects.toBeTruthy();
      const summary = JSON.parse(await readFile(path.join(outDir, 'pilot-summary.json'), 'utf8')) as LivePilotSummary;
      const failures = await readFile(path.join(outDir, 'failures.md'), 'utf8');
      expect(summary.status).toBe('blocked');
      expect(failures).toContain('Projected cost');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('rescoring existing live artifacts separates label mismatches from substantive failures', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-live-portability-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:live-portability', '--', '--out', outDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const summary = JSON.parse(await readFile(path.join(outDir, 'portability-summary.json'), 'utf8')) as LivePortabilitySummary;
      const report = await readFile(path.join(outDir, 'portability-summary.md'), 'utf8');
      const taxonomy = await readFile(path.join(outDir, 'divergence-taxonomy.md'), 'utf8');
      const table = await readFile(path.join(outDir, 'results-table.csv'), 'utf8');
      const failures = await readFile(path.join(outDir, 'failures.md'), 'utf8');
      const trace = await readFile(path.join(outDir, 'traces', 'lp-routing-003.json'), 'utf8');

      expect(summary.status).toBe('pass');
      expect(summary.totalCases).toBe(12);
      expect(summary.passCases).toBe(6);
      expect(summary.reviewCases).toBeGreaterThan(0);
      expect(summary.failCases).toBe(0);
      expect(summary.divergenceCounts.label_mismatch).toBeGreaterThan(0);
      expect(summary.costEnvelope.actualEstimatedCostUsd).toBeGreaterThan(0);
      expect(summary.costEnvelope.modelSplit['gpt-5.4-mini'].calls).toBe(11);
      expect(summary.costEnvelope.modelSplit['gpt-5.4'].calls).toBe(1);
      expect(summary.nonClaims).toContain('not real-world civic efficacy');
      expect(report).toContain('did not spend additional provider budget');
      expect(taxonomy).toContain('label_mismatch');
      expect(table).toContain('case,family,model');
      expect(failures).toContain('No substantive portability failures');
      expect(trace).toContain('portabilityAssessment');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
