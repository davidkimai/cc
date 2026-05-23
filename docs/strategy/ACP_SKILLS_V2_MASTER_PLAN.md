# ACP Skills V2 Master Plan

Status: senior-owner strategy and execution plan  
Owner: senior researcher / engineer  
Primary executor: Codex  
Scope: make `skills/` a core centerpiece of ACP rather than a thin wrapper layer

---

## 0. Executive mandate

ACP should not merely *have* skills.  
ACP should become a **skill-native protocol ecosystem**.

The skills layer should become one of the strongest reasons to adopt ACP:

- for agents
- for operators
- for external implementers
- for evaluation and replay
- for institutional deliberation workflows

The current repo has a real `skills/` tree, but most skills are still too short, too thin, and too weakly evaluated to count as a mature centerpiece.

The next plan must therefore do two things at once:

1. define a **new ACP skill maturity standard**
2. **actually apply it** to the skill suite, rather than stopping after a smoke test or documentation pass

This plan is designed to prevent shallow completion behavior.

---

## 1. Senior diagnosis of current state

## 1.1 What already exists

The repo already has a meaningful skills foundation:

- `skills/README.md`
- `skills/registry.json`
- per-skill `SKILL.md` files
- `skills/packages/*/manifest.json`
- some `references/` and `scripts/`
- some compositions under `skills/compositions/`

Current core suite includes:

- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `bridge-exposure`
- `operator-audit`
- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`
- `relay-openclaw`

This is a strong skeleton.

## 1.2 What is still weak

The existing skills are still below the ideal standard in several ways:

1. **thin SKILL files**
   - many are only brief workflow wrappers
   - they are useful, but not yet richly procedural

2. **uneven depth**
   - some skills have scripts/references, others are sparse
   - quality is inconsistent across the suite

3. **too few examples and anti-examples**
   - current skills rarely include goldens, edge cases, or failure casebooks

4. **weak evaluation discipline**
   - there is little evidence that the skills materially improve agent behavior
   - there is not yet a strong `skills:audit` or skill-quality gate

5. **no explicit maturity model**
   - skills exist, but there is no formal definition of what counts as “professional,” “robust,” or “flagship”

6. **insufficient workflow judgment**
   - skills tell an agent what command to run, but not enough about what good output looks like, what to distrust, or when to escalate

7. **limited ecosystem posture**
   - the skill layer is not yet strong enough to be a major adoption attractor in its own right

## 1.3 Senior conclusion

The current skill layer is **real but undercapitalized**.

It is good enough to prove the direction.
It is not yet good enough to be a central ACP differentiator.

---

## 2. The ideal attractors and frames

## 2.1 Most compelling attractors

### Attractor A — ACP as a skill-native protocol for democratic reasoning

ACP should feel like:

- protocol truth in `protocol/` and `docs/specs/`
- engine truth in `src/`
- **procedural intelligence in `skills/`**

This creates a uniquely adoptable stack.

### Attractor B — Skills as institutional reasoning playbooks

ACP skills should not be thought of as “plugin docs.”
They should be thought of as:

- institutional playbooks
- operator cognition packs
- agent-executable deliberation workflows
- reusable democratic procedure modules

### Attractor C — Skills as the real bridge from protocol to practice

The protocol explains meaning.
The engine computes outputs.
The skills teach agents and operators how to use ACP correctly.

This bridge is strategically valuable.

### Attractor D — The MCP analogue for deliberative workflows

If MCP is a protocol for tool interoperability, ACP skills can become:

> **the reusable workflow layer for public reasoning and civic coordination**

This is a major ecosystem-level attractor.

### Attractor E — Defense-in-depth workflow intelligence

The engine catches algorithmic failure modes.  
The skills catch **workflow and interpretation** failure modes.

Examples:
- when to escalate
- how to interpret bridge exposure
- how to detect false consensus
- how to use omission critics responsibly
- how to build a review packet

## 2.2 Core frames

Use these frames consistently.

### Frame 1 — Skills are codified procedural judgment

Not just instructions. Not just docs.  
They encode operational judgment.

### Frame 2 — Skills are the reusable cognition layer of ACP

Protocol = meaning  
Engine = computation  
Skills = procedural cognition

### Frame 3 — Skills make ACP agent-native and institution-native

They should work for:
- API-driven agents
- coding agents
- operators
- external implementers
- report generators

### Frame 4 — Skills are evidence-bearing and testable

A mature skill must be auditable, eval-ready, and improvable from failures.

---

## 3. Non-negotiable architectural rule

The skills layer must be a **core centerpiece**, but it must not silently become the protocol source of truth.

### Therefore:

#### Protocol semantics must live in:
- `protocol/`
- `docs/specs/`
- canonical engine/data models in `src/`

#### Skills must own:
- workflow guidance
- procedural judgment
- scripts and helper logic
- examples and anti-patterns
- evaluation and inspection routines
- external adopter and operator rituals

This is the correct split.

---

## 4. ACP Skill Maturity Standard V1

Codex must first define a maturity standard and then apply it.

## 4.1 Maturity levels

### Level S0 — Present
Skill exists but is only minimally descriptive.

### Level S1 — Executable
Skill has:
- metadata
- bounded purpose
- basic steps
- at least one working script or deterministic usage path

### Level S2 — Procedural
Skill has:
- richer workflow guidance
- references
- examples
- clear failure handling
- explicit outputs
- anti-drift language

### Level S3 — Robust
Skill has:
- scripts
- references
- examples and anti-examples
- evaluation or smoke hooks
- explicit escalation rules
- trust/safety notes
- composition notes
- artifact expectations

### Level S4 — Flagship
Skill is a centerpiece-quality ACP skill.
It has:
- all S3 traits
- rich procedural judgment
- real casebook or goldens
- demonstrable agent usefulness
- integration with compositions and evals
- explicit benchmark / operator / adopter relevance

## 4.2 Required metadata fields

Every skill must carry a standardized front matter or manifest shape that includes at least:

- `name`
- `description`
- `category`
- `maturity`
- `use_when`
- `dont_use_when`
- `inputs_expected`
- `outputs_promised`
- `surfaces`
- `scripts`
- `references`
- `examples`
- `evals`
- `trust_level`
- `side_effects`
- `depends_on`

## 4.3 Required file structure for S3+

Each robust skill should follow this shape:

```text
skills/<skill>/
  SKILL.md
  references/
  scripts/
  examples/
  evals/
  checklists/
```

Not every folder must be large, but for S3+ the shape must exist intentionally.

## 4.4 Required SKILL.md sections

At minimum:

1. What this skill is for
2. When to use it
3. When not to use it
4. Inputs expected
5. Preflight / prerequisites
6. Workflow
7. Decision rules / judgment criteria
8. Escalation rules
9. Available scripts
10. Outputs
11. Failure handling
12. Trust / safety notes
13. Examples to inspect next
14. Evaluation hooks

## 4.5 Required example types for S3+

At least:
- one happy path
- one failure path
- one ambiguity/escalation path
- one anti-pattern

## 4.6 Required evaluation hooks

Every robust skill must have at least one of:
- a test
- a scriptable smoke
- a reproducible example run
- a skill-quality rubric

---

## 5. The target suite architecture

ACP should organize skills into 5 families.

## 5.1 Family A — Engine and protocol workflow skills

These are closest to the core engine.

Target skills:
- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `bridge-exposure`
- `operator-audit`
- `omission-critic` **new**
- `fairness-contestability-critic` **new**
- `abstention-escalation` **new**

## 5.2 Family B — Surface and operator workflow skills

Target skills:
- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`
- `conference-foresight-packaging` **new**

## 5.3 Family C — Institutional domain skills

These make ACP legible in the real world.

Target skills:
- `public-hearing-triage` **new**
- `participatory-budget-prioritization` **new**
- `council-agenda-briefing` **new**
- `board-tradeoff-facilitation` **new**

## 5.4 Family D — Ecosystem and adopter skills

Target skills:
- `protocol-implementer-review` **new**
- `sdk-adopter-starter` **new**
- `relay-openclaw`

## 5.5 Family E — Composition skills

Target compositions:
- `pilot-cycle-review`
- `export-generation`
- `surface-preflight`
- `foresight-submission-prep` **new**
- `public-hearing-end-to-end` **new**

---

## 6. What Codex must actually apply, not just define

To prevent shallow completion, Codex must not stop after writing the standard.

It must apply the standard to a meaningful subset.

## 6.1 Mandatory upgrade set

The following skills must be upgraded to **at least S3**:

1. `epistemic-routing`
2. `digest-and-explanation`
3. `operator-audit`
4. `overload-governance`
5. `participant-web-operator`
6. `pilot-analysis`
7. `deliberation-cycle`
8. `research-cli-operator`

## 6.2 Mandatory flagship set

The following must reach **S4**:

1. `epistemic-routing`
2. `digest-and-explanation`
3. `public-hearing-triage` **new**

## 6.3 Mandatory new skills

Codex must add at least these new skills:

- `omission-critic`
- `fairness-contestability-critic`
- `abstention-escalation`
- `public-hearing-triage`
- `conference-foresight-packaging`
- `protocol-implementer-review`

## 6.4 Mandatory composition upgrades

Codex must also deliver:

- one upgraded existing composition
- two new compositions

Required end state:
- `pilot-cycle-review` upgraded
- `foresight-submission-prep` added
- `public-hearing-end-to-end` added

---

## 7. Required tooling and quality gates

## 7.1 Add skill-audit tooling

Codex must add tooling such as:

- `scripts/skills/audit-skills.mjs`
- `npm run skills:audit`

This should verify:
- registry consistency
- manifest consistency
- presence of required sections/files by maturity level
- scripts existence
- example existence
- eval hook existence

## 7.2 Add skill test coverage

Suggested tests:
- `tests/skill-registry.test.ts`
- `tests/skill-maturity.test.ts`
- `tests/skill-compositions.test.ts`

## 7.3 Add skill report output

Generate a machine-readable and human-readable maturity report:

- `artifacts/skills/skills-maturity-report.json`
- `artifacts/skills/skills-maturity-report.md`

---

## 8. Integration with SDK and discovery

Skills should become more visible as a first-class ACP surface.

Codex should:

1. strengthen `skills/registry.json`
2. add maturity metadata to manifests or registry
3. add SDK/readme support for discovering skills
4. add skill references into `protocol/discovery.json` or adjacent discovery docs where appropriate
5. clarify how agents or API consumers should invoke skill-backed workflows

This should make skills feel like a real ecosystem surface, not a side folder.

---

## 9. End-to-end phase plan for Codex

## Phase 0 — Ground truth and standard definition

### Goal
Define the ACP skill maturity standard in repo-local documents before editing the suite.

### Deliverables
- `docs/strategy/ACP_SKILLS_V2_POSITIONING.md`
- `docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md`
- updated `skills/README.md`
- updated `skills/registry.json` schema expectations

### Exit criteria
- maturity levels and required sections are frozen

---

## Phase 1 — Audit current suite

### Goal
Ground the standard in the actual tree.

### Deliverables
- `docs/strategy/ACP_SKILLS_V2_AUDIT.md`
- per-skill current maturity classification
- exact gap list per skill

### Exit criteria
- every current skill has a current maturity level and explicit missing pieces

---

## Phase 2 — Tooling and gating

### Goal
Make skill quality testable.

### Deliverables
- `scripts/skills/audit-skills.mjs`
- `npm run skills:audit`
- skill maturity tests
- generated maturity report

### Exit criteria
- skills can fail a gate for being thin or malformed

---

## Phase 3 — Upgrade the mandatory existing skills

### Goal
Apply the standard to the high-value existing suite.

### Deliverables
Upgrade the 8 mandatory skills to S3+, including:
- richer SKILLs
- references
- examples
- eval hooks
- trust notes
- scripts / checklists where missing

### Exit criteria
- all 8 mandatory skills reach S3+

---

## Phase 4 — Add the new skills

### Goal
Fill the biggest capability gaps.

### Deliverables
Add:
- `omission-critic`
- `fairness-contestability-critic`
- `abstention-escalation`
- `public-hearing-triage`
- `conference-foresight-packaging`
- `protocol-implementer-review`

### Exit criteria
- all 6 new skills exist and pass skill audit

---

## Phase 5 — Flagship skills and compositions

### Goal
Create centerpiece-quality skills and end-to-end compositions.

### Deliverables
- 3 flagship S4 skills
- upgraded `pilot-cycle-review`
- new `foresight-submission-prep`
- new `public-hearing-end-to-end`

### Exit criteria
- ACP has at least three clearly flagship skills and two flagship compositions

---

## Phase 6 — Ecosystem and adoption integration

### Goal
Make skills an external-facing adoption reason.

### Deliverables
- improved registry and package metadata
- SDK/discovery integration
- adopter docs updated to reference skills
- evidence of skill-driven workflows in artifacts

### Exit criteria
- skills are visible as a first-class ACP ecosystem surface

---

## Phase 7 — Final skill centerpiece package

### Goal
Produce a package that makes skills clearly central to ACP.

### Deliverables
- `artifacts/skills/skills-maturity-report.json`
- `artifacts/skills/skills-maturity-report.md`
- `artifacts/skills/skill-suite-overview.html` or markdown equivalent
- updated Foresight package references to the skill layer where appropriate

### Exit criteria
- a reviewer can see that ACP’s skills layer is substantial, professional, and strategically central

---

## 10. Anti-laziness constraints for Codex

These are binding.

1. Writing the standard alone does **not** count as completion.
2. Passing one smoke test does **not** count as skill maturity.
3. A skill without examples and failure handling cannot be marked S3+.
4. A skill without evaluation hooks cannot be marked robust.
5. New skills must be added where the suite has real functional gaps.
6. At least 8 existing skills must be materially upgraded, not only touched superficially.
7. At least 3 skills must become obvious flagship exemplars.
8. Completion requires both tooling and applied refactors.

---

## 11. Definition of done

This plan is complete only when:

- the maturity standard exists and is explicit
- the current suite has been audited against it
- audit tooling exists and runs
- 8 existing skills are upgraded to S3+
- 3 skills are upgraded to S4
- 6 strategically important new skills are added
- 3 compositions are robust and useful
- registry/package metadata reflect maturity and structure
- a skill maturity report exists
- the skills layer clearly reads as a core ACP differentiator

At that point, ACP no longer merely “has skills.”
It has a **skill-native operating layer** that strengthens the protocol, engine, product, and ecosystem story.
