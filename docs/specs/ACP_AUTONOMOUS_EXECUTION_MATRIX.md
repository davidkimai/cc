Status: autonomous execution control spec
Version: 0.1
Date: 2026-04-24

# ACP Autonomous Execution Matrix

## 1. Purpose

This document turns the remaining ACP technical surface into agent-addressable execution packages.

Every package below must be:

- small enough for one agent or tightly scoped agent pair
- explicit about write scope
- explicit about dependencies
- explicit about acceptance checks

The goal is to finish the remaining 12-month technical build quickly without letting agents improvise the architecture.

## 2. Execution rule

Agents should not be assigned loose goals like “improve ACP” or “make Relay production-ready.”

They should be assigned one package at a time with:

- one owning spec
- one write scope
- one acceptance bar
- one integration surface

## 3. Priority order

Run the remaining work in this order:

1. protocol ecosystem
2. production platform
3. evidence and reporting system
4. external adoption path hardening
5. browser regression and dogfood hardening
6. release and deployment hardening

## 4. Execution packages

### Package 1. Protocol ecosystem core

Owns:

- protocol ecosystem spec
- versioned client and SDK surface
- extension and discovery rules

Primary spec:

- `ACP_PROTOCOL_ECOSYSTEM_SPEC.md`

Write scope:

- `docs/specs/ACP_PROTOCOL_ECOSYSTEM_SPEC.md`
- `protocol/`
- `docs/compatibility/`

Acceptance:

- outside implementer can see what ACP needs beyond Relay
- discovery and extension rules are bounded
- compatibility surface is explicit

### Package 2. External adopter starter kit

Owns:

- adopter starter package
- minimal consumer examples
- first non-founder implementer path

Primary specs:

- `ACP_PROTOCOL_ECOSYSTEM_SPEC.md`
- `ACP_EXTERNAL_ADOPTION_SPEC.md`

Write scope:

- `runners/`
- `protocol/`
- `docs/compatibility/`
- `docs/agents/`

Acceptance:

- a new adopter path exists outside current Relay operator habits
- instructions are runnable without founder explanation

### Package 3. Relay access and roles

Owns:

- auth model
- session model
- operator roles
- participant access discipline

Primary spec:

- `RELAY_PRODUCTION_PLATFORM_SPEC.md`

Write scope:

- `src/api/`
- `src/core/`
- `public/`
- `docs/specs/RELAY_PRODUCTION_PLATFORM_SPEC.md`

Acceptance:

- role and access semantics are explicit
- Relay no longer depends on a vague local-operator default for serious use

### Package 4. Workspace and persistence evolution

Owns:

- workspace or tenant model
- persistence migration path
- backup and retention implementation discipline

Primary specs:

- `RELAY_PRODUCTION_PLATFORM_SPEC.md`
- `ACP_PERSISTENCE_EXPORT_SPEC.md`

Write scope:

- `src/services/`
- `src/core/`
- `docs/specs/RELAY_PRODUCTION_PLATFORM_SPEC.md`
- `docs/deployment/`

Acceptance:

- persistence evolution path is real, not just discussed
- workspace boundaries are explicit enough for real operators

### Package 5. Observability and release discipline

Owns:

- logs and metrics strategy
- health, readiness, and failure surfaces
- release and smoke gates

Primary specs:

- `RELAY_PRODUCTION_PLATFORM_SPEC.md`
- `ACP_RELEASE_DEPLOYMENT_SPEC.md`

Write scope:

- `src/server.ts`
- `src/api/`
- `.github/`
- `docs/deployment/`

Acceptance:

- a deployment can be judged healthy by explicit signals
- release confidence is not based on manual intuition alone

### Package 6. Benchmark and comparison harness

Owns:

- seeded benchmark scenarios
- baseline versus intervention harness
- repeatable comparison outputs

Primary spec:

- `ACP_EVIDENCE_AND_REPORTING_SYSTEM_SPEC.md`

Write scope:

- `demo/`
- `scripts/`
- `docs/pilot/`
- `docs/evaluation/`
- `tests/`

Acceptance:

- comparison runs are repeatable
- evidence outputs are stable enough to inspect over time

### Package 7. Institutional reporting bundle

Owns:

- cycle briefing
- pilot recap
- compatibility proof
- protocol explainer
- operator and researcher review bundle

Primary specs:

- `ACP_EVIDENCE_AND_REPORTING_SYSTEM_SPEC.md`
- `ACP_VISUAL_ARTIFACTS_AND_DOGFOOD_SPEC.md`

Write scope:

- `scripts/visual-artifacts/`
- `docs/reports/`
- `artifacts/`
- `README.md`

Acceptance:

- a non-engineer can understand what happened from generated artifacts
- the reporting layer reduces ambiguity

### Package 8. Browser regression and dogfood hardening

Owns:

- deterministic surface checks
- richer dogfood evidence
- browser-level flow coverage where tool access permits

Primary spec:

- `ACP_VISUAL_ARTIFACTS_AND_DOGFOOD_SPEC.md`

Write scope:

- `scripts/dogfood/`
- `tests/`
- browser automation helpers

Acceptance:

- operator flow, participant flow, and export flow are checked by repeatable automation
- findings can be stored and reviewed

### Package 9. Final technical completion sweep

Owns:

- repo versus spec audit
- unresolved technical gap list
- completion gate review against the 12-month completion spec

Primary specs:

- `ACP_12_MONTH_TECHNICAL_COMPLETION_SPEC.md`
- all current phase-ten specs

Write scope:

- `docs/specs/`
- `README.md`
- `docs/README.md`

Acceptance:

- the remaining technical gap is explicit
- the team can clearly say what is still technical and what is now mainly human-layer work

## 5. Agent assignment rule

Each package should be assigned to one owner at a time.

If multiple agents are used in parallel, they must have:

- disjoint write scopes
- one integrating owner
- one explicit acceptance bar

## 6. Stop rule

Stop opening new technical fronts when the completion gate in `ACP_12_MONTH_TECHNICAL_COMPLETION_SPEC.md` is mostly satisfied and the remaining bottlenecks are primarily:

- adoption
- distribution
- partner onboarding
- pilot logistics
- institutional trust

At that point, technical work should become pull-driven rather than roadmap-driven.
