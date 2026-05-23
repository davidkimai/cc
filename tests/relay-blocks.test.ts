import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

describe('Relay Blocks packaging and composition', () => {
  it('has a valid registry and package manifests for the current block suite', () => {
    const registry = readJson('skills/registry.json');

    expect(registry.suite).toBe('relay-blocks');
    expect(registry.framing.protocol).toBe('ACP');
    expect(registry.framing.implementation).toBe('Relay');
    expect(registry.framing.blocks).toBe('Relay Blocks');
    expect(Array.isArray(registry.packages)).toBe(true);
    expect(registry.packages).toHaveLength(17);

    for (const pkg of registry.packages) {
      const manifestPath = path.join(repoRoot, pkg.manifest);
      expect(existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      expect(manifest.name).toBe(pkg.name);
      expect(manifest.layer).toBe('relay-block');
      expect(['protocol', 'surface-workflow', 'institutional-domain', 'ecosystem-adopter', 'runtime-adapter']).toContain(manifest.category);
      expect(typeof manifest.maturity).toBe('string');
      expect(typeof manifest.skillFile).toBe('string');
    }

    for (const name of ['epistemic-routing', 'digest-and-explanation', 'public-hearing-triage']) {
      const pkg = registry.packages.find((item: { name: string }) => item.name === name);
      expect(pkg).toBeTruthy();
      const manifest = readJson(pkg.manifest);
      expect(manifest.maturity).toBe('S4');
      expect(manifest.status).toBe('flagship');
      expect(existsSync(path.join(repoRoot, manifest.examples[0]))).toBe(true);
      expect(existsSync(path.join(repoRoot, manifest.evals[0]))).toBe(true);
    }

    for (const name of ['epistemic-routing', 'digest-and-explanation', 'overload-governance', 'bridge-exposure', 'operator-audit']) {
      const pkg = registry.packages.find((item: { name: string }) => item.name === name);
      expect(pkg).toBeTruthy();
      const manifest = readJson(pkg.manifest);
      expect(['procedural', 'executable', 'robust', 'flagship']).toContain(manifest.status);
      expect(Array.isArray(manifest.scripts)).toBe(true);
      expect(manifest.scripts.length).toBeGreaterThan(0);
      for (const script of manifest.scripts) {
        expect(existsSync(path.join(repoRoot, script))).toBe(true);
      }
    }
  });

  it('ships the initial composition set with runnable entrypoints', () => {
    for (const name of ['pilot-cycle-review', 'export-generation', 'surface-preflight', 'foresight-submission-prep', 'public-hearing-end-to-end']) {
      const base = path.join(repoRoot, 'skills', 'compositions', name);
      expect(existsSync(path.join(base, 'composition.yaml'))).toBe(true);
      expect(existsSync(path.join(base, 'README.md'))).toBe(true);
      expect(existsSync(path.join(base, 'run.sh'))).toBe(true);
    }
  });
});
