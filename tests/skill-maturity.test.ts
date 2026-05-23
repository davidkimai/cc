import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

import { constitutionalSkills, flagshipSkills, skillsAtOrAbove, type AcpSkillRegistry } from '../src/sdk/index.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('Skills V2 maturity gate', () => {
  it('runs the skills audit and reports the mandatory maturity counts', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-audit-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:audit', '--', '--out', outDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const report = JSON.parse(await readFile(path.join(outDir, 'skills-maturity-report.json'), 'utf8'));
      const overview = await readFile(path.join(outDir, 'skill-suite-overview.md'), 'utf8');
      expect(report.status).toBe('pass');
      expect(report.summary.skillsTotal).toBe(17);
      expect(report.summary.s3OrBetter).toBeGreaterThanOrEqual(14);
      expect(report.summary.s4).toBe(3);
      expect(report.summary.constitutionalCore).toBe(7);
      expect(report.summary.compositionsTotal).toBe(7);
      expect(report.summary.compositionsPassing).toBe(report.summary.compositionsTotal);
      expect(overview).toContain('Constitutional Core');
      expect(overview).toContain('Flagship S4 Skills');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('exposes skill discovery helpers through the SDK', async () => {
    const registry = JSON.parse(await readFile(path.join(repoRoot, 'skills', 'registry.json'), 'utf8')) as AcpSkillRegistry;

    expect(skillsAtOrAbove(registry, 'S3')).toHaveLength(14);
    expect(flagshipSkills(registry).map((skill) => skill.name).sort()).toEqual([
      'digest-and-explanation',
      'epistemic-routing',
      'public-hearing-triage',
    ]);
    expect(constitutionalSkills(registry).map((skill) => skill.name)).toEqual([
      'epistemic-routing',
      'digest-and-explanation',
      'omission-critic',
      'fairness-contestability-critic',
      'abstention-escalation',
      'protocol-implementer-review',
      'public-hearing-triage',
    ]);
  });

  it('builds the constitutional skills map', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-skills-map-'));
    try {
      await execFileAsync('npm', ['run', '--silent', 'skills:map', '--', '--out', outDir], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      const map = JSON.parse(await readFile(path.join(outDir, 'constitutional-skills-map.json'), 'utf8'));
      const markdown = await readFile(path.join(outDir, 'constitutional-skills-map.md'), 'utf8');
      expect(map.skills).toHaveLength(7);
      expect(map.compositions).toHaveLength(3);
      expect(markdown).toContain('ACP Constitutional Skills Map');
      expect(markdown).toContain('participatory-budget-end-to-end');
      expect(markdown).toContain('school-board-tradeoff-review');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
