import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runHttpScenario, summarizeCycleEvidence, validateProtocolWorkspace } from '../../../src/sdk/index.js';

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(starterRoot, '../..');

interface Options {
  scenarioPath: string;
  baseUrl: string;
  outDir: string;
  actorId: string;
}

function parseArgs(argv: string[]): Options {
  let scenarioPath = path.join(starterRoot, 'examples', 'intervention.json');
  let baseUrl = process.env.ACP_BASE_URL ?? 'http://127.0.0.1:4317';
  let outDir = path.join(repoRoot, 'adopters', 'typescript-http-starter', 'out', 'latest');
  let actorId = 'typescript-http-starter';

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--scenario' && next) {
      scenarioPath = path.isAbsolute(next) ? next : path.resolve(repoRoot, next);
      index += 1;
      continue;
    }
    if (token === '--base-url' && next) {
      baseUrl = next;
      index += 1;
      continue;
    }
    if (token === '--out' && next) {
      outDir = path.isAbsolute(next) ? next : path.resolve(repoRoot, next);
      index += 1;
      continue;
    }
    if (token === '--actor-id' && next) {
      actorId = next;
      index += 1;
      continue;
    }
    if (token === '--help') {
      process.stdout.write(
        [
          'usage: npm run adopter:starter -- [--scenario FILE] [--base-url URL] [--out DIR] [--actor-id ID]',
          '',
          'Default scenario: adopters/typescript-http-starter/examples/intervention.json',
          'Default base URL: ACP_BASE_URL or http://127.0.0.1:4317',
        ].join('\n'),
      );
      process.exit(0);
    }
  }

  return { scenarioPath, baseUrl, outDir, actorId };
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const protocolValidation = await validateProtocolWorkspace(repoRoot);
  if (protocolValidation.status !== 'pass') {
    throw new Error(`ACP protocol workspace validation failed: ${JSON.stringify(protocolValidation, null, 2)}`);
  }

  const run = await runHttpScenario({
    repoRoot,
    scenarioPath: options.scenarioPath,
    baseUrl: options.baseUrl,
    outDir: options.outDir,
    actorId: options.actorId,
  });

  const manifestPath = path.join(run.outDir, 'run-manifest.json');
  const conformancePath = path.join(run.outDir, 'conformance-report.json');
  const cyclePath = path.join(run.outDir, 'cycle.json');
  const participantViewsPath = path.join(run.outDir, 'participant-views.json');
  const normalizedInputPath = path.join(run.outDir, 'normalized-input.json');

  const manifest = (await readJson(manifestPath)) as { exports?: Array<{ mode: string; path: string }> };
  const cycle = (await readJson(cyclePath)) as Parameters<typeof summarizeCycleEvidence>[0];
  const evidenceIndex = {
    generatedBy: '@acp/typescript-http-starter',
    baseUrl: run.baseUrl,
    scenarioId: run.scenarioId,
    cycleId: run.cycleId,
    summary: summarizeCycleEvidence(cycle),
    artifacts: {
      normalizedInput: normalizedInputPath,
      cycle: cyclePath,
      participantViews: participantViewsPath,
      conformanceReport: conformancePath,
      runManifest: manifestPath,
      exports: (manifest.exports ?? []).map((artifact) => ({
        mode: artifact.mode,
        path: artifact.path,
      })),
    },
    protocol: {
      manifest: path.join(repoRoot, 'protocol', 'acp-bundle.manifest.json'),
      discovery: path.join(repoRoot, 'protocol', 'discovery.json'),
      compatibility: path.join(repoRoot, 'protocol', 'compatibility', 'compatibility-matrix.json'),
    },
  };

  await writeJson(path.join(run.outDir, 'evidence-index.json'), evidenceIndex);

  process.stdout.write(
    `${JSON.stringify(
      {
        status: 'pass',
        scenarioId: run.scenarioId,
        cycleId: run.cycleId,
        outDir: run.outDir,
        evidenceIndex: path.join(run.outDir, 'evidence-index.json'),
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
