# ACP Skills V3 Research Questions

Status: pre-registered V3 questions

## Primary Question

Do ACP skills materially improve deliberative workflow quality compared with weaker or absent procedural guidance?

## Evidence Ladder Questions

### 1. Structural Maturity

Are skills complete enough to be discoverable, auditable, and composable?

Current answer: yes for Skills V2, based on `skills:audit`. This is necessary but insufficient.

### 2. Runtime Competence

Can an agent or runner select the right skill or composition, use the relevant instructions, and emit a trace that another reviewer can inspect?

Required evidence: task-level traces, selection accuracy, artifact completeness, and failure notes.

### 3. Comparative Behavior Lift

Do full skills outperform no-skill, metadata-only, or thin-skill baselines on deterministic task families?

Required evidence: comparative reports with selection accuracy, omission/fairness catch behavior, escalation correctness, explanation faithfulness, and claim-boundary obedience.

### 4. Operator Utility

Do the skill outputs help a human reviewer notice the right concerns faster and avoid overclaiming?

Required evidence: review protocol, disagreement log, representative cases, and rubric updates from review findings.

### 5. Live-Provider Portability

Can real model calls execute skill-conditioned tasks with valid structured outputs, useful traces, bounded cost, and honest failure capture?

Required evidence: live pilot summary, costs, traces, failures, model split, and divergence notes.

### 6. Field Efficacy

Do skills improve real institutional deliberation outcomes?

Current answer: not claimed. Field efficacy requires external deployment or operator study evidence beyond V3 fixture and pilot artifacts.

## Flagship Reviewer Questions

1. Does `epistemic-routing` improve attention-allocation review or only describe it?
2. Does `digest-and-explanation` reduce explanation overclaiming?
3. Do `omission-critic` and `fairness-contestability-critic` catch failures that thinner guidance misses?
4. Does `abstention-escalation` make low-confidence cases more legible?
5. Does `public-hearing-triage` produce a better issue-review workflow under overload without claiming field validity?
6. Does live `gpt-5.4-mini` handle most structured cases, and which few justify `gpt-5.4` arbitration?

## Claim Boundary

Until V3.3 and V3.4 exist, the strongest allowed claim is: ACP has a runnable deterministic and live-pilot harness for skill-conditioned deliberative workflows, with early evidence about traces, structured output validity, cost, and failure surfaces.
