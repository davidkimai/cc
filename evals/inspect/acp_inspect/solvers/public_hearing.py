from __future__ import annotations

import json
from typing import Any

from inspect_ai.model import ModelOutput
from inspect_ai.solver import Generate, TaskState, solver


def _is_mock_model(state: TaskState) -> bool:
    return str(state.model).startswith("mockllm/")


def _mock_public_hearing_output(metadata: dict[str, Any]) -> dict[str, Any]:
    preferred_label = str(metadata.get("preferred_label", "A"))
    return {
        "preferredLabel": preferred_label,
        "keepBaselineAsComparator": bool(metadata.get("keep_baseline_as_comparator", True)),
        "keyTradeoffs": [
            "One workflow better supports decision relevance under bounded attention, while the other better preserves plain chronology as a transparent comparator.",
            "The stronger workflow should preserve quieter or minority concerns rather than equating volume with importance.",
        ],
        "minorityConcernHandling": [
            "Quieter or bridge-routed testimony can remain decision relevant even when it is not the loudest material.",
        ],
        "claimBoundaryWarnings": [
            "Do not claim consensus manufacture.",
            "Do not claim field efficacy or proven institutional scale.",
        ],
        "producedArtifacts": metadata.get("artifact_expectations", ["comparison_summary", "claim_boundary_note"]),
        "rationale": "The preferred workflow better supports bounded-attention triage while the alternative remains a necessary comparator for chronology and inspection.",
        "confidence": 0.82,
    }


@solver
def public_hearing_solver():
    async def solve(state: TaskState, generate: Generate) -> TaskState:
        if _is_mock_model(state):
            payload = _mock_public_hearing_output(state.metadata)
            state.output = ModelOutput.from_content(model=str(state.model), content=json.dumps(payload))
            state.completed = True
            return state
        return await generate(state)

    return solve
