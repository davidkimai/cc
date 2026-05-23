from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
INSPECT_PY_ROOT = REPO_ROOT / "evals" / "inspect"
if str(INSPECT_PY_ROOT) not in sys.path:
    sys.path.insert(0, str(INSPECT_PY_ROOT))


def ensure_openai_api_key() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is required for real Inspect runs.")


def run(command: list[str], cwd: Path | None = None) -> None:
    subprocess.run(command, cwd=str(cwd or REPO_ROOT), check=True)


def repo_relative(path: str | Path) -> str:
    return str(Path(path).resolve().relative_to(REPO_ROOT)).replace("\\", "/") if Path(path).resolve().is_relative_to(REPO_ROOT) else str(Path(path).resolve())


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def ensure_export(command: list[str]) -> None:
    run(command)


def as_dict(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump()
    return value


def aggregate_nested_usage(usage: Any) -> dict[str, float]:
    totals: dict[str, float] = {}

    def walk(node: Any, prefix: str = "") -> None:
        node = as_dict(node)
        if isinstance(node, dict):
            for key, value in node.items():
                if isinstance(value, (int, float)):
                    totals[prefix + key] = totals.get(prefix + key, 0.0) + float(value)
                else:
                    walk(value, prefix)
        elif isinstance(node, list):
            for item in node:
                walk(item, prefix)

    walk(usage)
    return {key: round(value, 6) for key, value in totals.items()}


def parse_output_json(sample: Any) -> dict[str, Any] | None:
    completion = sample.output.completion if getattr(sample, "output", None) else ""
    text = completion.strip()
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    if text.startswith("```"):
        text = text[len("```"):].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def score_record(sample: Any, scorer_name: str) -> dict[str, Any]:
    score = sample.scores[scorer_name]
    metadata = as_dict(score.metadata) if score.metadata else {}
    return {
        "value": float(score.value),
        "explanation": score.explanation,
        "metadata": metadata,
    }


def safe_mean(values: list[float]) -> float:
    return round(sum(values) / len(values), 4) if values else 0.0
