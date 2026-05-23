#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_DIR="$ROOT/demo"
TARGET_DIR="$ROOT/.acp-demo/acp-relay-demo"
FORCE=0

usage() {
  cat <<'EOF'
Usage: bash scripts/demo/bootstrap-demo.sh [--target DIR] [--force]

Copies the canonical ACP Relay demo bundle into a target directory.

Options:
  --target DIR   Destination directory for the bootstrapped demo bundle.
  --force        Allow bootstrap into a non-empty target directory.
  -h, --help     Show this help text.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_DIR="${2:?missing value for --target}"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Demo source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

if [[ -d "$TARGET_DIR" ]] && find "$TARGET_DIR" -mindepth 1 -maxdepth 1 | read -r _; then
  if [[ "$FORCE" -ne 1 ]]; then
    echo "Target directory is not empty: $TARGET_DIR" >&2
    echo "Use --force to allow overlaying the demo bundle." >&2
    exit 1
  fi
fi

mkdir -p "$TARGET_DIR"
cp -R "$SOURCE_DIR"/. "$TARGET_DIR"/

cat <<EOF
Bootstrapped ACP Relay demo bundle.
Target: $TARGET_DIR
Source:  $SOURCE_DIR

Seeded files:
  - demo/bootstrap-manifest.json
  - demo/seed/cycles.json
  - demo/seed/participants.json
  - demo/seed/lifecycle.json

Prompt packs:
  - docs/pilot/prompt-packs/
  - docs/evaluation/prompt-packs/

Demo summary:
EOF

bash "$ROOT/scripts/demo/demo-summary.sh" --target "$TARGET_DIR"
