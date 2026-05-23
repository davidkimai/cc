import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function run(command: string, args: string[], cwd = repoRoot) {
  return execFileAsync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
}

describe('Inspect AI mirror integration', () => {
  it('exports the measured skills slice and flagship public-hearing benchmark for Inspect', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'acp-inspect-export-'));
    const skillsOut = path.join(tmpDir, 'skills-measured.json');
    const publicOut = path.join(tmpDir, 'public-hearing.json');

    try {
      await run('npx', ['tsx', 'scripts/evals/export-inspect-skills-measured.ts', '--out', skillsOut]);
      await run('npx', ['tsx', 'scripts/evals/export-inspect-public-hearing.ts', '--out', publicOut]);

      const skills = JSON.parse(await readFile(skillsOut, 'utf8'));
      const publicHearing = JSON.parse(await readFile(publicOut, 'utf8'));

      expect(skills).toHaveLength(44);
      expect(skills[0].metadata.condition_material).toBeTruthy();
      expect(skills[0].input).toContain('Return one strict JSON object only');
      expect(publicHearing).toHaveLength(2);
      expect(publicHearing[0].metadata.preferred_label).toBe('A');
      expect(publicHearing[1].metadata.preferred_label).toBe('B');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('runs both Inspect mirror tasks end to end with mockllm', async () => {
    const result = await run('npm', ['run', 'inspect:smoke']);

    expect(result.stdout).toContain('acp_skills_measured');
    expect(result.stdout).toContain('acp_skills_judge');
    expect(result.stdout).toContain('acp_adherence');
    expect(result.stdout).toContain('acp_public_hearing_flagship');
    expect(result.stdout).toContain('acp_public_hearing_alignment');
  }, 120000);
});
