# Relay Blocks / ACP Skills

The `skills/` directory packages ACP as reusable Relay Blocks / ACP Skills: agent-readable procedural playbooks for operating the protocol and Relay implementation.

The intended public framing is stronger than "prompting help": ACP Skills are a **constitutional procedural layer for public reasoning under bounded attention**.

Read the stack this way:

- `ACP` is the protocol
- `Relay` is the first implementation
- `ACP Engine V2` computes and audits deliberative outputs
- `Relay Blocks / ACP Skills` encode inspectable procedural judgment for agents, operators, and implementers

Skills do **not** define protocol truth. Canonical semantics live in `protocol/`, `docs/specs/`, and typed implementation models. Skills teach agents how to use those surfaces correctly while preserving claim boundaries, contestability, and escalation discipline.

Start with [`CONSTITUTIONAL_SKILLS.md`](CONSTITUTIONAL_SKILLS.md) if you want the shortest explanation of the load-bearing skills thesis.

## Skills V2 Standard

Skills V2 follows `docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md`.

Maturity levels:

- `S0`: present
- `S1`: executable
- `S2`: procedural
- `S3`: robust
- `S4`: flagship

S3+ skills must include:

- richer `SKILL.md` workflow guidance
- references
- scripts
- examples covering happy path, failure path, ambiguity/escalation, and anti-patterns
- eval hooks
- checklists
- trust/safety notes

Run the gate:

```bash
npm run skills:audit
```

Outputs:

- `artifacts/skills/skills-maturity-report.json`
- `artifacts/skills/skills-maturity-report.md`

Generate the constitutional map:

```bash
npm run skills:map
```

Outputs:

- `artifacts/skills/constitutional-skills-map.json`
- `artifacts/skills/constitutional-skills-map.md`

## Constitutional core

The load-bearing constitutional core is:

- `epistemic-routing`
- `digest-and-explanation`
- `omission-critic`
- `fairness-contestability-critic`
- `abstention-escalation`
- `protocol-implementer-review`
- `public-hearing-triage`

These skills are the clearest expression of ACP's theory of procedural intelligence: route attention, explain faithfully, catch omissions, catch contestability risks, abstain/escalate when needed, and protect protocol boundaries.

## Flagship Skills

- `epistemic-routing`
- `digest-and-explanation`
- `public-hearing-triage`

These are S4 because they demonstrate ACP's strongest claims: attention routing, explanation faithfulness, and public-hearing triage as the frozen conference denominator.

## Robust Skills

- `deliberation-cycle`
- `operator-audit`
- `overload-governance`
- `participant-web-operator`
- `pilot-analysis`
- `research-cli-operator`
- `omission-critic`
- `fairness-contestability-critic`
- `abstention-escalation`
- `conference-foresight-packaging`
- `protocol-implementer-review`

## Procedural Supporting Skills

- `bridge-exposure`
- `baseline-thread-runner`
- `relay-openclaw`

## Compositions

- `pilot-cycle-review`
- `export-generation`
- `surface-preflight`
- `foresight-submission-prep`
- `public-hearing-end-to-end`
- `participatory-budget-end-to-end`
- `school-board-tradeoff-review`

Compositions combine skills into repeatable operator workflows. The most important compositions should demonstrate **defense in depth across civic domains**, not only packaging convenience.

Current flagship civic compositions are:

- `public-hearing-end-to-end`
- `participatory-budget-end-to-end`
- `school-board-tradeoff-review`

These compositions show how the same constitutional skill stack transfers across overloaded public reasoning tasks without becoming a second protocol truth source.
