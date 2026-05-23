Status: technical completion control spec
Version: 0.1
Date: 2026-04-24

# ACP 12-Month Technical Completion Spec

## 1. Purpose

This spec defines the remaining technical surface required for ACP to count as technically complete enough that the rest of the fellowship can focus primarily on human-layer work:

- adoption
- distribution
- pilots
- partners
- institutional uptake

The goal is to make the remaining technical build explicit, bounded, and checkable.

## 2. Strategic test

ACP should not be judged complete because Relay is impressive.
ACP should be judged complete when the following are all true:

- ACP is a stable protocol, not just a repo narrative
- Relay is a credible reference implementation, not just a fast prototype
- protocol drift is caught by checks, fixtures, and replay
- an outside implementer has a real path in
- the evidence layer is strong enough to compare, inspect, and publish
- the reporting layer is strong enough for operators, researchers, and institutions
- the production platform is reliable enough that the remaining bottlenecks are mostly human, not technical

## 3. What counts as technical completion

Technical completion for ACP requires 6 completed layers.

### Layer A. Protocol layer

Required end state:

- versioned protocol shape
- stable canonical objects
- explicit lifecycle and condition rules
- compatibility rules
- extension rules
- machine-readable protocol artifacts

Done when:

- ACP can be explained and implemented without opening Relay UI code
- changes to canonical objects are versioned and traceable
- extension points are documented and bounded

### Layer B. Reference implementation layer

Required end state:

- Relay web app
- Relay API
- Relay CLI/headless path
- seeded demo path
- export path
- dogfood path

Done when:

- Relay is clearly the first implementation, not the protocol itself
- the main operator and participant flows work reliably
- the product surface is good enough that remaining work is mostly scaling and polish

### Layer C. Conformance and independence layer

Required end state:

- conformance checks
- replay fixtures
- compatibility matrix
- at least 2 proof surfaces beyond simple README claims
- at least 1 public-boundary consumer path

Done when:

- ACP can be checked instead of trusted
- protocol behavior survives outside the main browser flow
- a second adopter does not need to import the Relay engine directly to begin integrating

### Layer D. Evidence layer

Required end state:

- seeded scenarios
- benchmark and comparison harness
- live run evidence capture
- structured dogfood outputs
- pilot comparison artifacts

Done when:

- ACP runs leave behind evidence that can be inspected later
- baseline and intervention comparisons are repeatable
- evaluation outputs are usable outside the development team

### Layer E. Reporting layer

Required end state:

- cycle briefing artifacts
- pilot recap artifacts
- protocol explainer artifacts
- compatibility proof artifacts
- institutional review surfaces

Done when:

- a researcher, operator, or partner can understand what happened without opening raw JSON or code
- the reporting surface reduces ambiguity instead of adding presentation noise

### Layer F. Production platform layer

Required end state:

- access and role model
- workspace or tenant model
- persistence evolution path
- observability
- deployment topology
- backup and retention rules
- release gates

Done when:

- Relay can be run with credible operational discipline
- operators are not depending on undocumented local behavior
- the remaining blockers to real use are primarily human and organizational

## 4. Current state and remaining gap

Current repo state is strong on:

- protocol framing
- first implementation
- second proof surfaces
- conformance and replay basics
- external implementer path beginnings
- visual artifact generation
- seeded dogfood automation

Current repo state is weaker on:

- protocol ecosystem surfaces beyond the current stack
- production auth, role, and workspace model
- persistence evolution beyond local file storage
- observability and deployment maturity
- benchmark and publication-grade evidence packaging
- institutional reporting as a stable system rather than a growing collection of artifacts

## 5. Remaining technical build checklist

The remaining technical build is complete only when all items below are checked.

### Protocol ecosystem

- [ ] ACP protocol ecosystem spec completed and adopted
- [ ] SDK or client surface defined
- [ ] registry or discovery model defined
- [ ] independent implementation requirements pinned down
- [ ] extension policy pinned down

### Relay production platform

- [ ] production platform spec completed and adopted
- [ ] auth and role model defined
- [ ] workspace or tenant model defined
- [ ] production deployment topology defined
- [ ] observability and backup model defined
- [ ] release gates defined

### Evidence and reporting system

- [ ] evidence and reporting system spec completed and adopted
- [ ] benchmark harness defined
- [ ] run evidence capture standardized
- [ ] institutional artifact set standardized
- [ ] publication-ready output path defined

### External adoption and independence

- [ ] at least 1 API-driven external consumer path exists
- [ ] at least 1 additional adopter starter path exists
- [ ] compatibility claims are bounded to what is actually validated
- [ ] outside implementer path is runnable without founder explanation

### Dogfood and browser validation

- [ ] seeded dogfood loop exists
- [ ] deterministic browser or surface checks exist
- [ ] findings produce machine-readable and human-readable outputs
- [ ] generated artifacts are wired into the review loop

## 6. Completion gate

ACP counts as technically complete enough to shift the fellowship toward human-layer work when all 6 statements below are true:

1. ACP can be explained without Relay.
2. ACP can be checked without trusting the authors.
3. ACP can be run outside the main Relay browser flow.
4. ACP can be adopted through a clear outside path.
5. ACP can produce evidence others can inspect.
6. Relay can be operated with credible production discipline.

## 7. What becomes human-layer work after completion

Once this spec is satisfied, the remaining primary work should shift toward:

- distribution
- external pilots
- partnerships
- implementer outreach
- governance framing
- institutional trust building
- public writing and adoption

That work will still create technical pull, but the bottleneck will no longer be “what do we still need to build for ACP to make sense?”
