#!/usr/bin/env bash
set -euo pipefail

out_dir="${1:-skills/compositions/foresight-submission-prep/out/foresight-submission-prep}"
package_dir="$out_dir/foresight"
mkdir -p "$out_dir"

npm run --silent conference:foresight -- --out "$package_dir" > "$out_dir/foresight-package-summary.json"

node --input-type=module - "$out_dir" "$package_dir" <<'EOF'
import fs from 'node:fs';
import path from 'node:path';

const [outDir, packageDir] = process.argv.slice(2);
const summary = JSON.parse(fs.readFileSync(path.join(outDir, 'foresight-package-summary.json'), 'utf8'));
const required = [
  'reviewer-start-here.md',
  'contribution-list.md',
  'omission-fairness-casebook.md',
  'limitations-and-non-claims.md',
  'artifact-index.json',
];
const missing = required.filter((file) => !fs.existsSync(path.join(packageDir, file)));
const payload = {
  ok: summary.ok === true && missing.length === 0,
  packageDir,
  artifactCount: summary.artifactCount,
  missing,
};
fs.writeFileSync(path.join(outDir, 'composition-summary.json'), `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
if (!payload.ok) process.exitCode = 1;
EOF
