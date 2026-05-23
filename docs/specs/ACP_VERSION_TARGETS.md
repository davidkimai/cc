# ACP Version Targets

Status: draft v0.1  
Owner: ACP core team  
Scope: target definitions for the minimum strong version, the ambitious protocol-first version, and the maximal 12-month version.

## 1. Purpose

This document defines what each major target version should look like.

It exists to keep scope expansion coherent. It should be used as a quality target, not as a promise that everything must be built immediately.

## 2. Version hierarchy

Use three target versions:
- Minimum strong version
- Ambitious protocol-first version
- Maximal 12-month version

Each version expands outward from ACP.

## 3. Minimum strong version

Definition:
A serious ACP-first reference implementation that is easy to run, easy to demo, and credible for a small pilot.

Must include:
- stable ACP core and current canonical specs
- Relay web app and operator CLI that run end to end
- seeded demo cycles
- sample civic prompt pack
- polished exports and reports
- pilot docs and evaluation materials
- Relay Blocks with executable helpers for core operator workflows

Must feel like:
- a real system
- a real protocol claim
- a real demo
- a credible pilot candidate

Should not require:
- multiple implementations
- public registry
- advanced auth or multi-tenancy

Success test:
- an informed external reviewer can run the system, understand the protocol claim, and see how the pilot would work

## 4. Ambitious protocol-first version

Definition:
ACP feels like a real open protocol effort, not just a product with good architecture.

Must include everything in the minimum strong version, plus:
- ACP versioning rules
- canonical schema bundle
- conformance checks
- replay fixtures and golden outputs
- compatibility notes
- mature Relay Blocks packaging and composition guidance
- at least one additional proof surface, adapter, or runner
- democracy packs for multiple civic scenarios

Must feel like:
- a standard in formation
- a reusable coordination layer
- a protocol with implementation discipline

Success test:
- someone could plausibly build or validate a second ACP-compatible implementation from the repo and specs

## 5. Maximal 12-month version

Definition:
ACP is the default reference point for deliberative attention coordination under load.

Must include everything in the ambitious version, plus:
- stronger deployment and access model
- robust observability and release discipline
- multiple pilots or comparative studies
- polished operator console and archive/replay experience
- registry or catalog for blocks, packs, fixtures, or implementations
- benchmark scenarios and public-facing findings artifacts
- clear external implementer path

Must feel like:
- a protocol ecosystem
- a flagship implementation
- a reusable evidence-backed coordination primitive

Success test:
- ACP can be explained as a protocol, demonstrated as a product, and adopted as a reusable coordination layer beyond the original team

## 6. Strategic guidance

Prefer moving from one version target to the next by adding:
- clearer evidence
- stronger conformance
- better demoability
- better transferability

Do not primarily expand by adding generic app features.

## 7. Use with the execution plan

Use `ACP_EXECUTION_PLAN.md` to decide what to build next.

Use this document to decide whether a proposed scope increase actually strengthens the project or merely makes it larger.
