from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.evals._inspect_packet_utils import REPO_ROOT, repo_relative, write_json, write_text


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--native-generation", default=str(REPO_ROOT / "artifacts" / "evals" / "skills" / "measured-comparative" / "summary.json"))
    parser.add_argument("--native-adjudication", default=str(REPO_ROOT / "artifacts" / "evals" / "skills" / "measured-comparative" / "adjudication" / "summary.json"))
    parser.add_argument("--inspect-summary", default=str(REPO_ROOT / "artifacts" / "evals" / "inspect" / "skills-measured-real-run" / "summary.json"))
    parser.add_argument("--out-dir", default=str(REPO_ROOT / "artifacts" / "evals" / "inspect"))
    return parser.parse_args()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def render_markdown(summary: dict[str, Any]) -> str:
    rows = []
    for condition, item in summary["conditionComparison"].items():
        rows.append(
            f"| {condition} | {item['nativeOutputs']} | {item['inspectOutputs']} | {item['nativeAverageOverallScore']:.4f} | {item['inspectJudgeMeanOverall']:.4f} | {item['overallDelta']:+.4f} | {item['inspectQualityMeanOverall']:.4f} | {item['nativeStatusMix']} | {item['inspectStatusMix']} | {item['inspectAdherenceMean']:.4f} |"
        )
    rows_text = "\n".join(rows)
    return f"# ACP Inspect Mirror Fidelity Summary\n\nGenerated: {summary['generatedAt']}\n\nThis summary compares ACP's canonical measured skills slice artifacts with the calibrated real provider-backed Inspect AI mirror run.\n\n## Structural fidelity\n\n- Native cases: **{summary['structuralFidelity']['nativeCaseCount']}**\n- Inspect tasks: **{summary['structuralFidelity']['inspectTaskCount']}**\n- Native outputs: **{summary['structuralFidelity']['nativeOutputCount']}**\n- Inspect outputs: **{summary['structuralFidelity']['inspectOutputCount']}**\n- Conditions match: **{summary['structuralFidelity']['conditionsMatch']}**\n- Families match: **{summary['structuralFidelity']['familiesMatch']}**\n\n## By condition\n\n| Condition | Native outputs | Inspect outputs | Native overall | Inspect calibrated overall | Δ overall | Inspect pre-penalty quality | Native status mix | Inspect status mix | Inspect adherence |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |\n{rows_text}\n\n## Interpretation\n\nThe Inspect layer should be read as a **mirror** of the load-bearing measured slice, not a replacement for ACP's canonical harness. The mirror shows strong structural fidelity when counts, conditions, and families match. The calibrated Inspect scorer now blends model judgment with deterministic condition-discipline checks, which reduces some of the earlier permissive drift while preserving the mirror's ecosystem-legibility role.\n\n## Known drift sources\n\n- native ACP adjudication still uses a richer adjudication stack with arbitration\n- Inspect mirror generation and native generation are comparable surfaces, not identical output traces\n- score alignment is improved but not isomorphic; remaining drift should be interpreted as calibration work, not hidden\n\n## Boundary\n\n- mirror fidelity, not field validation\n- model-graded evidence only, not human review\n- no new efficacy claims created by the Inspect layer\n"


def main() -> None:
    args = parse_args()
    native_generation = read_json(Path(args.native_generation))
    native_adjudication = read_json(Path(args.native_adjudication))
    inspect_summary = read_json(Path(args.inspect_summary))

    native_conditions = sorted(native_generation.get("baselines", []))
    inspect_conditions = sorted(inspect_summary.get("conditions", []))
    native_families = sorted(native_generation.get("familiesCovered", []))
    inspect_families = sorted(inspect_summary.get("familiesCovered", []))

    condition_comparison: dict[str, Any] = {}
    for condition in sorted(set(native_conditions) | set(inspect_conditions)):
        native = native_adjudication.get("byBaseline", {}).get(condition, {})
        inspect = inspect_summary.get("byCondition", {}).get(condition, {})
        condition_comparison[condition] = {
            "nativeOutputs": native.get("outputs", 0),
            "inspectOutputs": inspect.get("outputs", 0),
            "nativeAverageOverallScore": round(float(native.get("averageOverallScore", 0.0)), 4),
            "inspectJudgeMeanOverall": round(float(inspect.get("judgeMeanOverall", 0.0)), 4),
            "inspectQualityMeanOverall": round(float(inspect.get("qualityMeanOverall", 0.0)), 4),
            "overallDelta": round(float(inspect.get("judgeMeanOverall", 0.0)) - float(native.get("averageOverallScore", 0.0)), 4),
            "nativeSubstantiveFailureDetection": round(float(native.get("substantiveFailureDetection", 0.0)), 4),
            "inspectSubstantiveFailureDetection": round(float(inspect.get("substantiveFailureDetection", 0.0)), 4),
            "substantiveDelta": round(float(inspect.get("substantiveFailureDetection", 0.0)) - float(native.get("substantiveFailureDetection", 0.0)), 4),
            "nativeEscalationCorrectness": round(float(native.get("escalationCorrectness", 0.0)), 4),
            "inspectEscalationCorrectness": round(float(inspect.get("escalationCorrectness", 0.0)), 4),
            "escalationDelta": round(float(inspect.get("escalationCorrectness", 0.0)) - float(native.get("escalationCorrectness", 0.0)), 4),
            "nativeClaimBoundaryObedience": round(float(native.get("claimBoundaryObedience", 0.0)), 4),
            "inspectClaimBoundaryObedience": round(float(inspect.get("claimBoundaryObedience", 0.0)), 4),
            "claimBoundaryDelta": round(float(inspect.get("claimBoundaryObedience", 0.0)) - float(native.get("claimBoundaryObedience", 0.0)), 4),
            "nativeArtifactTraceLegibility": round(float(native.get("artifactTraceLegibility", 0.0)), 4),
            "inspectArtifactTraceLegibility": round(float(inspect.get("artifactTraceLegibility", 0.0)), 4),
            "artifactDelta": round(float(inspect.get("artifactTraceLegibility", 0.0)) - float(native.get("artifactTraceLegibility", 0.0)), 4),
            "inspectAdherenceMean": round(float(inspect.get("adherenceMean", 0.0)), 4),
            "inspectProhibitedSkillLeakage": int(inspect.get("prohibitedSkillLeakage", 0)),
            "nativeStatusMix": f"{int(native.get('pass', 0))}/{int(native.get('review', 0))}/{int(native.get('fail', 0))}",
            "inspectStatusMix": f"{int(inspect.get('pass', 0))}/{int(inspect.get('review', 0))}/{int(inspect.get('fail', 0))}",
        }

    summary = {
        "generatedAt": inspect_summary.get("generatedAt"),
        "nativeGenerationSource": repo_relative(args.native_generation),
        "nativeAdjudicationSource": repo_relative(args.native_adjudication),
        "inspectMirrorSource": repo_relative(args.inspect_summary),
        "structuralFidelity": {
            "nativeCaseCount": native_generation.get("totalCases", 0),
            "inspectTaskCount": inspect_summary.get("totalTasks", 0),
            "nativeOutputCount": native_generation.get("totalOutputs", 0),
            "inspectOutputCount": inspect_summary.get("totalOutputs", 0),
            "conditionsMatch": native_conditions == inspect_conditions,
            "familiesMatch": native_families == inspect_families,
            "nativeConditions": native_conditions,
            "inspectConditions": inspect_conditions,
            "nativeFamilies": native_families,
            "inspectFamilies": inspect_families,
        },
        "conditionComparison": condition_comparison,
        "boundary": [
            "Inspect mirror only; native ACP measured slice remains canonical.",
            "Score drift is expected because native ACP uses richer adjudication and arbitration.",
            "This summary supports interoperability and mirror-fidelity claims, not field-efficacy claims.",
        ],
    }

    out_dir = Path(args.out_dir)
    write_json(out_dir / "skills-measured-mirror-summary.json", summary)
    write_text(out_dir / "skills-measured-mirror-summary.md", render_markdown(summary))
    print(json.dumps({"ok": True, "outDir": str(out_dir)}, indent=2))


if __name__ == "__main__":
    main()
