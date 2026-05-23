# ACP Inspect AI Integration Plan

Status: proposed integration plan  
Owner: senior research / eval engineering  
Intent: make ACP's load-bearing evaluation surfaces legible inside the Inspect AI ecosystem **without** rewriting ACP around Inspect or weakening ACP's current procedural-evidence strengths.

## Executive judgment

ACP should **not** migrate its evaluation system wholesale into Inspect AI.

ACP **should** add a **thin, Inspect-compatible mirror layer** for its most load-bearing evidence slices.

That is the high-taste move.

Why:

- Inspect AI is now a recognizable standard in the AI safety / eval ecosystem.
- Reviewers who are fluent in modern eval infrastructure will trust ACP faster if they can see at least part of its evidence expressed in a familiar frame.
- But ACP's strongest value is not generic model benchmarking. It is a **protocol-first, procedural, contestability-centered evaluation program** with treatment conditions, fidelity, blinding, and artifact preservation. A full migration would create churn and likely flatten what is distinctive.

The right objective is therefore:

> **Expose ACP's strongest eval slices through Inspect AI while keeping the current repo-native harness as the source of truth.**

## Why this matters

### For AI safety / eval-native reviewers

Inspect compatibility improves:

- immediate legibility
- replication confidence
- task/scorer familiarity
- interoperability with outside labs
- perceived seriousness of the evaluation stack

### For Supercooperation / civic-governance reviewers

Inspect integration is **not** the center of the story.

The center remains:

- bounded attention
- inspectable public reasoning
- contestability
- pluralism-preserving compression
- protocol substrate + procedural control surface

For this audience, Inspect is a **credibility multiplier**, not the main thesis.

## Non-goals

Do **not** pursue these attractors:

1. **Full eval migration**  
   Rewriting ACP's entire harness into Inspect would be high-churn and low-judgment.
2. **Cosmetic badge-chasing**  
   A trivial wrapper that changes vocabulary but not substance is not worth doing.
3. **Replacing ACP's fidelity logic with generic scoring**  
   Adherence, prohibited leakage, and procedural condition materialization are part of the research contribution.
4. **Letting Inspect redefine ACP's identity**  
   ACP should not become "yet another eval repo." It should remain a civic / procedural evaluation program that happens to be Inspect-compatible.

## Source-of-truth rule

ACP's canonical sources remain:

- task truth: `evals/skills/`, `benchmarks/`, `fixtures/`
- procedural condition truth: `src/skills/`
- study / judging logic truth: `scripts/evals/`
- claims truth: curated artifacts and repo docs

The Inspect layer should be a **mirror / adapter**, not a second competing truth source.

## What to port first

Port only the slices that carry the most reviewer value.

### Tier 1 — required

#### 1. Skills measured held-out slice

Canonical source:
- `evals/skills/tasks/v3-measured-heldout.json`
- `scripts/evals/run-skills-measured-comparative.mjs`
- `scripts/evals/judge-skills-measured-outputs.mjs`
- `src/skills/materialize.ts`
- `src/skills/adherence.ts`

Why first:
- this is ACP's strongest **measured** skill-evidence slice
- it already uses real model outputs plus blinded surrogate judging
- it maps naturally onto Inspect's dataset / solver / scorer abstractions

#### 2. Flagship `public-hearing-triage` benchmark

Canonical source:
- `benchmarks/scenarios/public-hearing-triage/`
- `scripts/benchmark/run-benchmark.mjs`
- `scripts/report/build-report-bundle.mjs`

Why second:
- this is ACP's strongest civic denominator
- it shows ACP is not just a skill micro-benchmark suite
- it anchors the protocol + workflow thesis in a public-reasoning task family

### Tier 2 — optional after Tier 1

#### 3. Deterministic fixture mirror

Canonical source:
- `evals/skills/tasks/v3-slice.json`
- `evals/skills/tasks/v3-hard-cases.json`
- `scripts/evals/run-skills-evals.mjs`

Why optional:
- useful for coverage and regression
- less persuasive than the measured slice
- should not be the first thing reviewers see

### Tier 3 — defer unless needed

Do not port first:

- live-provider portability artifacts
- operator-review packet generation
- full claims-package generation
- the entire conference packaging layer

Those are important to ACP, but they are not the highest-yield entrypoint for Inspect integration.

## ACP → Inspect mapping

| ACP concept | Current ACP source | Inspect AI mirror |
| --- | --- | --- |
| task fixtures | `evals/skills/tasks/*.json`, `benchmarks/scenarios/*` | Inspect datasets |
| intervention conditions | `no_skill`, `metadata_only`, `full_skill`, `composition` in `src/skills/materialize.ts` / `src/skills/conditions.ts` | Inspect solver variants or task params |
| structured model output | repo-native JSON schemas in `scripts/evals/*` | Inspect model outputs with JSON-constrained prompts |
| blinded surrogate judging | `scripts/evals/judge-skills-measured-outputs.mjs` | Inspect scorer using judge model |
| adherence / fidelity | `src/skills/adherence.ts` | Inspect scorer or post-run metric |
| failure-mode dimensions | `evals/skills/rubrics/v3-rubrics.json` | Inspect sub-scores / metrics |
| traces and artifact expectations | `src/skills/trace.ts`, artifact outputs | Inspect sample metadata + stored logs |
| arbitration | `gpt-5.4` on disagreements | Inspect secondary scorer / arbitration path |

## Architecture choice

### Recommended architecture: mirror layer with exported normalized inputs

Do not reimplement ACP's task semantics from scratch in Python if you can avoid it.

Instead:

1. keep ACP tasks in their current JSON/TS sources
2. export normalized Inspect-ready inputs from ACP's current task layer
3. let Inspect consume those normalized inputs
4. implement Inspect-native scorers where they add external legibility
5. preserve ACP's existing artifact pipeline for final claims

This reduces semantic drift.

## Concrete file layout

Create a dedicated mirror tree under `evals/inspect/`.

### Proposed structure

```text
evals/inspect/
  README.md
  pyproject.toml
  acp_inspect/
    __init__.py
    datasets/
      skills_measured.py
      public_hearing.py
    solvers/
      skills_conditions.py
      public_hearing.py
    scorers/
      skills_judge.py
      adherence.py
      deterministic.py
    tasks/
      skills_measured_eval.py
      public_hearing_eval.py
    utils/
      io.py
      pricing.py
      schemas.py
      traces.py
  exports/
    .gitkeep
```

### Proposed bridge scripts in ACP's existing stack

```text
scripts/evals/export-inspect-skills-measured.mjs
scripts/evals/export-inspect-public-hearing.mjs
```

These should generate normalized JSONL or JSON payloads into `evals/inspect/exports/`.

## Phase-by-phase implementation plan

## Phase 0 — framing and boundary docs

### Deliverable
A short README that explains:

- ACP does not replace its native harness with Inspect
- Inspect is a compatibility / legibility layer
- ACP's source of truth remains repo-native
- Inspect results must use the same claims discipline as native ACP results

### Files
- `evals/inspect/README.md`

### Success bar
A skeptical reviewer should understand in 60 seconds:

- why Inspect is here
- what it mirrors
- what it does **not** supersede

## Phase 1 — measured skills slice export

### Goal
Make the 14-case held-out measured slice runnable in Inspect without semantic drift.

### Deliverables

#### A. Export bridge
Add:
- `scripts/evals/export-inspect-skills-measured.mjs`

This script should:
- read `evals/skills/tasks/v3-measured-heldout.json`
- materialize condition payloads using ACP's existing task semantics where needed
- emit one normalized Inspect-ready record per `(task, condition)` pair
- include metadata fields:
  - `task_id`
  - `family`
  - `case_type`
  - `condition`
  - `expected_skill`
  - `expected_composition`
  - `expected_escalation`
  - `expected_signals`
  - `forbidden_claims`
  - `artifact_expectations`

#### B. Inspect dataset
Add:
- `evals/inspect/acp_inspect/datasets/skills_measured.py`

It should load the exported normalized records, not re-derive ACP semantics itself.

#### C. Inspect solver
Add:
- `evals/inspect/acp_inspect/solvers/skills_conditions.py`

The solver should expose the four ACP conditions:
- `no_skill`
- `metadata_only`
- `full_skill`
- `composition`

Important: the solver should preserve ACP's non-claim boundary in all conditions.

#### D. Inspect scorer set
Add:
- `evals/inspect/acp_inspect/scorers/skills_judge.py`
- `evals/inspect/acp_inspect/scorers/adherence.py`

Scorers should compute at minimum:
- substantive failure detection
- escalation correctness
- claim-boundary obedience
- artifact/trace legibility
- adherence / prohibited leakage

#### E. Inspect task entrypoint
Add:
- `evals/inspect/acp_inspect/tasks/skills_measured_eval.py`

This should expose a minimal reproducible evaluation entrypoint for the measured slice.

### Success bar
A reviewer should be able to say:

> ACP's measured skill-intervention slice is available in Inspect-compatible form, with preserved condition structure and bounded judging logic.

## Phase 2 — flagship public-hearing task

### Goal
Make ACP's most compelling civic benchmark visible in the same eval ecosystem language.

### Deliverables

#### A. Export bridge
Add:
- `scripts/evals/export-inspect-public-hearing.mjs`

This should normalize:
- intervention scenario
- baseline-thread scenario
- key evidence expectations
- criteria metadata
- procedural-layer expectations

#### B. Inspect dataset
Add:
- `evals/inspect/acp_inspect/datasets/public_hearing.py`

#### C. Solver
Add:
- `evals/inspect/acp_inspect/solvers/public_hearing.py`

This should not try to simulate the full Relay app. It should evaluate the benchmark in a structured task frame consistent with the repo's benchmark semantics.

#### D. Scorers
Port the dimensions most aligned with ACP's thesis:
- routing / decision relevance
- omission catch
- contestability / fairness catch
- explanation faithfulness
- escalation appropriateness
- artifact legibility

### Success bar
ACP can point to an Inspect-compatible flagship civic task that demonstrates the project is about public reasoning workflows, not only skill selection.

## Phase 3 — deterministic mirror for regression and coverage

### Goal
Expose the deterministic fixture suite as a secondary Inspect-compatible regression surface.

### Deliverables
- mirror `v3-slice` and `v3-hard-cases`
- implement a deterministic scorer from expected signals / artifacts
- label this surface clearly as **fixture-level / regression / non-field evidence**

### Success bar
Inspect users can run ACP regression-style fixture checks, but no one mistakes them for the primary empirical claim.

## Phase 4 — reviewer and reproduction integration

### Goal
Expose the Inspect layer in public docs without letting it dominate ACP's identity.

### Documentation updates
Update:
- `README.md`
- `REPRODUCE.md`
- `SUBMISSION_REPO_MAP.md`
- possibly `CLAIMS_AND_NON_CLAIMS.md`

### Exact framing to use
Use language like:

> ACP's canonical evaluation harness remains repo-native because it couples civic task semantics, procedural condition materialization, fidelity analysis, and curated evidence generation. The repo also provides an Inspect-compatible mirror for the load-bearing measured skills slice and flagship civic benchmark so outside evaluators can exercise ACP through a standard eval interface.

Do **not** say:

- "ACP now uses Inspect AI for all evals"
- "Inspect integration validates ACP"
- "Inspect makes ACP field-ready"

## Package management recommendation

ACP is a Node/TS repo. Inspect is Python-native.

Do not contaminate the main JS workflow unnecessarily.

### Recommended setup

Inside `evals/inspect/` add:
- `pyproject.toml`
- locked Python dependency set for Inspect-related execution only

Keep the JS repo root as the main operational environment.

### Why this is the right compromise

- keeps Inspect isolated
- preserves repo cleanliness
- makes it obvious this is an adapter layer
- avoids forcing all ACP contributors into Python-first workflows

## Scoring design guidance

ACP should not port generic accuracy metrics first.

The most thesis-aligned scorer set is:

1. **substantive failure detection**
2. **escalation correctness**
3. **claim-boundary obedience**
4. **artifact / trace legibility**
5. **adherence / prohibited leakage**

Why this order:
- it matches ACP's research claims
- it reflects bounded-attention governance rather than quiz-style correctness
- it preserves what is distinctive about the project

## Model policy inside the Inspect mirror

Preserve ACP's current model split:

- default generation / judging: `gpt-5.4-mini`
- arbitration / disagreements only: `gpt-5.4`

Do not change the model policy just because the eval framework changes.

## Risks

### Risk 1 — semantic drift
If the Python mirror reimplements too much logic independently, it will diverge from ACP truth.

**Mitigation:** export normalized inputs from the existing TS layer.

### Risk 2 — framework capture
ACP starts talking as if the framework is the contribution.

**Mitigation:** keep all docs explicit that Inspect is a mirror layer.

### Risk 3 — low-yield churn
Too much engineering is spent porting low-value surfaces.

**Mitigation:** limit initial scope to the measured slice + flagship benchmark.

### Risk 4 — reviewer over-interpretation
Reviewers mistake Inspect compatibility for stronger empirical evidence than actually exists.

**Mitigation:** preserve the same non-claims and evidence boundaries in all Inspect-facing docs.

## What would make this integration genuinely compelling

Not merely that ACP can run in Inspect.

What would actually be compelling is:

1. the measured skills slice runs through Inspect with the same four ACP treatment conditions
2. adherence / prohibited leakage is preserved as a first-class metric
3. the flagship public-hearing task is available in a recognizable eval ecosystem format
4. the repo-native and Inspect-mirror outputs are clearly aligned and cross-referenced

That would let ACP say something credible and attractive:

> Our evals are not only bespoke civic harnesses; the load-bearing slices are also exposed through the same ecosystem interface standard used in contemporary AI safety evaluation work.

## Reviewer-facing payoff

If executed well, Inspect integration supports three attractive frames at once:

### Frame 1 — civic procedure meets eval maturity
ACP is unusual because it brings public-reasoning procedure into an eval ecosystem usually centered on model capability and safety behaviors.

### Frame 2 — protocol substrate + procedural control surface
Inspect helps external evaluators see that ACP's conditions are real interventions, not vague prompt variants.

### Frame 3 — serious enough for skeptical replication
A reviewer can disagree with ACP's conclusions while still acknowledging that the project exposes its strongest evidence in a standard eval idiom.

## Final recommendation

Do this, but do it narrowly.

### Best immediate scope

Implement:

1. `evals/inspect/README.md`
2. `scripts/evals/export-inspect-skills-measured.mjs`
3. `evals/inspect/acp_inspect/datasets/skills_measured.py`
4. `evals/inspect/acp_inspect/solvers/skills_conditions.py`
5. `evals/inspect/acp_inspect/scorers/skills_judge.py`
6. `evals/inspect/acp_inspect/scorers/adherence.py`
7. `evals/inspect/acp_inspect/tasks/skills_measured_eval.py`
8. `scripts/evals/export-inspect-public-hearing.mjs`
9. `evals/inspect/acp_inspect/datasets/public_hearing.py`
10. `evals/inspect/acp_inspect/tasks/public_hearing_eval.py`

### Best deferred scope

Defer until later:

- full deterministic mirror
- live portability mirror
- operator-review mirror
- claims-package generation inside Inspect

That sequencing preserves judgment.

The objective is not to make ACP look like every other eval repo.
The objective is to let the strongest parts of ACP be recognized by reviewers who now read eval credibility through Inspect-shaped priors.
