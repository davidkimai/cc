import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const runtimes = {
  'claude-code': '.claude/skills',
  opencode: '.opencode/skills',
  openclaw: 'skills',
  'codex-compatible': '.agents/skills',
};

describe('ACP agent runtime bundles', () => {
  it('builds wrapper bundles for supported runtimes from the canonical skills registry', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-agent-bundles-'));
    const registry = JSON.parse(await readFile(path.join(repoRoot, 'skills', 'registry.json'), 'utf8')) as {
      packages: unknown[];
    };
    execFileSync('npm', ['run', '--silent', 'agents:bundle', '--', '--runtime', 'all', '--out', outDir], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    for (const [runtime, root] of Object.entries(runtimes)) {
      const manifestPath = path.join(outDir, runtime, 'bundle-manifest.json');
      expect(existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      expect(manifest.runtime).toBe(runtime);
      expect(manifest.packageCount).toBe(registry.packages.length);

      const sampleSkill = path.join(outDir, runtime, root, 'research-cli-operator', 'SKILL.md');
      expect(existsSync(sampleSkill)).toBe(true);
      const text = await readFile(sampleSkill, 'utf8');
      expect(text).toContain('ACP Relay Block Wrapper');
    }

    await rm(outDir, { recursive: true, force: true });
  });
});
