# ACP Conference, Production, and Ecosystem Master Plan

Status: senior-owner execution plan  
Owner: senior researcher / engineer  
Primary executor: Codex  
Scope: take ACP from strong pilot-grade protocol repo to conference-ready, production-disciplined, ecosystem-standard project

---

## 0. Executive mandate

ACP should become three things at once:

1. **a serious paper and demo for AI for democracy**
2. **a production-disciplined institutional product alpha**
3. **an open protocol ecosystem seed, analogous in posture to MCP rather than a one-off app**

The correct end state is **not** “a nicer demo.”
The correct end state is:

- `ACP` is legible as an open protocol for bounded collective deliberation / shared reasoning
- `Relay` is a credible reference implementation
- the evidence layer can support claims against a baseline
- the production layer is trustworthy enough for real pilots
- the ecosystem layer proves ACP can outlive Relay

This plan is written so Codex can execute for long stretches without improvising scope.

---

## 1. Repo-grounded current state

### 1.1 What is already strong

The current repo already has unusually strong raw ingredients:

- canonical protocol and implementation specs in `docs/specs/`
- canonical schema and discovery artifacts in `protocol/`
- Relay web app, HTTP API, CLI, persistence, routing/digest pipeline, exports, tests
- benchmark scenarios in `benchmarks/`
- external proof surfaces in `runners/batch/` and `runners/http-client/`
- external implementer guide in `protocol/EXTERNAL_IMPLEMENTER_GUIDE.md`
- visual artifact and report pipeline in `scripts/visual-artifacts/` and `scripts/report/`
- dogfood automation in `scripts/dogfood/`
- Relay Blocks packaging in `skills/`
- passing build, typecheck, tests, conformance, and release smoke checks

### 1.2 What is currently weak or incomplete

The repo is not yet conference-ready or production-ready because the remaining gaps are first-order, not cosmetic:

1. **evidence integrity gap**
   - browser telemetry currently sends `surface: 'web'` while canonical schema only accepts `participant_web | operator_cli | operator_web | api`
   - this makes participant telemetry unreliable and weakens every later claim

2. **production platform gap**
   - local file storage is still the effective canonical store
   - auth/session/workspace model exists in outline but is not yet institutional-grade
   - observability, retention, backups, and deployment hardening are underbuilt versus the stated ambition

3. **deliberation-engine sophistication gap**
   - current routing is deterministic and useful, but still closer to a transparent heuristic baseline than to a publishable frontier mediation system
   - “shared reasoning” criteria are only partially explicit in protocol state

4. **evaluation gap**
   - benchmark scaffolding is strong, but publication-grade empirical claims are still thin
   - current comparisons are largely structural and synthetic, not yet strong legitimacy / quality evidence

5. **ecosystem gap**
   - ACP has multiple proof surfaces but still lacks stronger outside-adopter validation and SDK maturity

6. **product-trust gap**
   - Relay is coherent, but still not at the standard where a workshop audience sees “serious institutional product” on first contact

### 1.3 Grounded strategic reading

Current repo truth:

- ACP is already better framed as a **protocol + evidence system** than as “another discussion product”
- the winning move is not to broaden features, but to **tighten legitimacy, evidence, product quality, and adoption surfaces**

---

## 2. External grounding and strategic frame alignment

### 2.1 Collective deliberation grounding

The strongest conceptual anchor from the current literature is:

> **Collective deliberation is shared reasoning embedded in a broader joint activity around questions that require argumentation.**

Implication for ACP:

ACP should frame itself as:

- not a social feed
- not a consensus generator
- not an AI participant
- not a generic summarizer

ACP is:

> **infrastructure for shared reasoning under bounded attention**

That is the frame that best matches both the philosophical literature and the existing repo architecture.

### 2.2 Foresight workshop alignment

The Foresight “Supercooperation: The Future of AI for Democracy” workshop is explicitly organized around three themes:

1. AI tools for collective deliberation and cooperation
2. power concentration and governance under rapid AI progress
3. democratic practice on the ground

ACP can map directly to all three:

- **Theme 1**: routed digests, bridge exposure, bounded load, explanation layer
- **Theme 2**: open protocol, auditability, conformance, non-black-box public reasoning infrastructure
- **Theme 3**: public hearings, participatory budgeting, school board and council decision workflows

### 2.3 State-of-the-art product / ecosystem grounding

The relevant frontier pattern is not “build a flashy civic app.”
The relevant frontier pattern is closer to:

- **MCP** for protocol posture
- **Polis / vTaiwan** for democratic legibility and rough-consensus lineage
- **deliberation.io / Stanford DEL** for AI facilitation primitives
- **Science 2024 AI common-ground mediation work** for evidence that AI-assisted deliberation can meaningfully mediate collective reasoning

Strategic conclusion:

ACP should be built and presented as:

> **the open protocol and evidence standard for AI-mediated bounded deliberation**

with Relay as the first serious implementation.

---

## 3. Most compelling attractors, frames, basins, and hypotheses

## 3.1 Primary attractors

### Attractor A — Attention as democratic infrastructure

The scarce civic resource is not only speech. It is **who gets seen by whom, when, and under what burden**.

Why this is compelling:

- chronological feeds silently allocate power
- attention concentration is a democratic distortion
- ACP makes attention allocation explicit, inspectable, and contestable

### Attractor B — Open protocol, not sovereign mediator

ACP can be the opposite of a proprietary AI civic copilot.

Why this is compelling:

- protocol, schema, conformance, compatibility, replay, and exports are already native to the repo
- this directly addresses workshop concerns about concentrated power

### Attractor C — Shared reasoning, not manufactured consensus

ACP should not promise unanimity.
It should promise better conditions for:

- hearing relevant arguments
- preserving disagreement
- exposing bridges
- keeping unresolved questions visible

### Attractor D — Institution-ready deliberation middleware

The strongest use cases are not “national direct democracy.”
They are real bounded institutional workflows:

- public hearing triage
- participatory budgeting
- council agenda formation
- school board tradeoff reasoning
- emergency coordination briefings

### Attractor E — Evidence-bearing legitimacy

ACP’s outputs should not only look good.
They should be:

- inspectable
- replayable
- comparable
- publishable

### Attractor F — Ecosystem standardization

The long game is to make ACP feel like a legitimate open standard:

- versioned protocol
- SDKs / client surfaces
- discovery registry
- conformance suite
- external implementer path
- multiple compatible surfaces

## 3.2 Core frames

Use these frames consistently in docs, demos, paper drafts, and product language.

### Frame 1 — Human reasons, AI attention coordination, institutional accountability

Humans supply the reasons.  
AI coordinates exposure.  
Institutions remain accountable.

### Frame 2 — Protocol for bounded shared reasoning

ACP is a protocol for **bounded shared reasoning**, not a chat app and not a bot democracy narrative.

### Frame 3 — Anti-concentration by design

ACP reduces the risk that one opaque model or one engagement-maximizing feed silently becomes the civic operating system.

### Frame 4 — Decision support for democratic institutions under overload

ACP helps institutions think, not merely talk.

## 3.3 Strategic basins of attraction

These are the development basins ACP should intentionally fall into.

### Basin 1 — Protocol-legibility basin

ACP is easiest to trust when:

- protocol meaning is explicit
- compatibility is bounded
- conformance is machine-checkable
- Relay is visibly “an implementation,” not “the protocol itself”

### Basin 2 — Institutional workflow basin

ACP should feel native to real institutional cycles:

- hearing packet preparation
- staff briefings
- agenda triage
- participatory budgeting
- board-level tradeoff reasoning

### Basin 3 — Evidence-and-legitimacy basin

ACP should accumulate legitimacy because every meaningful run leaves behind:

- structural metrics
- comparison outputs
- readable reports
- audit traces
- limitations and missingness notes

### Basin 4 — Ecosystem-adoption basin

ACP becomes stickier when:

- outside implementers can start without founder help
- SDK and starter kits exist
- secondary surfaces prove portability

### Basin 5 — Product-trust basin

Relay must look and behave like a serious institutional tool:

- calm design
- obvious state transitions
- reliable exports
- operator confidence
- participant dignity

### Basin 6 — Production-discipline basin

The project stops feeling like a prototype when:

- auth is real
- storage is durable
- observability exists
- deployments are repeatable
- backups and retention are explicit

## 3.4 Most important hypotheses

### H1 — Bounded routing improves deliberative quality versus chronological threads

Compared with `baseline_thread`, ACP intervention cycles should reduce overload and improve contributor coverage without collapsing meaningful disagreement.

### H2 — Bridge exposure improves pluralism without making outputs feel random

Relevant but non-obvious perspectives will increase exposure diversity and perceived usefulness when explicitly bounded and explained.

### H3 — Explanation increases legitimacy and trust

Participants and operators will rate the system as fairer and more trustworthy when routing and digest logic are explained.

### H4 — Explicit attention coordination improves institutional usability

For public-hearing, budgeting, and board-style tasks, ACP will help operators produce decision-ready briefings faster and with fewer missed themes than baseline thread review.

### H5 — Open protocol posture improves adoption and defensibility

External implementers and institutional partners will prefer an auditable, exportable, standards-oriented system over a black-box deliberation product.

### H6 — Explicit “shared weights” improve contestability

If the protocol makes deliberative criteria explicit — what is being optimized, what must be preserved, what counts as bridge exposure, what must remain unresolved — then fairness and accountability improve.

This is the strongest next-level research hypothesis for ACP’s protocol evolution.

---

## 4. North-star target state

ACP should be considered conference-ready and production-disciplined only when all of the following are true.

### 4.1 Protocol / ecosystem

- ACP can be explained without opening Relay code
- ACP protocol versioning, discovery, compatibility, and extension rules are stable
- at least one robust SDK / client surface exists
- at least one strong external adopter path exists
- a second implementation path is plausible from repo artifacts alone

### 4.2 Relay product

- participant and operator flows are polished, trustworthy, and boringly reliable
- exports and visual artifacts are presentation-grade
- seeded dogfood catches regressions
- browser telemetry and audit coverage are sound

### 4.3 Production platform

- role-aware auth is real
- workspace boundaries are explicit
- canonical storage is not just a local JSON file directory
- observability, backups, retention, and release gates are operationalized

### 4.4 Evidence / paper layer

- one flagship evaluation family is strong enough to anchor a workshop paper
- intervention vs baseline comparisons are replicable and legible
- limitations and missingness are surfaced honestly
- the paper can make modest but real claims, not just architecture claims

### 4.5 Ecosystem legitimacy

- ACP has a clear “MCP-like” posture: protocol, reference implementation, starter path, conformance, public docs, compatibility story

---

## 5. Codex execution doctrine

Codex should follow these patterns throughout the program.

### 5.1 Use a living execution plan

Codex should maintain a live execution status file during the program.
Recommended path:

- `docs/strategy/ACP_EXECUTION_STATUS.md`

Each work packet should record:

- objective
- touched files
- commands run
- blockers
- next packet

### 5.2 Work in thin but consequential vertical slices

Preferred slice pattern:

- spec / contract
- storage / service layer
- API
- UI / CLI
- test
- evidence / report artifact

### 5.3 No giant scope rewrite

Do **not** rewrite the project into a new framework just to look modern.
Stay within the current architecture unless there is a hard blocker.

### 5.4 Prefer closure-based packets, not vague “more work”

Each packet must close one real blocker:

- telemetry integrity
- auth / role boundary
- canonical store migration
- secure evidence capture
- baseline/intervention experiment quality
- SDK/adopter path
- report polish

### 5.5 Every packet must end with verification

Minimum gate after any nontrivial packet:

```bash
npm run build
npm run typecheck
npm test
npm run conformance:check
npm run release:smoke
```

Additional packet-specific gates should be added as the program matures.

### 5.6 Use explicit launch blockers and phase gates

Codex should not begin later-phase work until earlier blockers are satisfied.

### 5.7 Bias toward evidence, not vibes

If a feature does not strengthen:

- protocol clarity
- product reliability
- evidence quality
- adoption surface
- or trustworthiness

it is likely scope drift.

---

## 6. Launch blockers before large-scale implementation

The following blockers must be cleared first.

## Blocker 1 — Fix telemetry truth at the browser boundary

Required:

- replace invalid `surface: 'web'` emissions with canonical values
- add tests proving participant telemetry survives browser flows
- ensure abandonment / beforeunload handling is robust or explicitly degraded with clear semantics

Go condition:

- browser events are schema-valid and persisted

## Blocker 2 — Freeze one flagship evaluation family

Choose one paper anchor family first:

- `public-hearing-triage` **or**
- `participatory-budget-priorities`

Go condition:

- one primary scenario family is the main denominator for workshop claims

## Blocker 3 — Create the execution status control file

Required:

- create `docs/strategy/ACP_EXECUTION_STATUS.md`
- log packets, commands, blockers, and gates

Go condition:

- long-running Codex execution has a stable control plane

## Blocker 4 — Decide storage evolution path

Required:

- explicitly choose canonical path:
  - `SQLite-first with migration path to Postgres`, or
  - `Postgres-first`

Go condition:

- production hardening work is not blocked by storage ambiguity

## Blocker 5 — Freeze v1 production alpha target

Explicitly freeze that “production” for this cycle means:

- institutional production alpha
- not consumer-scale social platform infra

Go condition:

- the build target is ambitious but bounded

---

## 7. End-to-end execution plan

The program should be executed in 8 phases.

---

## Phase 0 — Ground truth, control plane, and blocker clearance

### Goal

Create a clean execution control plane and remove false confidence.

### Required work

1. fix browser telemetry surface mismatch
2. add missing browser telemetry tests
3. create `ACP_EXECUTION_STATUS.md`
4. choose storage evolution path
5. freeze flagship evaluation family
6. write `ACP_PAPER_POSITIONING.md` capturing:
   - central claim
   - denominator
   - target paper title directions
   - non-claims

### Primary file scope

- `public/app.js`
- `src/core/types.ts`
- `tests/*browser/telemetry*` or equivalent additions
- `docs/strategy/ACP_EXECUTION_STATUS.md`
- `docs/strategy/ACP_PAPER_POSITIONING.md`

### Exit criteria

- telemetry integrity restored
- execution control plane exists
- flagship scenario family frozen

---

## Phase 1 — Product truth and protocol tightening

### Goal

Make the system’s core semantics sharper before broadening infrastructure.

### Required work

1. make “shared weights / deliberative criteria” explicit in protocol config or cycle config
   - what is being optimized
   - how bridge exposure is budgeted
   - what fairness / inclusion constraints exist
   - what unresolved-question preservation means
2. clarify boundary between:
   - routing logic
   - digest logic
   - explanation logic
   - institutional review logic
3. normalize event vocabularies and surface vocabularies
4. ensure baseline vs intervention export parity is honest and legible
5. add stronger tests around protocol invariants and explanation semantics

### Deliverables

- protocol/config extension for explicit deliberative criteria
- updated docs and schema artifacts
- normalized telemetry/event vocabulary
- stronger comparison exports

### Primary file scope

- `src/core/types.ts`
- `src/services/pipeline.ts`
- `src/services/cycle-service.ts`
- `protocol/*`
- `docs/specs/ACP_PROTOCOL_CONTRACT_SPEC.md`
- `docs/specs/ACP_COORDINATION_ENGINE_SPEC.md`
- `tests/pipeline.test.ts`
- `tests/protocol-bundle.test.ts`

### Exit criteria

- ACP’s reasoning criteria are more explicit and contestable
- protocol drift is harder
- baseline and intervention remain comparable

---

## Phase 2 — Production platform baseline

### Goal

Turn Relay from local reference app into institutional production alpha.

### Required work

1. introduce canonical DB-backed store
   - recommended: `SQLite-first locally`, with interfaces and migration path to Postgres
2. preserve backward import from `.acp-data`
3. implement real workspace scoping in store and API
4. harden signed sessions and role checks
5. add deployment-time configuration discipline
6. add structured logs and request correlation
7. add backup / export / restore smoke path
8. add rate limits / request-size guards / safer session handling

### Deliverables

- canonical store abstraction and DB implementation
- migration / import path
- workspace-aware persistence
- hardened auth/session flow
- observability primitives
- backup/restore discipline

### Primary file scope

- `src/services/store.ts`
- `src/services/file-store.ts`
- new DB store modules
- `src/api/security.ts`
- `src/api/app.ts`
- `src/api/ops.ts`
- `src/core/config.ts`
- `docs/specs/RELAY_PRODUCTION_PLATFORM_SPEC.md`
- `docs/deployment/*`
- CI / release scripts as needed

### Exit criteria

- Relay can credibly be run for small institutional pilots
- local file storage is no longer the only canonical path
- auth and workspace model are materially more real

---

## Phase 3 — Deliberation engine v2

### Goal

Upgrade ACP from transparent heuristic demo into publishable coordination engine v2 while preserving interpretability.

### Required work

1. keep deterministic baseline heuristics as a fallback path
2. add a stronger routing / digest scoring layer that can incorporate:
   - semantic similarity
   - diversity / bridge distance
   - load budgeting
   - explicit criteria weighting
   - institutional policy constraints
3. preserve explanation honesty
   - explanations must point to interpretable categories, not fake precision
4. add evaluation hooks for:
   - exposure concentration
   - contributor coverage
   - bridge exposure quality
   - disagreement preservation
5. make digest caps and reading-time estimates more defensible

### Deliverables

- engine v2 routing design
- explicit weights / scoring contracts
- stronger explanation templates
- metrics instrumentation improvements

### Primary file scope

- `src/services/pipeline.ts`
- `src/core/types.ts`
- `docs/specs/ACP_COORDINATION_ENGINE_SPEC.md`
- `docs/specs/ACP_TELEMETRY_EVALUATION_SPEC.md`
- benchmark fixtures as needed
- pipeline tests and comparison harness tests

### Exit criteria

- ACP has a stronger mechanism story than “Jaccard plus bridge tail picks”
- explanations remain auditable
- metrics can support a paper claim

---

## Phase 4 — Evidence, benchmark, and paper backbone

### Goal

Build one real paper-grade evaluation backbone.

### Required work

1. freeze one flagship evaluation family
2. define exact hypotheses, primary metrics, secondary metrics, and caveats
3. strengthen seeded scenarios and paired baseline/intervention evidence bundles
4. add missingness and anomaly capture to every meaningful run
5. create operator-review and research-review templates that are regenerated from source artifacts
6. add at least one stronger matched comparison report for the flagship family
7. ensure dogfood and benchmark outputs can back a paper appendix

### Deliverables

- flagship evaluation spec
- primary metric table
- benchmark bundle structure upgrades
- paper-ready comparison report
- stronger casebook artifacts

### Primary file scope

- `benchmarks/*`
- `scripts/benchmark/*`
- `scripts/report/*`
- `docs/specs/ACP_EVIDENCE_AND_REPORTING_SYSTEM_SPEC.md`
- `docs/evaluation/*`
- `docs/reports/*`
- tests for benchmark / report generation

### Exit criteria

- one scenario family is strong enough to anchor a workshop submission
- generated evidence is inspectable and limitation-aware

---

## Phase 5 — Product quality, UX taste, and institutional briefing quality

### Goal

Make Relay feel trustworthy and high-taste on first contact.

### Required work

1. tighten operator information hierarchy
2. improve participant digest / thread clarity
3. make bridge items understandable but not alarmist
4. make exports and HTML artifacts look like briefing tools, not raw dumps
5. improve error, loading, and empty-state polish
6. add clearer cycle / participant / export navigation
7. preserve current no-framework-rewrite discipline unless blocked

### Deliverables

- product polish pass grounded in `docs/design/RELAY_VISUAL_STRATEGY.md`
- improved operator detail flow
- stronger participant release views
- more institutional-grade visual artifacts

### Primary file scope

- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `docs/design/RELAY_VISUAL_STRATEGY.md`
- related tests / screenshot checks if added

### Exit criteria

- Relay no longer feels like a prototype shell
- reports and explainers are briefable to institutional audiences

---

## Phase 6 — Ecosystem standardization

### Goal

Give ACP a real ecosystem-standard posture.

### Required work

1. ship a minimal TS SDK client that wraps the public API and protocol artifacts cleanly
2. optionally ship a minimal Python client if cost is acceptable
3. strengthen discovery and compatibility docs
4. add at least one additional adopter starter path beyond the current example
5. publish clear extension policy and compatibility claims
6. make conformance runnable from outside Relay internals
7. document ACP as a standard, not only as repo internals

### Deliverables

- SDK / client surface
- stronger adopter starter kit
- explicit extension and compatibility policy
- improved implementer docs

### Primary file scope

- `src/sdk/*`
- `adopters/*`
- `protocol/*`
- `docs/compatibility/*`
- `docs/specs/ACP_PROTOCOL_ECOSYSTEM_SPEC.md`
- `tests/sdk-smoke.test.ts`
- new adopter tests as needed

### Exit criteria

- ACP feels like a protocol ecosystem seed, not just a demo repo
- external implementer path is materially easier

---

## Phase 7 — Pilot hardening and external proof

### Goal

Prepare the system for credible outside use and workshop scrutiny.

### Required work

1. run seeded dogfood after every major phase
2. produce at least one full internal pilot rehearsal packet
3. exercise backup/restore and export-review flows
4. ensure operator runbooks truly match the product
5. capture one stronger external consumer walkthrough
6. if possible, validate with one outside implementer or simulated third-party operator

### Deliverables

- pilot rehearsal bundle
- operator anomaly log examples
- external-consumer walkthrough artifact
- updated runbooks and checklists

### Primary file scope

- `scripts/dogfood/*`
- `docs/pilot/*`
- `docs/deployment/*`
- `docs/reports/*`
- `adopters/*`
- test coverage for the hardest paths

### Exit criteria

- product, docs, and evidence loop align under realistic operation

---

## Phase 8 — Conference package and final export

### Goal

Produce the final conference-grade, product-grade, and ecosystem-grade package.

### Required work

1. freeze paper positioning and claims
2. generate final flagship comparison bundle
3. generate final protocol explainer, compatibility proof, cycle briefing, pilot recap
4. generate final adopter / SDK walkthrough artifacts
5. generate final readiness audit
6. write limitations and non-claims explicitly
7. produce a clean “start here” path for reviewers and adopters

### Deliverables

- conference-ready report bundle
- final README tightening
- final protocol/adopter docs
- final readiness memo
- final claim registry

### Exit criteria

- ACP can be shown to workshop reviewers, pilot partners, and external implementers with confidence

---

## 8. Workstream model for Codex

Codex should execute in parallelizable workstreams only where scopes are disjoint.

### Workstream A — protocol and conformance

Owns:

- protocol artifacts
- schema
- compatibility
- conformance
- SDK contracts

### Workstream B — product and platform

Owns:

- auth
- store
- workspace
- API
- product flows
- observability

### Workstream C — evidence and reporting

Owns:

- benchmark scenarios
- comparison harness
- report bundle
- paper artifacts

### Workstream D — UX and visual artifacts

Owns:

- UI polish
- briefings
- explainers
- product clarity

### Workstream E — adoption and ecosystem

Owns:

- adopter starter kits
- SDK usage docs
- external consumer path

Main orchestrator responsibility:

- phase gating
- integration
- anti-drift enforcement
- release gates

---

## 9. Codex packet sizing and runtime calibration

Given the current measured planning assumption:

- **60 human hours ≈ 2.656 Codex runtime hours**

Practical translation:

- **1 Codex runtime hour ≈ 22.6 human hours**

This should be used only for rough scoping, not as a completion proxy.

### Recommended packet sizes

#### Small packet

- `12–25 human hours`
- `0.5–1.1 Codex runtime hours`

Use for:

- a single boundary fix
- a test harness addition
- one report artifact cleanup
- one doc + code sync packet

#### Medium packet

- `30–60 human hours`
- `1.3–2.7 Codex runtime hours`

Use for:

- one real vertical slice
- store abstraction introduction
- auth / workspace hardening slice
- benchmark/reporting enhancement packet

#### Large packet

- `70–120 human hours`
- `3.1–5.3 Codex runtime hours`

Use for:

- DB migration + compatibility path
- SDK + adopter path slice
- major product / evidence phase bundle

### Program-scale estimate

A realistic technical program from current state to target state is:

- **450–750 human engineering hours**
- approximately **20–33 Codex runtime hours**

This excludes human partner coordination, pilot recruitment, and workshop submission logistics.

Interpretation:

- this is large, but absolutely feasible for sustained Codex execution
- closure should be managed by **phase gates**, not runtime accumulation

---

## 10. Required commands and release gates

Current mandatory gate after meaningful changes:

```bash
npm run build
npm run typecheck
npm test
npm run conformance:check
npm run release:smoke
```

### New gates to add during the program

Codex should add and use these when the corresponding systems exist:

- `npm run lint`
- `npm run test:e2e` or equivalent deterministic browser path
- `npm run dogfood:relay`
- `npm run benchmark:compare -- --class <flagship-class>`
- `npm run report:bundle -- --source <bundle> --out <dir>`
- backup/restore smoke command
- SDK/adopter smoke command

---

## 11. Anti-drift rules

These are binding.

### Rule 1 — Do not broaden into a generic social product

Reject:

- open feeds
- chat-first expansion
- growth / engagement features
- public social graph work

### Rule 2 — No framework rewrite without hard necessity

Do not migrate to a heavier framework for aesthetic reasons alone.

### Rule 3 — Protocol meaning stays primary

Relay may implement ACP.  
Relay must not silently redefine ACP.

### Rule 4 — Evidence before theater

Do not optimize the story beyond what the evidence can support.

### Rule 5 — One flagship denominator first

The paper and workshop narrative should anchor to one scenario family before broadening claims.

### Rule 6 — SDK and ecosystem work must follow strong core semantics

No glossy ecosystem posture over fuzzy protocol behavior.

### Rule 7 — Product polish is real work, but only after truth surfaces are fixed

Do not polish unreliable flows.

---

## 12. Immediate next packet sequence

Codex should start with this exact sequence.

### Packet 1

- fix browser telemetry surface mismatch
- add browser telemetry regression tests
- create `ACP_EXECUTION_STATUS.md`

### Packet 2

- write `ACP_PAPER_POSITIONING.md`
- freeze flagship evaluation family
- define explicit hypotheses and non-claims

### Packet 3

- choose and implement store evolution path
- preserve legacy import path
- add workspace-aware persistence tests

### Packet 4

- harden signed sessions / role boundaries / auth semantics
- add request correlation and structured ops visibility

### Packet 5

- add explicit deliberative criteria / shared-weights config to protocol and engine
- strengthen routing explanation semantics

### Packet 6

- strengthen flagship benchmark / report bundle pipeline
- generate first paper-grade comparison artifact

### Packet 7

- ship SDK + stronger adopter starter
- validate external consumer path end to end

### Packet 8

- polish Relay UI and visual artifact surfaces
- run dogfood and export the first full conference rehearsal bundle

---

## 13. Definition of done

The senior bar for satisfaction is:

> ACP is visibly a standards-oriented protocol project with a credible reference implementation, a trustworthy evidence layer, a real external-adoption path, and a product surface good enough to brief institutions and submit to a serious AI-for-democracy venue.

Concretely, done means:

- protocol clarity
- product reliability
- production discipline
- evidence strength
- ecosystem posture
- briefing quality
- honest limitations

Anything short of that may still be a strong milestone, but not the final target.
