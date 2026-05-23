from __future__ import annotations

import sys
from pathlib import Path

from inspect_ai import Task, task
from inspect_ai.model import GenerateConfig

INSPECT_ROOT = Path(__file__).resolve().parents[2]
if str(INSPECT_ROOT) not in sys.path:
    sys.path.insert(0, str(INSPECT_ROOT))

from acp_inspect.datasets.skills_measured import DEFAULT_DATASET, load_skills_measured_samples
from acp_inspect.scorers.adherence import acp_adherence
from acp_inspect.scorers.skills_judge import acp_skills_judge
from acp_inspect.solvers.skills_conditions import skills_condition_solver


@task
def acp_skills_measured(dataset_path: str = DEFAULT_DATASET):
    return Task(
        dataset=load_skills_measured_samples(dataset_path),
        solver=skills_condition_solver(),
        scorer=[
            acp_skills_judge(),
            acp_adherence(),
        ],
        config=GenerateConfig(temperature=0, max_tokens=900),
        name="acp_skills_measured",
        display_name="ACP Skills Measured Slice",
        tags=["acp", "inspect", "skills", "measured"],
        metadata={
            "mirror": "inspect_ai",
            "canonical_source": "evals/skills/tasks/v3-measured-heldout.json",
            "dataset_default": dataset_path,
        },
    )
