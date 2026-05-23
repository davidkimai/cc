import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = 'true';
    }
  }
  return {
    outDir: path.resolve(repoRoot, flags.out || path.join('artifacts', 'conference', 'rehearsal')),
    skipBuild: flags['skip-build'] === 'true',
  };
}

async function run(name, command, args, options = {}) {
  const startedAt = Date.now();
  const result = await execFileAsync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 40,
    ...options,
  });
  return {
    name,
    status: 'pass',
    durationMs: Date.now() - startedAt,
    stdout: result.stdout.trim().slice(-4000),
  };
}

async function runJson(name, command, args, options = {}) {
  const check = await run(name, command, args, options);
  check.result = parseLastJsonObject(check.stdout);
  return check;
}

function parseLastJsonObject(value) {
  let depth = 0;
  let start = -1;
  let last = null;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      escaped = char === '\\' && !escaped;
      if (char === '"' && !escaped) inString = false;
      if (char !== '\\') escaped = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        last = value.slice(start, index + 1);
      }
    }
  }

  return last ? JSON.parse(last) : null;
}

async function withServer(dataDir, fn) {
  const { buildApp } = await import(pathToFileURL(path.join(repoRoot, 'dist', 'src', 'api', 'app.js')).href);
  const app = await buildApp({ dataDir, repoRoot, storeMode: 'sqlite', sqlitePath: path.join(dataDir, 'acp.sqlite') });
  const baseUrl = await app.listen({ host: '127.0.0.1', port: 0 });
  try {
    return await fn(baseUrl);
  } finally {
    await app.close();
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function repoRelativePath(value) {
  if (typeof value !== 'string') return value;
  if (!path.isAbsolute(value)) return value;
  const normalizedRoot = `${repoRoot}${path.sep}`;
  return value === repoRoot || value.startsWith(normalizedRoot)
    ? path.relative(repoRoot, value).replaceAll(path.sep, '/')
    : value;
}

function sanitizePaths(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizePaths(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePaths(item)]));
  }
  return repoRelativePath(value);
}

async function writeReadme(outDir, summary) {
  const readme = `# ACP Conference Rehearsal Bundle

Generated: ${summary.generatedAt}

This bundle is a reproducible local rehearsal packet for conference, institutional, and partner review.

The **public branch** is expected to keep this README plus \`rehearsal-summary.json\` as the high-signal reviewer surfaces. Re-run \`npm run conference:rehearsal\` locally when you need the full nested benchmark, report, adopter, and dogfood directories.

## Local regenerated contents

- \`flagship-benchmark/\`: public-hearing intervention-vs-baseline benchmark bundle
- \`flagship-report/\`: institutional report generated from the flagship benchmark
- \`dogfood-run/\`: seeded Relay dogfood run through the public HTTP boundary
- \`adopter-http-run/\`: external adopter starter run through the public HTTP boundary
- \`runtime-data/\`: disposable SQLite runtime data used during rehearsal
- \`rehearsal-summary.json\`: command outputs and artifact pointers

## High-Signal Checks

- Flagship criteria evidence: ${summary.flagship?.comparisonSummary?.pairSignals?.criteriaEvidencePresent}
- Dogfood findings: ${summary.dogfood?.result?.findings ?? 'regenerate locally'}
- Adopter status: ${summary.adopter?.result?.status ?? 'unknown'}
- Release smoke: ${summary.releaseSmoke?.result?.ok}
`;
  await writeFile(path.join(outDir, 'README.md'), readme, 'utf8');
}

async function main() {
  const { outDir, skipBuild } = parseArgs(process.argv.slice(2));
  await mkdir(outDir, { recursive: true });
  const runtimeDataDir = path.join(outDir, 'runtime-data');
  await mkdir(runtimeDataDir, { recursive: true });
  const checks = [];

  if (!skipBuild) {
    checks.push(await run('build', 'npm', ['run', 'build']));
  }

  const flagshipBenchmark = await runJson('flagship-benchmark', 'npm', [
    'run',
    '--silent',
    'benchmark:compare',
    '--',
    '--class',
    'public-hearing-triage',
    '--out',
    path.join(outDir, 'flagship-benchmark'),
  ]);
  const flagshipComparisonSummary = JSON.parse(await readFile(path.join(outDir, 'flagship-benchmark', 'comparison-summary.json'), 'utf8'));
  const flagshipBundleManifest = JSON.parse(await readFile(path.join(outDir, 'flagship-benchmark', 'bundle-manifest.json'), 'utf8'));
  if (!flagshipBenchmark.result || !flagshipBenchmark.result.comparisonSummary) {
    flagshipBenchmark.result = {
      mode: 'comparison',
      benchmarkClass: 'public-hearing-triage',
      outDir: path.join(outDir, 'flagship-benchmark'),
      bundleManifest: flagshipBundleManifest,
      comparisonSummary: flagshipComparisonSummary,
    };
  }
  checks.push(flagshipBenchmark);

  const flagshipReport = await runJson('flagship-report', 'npm', [
    'run',
    '--silent',
    'report:bundle',
    '--',
    '--source',
    path.join(outDir, 'flagship-benchmark'),
    '--out',
    path.join(outDir, 'flagship-report'),
  ]);
  checks.push(flagshipReport);

  let dogfood;
  let adopter;
  await withServer(runtimeDataDir, async (baseUrl) => {
    dogfood = await runJson('dogfood-relay', 'npm', [
      'run',
      '--silent',
      'dogfood:relay',
      '--',
      '--base-url',
      baseUrl,
      '--out',
      path.join(outDir, 'dogfood-run'),
    ]);
    checks.push(dogfood);

    adopter = await runJson('adopter-starter', 'npm', [
      'run',
      '--silent',
      'adopter:starter',
      '--',
      '--base-url',
      baseUrl,
      '--out',
      path.join(outDir, 'adopter-http-run'),
    ]);
    checks.push(adopter);
  });

  const releaseSmoke = await runJson('release-smoke', 'npm', ['run', '--silent', 'release:smoke']);
  checks.push(releaseSmoke);

  const dogfoodReport = JSON.parse(await readFile(path.join(outDir, 'dogfood-run', 'report.json'), 'utf8'));
  const summary = sanitizePaths({
    generatedAt: new Date().toISOString(),
    outDir,
    ok:
      checks.every((check) => check.status === 'pass') &&
      flagshipBenchmark.result?.comparisonSummary?.pairSignals?.criteriaEvidencePresent === true &&
      dogfoodReport.findings.length === 0 &&
      adopter.result?.status === 'pass' &&
      releaseSmoke.result?.ok === true,
    flagship: flagshipBenchmark.result,
    flagshipReport: flagshipReport.result,
    dogfood: {
      result: dogfood.result,
      reportPath: path.join(outDir, 'dogfood-run', 'report.json'),
      findings: dogfoodReport.findings.length,
    },
    adopter: adopter.result,
    releaseSmoke,
    checks: checks.map(({ stdout, ...check }) => check),
  });

  await writeJson(path.join(outDir, 'rehearsal-summary.json'), summary);
  await writeReadme(outDir, summary);

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.ok) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
