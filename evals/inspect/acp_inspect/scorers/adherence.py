from __future__ import annotations

from typing import Any

from inspect_ai.scorer import Score, mean, scorer

from acp_inspect.utils.schemas import ensure_list, parse_json_completion

NONE_VALUES = {"", "none", "n/a", "na", "null", "not applicable", "not_applicable"}
ARTIFACT_KEYWORDS: dict[str, list[str]] = {
    "ablation_summary": ["ablation"],
    "baseline_release_note": ["baseline", "thread", "release"],
    "claim_boundary_note": ["claim", "boundary", "nonclaim", "non-claim"],
    "claim_safe_notes": ["claim", "safe", "boundary"],
    "comparison_summary": ["comparison", "compare"],
    "critic_flag": ["critic", "critique", "flag", "risk", "warning"],
    "digest_review_trace": ["digest", "explanation", "review"],
    "divergence_note": ["divergence", "mismatch", "difference"],
    "escalation_trace": ["escalation", "escalate", "abstention", "confidence"],
    "failure_note": ["failure", "risk", "warning", "gap"],
    "fairness_trace": ["fairness", "contestability", "minority", "bridge"],
    "implementer_review_trace": ["implementer", "protocol", "conformance", "schema", "review"],
    "limitations_note": ["limitation", "nonclaim", "non-claim", "boundary"],
    "load_warning": ["load", "overload", "warning"],
    "non_use_reason": ["nonuse", "non-use", "do not use", "reject"],
    "omission_trace": ["omission", "missing", "coverage"],
    "overclaim_flag": ["overclaim", "unsupported", "claim"],
    "protocol_drift_flag": ["protocol", "drift", "schema", "vocabulary"],
    "release_recommendation": ["release", "recommendation"],
    "review_recommendation": ["review", "recommendation"],
    "routing_trace": ["routing", "route", "recipient", "bridge"],
    "scale_summary": ["scale", "band"],
}


def _normalize(value: Any) -> str:
    return str(value or "none").strip()


def _normalize_nullable(value: Any) -> str | None:
    normalized = _normalize(value).lower()
    return None if normalized in NONE_VALUES else _normalize(value)


def _is_none(value: str) -> bool:
    return value.lower() in NONE_VALUES


def _normalize_artifact(value: str) -> str:
    return " ".join(value.lower().replace("_", " ").replace("-", " ").split())


def _artifact_produced(expected: str, produced: list[str]) -> bool:
    expected_text = _normalize_artifact(expected)
    keywords = ARTIFACT_KEYWORDS.get(expected, [token for token in expected_text.split(" ") if len(token) > 3])
    for artifact in produced:
        artifact_text = _normalize_artifact(artifact)
        if artifact_text == expected_text:
            return True
        if any(_normalize_artifact(keyword) in artifact_text for keyword in keywords):
            return True
    return False


def evaluate_condition_adherence(metadata: dict[str, Any], parsed: dict[str, Any]) -> dict[str, Any]:
    condition = str(metadata.get("condition", "no_skill"))
    expected_composition = _normalize_nullable(metadata.get("expected_composition"))
    expected_artifacts = ensure_list(metadata.get("artifact_expectations"))
    candidate_skills = {str(item) for item in ensure_list(metadata.get("candidate_skills"))}
    expected_skill = str(metadata.get("expected_skill", "none"))

    selected_skill = _normalize(parsed.get("selectedSkill"))
    selected_skill_is_none = _is_none(selected_skill)
    selected_composition = _normalize_nullable(parsed.get("selectedComposition"))
    produced_artifacts = ensure_list(parsed.get("producedArtifacts"))
    expected_artifact_produced = not expected_artifacts or any(
        _artifact_produced(artifact, produced_artifacts) for artifact in expected_artifacts
    )

    expected_skill_match = (expected_skill == "none" and selected_skill_is_none) or selected_skill == expected_skill
    selected_skill_allowed = selected_skill_is_none or selected_skill in candidate_skills or selected_skill == expected_skill
    expected_composition_match = (
        selected_composition is None if expected_composition is None else selected_composition == expected_composition
    )

    if condition == "no_skill":
        condition_adhered = selected_skill_is_none and selected_composition is None
        prohibited_skill_leakage = not condition_adhered
    elif condition in {"metadata_only", "full_skill"}:
        condition_adhered = selected_composition is None and selected_skill_allowed
        prohibited_skill_leakage = selected_composition is not None
    else:
        condition_adhered = selected_composition == expected_composition and selected_skill_allowed
        prohibited_skill_leakage = selected_composition != expected_composition

    adherence = 1.0 if condition_adhered else 0.0
    if not expected_artifact_produced:
        adherence = min(adherence, 0.5)
    if prohibited_skill_leakage:
        adherence = 0.0

    return {
        "assigned_condition": condition,
        "expected_skill": expected_skill,
        "expected_composition": expected_composition,
        "selected_skill": selected_skill,
        "selected_composition": selected_composition,
        "selected_skill_is_none": selected_skill_is_none,
        "selected_skill_allowed": selected_skill_allowed,
        "expected_skill_match": expected_skill_match,
        "expected_composition_match": expected_composition_match,
        "condition_adhered": condition_adhered,
        "expected_artifact_produced": expected_artifact_produced,
        "prohibited_skill_leakage": prohibited_skill_leakage,
        "adherence": adherence,
    }


@scorer(metrics=[mean()])
def acp_adherence():
    async def score(state, target) -> Score:
        parsed = parse_json_completion(state.output.completion)
        if parsed is None:
            return Score(value=0, explanation="Model output was not valid JSON for adherence scoring.")

        adherence = evaluate_condition_adherence(state.metadata, parsed)
        return Score(
            value=float(adherence["adherence"]),
            explanation="ACP condition adherence and leakage check.",
            metadata=adherence,
        )

    return score
