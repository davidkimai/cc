#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_DIR="$ROOT/demo"

usage() {
  cat <<'EOF'
Usage: bash scripts/demo/demo-summary.sh [--target DIR]

Prints a compact summary of the canonical ACP Relay demo bundle.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_DIR="${2:?missing value for --target}"
      shift 2
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

python3 - "$TARGET_DIR" <<'PY'
import json
import os
import sys

target = sys.argv[1]

def load(path):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)

manifest = load(os.path.join(target, "bootstrap-manifest.json"))
cycles = load(os.path.join(target, "seed", "cycles.json"))["cycles"]
participants = load(os.path.join(target, "seed", "participants.json"))["participants"]
lifecycle = load(os.path.join(target, "seed", "lifecycle.json"))

print(f"Bundle: {manifest['bundle']} v{manifest['version']}")
print(f"Target: {target}")
print("Cycles:")
for cycle in cycles:
    print(f"  - {cycle['slug']} ({cycle['condition']}): {cycle['title']}")
print(f"Participants: {len(participants)}")
for participant in participants:
    scope = ", ".join(participant["condition_scope"])
    print(f"  - {participant['id']}: {participant['display_name']} [{scope}]")
print("Lifecycle order:")
print("  " + " -> ".join(lifecycle["state_order"]))
print("Condition notes:")
print("  intervention: routed digest plus explanation")
print("  baseline_thread: chronological thread only")
PY
