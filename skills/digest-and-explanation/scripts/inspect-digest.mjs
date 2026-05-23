#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

function parseArgs(argv) {
  const args = { cycleFile: null, participantId: null, out: 'skills/digest-and-explanation/out/demo-digest' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--cycle-file') {
      args.cycleFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (argv[i] === '--participant') {
      args.participantId = argv[i + 1];
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
const digests = (cycle.digests ?? []).filter((digest) => !args.participantId || digest.participantId === args.participantId || digest.recipient_id === args.participantId);
const items = digests.flatMap((digest) => (digest.items ?? []).map((item) => ({
  digestId: digest.id ?? digest.digest_id,
  participantId: digest.participantId ?? digest.recipient_id,
  contributionId: item.contributionId ?? item.contribution_id,
  explanation_text: item.explanation_text ?? item.explanation,
  bridge_flag: item.bridge_flag ?? item.bridgeFlag ?? false,
})));

const summary = {
  block: 'digest-and-explanation',
  cycleId: cycle.id ?? cycle.cycle_id,
  condition: cycle.condition,
  status: cycle.status,
  digestCount: digests.length,
  itemCount: items.length,
  itemsMissingExplanation: items.filter((item) => typeof item.explanation_text !== 'string' || item.explanation_text.length === 0).length,
  bridgeItemCount: items.filter((item) => item.bridge_flag === true).length,
  items,
  result: digests.length > 0 && items.length > 0 && items.every((item) => item.explanation_text) ? 'pass' : 'fail',
};

writeFileSync(path.join(outDir, 'digest-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.result !== 'pass') process.exitCode = 1;
