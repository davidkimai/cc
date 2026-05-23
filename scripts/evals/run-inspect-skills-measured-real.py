from __future__ import annotations

import argparse
import sys
from collections import defaultdict
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
from acp_inspect.tasks.skills_measured_eval import acp_skills_measured


def json_line(summary: dict[str, Any]) -> str:
    import json

    return json.dumps(summary, indent=2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-path", default=str(REPO_ROOT / "artifacts" / "tmp" / "inspect" / "exports" / "skills-measured.json"))
    parser.add_argument("--out-dir", default=str(REPO_ROOT / "artifacts" / "evals" / "inspect" / "skills-measured-real-run"))
    parser.add_argument("--log-dir", default=str(REPO_ROOT / "artifacts" / "tmp" / "inspect" / "logs" / "skills-measured-real-run"))
    parser.add_argument("--model", default="openai/gpt-5.4-mini")
    parser.add_argument("--grader-model", default="openai/gpt-5.4-mini")
    parser.add_argument("--max-samples", type=int, default=4)
    parser.add_argument("--refresh-export", action="store_true")
    return parser.parse_args()


def render_markdown(summary: dict[str, Any]) -> str:
    rows = []
    for condition, item in summary["byCondition"].items():
        rows.append(
            f"| {condition} | {item['outputs']} | {item['judgeMeanOverall']:.4f} | {item['qualityMeanOverall']:.4f} | {item['substantiveFailureDetection']:.4f} | {item['escalationCorrectness']:.4f} | {item['claimBoundaryObedience']:.4f} | {item['artifactTraceLegibility']:.4f} | {item['adherenceMean']:.4f} | {item['prohibitedSkillLeakage']} | {item['pass']} / {item['review']} / {item['fail']} |"
        )
    rows_text = "\n".join(rows)
    return f"# ACP Inspect Mirror — Skills Measured Real Run\n\nGenerated: {summary['generatedAt']}\n\nStatus: {summary['status']}\n\nThis is a real provider-backed Inspect AI mirror run of ACP's measured held-out skills slice.\nThe canonical ACP harness remains the source of truth; this artifact demonstrates that the measured slice can be exercised through Inspect with preserved condition structure and bounded judging logic.\n\nThe current scorer is **calibrated**, not purely permissive model grading: it blends model judgment with deterministic heuristics and condition-discipline penalties so that skill leakage, missed escalation boundaries, and missing artifacts lower the comparative score.\n\n- Model: `{summary['model']}`\n- Grader model: `{summary['graderModel']}`\n- Total tasks: **{summary['totalTasks']}**\n- Total outputs: **{summary['totalOutputs']}**\n- Families covered: **{', '.join(summary['familiesCovered'])}**\n- Conditions: **{', '.join(summary['conditions'])}**\n\n## By Condition\n\n| Condition | Outputs | Calibrated overall | Pre-penalty quality | Substantive | Escalation | Claim boundary | Artifact trace | Adherence | Leakage count | Pass / Review / Fail |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n{rows_text}\n\n## Boundary\n\n- Inspect mirror only; not the canonical ACP evidence surface\n- surrogate/model-graded evaluation only; not human review\n- not field efficacy\n- not fairness solved\n- not operator utility\n"


def main() -> None:
    args = parse_args()
    ensure_openai_api_key()

    dataset_path = Path(args.dataset_path)
    out_dir = Path(args.out_dir)
    log_dir = Path(args.log_dir)

    if args.refresh_export or not dataset_path.exists():
        ensure_export(["npx", "tsx", "scripts/evals/export-inspect-skills-measured.ts", "--out", str(dataset_path)])

    logs = inspect_eval(
        acp_skills_measured(dataset_path=str(dataset_path)),
        model=args.model,
        model_roles={"grader": args.grader_model},
        display="none",
        log_dir=str(log_dir),
        max_samples=args.max_samples,
        tags=["acp", "inspect", "measured", "real-run"],
        metadata={"mirror": "inspect_ai", "packet": "skills_measured_real_run"},
    )
    log = logs[0]

    rows: list[dict[str, Any]] = []
    by_condition: dict[str, list[dict[str, Any]]] = defaultdict(list)
    families = set()
    for sample in log.samples or []:
        metadata = dict(sample.metadata or {})
        output_json = parse_output_json(sample)
        judge = score_record(sample, "acp_skills_judge")
        adherence = score_record(sample, "acp_adherence")
        row = {
            "sampleId": sample.id,
            "taskId": metadata.get("task_id"),
            "family": metadata.get("family"),
            "condition": metadata.get("condition"),
            "judge": judge,
            "adherence": adherence,
            "output": output_json,
            "modelUsage": aggregate_nested_usage(getattr(sample, "model_usage", {})),
            "roleUsage": aggregate_nested_usage(getattr(sample, "role_usage", {})),
        }
        rows.append(row)
        by_condition[str(metadata.get("condition"))].append(row)
        families.add(str(metadata.get("family")))

    condition_summary: dict[str, Any] = {}
    for condition, items in by_condition.items():
        judge_scores = [float(item["judge"]["value"]) for item in items]
        judge_meta = [item["judge"]["metadata"] for item in items]
        adherence_scores = [float(item["adherence"]["value"]) for item in items]
        status_counts = {"pass": 0, "review": 0, "fail": 0}
        for meta in judge_meta:
            status_counts[str(meta.get("final_status", "review"))] = status_counts.get(str(meta.get("final_status", "review")), 0) + 1
        condition_summary[condition] = {
            "outputs": len(items),
            "judgeMeanOverall": safe_mean(judge_scores),
            "qualityMeanOverall": safe_mean([float(meta.get("quality_overall", item["judge"]["value"])) for meta, item in zip(judge_meta, items)]),
            "substantiveFailureDetection": safe_mean([float(meta.get("scores", {}).get("substantiveFailureDetection", 0.0)) for meta in judge_meta]),
            "escalationCorrectness": safe_mean([float(meta.get("scores", {}).get("escalationCorrectness", 0.0)) for meta in judge_meta]),
            "claimBoundaryObedience": safe_mean([float(meta.get("scores", {}).get("claimBoundaryObedience", 0.0)) for meta in judge_meta]),
            "artifactTraceLegibility": safe_mean([float(meta.get("scores", {}).get("artifactTraceLegibility", 0.0)) for meta in judge_meta]),
            "explanationFaithfulness": safe_mean([float(meta.get("scores", {}).get("explanationFaithfulness", 0.0)) for meta in judge_meta]),
            "omissionCatch": safe_mean([float(meta.get("scores", {}).get("omissionCatch", 0.0)) for meta in judge_meta]),
            "fairnessContestabilityCatch": safe_mean([float(meta.get("scores", {}).get("fairnessContestabilityCatch", 0.0)) for meta in judge_meta]),
            "protocolDriftCatch": safe_mean([float(meta.get("scores", {}).get("protocolDriftCatch", 0.0)) for meta in judge_meta]),
            "adherenceMean": safe_mean(adherence_scores),
            "prohibitedSkillLeakage": sum(1 for item in items if item["adherence"]["metadata"].get("prohibited_skill_leakage")),
            "judgeMode": sorted({str(meta.get("judge_mode", "unknown")) for meta in judge_meta}),
            **status_counts,
        }

    summary = {
        "generatedAt": log.stats.completed_at,
        "status": log.status,
        "model": args.model,
        "graderModel": args.grader_model,
        "datasetPath": repo_relative(dataset_path),
        "logLocation": repo_relative(log.location),
        "totalTasks": len({row['taskId'] for row in rows}),
        "totalOutputs": len(rows),
        "familiesCovered": sorted(families),
        "conditions": sorted(by_condition.keys()),
        "byCondition": condition_summary,
        "stats": as_dict(log.stats),
        "results": as_dict(log.results),
        "rows": rows,
        "boundary": [
            "Inspect mirror only; ACP native harness remains canonical.",
            "Real provider-backed generation and model-graded scoring; not human review.",
            "Not field efficacy, fairness solved, operator utility, or institutional legitimacy.",
        ],
    }

    write_json(out_dir / "summary.json", summary)
    write_text(out_dir / "summary.md", render_markdown(summary))
    print(json_line(summary={"ok": True, "outDir": str(out_dir), "outputs": len(rows)}))


if __name__ == "__main__":
    main()
