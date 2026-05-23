#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  out_dir="skills/compositions/surface-preflight/out/demo-preflight"
  mkdir -p "$out_dir"
  npm run --silent release:smoke > "$out_dir/release-smoke.json"
  node --input-type=module - "$out_dir" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';

const [outDir] = process.argv.slice(2);
const smoke = JSON.parse(fs.readFileSync(path.join(outDir, 'release-smoke.json'), 'utf8'));
const payload = {
  mode: 'local-smoke',
  checkedAt: new Date().toISOString(),
  releaseSmoke: smoke,
  result: smoke.ok === true ? 'pass' : 'fail',
};
fs.writeFileSync(path.join(outDir, 'preflight.json'), `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
if (payload.result !== 'pass') process.exitCode = 1;
EOF
  exit 0
fi

base_url="$1"
cycle_id="${2:-}"
participant_id="${3:-}"
out_dir="${4:-skills/compositions/surface-preflight/out}"

mkdir -p "$out_dir"

health_file="$out_dir/health.json"
ready_file="$out_dir/ready.json"
session_file="$out_dir/session.json"
preflight_file="$out_dir/preflight.json"

curl -fsS "$base_url/health" > "$health_file"
curl -fsS "$base_url/ready" > "$ready_file"
curl -fsS "$base_url/v1/session" > "$session_file"

view_file=""
if [ "$cycle_id" != "" ] && [ "$participant_id" != "" ]; then
  view_file="$out_dir/view-$cycle_id-$participant_id.json"
  curl -fsS "$base_url/v1/cycles/$cycle_id/participants/$participant_id/view" > "$view_file"
fi

node --input-type=module - "$base_url" "$cycle_id" "$participant_id" "$out_dir" "$health_file" "$ready_file" "$session_file" "$view_file" <<'EOF'
import fs from 'node:fs';

const [baseUrl, cycleId, participantId, outDir, healthFile, readyFile, sessionFile, viewFile] = process.argv.slice(2);
const read = (file) => (file ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);

const payload = {
  baseUrl,
  checkedAt: new Date().toISOString(),
  health: read(healthFile),
  ready: read(readyFile),
  session: read(sessionFile),
  participantView: viewFile ? read(viewFile) : null,
  cycleId: cycleId || null,
  participantId: participantId || null,
};

fs.writeFileSync(`${outDir}/preflight.json`, `${JSON.stringify(payload, null, 2)}\n`);
EOF

cat "$preflight_file"
