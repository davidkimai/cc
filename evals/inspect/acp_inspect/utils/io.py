from __future__ import annotations

import json
from pathlib import Path
from typing import Any

INSPECT_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = INSPECT_ROOT.parents[1]


def repo_root() -> Path:
    return REPO_ROOT


def inspect_root() -> Path:
    return INSPECT_ROOT


def resolve_dataset_path(dataset_path: str | None, default_relative: str) -> Path:
    candidate = Path(dataset_path) if dataset_path else repo_root() / default_relative
    if not candidate.is_absolute():
        candidate = repo_root() / candidate
    return candidate.resolve()


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)
