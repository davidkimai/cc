import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'index.html',
  'cycle-briefing.html',
  'pilot-recap.html',
  'compatibility-proof.html',
  'protocol-explainer.html',
  'evidence-index.json',
  'operator-review.md',
  'research-review.md',
];

async function expectRequiredFiles(outDir: string, includeComparison = false) {
  const files = includeComparison ? requiredFiles.concat('comparison-summary.json') : requiredFiles;
  await Promise.all(files.map((file) => stat(path.join(outDir, file))));
}

describe('institutional report bundle', () => {
  it('turns a benchmark comparison bundle into readable report artifacts with evidence pointers', async () => {
    const benchmarkOut = await mkdtemp(path.join(os.tmpdir(), 'acp-report-benchmark-source-'));
    const reportOut = await mkdtemp(path.join(os.tmpdir(), 'acp-report-benchmark-out-'));

    try {
      await execFileAsync(
        'node',
        [
          path.join('scripts', 'benchmark', 'run-benchmark.mjs'),
          'comparison',
          '--class',
          'public-hearing-triage',
          '--out',
          benchmarkOut,
        ],
        { cwd: repoRoot, encoding: 'utf8' },
      );

      await execFileAsync(
        'node',
        [path.join('scripts', 'report', 'build-report-bundle.mjs'), '--source', benchmarkOut, '--out', reportOut],
        { cwd: repoRoot, encoding: 'utf8' },
      );

      await expectRequiredFiles(reportOut, true);

      const evidenceIndex = JSON.parse(await readFile(path.join(reportOut, 'evidence-index.json'), 'utf8'));
      const indexHtml = await readFile(path.join(reportOut, 'index.html'), 'utf8');
      const researchReview = await readFile(path.join(reportOut, 'research-review.md'), 'utf8');

      expect(evidenceIndex.sourceType).toBe('benchmark-comparison');
      expect(evidenceIndex.artifacts.some((entry: { sourceRelativePath: string; sourcePath: string }) => {
        return entry.sourceRelativePath === 'comparison-summary.json' && path.isAbsolute(entry.sourcePath);
      })).toBe(true);
      expect(evidenceIndex.artifacts.some((entry: { sourceRelativePath: string }) => entry.sourceRelativePath === 'intervention/evidence.json')).toBe(true);
      expect(indexHtml).toContain('Evidence you can inspect');
      expect(researchReview).toContain('Comparison Snapshot');
      expect(researchReview).toContain('Criteria Snapshot');
      expect(researchReview).toContain('Engine V2 Snapshot');
      expect(researchReview).toContain('Criteria evidence present: true');
    } finally {
      await rm(benchmarkOut, { recursive: true, force: true });
      await rm(reportOut, { recursive: true, force: true });
    }
  }, 40000);

  it('turns a dogfood-style run bundle into the same report shape without a comparison summary', async () => {
    const sourceDir = await mkdtemp(path.join(os.tmpdir(), 'acp-report-dogfood-source-'));
    const reportOut = await mkdtemp(path.join(os.tmpdir(), 'acp-report-dogfood-out-'));

    try {
      await execFileAsync(
        'npm',
        [
          'run',
          '--silent',
          'batch:run',
          '--',
          'runners/batch/examples/intervention.json',
          '--out',
          sourceDir,
        ],
        { cwd: repoRoot, encoding: 'utf8' },
      );

      const runManifest = JSON.parse(await readFile(path.join(sourceDir, 'run-manifest.json'), 'utf8'));
      await writeFile(
        path.join(sourceDir, 'report.json'),
        `${JSON.stringify({
          scenarioId: runManifest.scenarioId,
          cycleId: runManifest.cycleId,
          checks: [{ id: 'seeded-run', status: 'pass', evidence: 'batch run completed' }],
          findings: [],
          generatedArtifacts: [],
        }, null, 2)}\n`,
        'utf8',
      );
      await mkdir(path.join(sourceDir, 'notes'), { recursive: true });
      await writeFile(path.join(sourceDir, 'notes', 'operator-note.md'), '# Operator note\n', 'utf8');

      await execFileAsync(
        'node',
        [path.join('scripts', 'report', 'build-report-bundle.mjs'), '--source', sourceDir, '--out', reportOut],
        { cwd: repoRoot, encoding: 'utf8' },
      );

      await expectRequiredFiles(reportOut, false);
      await expect(stat(path.join(reportOut, 'comparison-summary.json')).catch(() => null)).resolves.toBeNull();

      const evidenceIndex = JSON.parse(await readFile(path.join(reportOut, 'evidence-index.json'), 'utf8'));
      const operatorReview = await readFile(path.join(reportOut, 'operator-review.md'), 'utf8');

      expect(evidenceIndex.sourceType).toBe('dogfood-run');
      expect(evidenceIndex.artifacts.some((entry: { sourceRelativePath: string }) => entry.sourceRelativePath === 'cycle.json')).toBe(true);
      expect(evidenceIndex.artifacts.some((entry: { sourceRelativePath: string }) => entry.sourceRelativePath === 'notes/operator-note.md')).toBe(true);
      expect(operatorReview).toContain('Operator Review');
    } finally {
      await rm(sourceDir, { recursive: true, force: true });
      await rm(reportOut, { recursive: true, force: true });
    }
  }, 30000);
});
