# Relay Blocks Skill Maturity Standard

Status: normative skill maturity standard
Owner: ACP senior researcher / engineer

## 1. Scope

This standard defines how ACP Relay Blocks in `skills/` are evaluated for maturity.

It governs operational skill packaging only. Canonical protocol semantics remain in `protocol/`, `docs/specs/`, and typed implementation models.

## 2. Maturity Levels

| Level | Name | Requirement |
| --- | --- | --- |
| S0 | Present | Skill exists but is minimally descriptive. |
| S1 | Executable | Skill has metadata, bounded purpose, basic steps, and a deterministic usage path. |
| S2 | Procedural | Skill has workflow guidance, references, examples, failure handling, outputs, and anti-drift language. |
| S3 | Robust | Skill has scripts, references, examples and anti-examples, eval hooks, escalation rules, trust notes, composition notes, and artifact expectations. |
| S4 | Flagship | Skill has all S3 traits plus rich procedural judgment, casebook/golden examples, demonstrable agent usefulness, and benchmark, operator, or adopter relevance. |

## 3. Required Metadata

Each package manifest for a Skills V2 skill must include:

- `name`
- `description` or `summary`
- `category`
- `maturity`
- `useWhen`
- `dontUseWhen`
- `inputsExpected`
- `outputsPromised`
- `surfaces`
- `scripts`
- `references`
- `examples`
- `evals`
- `trustLevel`
- `sideEffects`
- `dependsOn`

## 4. Required S3+ File Shape

Every S3 or S4 skill must intentionally provide:

```text
skills/<skill>/
  SKILL.md
  references/
  scripts/
  examples/
  evals/
  checklists/
```

The folders may be compact, but they must contain reviewable material.

## 5. Required SKILL.md Sections

Every S3 or S4 `SKILL.md` must include these sections:

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
13. Composition notes
14. Examples to inspect next
15. Evaluation hooks

## 6. Required Example Types

Every S3 or S4 skill must include examples covering:

- happy path
- failure path
- ambiguity / escalation path
- anti-pattern

S4 skills must also include flagship relevance or casebook material.

## 7. Evaluation Hooks

Every S3 or S4 skill must include at least one of:

- scriptable smoke
- reproducible example run
- skill-quality rubric
- test coverage

## 8. Completion Rule

A skill cannot be called robust unless it passes `npm run skills:audit`.

Passing a release smoke check is not enough. The skill must expose richer workflow guidance, examples, failure handling, and evaluation hooks.
