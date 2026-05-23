from __future__ import annotations

import json
from typing import Any

from inspect_ai.model import ModelOutput

SKILLS_OUTPUT_KEYS = {
    "decision",
    "selectedSkill",
    "selectedComposition",
    "escalation",
    "detectedFailures",
    "rejectedClaims",
    "producedArtifacts",
    "rationale",
    "confidence",
}

PUBLIC_HEARING_OUTPUT_KEYS = {
    "recommendedWorkflow",
    "keepBaselineAsComparator",
    "keyTradeoffs",
    "minorityConcernHandling",
    "claimBoundaryWarnings",
    "producedArtifacts",
    "rationale",
    "confidence",
}


def parse_json_completion(text: str) -> dict[str, Any] | None:
    stripped = text.strip()
    if stripped.startswith("```json"):
        stripped = stripped[len("```json"):].strip()
    if stripped.startswith("```"):
        stripped = stripped[len("```"):].strip()
    if stripped.endswith("```"):
        stripped = stripped[:-3].strip()
    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def ensure_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def lower_blob(*parts: Any) -> str:
    items: list[str] = []
    for part in parts:
        if part is None:
            continue
        if isinstance(part, list):
            items.extend(str(item) for item in part)
        elif isinstance(part, dict):
            items.append(json.dumps(part, sort_keys=True))
        else:
            items.append(str(part))
    return " ".join(items).lower()


def boolish(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "1"}
    return bool(value)


def clamp(value: float) -> float:
    return max(0.0, min(1.0, round(float(value), 4)))


def model_name(output: ModelOutput | None, fallback: str) -> str:
    return output.model if output and output.model else fallback
