#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

function parseArgs(argv) {
  const args = { cycleFile: null, out: 'skills/bridge-exposure/out/demo-bridge' };
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
const routingDecisions = cycle.routingDecisions ?? [];
const digests = cycle.digests ?? [];
const participantExposure = new Map();

for (const digest of digests) {
  const participantId = digest.participantId ?? digest.recipient_id;
  const bridgeItems = (digest.items ?? []).filter((item) => item.bridgeFlag === true || item.bridge_flag === true);
  participantExposure.set(participantId, bridgeItems.length);
}

const summary = {
  block: 'bridge-exposure',
  cycleId: cycle.id ?? cycle.cycle_id,
  condition: cycle.condition,
  status: cycle.status,
  bridgeDecisionCount: routingDecisions.filter((item) => item.bridgeFlag === true || item.bridge_flag === true).length,
  bridgeDigestItemCount: [...participantExposure.values()].reduce((sum, count) => sum + count, 0),
  participantExposure: Object.fromEntries(participantExposure),
  result: cycle.condition === 'intervention' && [...participantExposure.values()].some((count) => count > 0) ? 'pass' : 'fail',
};

writeFileSync(path.join(outDir, 'bridge-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.result !== 'pass') process.exitCode = 1;
