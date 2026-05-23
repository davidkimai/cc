from __future__ import annotations

from inspect_ai.dataset import Sample

from acp_inspect.utils.io import read_json, resolve_dataset_path

DEFAULT_DATASET = "artifacts/tmp/inspect/exports/public-hearing.json"


def load_public_hearing_samples(dataset_path: str | None = None) -> list[Sample]:
    path = resolve_dataset_path(dataset_path, DEFAULT_DATASET)
    records = read_json(path)
    samples: list[Sample] = []
    for record in records:
        samples.append(
            Sample(
                id=record["id"],
                input=record["input"],
                target=record.get("target", ""),
                metadata=record.get("metadata", {}),
            )
        )
    return samples
