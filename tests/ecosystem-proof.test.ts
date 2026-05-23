import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

describe('ACP ecosystem proof surfaces', () => {
  it('ships a compatibility matrix with concrete boundary statuses', () => {
    const matrix = readJson('protocol/compatibility/compatibility-matrix.json');
    expect(matrix.version).toBe('0.1');
    expect(Array.isArray(matrix.matrix)).toBe(true);
    expect(matrix.matrix.length).toBeGreaterThanOrEqual(8);
    const compatValues = new Set(matrix.matrix.map((item: { compatibility: string }) => item.compatibility));
    expect(compatValues.has('native')).toBe(true);
    expect(compatValues.has('mapped') || compatValues.has('assumed') || compatValues.has('wrapped')).toBe(true);
    expect(Array.isArray(matrix.proofSurfaces)).toBe(true);
    expect(matrix.proofSurfaces.length).toBeGreaterThanOrEqual(3);
    const surfaceIds = new Set(matrix.proofSurfaces.map((item: { id: string }) => item.id));
    expect(surfaceIds.has('relay-browser-surface')).toBe(true);
    expect(surfaceIds.has('batch-runner')).toBe(true);
    expect(surfaceIds.has('http-api-runner')).toBe(true);
  });

  it('ships matched democracy pack pilot and evaluation companions', () => {
    const names = [
      'civic-participatory-budget-prioritization.md',
      'civic-public-hearing-routing.md',
      'civic-council-agenda-triage.md',
    ];

    for (const name of names) {
      const pilotPath = path.join(repoRoot, 'docs', 'pilot', 'democracy-packs', name);
      const evaluationPath = path.join(repoRoot, 'docs', 'evaluation', 'democracy-packs', name);
      expect(existsSync(pilotPath)).toBe(true);
      expect(existsSync(evaluationPath)).toBe(true);
      expect(readFileSync(pilotPath, 'utf8')).toContain('status: ready');
      expect(readFileSync(evaluationPath, 'utf8')).toContain('status: ready');
    }
  });

  it('ships public protocol docs for external implementers', () => {
    expect(existsSync(path.join(repoRoot, 'docs', 'protocol', 'README.md'))).toBe(true);
    expect(existsSync(path.join(repoRoot, 'docs', 'protocol', 'implementer-checklist.md'))).toBe(true);
  });
});
