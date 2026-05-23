import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface StudyGenerationSummary {
  provider: string;
  totalCases: number;
  totalOutputs: number;
  generatedOutputs: number;
  familiesCovered: string[];
  conditions: string[];
  boundary: string;
}

interface StudyAdjudicationSummary {
  mode: string;
  totalCases: number;
  totalOutputs: number;
  agreementRate: number;
  arbitration: { judgeAModel: string; judgeBModel: string; arbitrationModel: string; arbitrationUsed: number };
  boundary: string;
}

describe('Skills V3 behavioral study program', () => {
  it('runs the full study program in dry-run mode and emits study artifacts', async () => {
    const outRoot = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-study-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:study:experimental', '--', '--dry-run', '--out-root', outRoot, '--max-budget-usd', '20'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      await execFileAsync('npm', ['run', '--silent', 'skills:study:adjudication', '--', '--dry-run', '--out-root', outRoot, '--max-budget-usd', '20', '--max-arbitrations', '20'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      await execFileAsync('npm', ['run', '--silent', 'skills:study:adherence', '--', '--out-root', outRoot], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      await execFileAsync('npm', ['run', '--silent', 'skills:study:live', '--', '--dry-run', '--out-root', outRoot, '--max-budget-usd', '20', '--max-arbitrations', '20'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      await execFileAsync('npm', ['run', '--silent', 'skills:study:claims', '--', '--out-root', outRoot], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      await execFileAsync('npm', ['run', '--silent', 'skills:study:all', '--', '--dry-run', '--out-root', outRoot], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      const studyA = JSON.parse(await readFile(path.join(outRoot, 'study-a-experimental/generation-summary.json'), 'utf8')) as StudyGenerationSummary;
      const studyB = JSON.parse(await readFile(path.join(outRoot, 'study-b-adjudication/summary.json'), 'utf8')) as StudyAdjudicationSummary;
      const studyC = JSON.parse(await readFile(path.join(outRoot, 'study-c-adherence/summary.json'), 'utf8'));
      const studyD = JSON.parse(await readFile(path.join(outRoot, 'study-d-live/summary.json'), 'utf8'));
      const claims = await readFile(path.join(outRoot, 'final/skills-v3-claims-memo.md'), 'utf8');
      const finalTable = await readFile(path.join(outRoot, 'final/skills-v3-results-table.csv'), 'utf8');

      expect(studyA.provider).toBe('dry-run');
      expect(studyA.totalCases).toBeGreaterThanOrEqual(28);
      expect(studyA.totalOutputs).toBeGreaterThan(studyA.totalCases);
      expect(studyA.generatedOutputs).toBe(studyA.totalOutputs);
      expect(studyA.familiesCovered).toHaveLength(7);
      expect(studyA.conditions).toEqual(expect.arrayContaining(['no_skill', 'metadata_only', 'full_skill', 'composition']));
      expect(studyA.boundary).toContain('Measured generation only');

      expect(studyB.mode).toBe('dual_blinded_surrogate_adjudication');
      expect(studyB.totalCases).toBe(studyA.totalCases);
      expect(studyB.totalOutputs).toBe(studyA.totalOutputs);
      expect(studyB.agreementRate).toBeGreaterThanOrEqual(0);
      expect(studyB.arbitration.judgeAModel).toBe('gpt-5.4-mini');
      expect(studyB.arbitration.judgeBModel).toBe('gpt-5.4-mini');
      expect(studyB.arbitration.arbitrationModel).toBe('gpt-5.4');
      expect(studyB.boundary).toContain('not human operator review');

      expect(studyC.totalOutputs).toBe(studyA.totalOutputs);
      expect(studyC.ittByCondition.full_skill.outputs).toBeGreaterThan(0);
      expect(studyC.perProtocolByCondition.full_skill.outputs).toBeGreaterThan(0);

      expect(studyD.totalCases).toBeGreaterThanOrEqual(12);
      expect(studyD.totalOutputs).toBeGreaterThan(studyD.totalCases);
      expect(studyD.boundary).toContain('not broad comparative superiority');
      expect(studyD.divergenceCounts).toBeTruthy();

      expect(claims).toContain('behavioral intervention study layer');
      expect(claims).toContain('does not prove human operator utility');
      expect(finalTable).toContain('experimental_measured_crossover');
      expect(finalTable).toContain('pragmatic_live_cohort');
    } finally {
      await rm(outRoot, { recursive: true, force: true });
    }
  });

  it('refuses non-dry-run generation when OPENAI_API_KEY is absent', async () => {
    const outRoot = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-study-no-key-'));
    const env = { ...process.env };
    delete env.OPENAI_API_KEY;
    try {
      await expect(execFileAsync('npm', ['run', '--silent', 'skills:study:experimental', '--', '--out-root', outRoot], {
        cwd: repoRoot,
        encoding: 'utf8',
        env,
      })).rejects.toMatchObject({ stderr: expect.stringContaining('OPENAI_API_KEY is required') });
    } finally {
      await rm(outRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when projected measured generation cost exceeds the configured cap', async () => {
    const outRoot = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-study-budget-'));
    try {
      await expect(execFileAsync('npm', ['run', '--silent', 'skills:study:experimental', '--', '--dry-run', '--out-root', outRoot, '--max-budget-usd', '0.000001'], {
        cwd: repoRoot,
        encoding: 'utf8',
      })).rejects.toMatchObject({ stderr: expect.stringContaining('Projected study-a-experimental generation cost') });
    } finally {
      await rm(outRoot, { recursive: true, force: true });
    }
  });
});
