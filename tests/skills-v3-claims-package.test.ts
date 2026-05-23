import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface OperatorReviewResults {
  status: string;
  actualReviewerEvidence: boolean;
  caseCount: number;
  disagreementCaseCount: number;
  claimBoundary: string;
  nonClaims: string[];
}

describe('Skills V3 reviewer and claims packaging', () => {
  it('builds an operator-review packet without implying collected reviewer evidence', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-operator-review-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:operator-review', '--', '--out', outDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const results = JSON.parse(await readFile(path.join(outDir, 'review-results.json'), 'utf8')) as OperatorReviewResults;
      const protocol = await readFile(path.join(outDir, 'review-protocol.md'), 'utf8');
      const casePack = await readFile(path.join(outDir, 'case-pack.md'), 'utf8');
      const disagreementLog = await readFile(path.join(outDir, 'disagreement-log.md'), 'utf8');

      expect(results.status).toBe('ready_not_collected');
      expect(results.actualReviewerEvidence).toBe(false);
      expect(results.caseCount).toBeGreaterThanOrEqual(12);
      expect(results.disagreementCaseCount).toBeGreaterThanOrEqual(3);
      expect(results.claimBoundary).toContain('not claimed');
      expect(results.nonClaims).toContain('not real-world civic efficacy');
      expect(protocol).toContain('Operator utility is not claimed');
      expect(protocol).toContain('field efficacy');
      expect(casePack).toContain('lp-routing-003');
      expect(casePack).toContain('protocol-hard-002');
      expect(disagreementLog).toContain('not collected');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('builds the final Skills V3 claims package with tables, casebook, and non-claims', async () => {
    const operatorDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-operator-review-'));
    const finalDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-final-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:operator-review', '--', '--out', operatorDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      await execFileAsync('npm', ['run', '--silent', 'skills:claims-package', '--', '--operator-review', operatorDir, '--out', finalDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      const requiredFiles = [
        'skills-v3-claims-memo.md',
        'skills-v3-results-overview.md',
        'skills-v3-results-table.csv',
        'skills-v3-failure-taxonomy.md',
        'skills-v3-casebook.md',
        'skills-v3-non-claims.md',
        'reviewer-start-here.md',
      ];
      await Promise.all(requiredFiles.map((file) => access(path.join(finalDir, file))));

      const memo = await readFile(path.join(finalDir, 'skills-v3-claims-memo.md'), 'utf8');
      const table = await readFile(path.join(finalDir, 'skills-v3-results-table.csv'), 'utf8');
      const nonClaims = await readFile(path.join(finalDir, 'skills-v3-non-claims.md'), 'utf8');
      const startHere = await readFile(path.join(finalDir, 'reviewer-start-here.md'), 'utf8');
      const casebook = await readFile(path.join(finalDir, 'skills-v3-casebook.md'), 'utf8');

      expect(memo).toContain('measured and surrogate-adjudicated');
      expect(memo).toContain('does not yet establish a simple full-skill superiority claim');
      expect(memo).toContain('Operator review: packet prepared');
      expect(table).toContain('proxy_fixture_comparator');
      expect(table).toContain('measured_blinded_surrogate_adjudication');
      expect(table).toContain('live_provider_portability');
      expect(table).toContain('operator_review');
      expect(nonClaims).toContain('real-world civic efficacy');
      expect(nonClaims).toContain('fairness solved');
      expect(nonClaims).toContain('operator utility before actual reviewer judgments');
      expect(startHere).toContain('Read in this order');
      expect(startHere).toContain('skills-v3-claims-memo.md');
      expect(startHere).toContain('does not prove broad full-skill superiority');
      expect(casebook).toContain('routing-hard-003');
      expect(casebook).toContain('lp-protocol-review-001');
    } finally {
      await rm(operatorDir, { recursive: true, force: true });
      await rm(finalDir, { recursive: true, force: true });
    }
  });
});
