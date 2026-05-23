#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  cycle_id="demo-export-generation"
  out_dir="skills/compositions/export-generation/out/$cycle_id"
  batch_dir="$out_dir/batch"
  mkdir -p "$out_dir"
  npm run --silent batch:run -- runners/batch/examples/intervention.json --out "$batch_dir" >/dev/null
  node --input-type=module - "$cycle_id" "$out_dir" "$batch_dir" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';

const [cycleId, outDir, batchDir] = process.argv.slice(2);
const cycle = JSON.parse(fs.readFileSync(path.join(batchDir, 'cycle.json'), 'utf8'));
const files = fs.readdirSync(path.join(batchDir, 'exports'))
  .filter((name) => name.endsWith('.md'))
  .sort()
  .map((name) => path.join(batchDir, 'exports', name));
const payload = {
  cycleId,
  generatedCycleId: cycle.id,
  outDir,
  mode: 'all',
  generatedAt: new Date().toISOString(),
  files,
};
fs.writeFileSync(path.join(outDir, 'export-manifest.json'), `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
EOF
  exit 0
fi

cycle_id="$1"
mode="${2:-all}"
out_dir="${3:-skills/compositions/export-generation/out/$cycle_id}"

mkdir -p "$out_dir"

case "$mode" in
  analysis|audit|minimal)
    modes=("$mode")
    ;;
  all)
    modes=(analysis audit minimal)
    ;;
  *)
    echo "invalid mode: $mode" >&2
    exit 1
    ;;
esac

manifest_tmp="$out_dir/.manifest.tmp"
: > "$manifest_tmp"

for export_mode in "${modes[@]}"; do
  response_path="$out_dir/export-response-$export_mode.json"
  npm run cli -- cycle export "$cycle_id" "$export_mode" > "$response_path"
  printf '%s\n' "$response_path" >> "$manifest_tmp"
done

node --input-type=module - "$cycle_id" "$out_dir" "$manifest_tmp" <<'EOF'
import fs from 'node:fs';

const [cycleId, outDir, manifestTmp] = process.argv.slice(2);
const files = fs.readFileSync(manifestTmp, 'utf8').trim().split('\n').filter(Boolean);
const payload = {
  cycleId,
  outDir,
  generatedAt: new Date().toISOString(),
  files,
};
fs.writeFileSync(`${outDir}/export-manifest.json`, `${JSON.stringify(payload, null, 2)}\n`);
fs.rmSync(manifestTmp, { force: true });
EOF

printf '{\n  "cycleId": "%s",\n  "outDir": "%s",\n  "mode": "%s"\n}\n' "$cycle_id" "$out_dir" "$mode"
