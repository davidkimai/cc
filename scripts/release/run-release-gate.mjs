import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  return {
    command: argv[0] || 'smoke',
    smoke: argv.includes('--smoke'),
  };
}

async function run(name, command, args, options = {}) {
  const startedAt = Date.now();
  const result = await execFileAsync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
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
  const start = check.stdout.indexOf('{');
  if (start >= 0) {
    check.result = JSON.parse(check.stdout.slice(start));
  }
  return check;
}

async function smoke() {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(repoRoot, 'protocol', 'acp-bundle.manifest.json'), 'utf8'));
  const requiredScripts = ['build', 'typecheck', 'test', 'skills:audit', 'conformance:check', 'release:gate', 'dogfood:relay', 'conference:rehearsal', 'conference:foresight', 'completion:audit'];
  const missingScripts = requiredScripts.filter((script) => !packageJson.scripts[script]);
  return {
    ok: missingScripts.length === 0,
    version: packageJson.version,
    protocolVersion: manifest.version ?? manifest.protocolVersion,
    requiredScripts,
    missingScripts,
  };
}

async function backupCheck() {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-release-backup-data-'));
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'acp-release-backup-out-'));
  const importDir = await mkdtemp(path.join(os.tmpdir(), 'acp-release-backup-import-'));
  try {
    await run('build-for-backup-check', 'npm', ['run', 'build']);
    await withServer(dataDir, async (baseUrl) => {
      await run('adopter-seed', 'npm', ['run', 'adopter:starter', '--', '--base-url', baseUrl, '--out', path.join(outDir, 'seed')], {
        env: { ...process.env, ACP_DATA_DIR: dataDir },
      });
    });
    const exported = await runJson('workspace-export', 'npm', ['run', '--silent', 'workspace:export', '--', '--workspace', 'local-workspace', '--out', outDir], {
      env: { ...process.env, ACP_DATA_DIR: dataDir },
    });
    const imported = await runJson('workspace-import', 'npm', ['run', '--silent', 'workspace:import', '--', '--file', path.join(outDir, 'workspace-backup.json')], {
      env: { ...process.env, ACP_DATA_DIR: importDir },
    });
    return {
      ok: exported.result?.cycleCount > 0 && exported.result?.cycleCount === imported.result?.cycleCount,
      exportCycleCount: exported.result?.cycleCount,
      importCycleCount: imported.result?.cycleCount,
      backupFile: path.join(outDir, 'workspace-backup.json'),
    };
  } finally {
    await rm(dataDir, { recursive: true, force: true });
    await rm(outDir, { recursive: true, force: true });
    await rm(importDir, { recursive: true, force: true });
  }
}

async function withServer(dataDir, fn) {
  const { buildApp } = await import(pathToFileURL(path.join(repoRoot, 'dist', 'src', 'api', 'app.js')).href);
  const app = await buildApp({ dataDir, repoRoot });
  const address = await app.listen({ host: '127.0.0.1', port: 0 });
  try {
    return await fn(address);
  } finally {
    await app.close();
  }
}

async function gate({ smoke: smokeOnly }) {
  const checks = [];
  checks.push({ name: 'release-smoke', status: 'pass', result: await smoke() });
  checks.push(await run('build', 'npm', ['run', 'build']));
  checks.push(await run('typecheck', 'npm', ['run', 'typecheck']));
  if (!smokeOnly) {
    checks.push(await run('test', 'npm', ['test']));
  }
  checks.push(await run('conformance', 'npm', ['run', 'conformance:check']));
  const skillsOut = await mkdtemp(path.join(os.tmpdir(), 'acp-release-skills-'));
  checks.push(await run('skills-audit', 'npm', ['run', 'skills:audit', '--', '--out', skillsOut]));

  const benchmarkOut = await mkdtemp(path.join(os.tmpdir(), 'acp-release-benchmark-'));
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'acp-release-server-'));
  const reportOut = await mkdtemp(path.join(os.tmpdir(), 'acp-release-report-'));
  try {
    checks.push(await run('benchmark-compare', 'npm', ['run', 'benchmark:compare', '--', '--class', 'public-hearing-triage', '--out', benchmarkOut]));
    await withServer(dataDir, async (baseUrl) => {
      checks.push(await run('adopter-starter', 'npm', ['run', 'adopter:starter', '--', '--base-url', baseUrl, '--out', path.join(dataDir, 'adopter')]));
      checks.push(await run('dogfood-relay', 'npm', ['run', 'dogfood:relay', '--', '--base-url', baseUrl, '--out', path.join(dataDir, 'dogfood')]));
      checks.push(await run('workspace-export', 'npm', ['run', 'workspace:export', '--', '--workspace', 'local-workspace', '--out', path.join(dataDir, 'backup')], {
        env: { ...process.env, ACP_DATA_DIR: dataDir },
      }));
    });
    checks.push(await run('workspace-import', 'npm', ['run', 'workspace:import', '--', '--file', path.join(dataDir, 'backup', 'workspace-backup.json')], {
      env: { ...process.env, ACP_DATA_DIR: await mkdtemp(path.join(os.tmpdir(), 'acp-release-import-')) },
    }));
    checks.push(await run('report-bundle', 'npm', ['run', 'report:bundle', '--', '--source', benchmarkOut, '--out', reportOut]));
    checks.push(await run('completion-audit', 'npm', ['run', 'completion:audit', '--', '--out', path.join(dataDir, 'completion')]));
    return { ok: checks.every((check) => check.status === 'pass'), smoke: smokeOnly, checks: checks.map(({ stdout, ...check }) => check) };
  } finally {
    await rm(benchmarkOut, { recursive: true, force: true });
    await rm(skillsOut, { recursive: true, force: true });
    await rm(dataDir, { recursive: true, force: true });
    await rm(reportOut, { recursive: true, force: true });
  }
}

async function main() {
  const { command, smoke: smokeOnly } = parseArgs(process.argv.slice(2));
  const result = command === 'smoke'
    ? await smoke()
    : command === 'backup-check'
      ? await backupCheck()
      : command === 'gate'
        ? await gate({ smoke: smokeOnly })
        : null;
  if (!result) throw new Error('usage: node scripts/release/run-release-gate.mjs <smoke|backup-check|gate> [--smoke]');
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
