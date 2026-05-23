import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface SkillsEvalSummary {
  status: string;
  v3_1Status: string;
  totalCases: number;
  coverage: {
    familiesRequired: number;
    familiesCovered: number;
    negativeControlFamilies: number;
    adversarialOrOverclaimCases: number;
    liveDivergenceSeedCases: number;
  };
  minimumCompletion: {
    met: boolean;
  };
  failureModeMetrics: {
    falseConsensusErrorRate: number;
    omissionCatchRate: number;
    fairnessContestabilityCatchRate: number;
    abstentionEscalationCorrectness: number;
    claimBoundaryObedience: number;
  };
}

interface SkillsCompareSummary {
  status: string;
  totalCases: number;
  aggregate: {
    no_skill: number;
    metadata_only: number;
    full_skill: number;
    composition: number;
  };
  nonClaims: string[];
}

describe('Skills V3 deterministic eval harness', () => {
  it('runs the hardened deterministic suite with traces, reports, and divergence taxonomy', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-eval-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:eval', '--', '--mode', 'deterministic', '--out', outDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const summary = JSON.parse(await readFile(path.join(outDir, 'summary.json'), 'utf8')) as SkillsEvalSummary;
      const report = await readFile(path.join(outDir, 'report.md'), 'utf8');
      const casebook = await readFile(path.join(outDir, 'failure-casebook.md'), 'utf8');
      const taxonomy = await readFile(path.join(outDir, 'divergence-taxonomy.md'), 'utf8');
      const trace = await readFile(path.join(outDir, 'traces', 'routing-selection-001.json'), 'utf8');

      expect(summary.status).toBe('pass');
      expect(summary.v3_1Status).toBe('complete');
      expect(summary.totalCases).toBeGreaterThanOrEqual(48);
      expect(summary.coverage.familiesCovered).toBe(summary.coverage.familiesRequired);
      expect(summary.coverage.negativeControlFamilies).toBe(summary.coverage.familiesRequired);
      expect(summary.coverage.adversarialOrOverclaimCases).toBeGreaterThan(0);
      expect(summary.coverage.liveDivergenceSeedCases).toBeGreaterThan(0);
      expect(summary.minimumCompletion.met).toBe(true);
      expect(summary.failureModeMetrics.falseConsensusErrorRate).toBe(0);
      expect(summary.failureModeMetrics.omissionCatchRate).toBe(1);
      expect(summary.failureModeMetrics.fairnessContestabilityCatchRate).toBe(1);
      expect(summary.failureModeMetrics.abstentionEscalationCorrectness).toBe(1);
      expect(summary.failureModeMetrics.claimBoundaryObedience).toBe(1);
      expect(report).toContain('fixture-level harness claims only');
      expect(casebook).toContain('No deterministic fixture failures');
      expect(taxonomy).toContain('Label mismatches');
      expect(trace).toContain('epistemic-routing');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('runs deterministic comparative baselines and keeps claims bounded', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-compare-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:compare', '--', '--out', outDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const summary = JSON.parse(await readFile(path.join(outDir, 'deterministic-comparison.json'), 'utf8')) as SkillsCompareSummary;
      const report = await readFile(path.join(outDir, 'deterministic-comparison.md'), 'utf8');
      const table = await readFile(path.join(outDir, 'results-table.csv'), 'utf8');
      const failureModeSummary = await readFile(path.join(outDir, 'failure-mode-summary.md'), 'utf8');

      expect(summary.status).toBe('pass');
      expect(summary.totalCases).toBeGreaterThanOrEqual(48);
      expect(summary.aggregate.full_skill).toBeGreaterThan(summary.aggregate.metadata_only);
      expect(summary.aggregate.metadata_only).toBeGreaterThan(summary.aggregate.no_skill);
      expect(summary.nonClaims).toContain('not field efficacy');
      expect(report).toContain('simulated comparative baseline model');
      expect(report).toContain('fixture-policy comparator');
      expect(report).toContain('does not establish live comparative superiority');
      expect(table).toContain('family,baseline,cases');
      expect(failureModeSummary).toContain('field-efficacy claims');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
