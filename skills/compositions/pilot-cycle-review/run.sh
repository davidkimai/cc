#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  cycle_id="demo-pilot-review"
  out_dir="skills/compositions/pilot-cycle-review/out/$cycle_id"
  mkdir -p "$out_dir"
  npm run --silent batch:run -- runners/batch/examples/intervention.json --out "$out_dir"
  node --input-type=module - "$cycle_id" "$out_dir" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';

const [cycleId, outDir] = process.argv.slice(2);
const cyclePath = path.join(outDir, 'cycle.json');
const cycle = JSON.parse(fs.readFileSync(cyclePath, 'utf8'));
const writeJson = (name, value) => fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);

writeJson('metrics.json', cycle.metrics ?? {});
writeJson('audit-events.json', cycle.auditEvents ?? []);
writeJson('telemetry-events.json', cycle.telemetryEvents ?? []);
writeJson('digests.json', cycle.digests ?? []);
writeJson('routing-decisions.json', cycle.routingDecisions ?? []);
writeJson('exports-index.json', cycle.exports ?? []);
writeJson('analysis-export.json', (cycle.exports ?? []).find((item) => item.mode === 'analysis') ?? {});
writeJson('audit-export.json', (cycle.exports ?? []).find((item) => item.mode === 'audit') ?? {});

const summary = [
  `# Pilot Cycle Review: ${cycleId}`,
  '',
  `- Condition: ${cycle.condition ?? 'unknown'}`,
  `- Status: ${cycle.status ?? 'unknown'}`,
  `- Participants: ${Array.isArray(cycle.participants) ? cycle.participants.length : 0}`,
  `- Contributions: ${Array.isArray(cycle.contributions) ? cycle.contributions.length : 0}`,
  `- Digests: ${Array.isArray(cycle.digests) ? cycle.digests.length : 0}`,
  `- Routing decisions: ${Array.isArray(cycle.routingDecisions) ? cycle.routingDecisions.length : 0}`,
  `- Audit events: ${Array.isArray(cycle.auditEvents) ? cycle.auditEvents.length : 0}`,
  `- Telemetry events: ${Array.isArray(cycle.telemetryEvents) ? cycle.telemetryEvents.length : 0}`,
  '',
  '## Metrics snapshot',
  '',
  '```json',
  JSON.stringify(cycle.metrics ?? {}, null, 2),
  '```',
  '',
];

fs.writeFileSync(path.join(outDir, 'review-summary.md'), `${summary.join('\n')}\n`);
EOF
  printf '{\n  "cycleId": "%s",\n  "outDir": "%s"\n}\n' "$cycle_id" "$out_dir"
  exit 0
fi

cycle_id="$1"
out_dir="${2:-skills/compositions/pilot-cycle-review/out/$cycle_id}"

mkdir -p "$out_dir"

npm run cli -- cycle show "$cycle_id" > "$out_dir/cycle.json"
npm run cli -- cycle metrics "$cycle_id" > "$out_dir/metrics.json"
npm run cli -- cycle audit "$cycle_id" > "$out_dir/audit-events.json"
npm run cli -- cycle telemetry "$cycle_id" > "$out_dir/telemetry-events.json"
npm run cli -- cycle digests "$cycle_id" > "$out_dir/digests.json"
npm run cli -- cycle routing-decisions "$cycle_id" > "$out_dir/routing-decisions.json"
npm run cli -- cycle exports "$cycle_id" > "$out_dir/exports-index.json"
npm run cli -- cycle export "$cycle_id" analysis > "$out_dir/analysis-export.json"
npm run cli -- cycle export "$cycle_id" audit > "$out_dir/audit-export.json"

node --input-type=module - "$cycle_id" "$out_dir" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';

const [cycleId, outDir] = process.argv.slice(2);
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(outDir, name), 'utf8'));

const cycle = readJson('cycle.json');
const metrics = readJson('metrics.json');
const auditEvents = readJson('audit-events.json');
const telemetryEvents = readJson('telemetry-events.json');
const digests = readJson('digests.json');
const routingDecisions = readJson('routing-decisions.json');

const summary = [
  `# Pilot Cycle Review: ${cycleId}`,
  '',
  `- Condition: ${cycle.condition ?? 'unknown'}`,
  `- Status: ${cycle.status ?? 'unknown'}`,
  `- Participants: ${Array.isArray(cycle.participants) ? cycle.participants.length : 0}`,
  `- Contributions: ${Array.isArray(cycle.contributions) ? cycle.contributions.length : 0}`,
  `- Digests: ${Array.isArray(digests) ? digests.length : 0}`,
  `- Routing decisions: ${Array.isArray(routingDecisions) ? routingDecisions.length : 0}`,
  `- Audit events: ${Array.isArray(auditEvents) ? auditEvents.length : 0}`,
  `- Telemetry events: ${Array.isArray(telemetryEvents) ? telemetryEvents.length : 0}`,
  '',
  '## Metrics snapshot',
  '',
  '```json',
  JSON.stringify(metrics, null, 2),
  '```',
  '',
];

fs.writeFileSync(path.join(outDir, 'review-summary.md'), `${summary.join('\n')}\n`);
EOF

printf '{\n  "cycleId": "%s",\n  "outDir": "%s"\n}\n' "$cycle_id" "$out_dir"
