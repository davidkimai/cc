#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

function parseArgs(argv) {
  const args = { cycleFile: null, out: 'skills/overload-governance/out/demo-load' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--cycle-file') {
      args.cycleFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (argv[i] === '--out') {
      args.out = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function ensureDemoCycle(outDir) {
  const cycleFile = path.join(repoRoot, outDir, 'cycle.json');
  if (!existsSync(cycleFile)) {
    execFileSync('npm', ['run', '--silent', 'batch:run', '--', 'runners/batch/examples/intervention.json', '--out', outDir], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
  }
  return cycleFile;
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(repoRoot, args.out);
mkdirSync(outDir, { recursive: true });
const cycleFile = args.cycleFile ? path.resolve(repoRoot, args.cycleFile) : ensureDemoCycle(args.out);
const cycle = JSON.parse(readFileSync(cycleFile, 'utf8'));
const digests = cycle.digests ?? [];
const config = cycle.config ?? {};
const maxDigestItems = config.maxDigestItems ?? config.digest_size_limit ?? Infinity;
const maxBridgeItems = config.maxBridgeItems ?? config.bridge_item_limit ?? Infinity;
const digestChecks = digests.map((digest) => {
  const items = digest.items ?? [];
  const bridgeCount = items.filter((item) => item.bridgeFlag === true || item.bridge_flag === true).length;
  return {
    digestId: digest.id ?? digest.digest_id,
    participantId: digest.participantId ?? digest.recipient_id,
    itemCount: items.length,
    bridgeCount,
    withinItemLimit: items.length <= maxDigestItems,
    withinBridgeLimit: bridgeCount <= maxBridgeItems,
  };
});

const summary = {
  block: 'overload-governance',
  cycleId: cycle.id ?? cycle.cycle_id,
  condition: cycle.condition,
  status: cycle.status,
  maxDigestItems,
  maxBridgeItems,
  digestChecks,
  result: digestChecks.every((item) => item.withinItemLimit && item.withinBridgeLimit) ? 'pass' : 'fail',
};

writeFileSync(path.join(outDir, 'load-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.result !== 'pass') process.exitCode = 1;
