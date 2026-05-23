#!/usr/bin/env bash
set -euo pipefail

out_dir="${1:-skills/compositions/public-hearing-end-to-end/out/public-hearing-end-to-end}"
mkdir -p "$out_dir"

npm run --silent benchmark:compare -- --class public-hearing-triage --out "$out_dir/comparison" >/dev/null
npm run --silent benchmark:ablation -- --class public-hearing-triage --out "$out_dir/ablation" >/dev/null
npm run --silent benchmark:scale -- --out "$out_dir/scale" >/dev/null

node --input-type=module - "$out_dir" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';

const [outDir] = process.argv.slice(2);
const comparison = JSON.parse(fs.readFileSync(path.join(outDir, 'comparison', 'comparison-summary.json'), 'utf8'));
const ablation = JSON.parse(fs.readFileSync(path.join(outDir, 'ablation', 'ablation-summary.json'), 'utf8'));
const scale = JSON.parse(fs.readFileSync(path.join(outDir, 'scale', 'scale-summary.json'), 'utf8'));
const payload = {
  ok: true,
  comparisonSignals: comparison.pairSignals,
  ablationSignals: ablation.signals,
  scaleBands: scale.bands?.map((band) => ({ band: band.band, contributionCount: band.contributionCount })) ?? [],
};
fs.writeFileSync(path.join(outDir, 'composition-summary.json'), `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
EOF
