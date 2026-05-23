import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      flags[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return { outDir: path.resolve(repoRoot, flags.out || path.join('artifacts', 'completion-audit')) };
}

async function exists(relativePath) {
  try {
    await access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function claim(id, statement, evidence) {
  const checkedEvidence = [];
  for (const item of evidence) {
    checkedEvidence.push({ ...item, exists: await exists(item.path) });
  }
  return {
    id,
    statement,
    status: checkedEvidence.every((item) => item.exists) ? 'pass' : 'gap',
    evidence: checkedEvidence,
  };
}

function toMarkdown(audit) {
  const rows = audit.claims
    .map((item) => `| ${item.id} | ${item.status} | ${item.statement} | ${item.evidence.filter((entry) => entry.exists).map((entry) => entry.path).join('<br>')} |`)
    .join('\n');
  return `# ACP Technical Completion Audit\n\nGenerated: ${audit.generatedAt}\n\n## Result\n\n- Status: ${audit.status}\n- Passing claims: ${audit.claims.filter((item) => item.status === 'pass').length}/${audit.claims.length}\n\n## Claims\n\n| Claim | Status | Statement | Evidence |\n| --- | --- | --- | --- |\n${rows}\n`;
}

function humanLayerWork() {
  return `# Remaining Human-Layer Work\n\nACP's technical completion gate is now expressed in repo-local checks and artifacts. The remaining primary work is outside the codebase:\n\n- partner and pilot recruitment\n- external implementer outreach\n- public protocol explanation\n- institutional review and trust-building\n- live pilot operations\n- evidence interpretation after real use\n- distribution through communities that actually deliberate under load\n`;
}

async function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  await mkdir(outDir, { recursive: true });
  const claims = [
    await claim('explainable-without-relay', 'ACP can be explained without opening Relay UI code.', [
      { path: 'docs/protocol/README.md', note: 'public protocol guide' },
      { path: 'protocol/acp-bundle.manifest.json', note: 'machine-readable protocol bundle' },
      { path: 'protocol/discovery.json', note: 'artifact discovery registry' },
      { path: 'protocol/EXTERNAL_IMPLEMENTER_GUIDE.md', note: 'external implementer guide' },
    ]),
    await claim('checkable-without-trust', 'ACP can be checked without trusting the authors.', [
      { path: 'scripts/conformance/check-acp.mjs', note: 'conformance checker' },
      { path: 'fixtures/replay/manifest.json', note: 'replay fixtures' },
      { path: 'tests/conformance.test.ts', note: 'test coverage' },
    ]),
    await claim('runs-outside-browser', 'ACP can be run outside the main Relay browser flow.', [
      { path: 'scripts/batch/run-batch.ts', note: 'batch runner' },
      { path: 'scripts/http-client/run-http-scenario.mjs', note: 'HTTP runner' },
      { path: 'adopters/typescript-http-starter/src/run.ts', note: 'external starter' },
    ]),
    await claim('clear-outside-adoption-path', 'ACP can be adopted through a clear outside path.', [
      { path: 'adopters/typescript-http-starter/README.md', note: 'starter guide' },
      { path: 'src/sdk/index.ts', note: 'SDK surface' },
      { path: 'protocol/compatibility/compatibility-matrix.json', note: 'compatibility claims' },
    ]),
    await claim('inspectable-evidence', 'ACP can produce evidence others can inspect.', [
      { path: 'benchmarks/manifest.json', note: 'benchmark scenarios' },
      { path: 'scripts/benchmark/run-benchmark.mjs', note: 'comparison harness' },
      { path: 'scripts/report/build-report-bundle.mjs', note: 'institutional reports' },
    ]),
    await claim('production-discipline', 'Relay can be operated with credible production discipline.', [
      { path: 'src/api/ops.ts', note: 'ops counters and readiness checks' },
      { path: 'scripts/release/run-release-gate.mjs', note: 'release gate' },
      { path: 'scripts/workspace/workspace-archive.mjs', note: 'backup and import path' },
    ]),
    await claim('foresight-prepackage-ready', 'ACP has a Foresight Engine V2 pre-packaging path.', [
      { path: 'docs/strategy/ACP_ENGINE_V2_POSITIONING.md', note: 'Engine V2 positioning' },
      { path: 'scripts/conference/build-foresight-package.mjs', note: 'Foresight package builder' },
      { path: 'data/prompts/engine-v2/registry.json', note: 'Engine V2 prompt registry' },
      { path: 'src/services/engine-v2.ts', note: 'recursive engine trace implementation' },
    ]),
  ];
  const audit = {
    generatedAt: new Date().toISOString(),
    status: claims.every((item) => item.status === 'pass') ? 'pass' : 'gap',
    claims,
  };
  await writeFile(path.join(outDir, 'technical-completion-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'technical-completion-audit.md'), toMarkdown(audit), 'utf8');
  await writeFile(path.join(outDir, 'remaining-human-layer-work.md'), humanLayerWork(), 'utf8');
  console.log(JSON.stringify({ outDir, status: audit.status, claims: claims.length }, null, 2));
  if (audit.status !== 'pass') process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
