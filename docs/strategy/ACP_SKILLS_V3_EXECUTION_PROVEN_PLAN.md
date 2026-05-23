# ACP Skills V3 Execution-Proven Plan

Status: active V3 charter  
Owner: ACP senior researcher / engineer  
Goal: prove ACP skills materially improve deliberative workflow execution, not merely packaging maturity

## 1. Current Denominator

Skills V2 is structurally complete: the suite has a maturity standard, registry, S3/S4 skills, compositions, release-gate integration, and passing `skills:audit`.

Skills V3 uses that as infrastructure, not as proof. The new question is whether skills improve behavior in reviewer-relevant task settings.

## 2. Evidence Ladder

| Layer | What it can support | What it cannot support |
| --- | --- | --- |
| Structural maturity | Skills are well packaged and auditable | Runtime competence |
| Runtime competence | Skills can be selected, invoked, and traced | Comparative lift |
| Comparative lift | Full skills outperform weaker baselines on fixtures | Field efficacy |
| Operator utility | Reviewers find outputs legible and useful | General civic impact |
| Live-provider portability | Real model calls can execute skill-conditioned tasks under budget | Broad model robustness |
| Field efficacy | Requires external, real-world study evidence | Not claimed in V3 fixtures |

## 3. Packet Queue

### V3.0 - Charter And Control Plane

Freeze this plan, research questions, eval matrix, golden principles, short repo map, and execution status.

Exit: V3 questions and non-claims are explicit; V3.1 and V3.1-LP are named next.

### V3.1 - Deterministic Skill Efficacy Harness

Build closed-world fixtures, rubrics, goldens, runner, reports, and traces.

Exit: deterministic harness runs locally and emits reviewable artifacts. Mark in progress until the full 48-case minimum exists.

### V3.1-LP - Narrow Live-Provider Pilot Now

Run a small, cost-controlled live-provider pilot in parallel with V3.1.

Exit: real provider calls, structured outputs, traces, cost/latency, and failures are artifactized within the pilot cap.

### V3.2 - Runtime Selection And Trace Layer

Build repo-local skill runtime surfaces for selection, invocation, composition routing, and trace generation.

### V3.3 - Comparative Baselines

Compare no-skill, metadata-only, full robust skill, and composition workflows.

### V3.4 - Human / Operator Review Layer

Add review protocol, disagreement log, representative case review, and rubric refinements.

### V3.5 - Broad Cost-Controlled Live Wave

Run the larger live-provider wave only after deterministic harness, baseline comparisons, and operator review exist.

### V3.6 - Repo Organization And Drift Reduction

Only after proof surfaces exist, reduce registry/layout drift and add gardener tooling.

### V3.7 - Conference-Facing Packaging

Refresh Foresight-facing materials around Skills V3 evidence, limits, and casebooks.

## 4. Live-Provider Budget Policy

- V3.1-LP pilot target: `$10-$15`.
- Total V3 live-provider default: `$30`.
- Absolute ceiling: `$50`, only with explicit strategic justification.
- Default model: `gpt-5.4-mini`.
- `gpt-5.4` use: tiny arbitration slice only.

Budget artifacts must report estimated spend, calls, latency, model split, failures, and any reason to exceed the pilot target.

## 5. Non-Claims

V3 artifacts may claim fixture-level and pilot-level evidence only. They must not claim:

- real-world civic efficacy
- full comparative superiority before V3.3
- fairness solved
- field readiness
- legal adequacy for public hearings

## 6. Branch And Worktree Guidance

The current tree is broad and mixed from prior ACP completion work. Do not clean, delete, stage broadly, or reorganize before the V3 evidence harness exists. Preserve a claims-safe baseline separately from future broad live-provider or organization work.

## 7. Completion Rule

Skills V3 is complete only when deterministic fixtures, runtime traces, comparative baselines, operator review, live-provider evidence, and conference-facing artifacts all exist. V3.0 plus V3.1-LP is a kickoff, not final proof.
