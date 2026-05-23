# ACP Public Repo Packaging Plan

Status: proposed public-release cleanup plan  
Owner: senior researcher / engineer  
Audience: repository maintainer / Codex / future contributors

## Goal

Turn the current dirty local ACP worktree into a clean, reviewer-friendly, public workshop/conference repository without collapsing protocol truth, over-publishing noisy artifacts, or losing reproducibility.

## Grounded current state

As of the current local audit:

- `origin/main` and `HEAD` point to the same commit (`96b434f`), so the public repo is not behind because of missing pushed commits.
- The public repo is behind because **substantive local work exists mostly as modified and untracked files**.
- Major untracked local surfaces now include:
  - `protocol/`
  - `benchmarks/`
  - `evals/`
  - `scripts/`
  - `runners/`
  - `adopters/`
  - `demo/`
  - `docs/compatibility/`
  - `docs/reports/`
  - `docs/strategy/`
  - `skills/registry.json`, new skills, compositions, and packaging
  - `src/sdk/`
  - `src/skills/`
  - many new tests
- `artifacts/` is already about `38M`, which is too noisy to dump wholesale into the public repo.
- The repo currently lacks standard public-facing metadata files such as:
  - `LICENSE`
  - `CITATION.cff`
  - `CONTRIBUTING.md`
  - `SECURITY.md`

## Strategic principle

The right move is **not** “push local as-is.”

The right move is:

> classify the worktree into public source-of-truth layers, curated evidence layers, and local-only debris, then publish in disciplined packets.

## Public packaging objectives

The public repo should do four things well:

1. let a workshop reviewer understand ACP in 5 minutes
2. let an implementer reproduce the core workflow and evidence
3. let an evaluator inspect the benchmark/study surfaces
4. avoid burying the repo in internal planning noise and bulky generated artifacts

---

## 1. Classify everything before publishing

Create three buckets.

### A. Must be public source-of-truth
These are central to ACP's public identity and should be in the main repo.

- `README.md`
- `AGENTS.md` (short repo map is fine)
- `package.json`
- `.github/workflows/ci.yml`
- `src/`
- `public/`
- `protocol/`
- `docs/specs/`
- `docs/compatibility/`
- `skills/`
- `tests/`
- `scripts/`
- `benchmarks/`
- `evals/`
- `runners/`
- `adopters/`
- `demo/`

### B. Public but curated
These help reviewers, but should be intentionally selected, not dumped wholesale.

- `artifacts/completion/final/technical-completion-audit.md`
- `artifacts/completion/final/technical-completion-audit.json`
- `artifacts/conference/rehearsal/README.md`
- `artifacts/conference/rehearsal/rehearsal-summary.json`
- `artifacts/evals/skills/final/`
- selected flagship benchmark/report artifacts
- selected conference package artifacts
- selected skills study summaries

### C. Keep local or move to release assets, not the main repo
These are noisy, bulky, ephemeral, or internal.

- temporary logs
- browser traces not needed for claims
- local runtime data stores
- ad hoc output folders such as `skills/*/out/`
- experimental scratch files
- oversized generated HTML or repeated artifact trees that do not add reviewer value
- internal planning/control files that are not useful to a public reader

---

## 2. Publish in packets, not one giant dump

Do not update the public repo in one enormous push.

Use three deliberate public packets.

### Packet P1 — Public core ACP release
Purpose: establish ACP's public architecture clearly.

Include:
- `README.md`
- `protocol/`
- `docs/specs/`
- `src/`
- `public/`
- `tests/`
- CI updates
- minimal `scripts/` needed for reproducibility
- top-level metadata files (`LICENSE`, `CITATION.cff`, `CONTRIBUTING.md`, `SECURITY.md`)

Message:
- ACP is a protocol-first system
- Relay is the reference implementation
- the repo is buildable and testable

### Packet P2 — Evaluation and ecosystem proof release
Purpose: show ACP is not just an app, but a reproducible research/evidence repo.

Include:
- `benchmarks/`
- `evals/`
- `runners/`
- `adopters/`
- `src/sdk/`
- selected tests
- selected generated summaries

Message:
- ACP can be evaluated, adopted, and checked outside the browser surface

### Packet P3 — Skills and workshop evidence release
Purpose: show the procedural layer and the behavioral study program.

Include:
- `skills/registry.json`
- new skill packages and compositions
- `src/skills/`
- `docs/strategy/ACP_SKILLS_V3_STUDY_PROTOCOL.md`
- `docs/strategy/ACP_SKILLS_V3_STATISTICAL_PLAN.md`
- selected `artifacts/evals/skills/final/`
- selected `artifacts/conference/rehearsal/`

Message:
- ACP now supports procedural interventions and a conservative behavioral study layer

---

## 3. Make the root reviewer-friendly

The public repo should not force workshop reviewers to reverse-engineer the file tree.

### Add these top-level public-facing files

#### `REVIEWER_START_HERE.md`
A 5-minute guide with three paths:
- what ACP is
- what to read first
- where the evidence lives

#### `CITATION.cff`
Needed for conference/public credibility and citation tooling.

#### `LICENSE`
Critical. A public protocol repo without a clear license is structurally incomplete.

#### `CONTRIBUTING.md`
Should explain:
- source of truth hierarchy
- how to run tests
- artifact policy
- what not to edit casually

#### `SECURITY.md`
Especially relevant because ACP is partly about governance and trustworthy workflow infrastructure.

### Tighten `README.md`
The local README is much better than the current public state, but it is still somewhat broad for public-facing workshop review.

It should start with three quick paths:
1. **Review ACP in 5 minutes**
2. **Run the reference implementation**
3. **Inspect the benchmark and skills evidence**

Avoid making the root README a dumping ground for every subsystem.
Link outward.

---

## 4. Curate artifacts aggressively

The public repo should expose evidence, but not every artifact.

### Keep in the repo
Prefer small, legible, claim-bearing artifacts:
- summary JSONs
- markdown reviewer guides
- claims memos
- failure taxonomies
- final results tables

### Move out of the main repo or exclude
Prefer not to commit:
- repeated raw traces unless essential
- duplicate benchmark trees
- large generated HTML bundles unless they are central to the workshop demo
- bulky logs

### Rule
If an artifact is not directly cited in the paper, reviewer packet, or reproduction path, it probably should not live in the public main branch.

---

## 5. Separate public truth from internal control planes

Some `docs/strategy/` files are valuable publicly.
Others are internal execution scaffolding.

### Good candidates to keep public
- `ACP_PAPER_POSITIONING.md`
- `ACP_EXECUTION_STATUS.md` only if you want open-research transparency
- `ACP_SKILLS_V3_STUDY_PROTOCOL.md`
- `ACP_SKILLS_V3_STATISTICAL_PLAN.md`

### Better kept internal or moved to a secondary branch/folder
- long Codex packets
- old stabilization control prompts
- transient execution management docs that mainly served local orchestration

A public workshop repo should not feel like an exposed internal scratchpad.
It should feel like an inspectable research system.

---

## 6. Clean naming and path ergonomics

Use consistent public naming.

### Prefer
- `ACP` = protocol
- `Relay` = reference implementation
- `Relay Blocks` or `skills` = procedural layer

### Avoid
- stale legacy names
- unexplained internal abbreviations
- too many parallel labels for the same concept

Also reduce reviewer friction by preferring:
- short reviewer entry points
- fewer deeply nested “read this first” chains
- high-signal filenames like `REVIEWER_START_HERE.md`, `WORKSHOP_REPO_MAP.md`, `CLAIMS_AND_NON_CLAIMS.md`

---

## 7. Add a public artifact policy

Create a short policy in `CONTRIBUTING.md` or `docs/README.md`:

### Commit to main repo
- source code
- specifications
- fixtures
- benchmark definitions
- study protocols
- small claim-bearing summaries

### Do not commit casually
- bulky generated artifacts
- local scratch outputs
- runtime data
- private or sensitive materials
- duplicated raw traces unless explicitly needed

This prevents the repo from degrading again.

---

## 8. Recommended local cleanup sequence

Use this exact order.

### Step 1
Create a file inventory and classify every major modified/untracked path into:
- public-core
- public-curated
- local-only

### Step 2
Add missing public metadata files:
- `LICENSE`
- `CITATION.cff`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `REVIEWER_START_HERE.md`

### Step 3
Tighten root README around three user journeys:
- reviewer
- implementer
- evaluator

### Step 4
Curate `artifacts/` into a public subset.
Do not ship the full `38M` directory unchanged.

### Step 5
Create the three public packets (P1/P2/P3) as reviewable local boundaries.

### Step 6
Only after those packets are coherent, update the public repo in order.

### Step 7
Run `npm run public:package:audit` and require a clean result before any commit intended for the public branch.

---

## 9. Public repo target structure

A strong public ACP repo should feel like this:

```text
README.md
REVIEWER_START_HERE.md
LICENSE
CITATION.cff
CONTRIBUTING.md
SECURITY.md
AGENTS.md
package.json
src/
public/
protocol/
docs/specs/
docs/compatibility/
skills/
benchmarks/
evals/
runners/
adopters/
scripts/
tests/
demo/
artifacts/
  completion/final/
  conference/rehearsal/
  evals/skills/final/
```

Not everything in local must go public.
Only the parts that make ACP legible, reproducible, and reviewable.

---

## 10. Immediate highest-leverage actions

If time is limited, do these first:

1. Add `LICENSE`, `CITATION.cff`, `CONTRIBUTING.md`, `SECURITY.md`
2. Add `REVIEWER_START_HERE.md`
3. Tighten `README.md` for reviewer / implementer / evaluator paths
4. Curate `artifacts/` to a small claim-bearing subset
5. Publish `protocol/`, `benchmarks/`, `evals/`, `src/sdk/`, and `src/skills/`

These five changes would make the public repo feel dramatically more complete.

---

## 11. Non-goal

Do not try to make the public repo look maximally large.

The goal is not volume.
The goal is:

> a clean, credible, reviewer-legible public research repository.

That means fewer accidental files, fewer duplicated artifacts, clearer entry points, and sharper claims discipline.
