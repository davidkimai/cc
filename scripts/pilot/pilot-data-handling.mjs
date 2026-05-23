#!/usr/bin/env node

import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fallbackDataRoot = path.resolve(scriptDir, '..', '..', 'data');

function usage() {
  console.log(`Usage:
  pilot-data-handling.mjs [smoke] [--root PATH]
  pilot-data-handling.mjs capture-export --cycle-id ID --source PATH [--label NAME] [--root PATH]
  pilot-data-handling.mjs log-missingness --cycle-id ID --kind KIND --reason TEXT [--root PATH] [--artifact NAME] [--field NAME] [--scope NAME] [--severity LEVEL] [--status open|resolved] [--count N] [--operator NAME] [--notes TEXT]
  pilot-data-handling.mjs build-handoff --cycle-id ID [--root PATH] [--operator NAME] [--analysis-owner NAME] [--summary TEXT]
  pilot-data-handling.mjs apply-retention --root PATH [--keep-cycles N] [--keep-days N] [--apply]
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function requireValue(args, key, label) {
  const value = args[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing --${key} for ${label}`);
  }
  return value;
}

function resolveRoot(args) {
  return path.resolve(args.root || process.env.ACP_DATA_DIR || fallbackDataRoot);
}

function cycleDir(root, cycleId) {
  return path.join(root, 'pilot', 'cycles', cycleId);
}

function safeCycleId(cycleId) {
  if (!/^[A-Za-z0-9._-]+$/.test(cycleId)) {
    throw new Error(`Invalid cycle id: ${cycleId}`);
  }
  return cycleId;
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'bundle';
}

function isoStamp(value = new Date()) {
  return value.toISOString().replace(/[:.]/g, '-');
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function appendJsonl(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`);
}

async function copyRecursive(sourcePath, targetPath) {
  const stat = await fs.stat(sourcePath);
  if (stat.isDirectory()) {
    await ensureDir(targetPath);
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      await copyRecursive(path.join(sourcePath, entry.name), path.join(targetPath, entry.name));
    }
    return;
  }

  if (stat.isFile()) {
    await ensureDir(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
    return;
  }

  throw new Error(`Unsupported source entry: ${sourcePath}`);
}

async function walkFiles(dirPath, prefix = '') {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const rel = prefix ? path.posix.join(prefix, entry.name) : entry.name;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result.push(...await walkFiles(full, rel));
    } else if (entry.isFile()) {
      result.push({ relativePath: rel, fullPath: full });
    }
  }
  return result;
}

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function loadCycleManifest(cycleRoot, cycleId, createdAt) {
  const manifestPath = path.join(cycleRoot, 'cycle-manifest.json');
  if (await exists(manifestPath)) {
    return { manifestPath, manifest: await readJson(manifestPath) };
  }

  const manifest = {
    cycleId,
    createdAt,
    exports: [],
    retain: false,
  };
  await writeJson(manifestPath, manifest);
  return { manifestPath, manifest };
}

async function saveCycleManifest(manifestPath, manifest) {
  await writeJson(manifestPath, manifest);
}

function parseCount(rawValue, defaultValue) {
  if (rawValue === undefined) {
    return defaultValue;
  }
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid count: ${rawValue}`);
  }
  return parsed;
}

async function commandCaptureExport(args) {
  const root = resolveRoot(args);
  const cycleId = safeCycleId(requireValue(args, 'cycle-id', 'capture-export'));
  const source = path.resolve(requireValue(args, 'source', 'capture-export'));
  const label = args.label || 'relay';
  const stamp = isoStamp();
  const bundleName = `${stamp}-${slugify(label)}`;
  const cycleRoot = cycleDir(root, cycleId);
  const exportRoot = path.join(cycleRoot, 'exports', bundleName);
  await ensureDir(exportRoot);

  await copyRecursive(source, exportRoot);

  const files = await walkFiles(exportRoot);
  const fileEntries = [];
  for (const file of files) {
    const stat = await fs.stat(file.fullPath);
    fileEntries.push({
      relativePath: file.relativePath,
      bytes: stat.size,
      sha256: await sha256(file.fullPath),
    });
  }

  const capturedAt = new Date().toISOString();
  const exportRecord = {
    capturedAt,
    label,
    sourcePath: source,
    bundlePath: exportRoot,
    fileCount: fileEntries.length,
    files: fileEntries,
  };

  const { manifestPath, manifest } = await loadCycleManifest(cycleRoot, cycleId, capturedAt);
  manifest.lastExport = exportRecord;
  manifest.exports = Array.isArray(manifest.exports) ? manifest.exports : [];
  manifest.exports.push({
    capturedAt,
    label,
    bundlePath: exportRoot,
    fileCount: fileEntries.length,
  });
  manifest.updatedAt = capturedAt;
  await saveCycleManifest(manifestPath, manifest);
  await writeJson(path.join(cycleRoot, 'export-manifest.json'), exportRecord);

  console.log(`Captured export for ${cycleId} into ${exportRoot}`);
}

async function commandLogMissingness(args) {
  const root = resolveRoot(args);
  const cycleId = safeCycleId(requireValue(args, 'cycle-id', 'log-missingness'));
  const kind = requireValue(args, 'kind', 'log-missingness');
  const reason = requireValue(args, 'reason', 'log-missingness');
  const entry = {
    loggedAt: new Date().toISOString(),
    cycleId,
    kind,
    artifact: args.artifact || '',
    field: args.field || '',
    scope: args.scope || 'cycle',
    severity: args.severity || 'medium',
    status: args.status || 'open',
    count: parseCount(args.count, 1),
    source: args.source || '',
    operator: args.operator || '',
    reason,
    notes: args.notes || '',
  };

  const cycleRoot = cycleDir(root, cycleId);
  await appendJsonl(path.join(cycleRoot, 'missingness.jsonl'), entry);
  await writeJson(path.join(cycleRoot, 'missingness-latest.json'), entry);

  console.log(`Logged missingness for ${cycleId}: ${kind}`);
}

async function commandBuildHandoff(args) {
  const root = resolveRoot(args);
  const cycleId = safeCycleId(requireValue(args, 'cycle-id', 'build-handoff'));
  const operator = args.operator || '';
  const analysisOwner = args['analysis-owner'] || '';
  const summary = args.summary || '';
  const cycleRoot = cycleDir(root, cycleId);
  const manifestPath = path.join(cycleRoot, 'cycle-manifest.json');
  const exportManifestPath = path.join(cycleRoot, 'export-manifest.json');
  const missingnessPath = path.join(cycleRoot, 'missingness.jsonl');

  const manifest = (await exists(manifestPath)) ? await readJson(manifestPath) : { cycleId };
  const exportManifest = (await exists(exportManifestPath)) ? await readJson(exportManifestPath) : null;
  const missingnessEntries = [];
  if (await exists(missingnessPath)) {
    const lines = (await fs.readFile(missingnessPath, 'utf8')).split('\n').map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      missingnessEntries.push(JSON.parse(line));
    }
  }

  const handoff = [
    `# Pilot Cycle Handoff`,
    ``,
    `- Cycle ID: ${cycleId}`,
    `- Generated at: ${new Date().toISOString()}`,
    `- Operator: ${operator || 'n/a'}`,
    `- Analysis owner: ${analysisOwner || 'n/a'}`,
    summary ? `- Summary: ${summary}` : `- Summary: n/a`,
    ``,
    `## Export bundle`,
    ``,
    exportManifest
      ? `- Bundle path: ${exportManifest.bundlePath}`
      : `- Bundle path: n/a`,
    exportManifest
      ? `- File count: ${exportManifest.fileCount}`
      : `- File count: n/a`,
    ``,
    `## Cycle manifest`,
    ``,
    `- Manifest path: ${manifestPath}`,
    manifest.retain ? `- Retention hold: yes` : `- Retention hold: no`,
    manifest.updatedAt ? `- Manifest updated: ${manifest.updatedAt}` : `- Manifest updated: n/a`,
    ``,
    `## Missingness`,
    ``,
    missingnessEntries.length
      ? `- Logged items: ${missingnessEntries.length}`
      : `- Logged items: 0`,
    ...missingnessEntries.map((entry) => `- ${entry.kind} | ${entry.artifact || entry.field || 'n/a'} | ${entry.status} | ${entry.reason}`),
    ``,
    `## Next owner actions`,
    ``,
    `- Review the export bundle before analysis.`,
    `- Keep missingness visible in reporting.`,
    `- Do not rewrite raw pilot exports in place.`,
    `- Apply retention only after signoff and hold checks.`,
  ].join('\n');

  await fs.writeFile(path.join(cycleRoot, 'handoff.md'), `${handoff}\n`);
  await writeJson(path.join(cycleRoot, 'handoff.json'), {
    cycleId,
    generatedAt: new Date().toISOString(),
    operator,
    analysisOwner,
    summary,
    manifestPath,
    exportManifestPath: exportManifest ? exportManifest.bundlePath : null,
    missingnessCount: missingnessEntries.length,
  });

  console.log(`Built handoff for ${cycleId}`);
}

async function cycleHoldExists(cycleRoot, manifest) {
  return (
    await exists(path.join(cycleRoot, 'hold.lock')) ||
    await exists(path.join(cycleRoot, 'retain.lock')) ||
    Boolean(manifest?.retain)
  );
}

async function commandApplyRetention(args) {
  const root = resolveRoot(args);
  const keepCycles = parseCount(args['keep-cycles'], Number.POSITIVE_INFINITY);
  const keepDays = args['keep-days'] === undefined
    ? Number.POSITIVE_INFINITY
    : parseCount(args['keep-days'], Number.POSITIVE_INFINITY);
  const apply = Boolean(args.apply);
  const cyclesRoot = path.join(root, 'pilot', 'cycles');
  if (!(await exists(cyclesRoot))) {
    console.log(`No pilot cycles found at ${cyclesRoot}`);
    return;
  }

  const entries = await fs.readdir(cyclesRoot, { withFileTypes: true });
  const cycleRows = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const cycleRoot = path.join(cyclesRoot, entry.name);
    const manifestPath = path.join(cycleRoot, 'cycle-manifest.json');
    const manifest = (await exists(manifestPath)) ? await readJson(manifestPath) : {};
    const stat = await fs.stat(cycleRoot);
    const capturedAt = manifest.updatedAt || manifest.createdAt || stat.mtime.toISOString();
    cycleRows.push({
      cycleId: entry.name,
      cycleRoot,
      manifest,
      capturedAt: new Date(capturedAt),
      hold: await cycleHoldExists(cycleRoot, manifest),
    });
  }

  cycleRows.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  const now = Date.now();

  const keptByCount = new Set(cycleRows.slice(0, keepCycles).map((row) => row.cycleId));
  const planned = [];
  for (const row of cycleRows) {
    const ageDays = (now - row.capturedAt.getTime()) / (1000 * 60 * 60 * 24);
    const keepBecauseAge = Number.isFinite(keepDays) && ageDays <= keepDays;
    const keepBecauseCount = keptByCount.has(row.cycleId);
    const keep = row.hold || keepBecauseAge || keepBecauseCount;
    if (!keep) {
      planned.push(row);
    }
  }

  if (!apply) {
    console.log(`Retention dry run for ${cyclesRoot}`);
    for (const row of planned) {
      console.log(`Would remove ${row.cycleId} (${row.cycleRoot})`);
    }
    return;
  }

  for (const row of planned) {
    await fs.rm(row.cycleRoot, { recursive: true, force: true });
    console.log(`Removed ${row.cycleId}`);
  }
}

async function commandSmoke(args) {
  const root = resolveRoot(args);
  const cycleId = args['cycle-id'] || 'pilot-smoke-cycle';
  const source = path.resolve(args.source || path.join(scriptDir, '..', '..', 'demo'));
  const cycleRoot = cycleDir(root, cycleId);

  await commandCaptureExport({
    root,
    'cycle-id': cycleId,
    source,
    label: 'pilot-smoke-demo',
  });
  await commandLogMissingness({
    root,
    'cycle-id': cycleId,
    kind: 'smoke-check',
    reason: 'Pilot data handling smoke path records missingness without changing raw exports.',
    artifact: 'demo-bundle',
    scope: 'cycle',
    severity: 'low',
    status: 'resolved',
    operator: 'pilot-data-smoke',
  });
  await commandBuildHandoff({
    root,
    'cycle-id': cycleId,
    operator: 'pilot-data-smoke',
    'analysis-owner': 'demo-reviewer',
    summary: 'Local smoke workflow for capture, missingness, handoff, and retention dry-run.',
  });
  await commandApplyRetention({
    root,
    'keep-cycles': '10',
  });

  console.log(JSON.stringify({
    status: 'pass',
    cycleId,
    root,
    cycleDir: cycleRoot,
  }, null, 2));
}

async function main() {
  const [subcommand, ...rest] = process.argv.slice(2);
  if (subcommand === '--help' || subcommand === '-h') {
    usage();
    return;
  }

  const args = parseArgs(rest);
  switch (subcommand || 'smoke') {
    case 'smoke':
      await commandSmoke(args);
      return;
    case 'capture-export':
      await commandCaptureExport(args);
      return;
    case 'log-missingness':
      await commandLogMissingness(args);
      return;
    case 'build-handoff':
      await commandBuildHandoff(args);
      return;
    case 'apply-retention':
      await commandApplyRetention(args);
      return;
    default:
      throw new Error(`Unknown subcommand: ${subcommand}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
