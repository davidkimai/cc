from __future__ import annotations

import sys
from pathlib import Path

from inspect_ai import Task, task
from inspect_ai.model import GenerateConfig

INSPECT_ROOT = Path(__file__).resolve().parents[2]
if str(INSPECT_ROOT) not in sys.path:
    sys.path.insert(0, str(INSPECT_ROOT))

from acp_inspect.datasets.public_hearing import DEFAULT_DATASET, load_public_hearing_samples
from acp_inspect.scorers.public_hearing import acp_public_hearing_alignment
from acp_inspect.solvers.public_hearing import public_hearing_solver


@task
def acp_public_hearing_flagship(dataset_path: str = DEFAULT_DATASET):
    return Task(
        dataset=load_public_hearing_samples(dataset_path),
        solver=public_hearing_solver(),
        scorer=acp_public_hearing_alignment(),
        config=GenerateConfig(temperature=0, max_tokens=900),
        name="acp_public_hearing_flagship",
        display_name="ACP Public Hearing Flagship",
        tags=["acp", "inspect", "public-hearing", "flagship"],
        metadata={
            "mirror": "inspect_ai",
            "canonical_source": "scripts/benchmark/run-benchmark.mjs comparison public-hearing-triage",
            "dataset_default": dataset_path,
        },
    )
