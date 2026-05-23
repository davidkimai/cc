#!/usr/bin/env bash
set -euo pipefail

out_dir="${1:-skills/compositions/school-board-tradeoff-review/out/school-board-tradeoff-review}"
mkdir -p "$out_dir"

npm run --silent benchmark:compare -- --class school-board-tradeoffs --out "$out_dir/comparison" >/dev/null
npm run --silent report:bundle -- --source "$out_dir/comparison" --out "$out_dir/report" >/dev/null

node --input-type=module - "$out_dir" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';

const [outDir] = process.argv.slice(2);
const comparison = JSON.parse(fs.readFileSync(path.join(outDir, 'comparison', 'comparison-summary.json'), 'utf8'));
const evidenceIndex = JSON.parse(fs.readFileSync(path.join(outDir, 'report', 'evidence-index.json'), 'utf8'));
const payload = {
  ok: comparison.pairSignals?.criteriaEvidencePresent === true && Array.isArray(evidenceIndex.artifacts) && evidenceIndex.artifacts.length > 0,
  scenarioClass: comparison.scenarioClass,
  routingContrast: comparison.pairSignals?.routingContrast ?? false,
  digestContrast: comparison.pairSignals?.digestContrast ?? false,
  criteriaEvidencePresent: comparison.pairSignals?.criteriaEvidencePresent ?? false,
  evidenceFiles: evidenceIndex.artifacts?.length ?? 0,
  claimBoundary: 'school-board tradeoff evidence is decision-support, not proof of legitimacy, adequacy, or resolved community agreement',
};
fs.writeFileSync(path.join(outDir, 'composition-summary.json'), `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
if (!payload.ok) process.exitCode = 1;
EOF
