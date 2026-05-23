#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const requiredAuditEvents = [
  'cycle_created',
  'cycle_opened',
  'submissions_closed',
  'digests_released',
  'cycle_archived',
];

function parseArgs(argv) {
  const args = { cycleFile: null, out: 'skills/operator-audit/out/demo-audit' };
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
const auditEvents = cycle.auditEvents ?? [];
const telemetryEvents = cycle.telemetryEvents ?? [];
const eventTypes = auditEvents.map((event) => event.action ?? event.event_type ?? event.eventType);
const missingAuditEvents = requiredAuditEvents.filter((eventType) => !eventTypes.includes(eventType));

const summary = {
  block: 'operator-audit',
  cycleId: cycle.id ?? cycle.cycle_id,
  condition: cycle.condition,
  status: cycle.status,
  auditEventCount: auditEvents.length,
  telemetryEventCount: telemetryEvents.length,
  exportCount: (cycle.exports ?? []).length,
  requiredAuditEvents,
  missingAuditEvents,
  result: missingAuditEvents.length === 0 && auditEvents.length > 0 ? 'pass' : 'fail',
};

writeFileSync(path.join(outDir, 'audit-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.result !== 'pass') process.exitCode = 1;
