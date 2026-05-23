import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('ACP conformance', () => {
  it('passes the protocol bundle and replay fixture checks', () => {
    const raw = execFileSync('node', ['scripts/conformance/check-acp.mjs', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const report = JSON.parse(raw);

    expect(report.status).toBe('pass');
    expect(report.protocolVersion).toBe('0.1.0');
    expect(report.summary.totalChecks).toBeGreaterThan(0);
    expect(report.summary.failed).toBe(0);
    expect(report.results).toHaveLength(report.summary.totalChecks);
    expect(report.checks.every((item: { status: string }) => item.status === 'pass')).toBe(true);
    expect(report.schemaBundle.status).toBe('pass');
    expect(report.replayCases).toHaveLength(2);
    expect(report.replayCases.every((item: { status: string }) => item.status === 'pass')).toBe(true);
  });
});
