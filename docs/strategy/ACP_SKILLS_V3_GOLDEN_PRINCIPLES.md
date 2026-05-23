# ACP Skills V3 Golden Principles

Status: V3 taste and invariant source

## 1. Harness First

Do not broaden the suite before there is a harness that can show whether skills helped.

Mechanical target: `skills:eval` must emit traces, reports, and failure casebooks.

## 2. Eval First

Pre-register tasks, rubrics, goldens, and negative controls before making claims.

Mechanical target: tests fail when required families or negative controls are missing.

## 3. Closed-World Before Broad Live

Use deterministic fixtures before broad live-provider waves.

Mechanical target: V3.1-LP may run now, but V3.5 remains blocked on deterministic, comparative, and operator-review evidence.

## 4. Trace Everything

Any meaningful run must leave enough evidence for a later agent or reviewer to reconstruct what happened.

Mechanical target: every task emits a trace with selected skill, expected skill, output, score, failures, artifacts, and claim-boundary status.

## 5. Skills Are Procedural, Not Semantic Truth

Protocol meaning lives in specs, protocol bundles, and typed implementation models. Skills teach agents how to use those surfaces.

Mechanical target: eval rubrics include claim-boundary and protocol-compliance checks.

## 6. Negative Controls Matter

Every family needs cases where a skill should not be used, a release should not happen, or a claim should be rejected.

Mechanical target: family coverage tests require negative-control cases.

## 7. Cost Is Evidence

Live-provider runs must show model split, latency, estimated cost, and failures.

Mechanical target: live pilot refuses to run above the budget cap and always writes `costs.json`.

## 8. Preserve Failures

Do not retry away or hide invalid outputs, overclaims, or model failures.

Mechanical target: reports include failure casebooks, and live traces include raw failure reason without secrets.

## 9. Do Not Overclaim

Fixture lift is not field efficacy. Live portability is not broad comparative superiority.

Mechanical target: docs and reports state allowed and disallowed claims.

## 10. Short Packets, Repairable Artifacts

Each packet should answer one thesis-bearing question and leave reusable fixtures, traces, reports, or checks.
