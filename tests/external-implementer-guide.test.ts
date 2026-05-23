import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('ACP external implementer guide', () => {
  it('references current compatibility artifacts and second-surface expectations', () => {
    const guide = readFileSync(path.join(repoRoot, 'protocol', 'EXTERNAL_IMPLEMENTER_GUIDE.md'), 'utf8');

    expect(guide).toContain('protocol/acp-canonical.schema.json');
    expect(guide).toContain('protocol/examples/');
    expect(guide).toContain('protocol/compatibility/compatibility-matrix.json');
    expect(guide).toContain('docs/compatibility/RELAY_COMPATIBILITY_NOTES.md');
    expect(guide).toContain('npm run conformance:check');
    expect(guide).toContain('lightweight batch runner');
    expect(guide).toContain('runners/batch/');
    expect(guide).toContain('HTTP client runner');
    expect(guide).toContain('runners/http-client/');
  });
});
