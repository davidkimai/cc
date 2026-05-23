# Artifacts Policy and Map

The `artifacts/` tree is intentionally **curated**.

It contains claim-bearing outputs that help reviewers, implementers, and future contributors inspect the current ACP system without rerunning every pipeline from scratch.

It is **not** meant to be a complete dump of every raw trace, local scratch directory, or one-off experimental output.

## What is checked in on purpose

Prioritized artifact classes:

- final completion and release audits
- conference / rehearsal packets
- final skills claims packages
- compact benchmark summaries
- compact report/demo bundles that materially help review

## Main reviewer-facing directories

### `completion/final/`
Technical completion and release-audit surfaces.

### `conference/rehearsal/`
Flagship rehearsal summary surface for reviewer walkthroughs and paper support. The public branch keeps the high-signal README and summary here; regenerate the full nested rehearsal bundle locally when needed.

### `evals/skills/final/`
Bounded claims package for the ACP skills behavioral-study layer.

### `skills/`
Structural maturity summaries for the skill suite, including the constitutional skills map.

## What usually stays out of versioned artifacts

Examples of outputs that should usually remain local-only:

- raw scratch traces
- duplicated benchmark trees
- temporary browser logs
- local provider-call experiments not referenced by any public claim
- oversized generated files that do not improve reviewer understanding

## Contributor rule of thumb

If an artifact is not directly useful for one of these, it probably should not be committed:

- paper support
- reviewer orientation
- reproducibility of a stated claim
- auditability of a release-bound behavior

For local runs, prefer:

- `/tmp/...`
- `artifacts/local/...`
- another clearly local scratch path

## Relationship to source of truth

Artifacts are evidence surfaces, not normative protocol definitions.

If an artifact disagrees with code/specs, treat the artifact as stale until regenerated or explained. Normative truth lives in:

- `protocol/`
- `docs/specs/`
- `src/`
- tests and generating scripts
