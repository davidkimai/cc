---
name: conference-foresight-packaging
description: Use this skill to assemble and review the Foresight Supercooperation pre-submission evidence packet.
category: surface-workflow
maturity: S3
---

# What this skill is for

Use this skill to package ACP's Foresight-facing evidence, framing, limitations, artifact index, and demo script.

# When to use it

- Preparing `artifacts/conference/foresight`.
- Reviewing whether the packet is submission pre-packaging ready.
- Checking that contribution list and limitations are present.

# When not to use it

- Do not use it to make final camera-ready prose.
- Do not use it to inflate benchmark evidence into field claims.
- Do not use it before the stabilization boundary is understood.

# Inputs expected

- Target output directory
- Foresight venue frame
- Benchmark and rehearsal artifacts
- Limitations/non-claims

# Preflight / prerequisites

1. Confirm stabilization packet status.
2. Confirm benchmark, ablation, and scale-band commands pass.
3. Confirm the package includes limitations and artifact hashes.

# Workflow

1. Run `npm run conference:foresight`.
2. Inspect package summary and artifact index.
3. Confirm reviewer start, abstract, contribution list, casebook, figure plan, limitations, and demo script exist.
4. Run release gate before claiming package readiness.

# Decision rules / judgment criteria

- Reviewer legibility matters more than artifact volume.
- Every claim should point to a generated or source artifact.
- Limitations must be adjacent to evidence.

# Escalation rules

Escalate when artifact index is missing, required memos are absent, gates fail, or the requested claim is not supported by artifacts.

# Available scripts

- `scripts/smoke.mjs`: checks expected Foresight package files.

# Outputs

- Foresight package readiness notes
- Missing artifact list
- Gate recommendation

# Failure handling

Do not delete failed package output; preserve and report what is missing.

# Trust / safety notes

Conference packaging is claim-bearing. Keep prototype, benchmark, and field-efficacy boundaries explicit.

# Composition notes

Use in `foresight-submission-prep` after public-hearing evidence generation.

# Examples to inspect next

Read `examples/casebook.md` for packaging success, missing limitations, ambiguous evidence, and overclaiming.

# Evaluation hooks

Run `scripts/smoke.mjs`, `npm run conference:foresight`, and `npm run skills:audit`.
