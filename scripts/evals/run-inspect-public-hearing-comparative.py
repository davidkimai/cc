from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from inspect_ai import eval as inspect_eval

from scripts.evals._inspect_packet_utils import (
    REPO_ROOT,
    aggregate_nested_usage,
    as_dict,
    ensure_export,
    ensure_openai_api_key,
    parse_output_json,
    repo_relative,
    safe_mean,
    score_record,
    write_json,
    write_text,
)
from acp_inspect.tasks.public_hearing_eval import acp_public_hearing_flagship


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-path", default=str(REPO_ROOT / "artifacts" / "tmp" / "inspect" / "exports" / "public-hearing.json"))
    parser.add_argument("--out-dir", default=str(REPO_ROOT / "artifacts" / "evals" / "inspect" / "public-hearing-comparative"))
    parser.add_argument("--log-dir", default=str(REPO_ROOT / "artifacts" / "tmp" / "inspect" / "logs" / "public-hearing-comparative"))
    parser.add_argument("--model", default="openai/gpt-5.4-mini")
    parser.add_argument("--grader-model", default="openai/gpt-5.4-mini")
    parser.add_argument("--refresh-export", action="store_true")
    return parser.parse_args()


def render_markdown(summary: dict[str, Any]) -> str:
    rows = []
    for row in summary["rows"]:
        scores = row["judge"]["metadata"].get("scores", {})
        rows.append(
            f"| {row['sampleId']} | {row['preferredLabelExpected']} | {row['preferredLabelObserved']} | {row['judge']['metadata'].get('final_status', 'unknown')} | {row['judge']['value']:.4f} | {scores.get('workflowPreferenceCorrectness', 0):.4f} | {scores.get('boundedAttentionTriage', 0):.4f} | {scores.get('minorityConcernPreservation', 0):.4f} | {scores.get('claimBoundaryObedience', 0):.4f} |"
        )
    rows_text = "\n".join(rows)
    return f"# ACP Inspect Mirror — Public Hearing Comparative Run\n\nGenerated: {summary['generatedAt']}\n\nStatus: {summary['status']}\n\nThis is a real provider-backed Inspect AI comparative adjudication run over ACP's flagship `public-hearing-triage` benchmark, using paired A/B orderings over actual benchmark outputs.\n\n- Model: `{summary['model']}`\n- Grader model: `{summary['graderModel']}`\n- Samples: **{summary['totalOutputs']}**\n- Preferred-label consistency: **{summary['consistency']['expectedLabelMatchCount']}/{summary['totalOutputs']}**\n\n## Pairwise Results\n\n| Sample | Expected label | Observed label | Final status | Overall | Preference | Bounded attention | Minority concern | Claim boundary |\n| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |\n{rows_text}\n\n## Boundary\n\n- comparative mirror only; not ACP's canonical flagship evidence layer\n- model-graded adjudication only; not human review\n- not field efficacy, consensus manufacture, or institutional scale proof\n" 


def main() -> None:
    args = parse_args()
    ensure_openai_api_key()

    dataset_path = Path(args.dataset_path)
    out_dir = Path(args.out_dir)
    log_dir = Path(args.log_dir)

    if args.refresh_export or not dataset_path.exists():
        ensure_export(["npx", "tsx", "scripts/evals/export-inspect-public-hearing.ts", "--out", str(dataset_path)])

    logs = inspect_eval(
        acp_public_hearing_flagship(dataset_path=str(dataset_path)),
        model=args.model,
        model_roles={"grader": args.grader_model},
        display="none",
        log_dir=str(log_dir),
        max_samples=2,
        tags=["acp", "inspect", "public-hearing", "comparative", "real-run"],
        metadata={"mirror": "inspect_ai", "packet": "public_hearing_comparative"},
    )
    log = logs[0]

    rows: list[dict[str, Any]] = []
    expected_match = 0
    observed_counter: Counter[str] = Counter()
    for sample in log.samples or []:
        metadata = dict(sample.metadata or {})
        output_json = parse_output_json(sample)
        judge = score_record(sample, "acp_public_hearing_alignment")
        observed_label = str((output_json or {}).get("preferredLabel", "invalid"))
        expected_label = str(metadata.get("preferred_label"))
        if observed_label == expected_label:
            expected_match += 1
        observed_counter[observed_label] += 1
        rows.append({
            "sampleId": sample.id,
            "preferredLabelExpected": expected_label,
            "preferredLabelObserved": observed_label,
            "labelMap": metadata.get("label_map"),
            "judge": judge,
            "output": output_json,
            "modelUsage": aggregate_nested_usage(getattr(sample, "model_usage", {})),
            "roleUsage": aggregate_nested_usage(getattr(sample, "role_usage", {})),
        })

    judge_meta = [row["judge"]["metadata"] for row in rows]
    summary = {
        "generatedAt": log.stats.completed_at,
        "status": log.status,
        "model": args.model,
        "graderModel": args.grader_model,
        "datasetPath": repo_relative(dataset_path),
        "logLocation": repo_relative(log.location),
        "totalOutputs": len(rows),
        "consistency": {
            "expectedLabelMatchCount": expected_match,
            "observedLabels": dict(observed_counter),
        },
        "averages": {
            "overall": safe_mean([float(row["judge"]["value"]) for row in rows]),
            "workflowPreferenceCorrectness": safe_mean([float(meta.get("scores", {}).get("workflowPreferenceCorrectness", 0.0)) for meta in judge_meta]),
            "boundedAttentionTriage": safe_mean([float(meta.get("scores", {}).get("boundedAttentionTriage", 0.0)) for meta in judge_meta]),
            "minorityConcernPreservation": safe_mean([float(meta.get("scores", {}).get("minorityConcernPreservation", 0.0)) for meta in judge_meta]),
            "claimBoundaryObedience": safe_mean([float(meta.get("scores", {}).get("claimBoundaryObedience", 0.0)) for meta in judge_meta]),
            "baselineComparatorDiscipline": safe_mean([float(meta.get("scores", {}).get("baselineComparatorDiscipline", 0.0)) for meta in judge_meta]),
            "artifactTraceLegibility": safe_mean([float(meta.get("scores", {}).get("artifactTraceLegibility", 0.0)) for meta in judge_meta]),
        },
        "stats": as_dict(log.stats),
        "results": as_dict(log.results),
        "rows": rows,
        "boundary": [
            "Inspect mirror only; ACP native benchmark harness remains canonical.",
            "Pairwise A/B orderings over actual benchmark outputs.",
            "Model-graded comparative adjudication only; not human review or field evidence.",
        ],
    }

    write_json(out_dir / "summary.json", summary)
    write_text(out_dir / "summary.md", render_markdown(summary))
    print(json.dumps({"ok": True, "outDir": str(out_dir), "outputs": len(rows)}, indent=2))


if __name__ == "__main__":
    main()
