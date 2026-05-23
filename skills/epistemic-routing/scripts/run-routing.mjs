#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

function parseArgs(argv) {
  const args = { cycleFile: null, out: 'skills/epistemic-routing/out/demo-routing' };
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

function readCycle(filePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, filePath), 'utf8'));
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(repoRoot, args.out);
mkdirSync(outDir, { recursive: true });
const cycleFile = args.cycleFile ? path.resolve(repoRoot, args.cycleFile) : ensureDemoCycle(args.out);
const cycle = readCycle(cycleFile);
const routingDecisions = cycle.routingDecisions ?? [];
const participantLoad = new Map();
for (const decision of routingDecisions) {
  const recipient = decision.recipientParticipantId ?? decision.recipient_id;
  participantLoad.set(recipient, (participantLoad.get(recipient) ?? 0) + 1);
}

const summary = {
  block: 'epistemic-routing',
  cycleId: cycle.id ?? cycle.cycle_id,
  condition: cycle.condition,
  status: cycle.status,
  routingDecisionCount: routingDecisions.length,
  bridgeDecisionCount: routingDecisions.filter((item) => item.bridgeFlag === true || item.bridge_flag === true).length,
  participantLoad: Object.fromEntries(participantLoad),
  result: cycle.condition === 'intervention' && routingDecisions.length > 0 ? 'pass' : 'fail',
};

writeFileSync(path.join(outDir, 'routing-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.result !== 'pass') process.exitCode = 1;
