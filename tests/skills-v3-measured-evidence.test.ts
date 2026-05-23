import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface MeasuredGenerationSummary {
  status: string;
  provider: string;
  totalCases: number;
  totalOutputs: number;
  generatedOutputs: number;
  baselines: string[];
  familiesCovered: string[];
  boundary: string;
}

interface MeasuredAdjudicationSummary {
  mode: string;
  totalCases: number;
  totalOutputs: number;
  byBaseline: Record<string, { outputs: number; averageOverallScore: number }>;
  arbitration: { primaryModel: string; arbitrationModel: string; arbitrationUsed: number };
  boundary: string;
}

interface LiveAdjudicationSummary {
  method: string;
  reviewCasesAdjudicated: number;
  arbitrationUsed: number;
  rows: Array<{ finalDivergenceType: string; finalStatus: string }>;
}

describe('Skills V3 measured and adjudicated evidence correction', () => {
  it('generates a measured held-out slice without exposing expected labels to generation', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-measured-generation-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:measured-generate', '--', '--dry-run', '--out', outDir, '--max-budget-usd', '12'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const summary = JSON.parse(await readFile(path.join(outDir, 'summary.json'), 'utf8')) as MeasuredGenerationSummary;
      const report = await readFile(path.join(outDir, 'report.md'), 'utf8');
      const raw = await readFile(path.join(outDir, 'raw-outputs', 'routing-measured-001--no_skill.json'), 'utf8');

      expect(summary.status).toBe('pass');
      expect(summary.provider).toBe('dry-run');
      expect(summary.totalCases).toBeGreaterThanOrEqual(14);
      expect(summary.totalOutputs).toBeGreaterThan(summary.totalCases);
      expect(summary.generatedOutputs).toBe(summary.totalOutputs);
      expect(summary.baselines).toContain('no_skill');
      expect(summary.baselines).toContain('metadata_only');
      expect(summary.baselines).toContain('full_skill');
      expect(summary.baselines).toContain('composition');
      expect(summary.familiesCovered).toHaveLength(7);
      expect(summary.boundary).toContain('Measured generation only');
      expect(report).toContain('Gold labels');
      expect(raw).toContain('expectedLabelsHiddenFromGeneration');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('runs separated blinded surrogate adjudication over measured outputs', async () => {
    const measuredDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-measured-generation-'));
    const adjudicationDir = path.join(measuredDir, 'adjudication');
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:measured-generate', '--', '--dry-run', '--out', measuredDir, '--max-budget-usd', '12'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      await execFileAsync('npm', ['run', '--silent', 'skills:measured-judge', '--', '--dry-run', '--source', path.join(measuredDir, 'summary.json'), '--out', adjudicationDir, '--max-budget-usd', '14'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      const summary = JSON.parse(await readFile(path.join(adjudicationDir, 'summary.json'), 'utf8')) as MeasuredAdjudicationSummary;
      const blindingMap = await readFile(path.join(adjudicationDir, 'blinding-map.json'), 'utf8');
      const disagreementLog = await readFile(path.join(measuredDir, 'disagreement-log.md'), 'utf8');
      const uncertaintyNotes = await readFile(path.join(measuredDir, 'uncertainty-notes.md'), 'utf8');

      expect(summary.mode).toBe('blinded_surrogate_adjudication');
      expect(summary.totalCases).toBeGreaterThanOrEqual(14);
      expect(summary.totalOutputs).toBeGreaterThan(summary.totalCases);
      expect(summary.byBaseline.no_skill.outputs).toBeGreaterThan(0);
      expect(summary.byBaseline.full_skill.outputs).toBeGreaterThan(0);
      expect(summary.arbitration.primaryModel).toBe('gpt-5.4-mini');
      expect(summary.arbitration.arbitrationModel).toBe('gpt-5.4');
      expect(summary.boundary).toContain('not human operator review');
      expect(blindingMap).toContain('baselineHiddenFromJudgePrompt');
      expect(disagreementLog).toContain('Measured Comparative Disagreement Log');
      expect(uncertaintyNotes).toContain('Surrogate adjudication');
    } finally {
      await rm(measuredDir, { recursive: true, force: true });
    }
  });

  it('adjudicates live-provider review divergences without converting them to human review', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-live-adjudication-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:live-adjudicate', '--', '--dry-run', '--out', outDir, '--max-budget-usd', '4'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const summary = JSON.parse(await readFile(path.join(outDir, 'portability-summary.json'), 'utf8'));
      const adjudication = summary.surrogateAdjudication as LiveAdjudicationSummary;
      const log = await readFile(path.join(outDir, 'adjudication-log.md'), 'utf8');
      const uncertainty = await readFile(path.join(outDir, 'uncertainty-notes.md'), 'utf8');

      expect(adjudication.method).toContain('not human review');
      expect(adjudication.reviewCasesAdjudicated).toBeGreaterThan(0);
      expect(adjudication.arbitrationUsed).toBeGreaterThan(0);
      expect(adjudication.rows.length).toBe(adjudication.reviewCasesAdjudicated);
      expect(log).toContain('separated surrogate adjudicator');
      expect(uncertainty).toContain('Substantive misses');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
