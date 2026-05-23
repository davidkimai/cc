import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('ACP visual artifacts', () => {
  it('generates compatibility proof and protocol explainer HTML pages', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-visual-artifacts-'));
    const compatPath = path.join(outDir, 'compatibility-proof.html');
    const protocolPath = path.join(outDir, 'protocol-explainer.html');
    const briefingPath = path.join(outDir, 'cycle-briefing.html');
    const viewsPath = path.join(outDir, 'views.json');
    const conformancePath = path.join(outDir, 'conformance.json');
    await writeFile(viewsPath, '[]\n', 'utf8');
    await writeFile(conformancePath, '{"result":"pass","checks":{"routingConditionRespected":true,"exportsGenerated":true}}\n', 'utf8');

    await execFileAsync('node', [path.join('scripts', 'visual-artifacts', 'generate-visual-artifact.mjs'), 'compatibility-proof', '--out', compatPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    await execFileAsync('node', [path.join('scripts', 'visual-artifacts', 'generate-visual-artifact.mjs'), 'protocol-explainer', '--out', protocolPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    await execFileAsync(
      'node',
      [
        path.join('scripts', 'visual-artifacts', 'generate-visual-artifact.mjs'),
        'cycle-briefing',
        '--out',
        briefingPath,
        '--cycle',
        'protocol/examples/intervention-cycle.example.json',
        '--views',
        viewsPath,
        '--conformance',
        conformancePath,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );

    const compatHtml = await readFile(compatPath, 'utf8');
    const protocolHtml = await readFile(protocolPath, 'utf8');
    const briefingHtml = await readFile(briefingPath, 'utf8');

    expect(compatHtml).toContain('Compatibility proof');
    expect(compatHtml).toContain('relay-browser-surface');
    expect(protocolHtml).toContain('Protocol explainer');
    expect(protocolHtml).toContain('Relay Blocks');
    expect(briefingHtml).toContain('Shared routing weights');
    expect(briefingHtml).toContain('Recipient relevance');

    await rm(outDir, { recursive: true, force: true });
  });
});
