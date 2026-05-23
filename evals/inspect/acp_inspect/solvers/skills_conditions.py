from __future__ import annotations

import json
from typing import Any

from inspect_ai.model import ModelOutput
from inspect_ai.solver import Generate, TaskState, solver


def _is_mock_model(state: TaskState) -> bool:
    return str(state.model).startswith("mockllm/")


def _mock_skills_output(metadata: dict[str, Any]) -> dict[str, Any]:
    condition = str(metadata.get("condition", "no_skill"))
    expected_skill = str(metadata.get("expected_skill", "none"))
    expected_composition = metadata.get("expected_composition")
    expected_escalation = bool(metadata.get("expected_escalation", False))
    expected_signals = [str(item) for item in metadata.get("expected_signals", [])]
    forbidden_claims = [str(item) for item in metadata.get("forbidden_claims", [])]
    artifact_expectations = [str(item) for item in metadata.get("artifact_expectations", [])]

    selected_skill = "none" if condition == "no_skill" else expected_skill
    selected_composition = expected_composition if condition == "composition" else None
    decision = "do_not_use" if selected_skill == "none" else "package_evidence" if selected_composition else "escalate" if expected_escalation else "use_skill"
    rationale = (
        f"Condition {condition} preserved ACP's non-claim boundary while catching the expected failure signals "
        f"for {metadata.get('task_id', 'unknown-task')}."
    )
    return {
        "decision": decision,
        "selectedSkill": selected_skill,
        "selectedComposition": selected_composition,
        "escalation": expected_escalation,
        "detectedFailures": expected_signals,
        "rejectedClaims": forbidden_claims,
        "producedArtifacts": artifact_expectations,
        "rationale": rationale,
        "confidence": 0.78 if expected_escalation else 0.84,
    }


@solver
def skills_condition_solver():
    async def solve(state: TaskState, generate: Generate) -> TaskState:
        if _is_mock_model(state):
            payload = _mock_skills_output(state.metadata)
            state.output = ModelOutput.from_content(model=str(state.model), content=json.dumps(payload))
            state.completed = True
            return state
        return await generate(state)

    return solve
