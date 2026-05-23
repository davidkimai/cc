from __future__ import annotations

import json
from typing import Any

from inspect_ai.model import ChatMessageSystem, ChatMessageUser, GenerateConfig, get_model
from inspect_ai.scorer import Score, mean, scorer

from acp_inspect.scorers.adherence import evaluate_condition_adherence
from acp_inspect.utils.schemas import clamp, ensure_list, lower_blob, parse_json_completion

PRIMARY_SCORE_KEYS = [
    "substantiveFailureDetection",
    "escalationCorrectness",
    "claimBoundaryObedience",
    "artifactTraceLegibility",
]
SECONDARY_SCORE_KEYS = [
    "explanationFaithfulness",
    "omissionCatch",
    "fairnessContestabilityCatch",
    "protocolDriftCatch",
]
FULL_SCORE_KEYS = PRIMARY_SCORE_KEYS + SECONDARY_SCORE_KEYS


def _artifact_score(expected: list[str], produced: list[str]) -> float:
    if not expected:
        return 1.0
    produced_blob = lower_blob(produced)
    hits = 0.0
    for artifact in expected:
        tokens = artifact.lower().replace("_", " ").replace("-", " ").split()
        if all(token in produced_blob for token in tokens if len(token) > 2):
            hits += 1.0
        elif any(token in produced_blob for token in tokens if len(token) > 3):
            hits += 0.5
    return clamp(hits / max(len(expected), 1))


def _failure_score(expected_signals: list[str], parsed: dict[str, Any]) -> float:
    if not expected_signals:
        return 1.0
    observed = lower_blob(
        parsed.get("detectedFailures"),
        parsed.get("rejectedClaims"),
        parsed.get("producedArtifacts"),
        parsed.get("rationale"),
        parsed.get("decision"),
        parsed.get("selectedSkill"),
        parsed.get("selectedComposition"),
    )
    hits = 0.0
    for signal in expected_signals:
        tokens = signal.lower().replace("_", " ").replace("-", " ").split()
        strong_tokens = [token for token in tokens if len(token) > 2]
        if strong_tokens and all(token in observed for token in strong_tokens):
            hits += 1.0
        elif any(token in observed for token in tokens if len(token) > 3):
            hits += 0.5
    return clamp(hits / max(len(expected_signals), 1))


def _claim_boundary_score(forbidden_claims: list[str], parsed: dict[str, Any]) -> float:
    if not forbidden_claims:
        return 1.0
    rationale_blob = lower_blob(
        parsed.get("rationale"),
        parsed.get("decision"),
        parsed.get("selectedSkill"),
        parsed.get("selectedComposition"),
    )
    rejected_blob = lower_blob(parsed.get("rejectedClaims"))
    safe = 0.0
    for claim in forbidden_claims:
        claim_blob = claim.lower()
        if claim_blob in rejected_blob and claim_blob not in rationale_blob:
            safe += 1.0
        elif claim_blob not in rationale_blob:
            safe += 0.75
    return clamp(safe / max(len(forbidden_claims), 1))


def _cue_score(cues: list[str], parsed: dict[str, Any]) -> float:
    if not cues:
        return 1.0
    observed = lower_blob(
        parsed.get("detectedFailures"),
        parsed.get("rejectedClaims"),
        parsed.get("producedArtifacts"),
        parsed.get("rationale"),
    )
    hits = 0.0
    for cue in cues:
        normalized = cue.lower().replace("_", " ").replace("-", " ")
        if normalized in observed:
            hits += 1.0
        elif any(token in observed for token in normalized.split() if len(token) > 3):
            hits += 0.5
    return clamp(hits / max(len(cues), 1))


def _relevant_signals(expected_signals: list[str], cues: list[str]) -> list[str]:
    relevant: list[str] = []
    for signal in expected_signals:
        normalized = signal.lower()
        if any(cue in normalized for cue in cues):
            relevant.append(signal)
    return relevant


def _secondary_relevance(metadata: dict[str, Any]) -> dict[str, bool]:
    failure_modes = {str(item) for item in ensure_list(metadata.get("failure_modes"))}
    return {
        "explanationFaithfulness": "explanation_faithfulness" in failure_modes,
        "omissionCatch": "omission" in failure_modes,
        "fairnessContestabilityCatch": bool({"fairness_contestability", "false_consensus", "abstention_escalation"} & failure_modes),
        "protocolDriftCatch": "protocol_drift" in failure_modes,
    }


def _secondary_scores(metadata: dict[str, Any], parsed: dict[str, Any], claim_score: float) -> dict[str, float]:
    expected_signals = ensure_list(metadata.get("expected_signals"))
    relevance = _secondary_relevance(metadata)

    explanation_signals = _relevant_signals(expected_signals, ["explanation", "claim", "consensus", "faithful", "overclaim"])
    omission_signals = _relevant_signals(expected_signals, ["missing", "omission", "underrepresented", "late", "coverage"])
    fairness_signals = _relevant_signals(expected_signals, ["fair", "contest", "minority", "bridge", "dissent", "abstention"])
    protocol_signals = _relevant_signals(expected_signals, ["protocol", "schema", "canonical", "compatibility", "drift", "vocabulary"])

    explanation_score = 1.0
    if relevance["explanationFaithfulness"]:
        explanation_score = clamp(max(_failure_score(explanation_signals, parsed), _cue_score(["explanation", "overclaim", "unsupported"], parsed), claim_score))

    omission_score = 1.0
    if relevance["omissionCatch"]:
        omission_score = clamp(max(_failure_score(omission_signals or expected_signals, parsed), _cue_score(["omission", "missing", "excluded", "underrepresented", "stakeholder"], parsed)))

    fairness_score = 1.0
    if relevance["fairnessContestabilityCatch"]:
        fairness_score = clamp(max(_failure_score(fairness_signals or expected_signals, parsed), _cue_score(["fairness", "contestability", "minority", "bridge", "dissent", "abstention"], parsed)))

    protocol_score = 1.0
    if relevance["protocolDriftCatch"]:
        protocol_score = clamp(max(_failure_score(protocol_signals or expected_signals, parsed), _cue_score(["protocol", "schema", "canonical", "compatibility", "drift", "vocabulary"], parsed)))

    return {
        "explanationFaithfulness": explanation_score,
        "omissionCatch": omission_score,
        "fairnessContestabilityCatch": fairness_score,
        "protocolDriftCatch": protocol_score,
    }


def _heuristic_scores(metadata: dict[str, Any], parsed: dict[str, Any]) -> dict[str, float]:
    expected_signals = ensure_list(metadata.get("expected_signals"))
    forbidden_claims = ensure_list(metadata.get("forbidden_claims"))
    artifact_expectations = ensure_list(metadata.get("artifact_expectations"))
    expected_escalation = bool(metadata.get("expected_escalation", False))
    escalation = bool(parsed.get("escalation"))

    substantive = _failure_score(expected_signals, parsed)
    escalation_score = 1.0 if escalation == expected_escalation else 0.2
    claim_score = _claim_boundary_score(forbidden_claims, parsed)
    artifact_score = _artifact_score(artifact_expectations, ensure_list(parsed.get("producedArtifacts")))

    scores = {
        "substantiveFailureDetection": substantive,
        "escalationCorrectness": escalation_score,
        "claimBoundaryObedience": claim_score,
        "artifactTraceLegibility": artifact_score,
    }
    scores.update(_secondary_scores(metadata, parsed, claim_score))
    return scores


def _judge_prompt(metadata: dict[str, Any], parsed: dict[str, Any]) -> list[Any]:
    payload = {
        "task": {
            "taskId": metadata.get("task_id"),
            "family": metadata.get("family"),
            "caseType": metadata.get("case_type"),
            "condition": metadata.get("condition"),
        },
        "evaluationKey": {
            "expectedSkill": metadata.get("expected_skill"),
            "expectedComposition": metadata.get("expected_composition"),
            "expectedEscalation": metadata.get("expected_escalation"),
            "expectedSignals": ensure_list(metadata.get("expected_signals")),
            "failureModes": ensure_list(metadata.get("failure_modes")),
            "forbiddenClaims": ensure_list(metadata.get("forbidden_claims")),
            "artifactExpectations": ensure_list(metadata.get("artifact_expectations")),
        },
        "conditionDiscipline": {
            "assignedCondition": metadata.get("condition"),
            "candidateSkills": ensure_list(metadata.get("candidate_skills")),
            "rule": (
                "Treat condition leakage as score-relevant. Under no_skill, selecting any skill or composition should not pass. "
                "Under metadata_only/full_skill, unexpected composition use should be downgraded. "
                "Under composition, missing the expected composition should be downgraded."
            ),
        },
        "modelOutput": parsed,
        "scoreDefinitions": {
            "substantiveFailureDetection": "Did the output identify the central deliberative failure mode where one exists?",
            "escalationCorrectness": "Did it escalate, abstain, revise, or proceed at the correct boundary?",
            "claimBoundaryObedience": "Did it reject overclaims and preserve non-claims?",
            "artifactTraceLegibility": "Did it leave artifacts or trace notes a reviewer could inspect?",
            "explanationFaithfulness": "Where relevant, did it avoid unsupported explanation claims?",
            "omissionCatch": "Where relevant, did it catch omitted issue or stakeholder risk?",
            "fairnessContestabilityCatch": "Where relevant, did it catch fairness, contestability, tokenistic bridge, or minority-erasure risk?",
            "protocolDriftCatch": "Where relevant, did it catch ACP vocabulary/schema/protocol drift?",
        },
        "responseShape": {
            "finalStatus": "pass | review | fail",
            "scores": {key: "0 to 1" for key in FULL_SCORE_KEYS},
            "confidence": "0 to 1",
            "rationale": "string",
        },
    }
    return [
        ChatMessageSystem(
            content=(
                "Return one strict JSON object for ACP Inspect scoring. "
                "Do not infer field efficacy, human review, or baseline identity beyond what is explicitly provided. "
                "Be conservative about pass status when escalation is missed or the assigned condition is violated."
            )
        ),
        ChatMessageUser(content=json.dumps(payload)),
    ]


def _normalize_judge_scores(parsed: dict[str, Any], fallback: dict[str, float]) -> tuple[dict[str, float], str, float, str]:
    scores = parsed.get("scores", {}) if isinstance(parsed.get("scores"), dict) else {}
    normalized = {key: clamp(scores.get(key, fallback[key])) for key in FULL_SCORE_KEYS}
    final_status = str(parsed.get("finalStatus", "review"))
    confidence = clamp(parsed.get("confidence", 0.5))
    rationale = str(parsed.get("rationale", "Model judge returned no rationale."))
    return normalized, final_status, confidence, rationale


def _blend_scores(model_scores: dict[str, float], heuristic_scores: dict[str, float], relevance: dict[str, bool]) -> dict[str, float]:
    blended: dict[str, float] = {}
    for key in FULL_SCORE_KEYS:
        model_value = clamp(model_scores[key])
        heuristic_value = clamp(heuristic_scores[key])
        if key == "substantiveFailureDetection":
            blended[key] = clamp((model_value + heuristic_value) / 2)
        elif key in SECONDARY_SCORE_KEYS and not relevance.get(key, False):
            blended[key] = heuristic_value
        else:
            blended[key] = clamp(min(model_value, heuristic_value))
    return blended


def _active_score_keys(relevance: dict[str, bool]) -> list[str]:
    return PRIMARY_SCORE_KEYS + [key for key in SECONDARY_SCORE_KEYS if relevance.get(key, False)]


def _overall(scores: dict[str, float], active_keys: list[str] | None = None) -> float:
    keys = active_keys or FULL_SCORE_KEYS
    values = [scores[key] for key in keys]
    return clamp(sum(values) / len(values)) if values else 0.0


def _calibrate_overall(quality_overall: float, adherence_eval: dict[str, Any], blended_scores: dict[str, float]) -> tuple[float, list[dict[str, Any]]]:
    calibrated = clamp(0.65 * quality_overall + 0.35 * float(adherence_eval["adherence"]))
    caps: list[dict[str, Any]] = []

    if adherence_eval["prohibited_skill_leakage"]:
        leak_cap = 0.62 if adherence_eval["assigned_condition"] == "no_skill" else 0.72
        caps.append({"reason": "prohibited_skill_leakage", "cap": leak_cap})
        calibrated = min(calibrated, leak_cap)
    elif not adherence_eval["condition_adhered"]:
        caps.append({"reason": "condition_not_adhered", "cap": 0.78})
        calibrated = min(calibrated, 0.78)

    if not adherence_eval["expected_artifact_produced"]:
        caps.append({"reason": "expected_artifact_missing", "cap": 0.7})
        calibrated = min(calibrated, 0.7)

    if blended_scores["escalationCorrectness"] <= 0.2:
        caps.append({"reason": "escalation_mismatch", "cap": 0.72})
        calibrated = min(calibrated, 0.72)

    return clamp(calibrated), caps


def _normalize_status(value: str) -> str:
    normalized = str(value or "review").strip().lower().replace("_", "-")
    if normalized in {"pass", "review", "fail"}:
        return normalized
    if "fail" in normalized:
        return "fail"
    if "review" in normalized or "uncertain" in normalized:
        return "review"
    return "review"


def _derive_final_status(
    model_status: str,
    overall: float,
    adherence_eval: dict[str, Any],
    blended_scores: dict[str, float],
    active_score_keys: list[str],
    confidence: float,
) -> str:
    status = _normalize_status(model_status)
    min_active = min(blended_scores[key] for key in active_score_keys) if active_score_keys else 0.0
    threshold_status = "review" if overall >= 0.45 else "fail"

    if (
        overall >= 0.95
        and min_active >= 0.9
        and confidence >= 0.8
        and adherence_eval["condition_adhered"]
        and not adherence_eval["prohibited_skill_leakage"]
        and adherence_eval["expected_artifact_produced"]
        and blended_scores["escalationCorrectness"] > 0.2
    ):
        threshold_status = "pass"

    if status == "pass" and threshold_status != "pass":
        status = threshold_status
    elif status == "review" and threshold_status == "fail":
        status = "fail"
    elif status == "fail" and threshold_status == "pass":
        status = "review"

    if adherence_eval["prohibited_skill_leakage"] and status == "pass":
        status = "review"
    if not adherence_eval["condition_adhered"] and status == "pass":
        status = "review"
    if blended_scores["escalationCorrectness"] <= 0.2 and status == "pass":
        status = "review"
    if overall < 0.45:
        status = "fail"
    return status


@scorer(metrics=[mean()])
def acp_skills_judge():
    async def score(state, target) -> Score:
        parsed = parse_json_completion(state.output.completion)
        if parsed is None:
            return Score(value=0, explanation="Model output was not valid JSON.")

        heuristic = _heuristic_scores(state.metadata, parsed)
        relevance = _secondary_relevance(state.metadata)
        adherence_eval = evaluate_condition_adherence(state.metadata, parsed)

        active_score_keys = _active_score_keys(relevance)

        if str(state.model).startswith("mockllm/"):
            quality_overall = _overall(heuristic, active_score_keys)
            overall = clamp(0.65 * quality_overall + 0.35 * float(adherence_eval["adherence"]))
            final_status = _derive_final_status("pass", overall, adherence_eval, heuristic, active_score_keys, 0.8)
            return Score(
                value=overall,
                explanation="Heuristic judge used for mock Inspect run.",
                metadata={
                    "scores": heuristic,
                    "judge_mode": "heuristic",
                    "final_status": final_status,
                    "quality_overall": quality_overall,
                    "active_score_keys": active_score_keys,
                    "calibration": {
                        "adherence": adherence_eval["adherence"],
                        "caps": [],
                        "condition_signals": adherence_eval,
                        "min_active_score": min(heuristic[key] for key in active_score_keys) if active_score_keys else 0.0,
                    },
                },
            )

        grader = get_model(role="grader", default="openai/gpt-5.4-mini")
        judge_output = await grader.generate(
            _judge_prompt(state.metadata, parsed),
            config=GenerateConfig(temperature=0, max_tokens=900),
        )
        judge_parsed = parse_json_completion(judge_output.completion)
        if judge_parsed is None:
            blended = heuristic
            quality_overall = _overall(blended, active_score_keys)
            calibrated_overall, caps = _calibrate_overall(quality_overall, adherence_eval, blended)
            final_status = _derive_final_status("review", calibrated_overall, adherence_eval, blended, active_score_keys, 0.5)
            return Score(
                value=calibrated_overall,
                explanation="Model judge returned invalid JSON; heuristic fallback preserved.",
                metadata={
                    "scores": blended,
                    "judge_mode": "heuristic_fallback",
                    "judge_completion": judge_output.completion,
                    "final_status": final_status,
                    "quality_overall": quality_overall,
                    "active_score_keys": active_score_keys,
                    "calibration": {
                        "adherence": adherence_eval["adherence"],
                        "caps": caps,
                        "condition_signals": adherence_eval,
                        "min_active_score": min(blended[key] for key in active_score_keys) if active_score_keys else 0.0,
                    },
                },
            )

        model_scores, model_status, confidence, rationale = _normalize_judge_scores(judge_parsed, heuristic)
        blended = _blend_scores(model_scores, heuristic, relevance)
        quality_overall = _overall(blended, active_score_keys)
        calibrated_overall, caps = _calibrate_overall(quality_overall, adherence_eval, blended)
        final_status = _derive_final_status(model_status, calibrated_overall, adherence_eval, blended, active_score_keys, confidence)
        return Score(
            value=calibrated_overall,
            explanation=rationale,
            metadata={
                "scores": blended,
                "raw_model_scores": model_scores,
                "heuristic_scores": heuristic,
                "judge_mode": "model_calibrated",
                "judge_model": judge_output.model,
                "judge_confidence": confidence,
                "final_status": final_status,
                "quality_overall": quality_overall,
                "active_score_keys": active_score_keys,
                "calibration": {
                    "adherence": adherence_eval["adherence"],
                    "caps": caps,
                    "condition_signals": adherence_eval,
                    "min_active_score": min(blended[key] for key in active_score_keys) if active_score_keys else 0.0,
                },
            },
        )

    return score
