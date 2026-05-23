# ACP Protocol Ecosystem Spec

Status: Ecosystem expansion spec  
Parent specs: `ACP_PROTOCOL_CONTRACT_SPEC.md`, `ACP_VERSIONING_SPEC.md`, `ACP_SCHEMA_SPEC.md`, `ACP_CONFORMANCE_SPEC.md`, `ACP_COMPATIBILITY_SPEC.md`  
Version: 0.1  
Date: 2026-04-24

## 1. Purpose

This document defines what must exist for `Attention Coordination Protocol (ACP)` to count as a real protocol ecosystem rather than a strong single-repo implementation.

Its job is to make six things explicit:

- the versioned protocol shape
- the conformance stack
- the SDK and client surface
- the registry and discovery model
- the compatibility policy
- the minimum bar for independent implementations

This spec keeps the ACP-first hierarchy fixed:

- `ACP` is the protocol contract
- `Relay` is the first implementation
- `Relay Blocks` are the reusable operational layer packaged over ACP

## 2. Scope

This spec covers only ecosystem-level technical requirements.

It does cover:

- how ACP versions are defined and carried across artifacts
- what a conformance stack must contain
- what SDKs and client surfaces must expose
- how protocol artifacts are discovered
- how compatibility claims are made
- what counts as an independent implementation
- where extension is allowed
- what acceptance criteria mark ACP as a real protocol ecosystem

It does not:

- redefine canonical object meanings from the protocol contract
- make Relay Blocks the source of truth for protocol state
- require one specific programming language or deployment topology
- require UI parity with Relay
- require every implementation to support every operational adapter

## 3. Ecosystem Goal

ACP becomes a real protocol ecosystem when all of the following are true:

- the protocol can be understood without opening Relay
- the protocol can be checked without trusting Relay
- the protocol can be implemented without copying Relay internals
- the protocol can be extended without changing canonical meaning
- the protocol can be adopted by another surface or team with bounded effort

The ecosystem bar is not "we built a good app."

The ecosystem bar is:

- there is a stable contract
- there are testable artifacts
- there is a client path for implementers
- there is a discovery path for protocol artifacts
- there is at least one implementation path beyond the first product shell

## 4. Ecosystem Layers

ACP ecosystem work is split into five layers.

### 4.1 Protocol layer

Owns:

- canonical object meanings
- state transitions
- required invariants
- version identifiers
- schema bundle
- examples and fixtures

Does not own:

- product-specific UI
- runtime-specific packaging
- operator workflow instructions

### 4.2 Conformance layer

Owns:

- schema validation
- replay fixtures
- conformance checks
- lifecycle normalization rules
- compatibility matrix checks

Does not own:

- application state persistence
- visual presentation

### 4.3 Client layer

Owns:

- SDKs or thin clients for reading, validating, submitting, replaying, and exporting ACP artifacts
- stable request and response contracts where ACP is accessed through HTTP or CLI boundaries
- typed helpers for common protocol operations

Does not own:

- canonical protocol semantics
- product branding

### 4.4 Discovery layer

Owns:

- machine-readable protocol bundle locations
- registry metadata
- implementation listings
- compatibility claim listings
- extension listings

Does not own:

- canonical protocol truth
- mutable cycle state

### 4.5 Implementation layer

Owns:

- concrete execution of the protocol
- storage
- UI and operator surfaces
- runtime packaging

Current implementation split:

- `Relay` is the first implementation
- `Relay Blocks` package reusable operational units over ACP
- runtime wrappers distribute Relay Blocks across skills-compatible agent environments

## 5. Versioned Protocol Shape

### 5.1 Version identity

Every ACP ecosystem artifact must declare a protocol version.

Required version fields:

- `protocol_name`
- `protocol_version`
- `artifact_kind`
- `artifact_version`

Rules:

- `protocol_name` must be `ACP`
- `protocol_version` must use semver-style versioning
- artifact versions may advance independently, but may not imply a different protocol version without explicit declaration
- compatibility claims must always name the exact `protocol_version` they target

### 5.2 Canonical protocol bundle

An ACP protocol bundle for a given version must include:

- canonical schema bundle
- canonical example artifacts
- replay fixtures
- compatibility matrix
- conformance command or runner
- external implementer guidance

Minimum bundle locations for the current repo:

- `protocol/`
- `fixtures/replay/`
- `docs/compatibility/`

### 5.3 Version change classes

Version changes must be classified as one of:

- `patch`: clarification, non-semantic artifact correction, stricter tooling without contract meaning changes
- `minor`: backward-compatible protocol additions, new optional fields, new optional extension hooks, new discovery metadata
- `major`: lifecycle change, object meaning change, required field change, incompatible status or operation change

### 5.4 Version support policy

At minimum, the ecosystem must support:

- one current stable version
- one clearly marked draft or next version if active development is underway

Every implementation claim must say whether it is:

- `native`
- `mapped`
- `wrapped`
- `assumed`

These labels belong in the compatibility matrix and must not be inferred informally.

## 6. Conformance Stack

### 6.1 Required components

ACP must ship a conformance stack with all of the following:

- schema validation against the canonical bundle
- replay fixtures for intervention and baseline conditions
- lifecycle normalization checks
- compatibility matrix validation
- smoke validation for secondary proof surfaces

### 6.2 Conformance responsibilities

The conformance stack must answer five questions:

- does an artifact match the schema for its declared protocol version?
- does a run preserve canonical lifecycle meaning?
- does a fixture replay to the expected normalized state?
- does an implementation claim more compatibility than it actually supports?
- does a secondary proof surface still behave as ACP rather than an app-specific variant?

### 6.3 Required fixture coverage

At minimum, replay fixtures must cover:

- one `intervention` cycle
- one `baseline_thread` cycle
- one failure-path fixture
- one export-path fixture
- one compatibility normalization fixture where vocabulary mapping is required

### 6.4 Conformance outputs

A conformance run must emit machine-readable output with:

- protocol version checked
- artifact set checked
- fixture set checked
- pass or fail result per check
- explicit failure reasons

### 6.5 Conformance failure conditions

Conformance fails when:

- schema validation fails
- lifecycle meaning diverges from the contract
- replay output diverges from expected normalized output
- an implementation claims unsupported conditions or statuses
- a wrapped runtime changes protocol meaning at the boundary

## 7. SDK and Client Surface

### 7.1 Goal

ACP must be usable through stable client surfaces without requiring implementers to inspect Relay internals.

### 7.2 Required client capabilities

A minimal ACP client surface must support:

- reading canonical protocol metadata
- validating artifact bundles against the schema bundle
- loading and replaying fixtures
- reading compatibility claims
- executing or driving one ACP cycle through a stable boundary
- exporting ACP run artifacts in machine-readable form

### 7.3 Supported surface classes

The ecosystem may expose these client classes:

- SDKs in concrete languages
- HTTP clients
- CLI clients
- batch runners
- adapter wrappers for skills-compatible runtimes

At least two client surface classes must exist for ACP to count as ecosystem-grade.

### 7.4 SDK/client minimum contract

Any ACP SDK or client must expose or document:

- protocol version handling
- artifact validation entrypoints
- cycle condition handling for both supported conditions
- lifecycle status normalization rules where needed
- export retrieval or generation
- error types for invalid contract use

### 7.5 SDK/client non-goals

SDKs and clients do not need to:

- replicate Relay UI behavior
- ship Relay Blocks packaging
- expose every operator convenience flow from Relay

## 8. Registry and Discovery Model

### 8.1 Goal

ACP protocol artifacts, implementations, and extensions must be discoverable without oral tradition or repo-memory.

### 8.2 Discovery objects

The discovery layer must support these object classes:

- protocol bundles
- schema bundles
- replay fixtures
- implementations
- client surfaces
- Relay Blocks packages
- runtime wrappers
- extensions
- compatibility claims

### 8.3 Registry model

A valid ACP registry model may be file-based first.

Minimum registry requirements:

- machine-readable listing
- stable identifiers
- protocol version linkage
- compatibility classification
- implementation ownership metadata
- status marker such as `draft`, `stable`, `deprecated`

### 8.4 Discovery rules

Discovery metadata must:

- point to canonical artifacts, not copies where possible
- declare protocol version explicitly
- distinguish implementation from wrapper
- distinguish extension from core protocol
- distinguish first-party from external implementations if known

### 8.5 Current baseline

In the current repo, discovery is satisfied minimally by:

- canonical spec index
- protocol bundle files
- compatibility matrix
- Relay Blocks registry
- agent runtime bundle manifests

That baseline is acceptable for v0.1, but it is not the end-state ecosystem registry.

## 9. Compatibility Policy

### 9.1 Compatibility goal

ACP compatibility claims must be explicit, bounded, and falsifiable.

### 9.2 Claim types

An implementation or client may claim:

- protocol compatibility
- condition compatibility
- lifecycle compatibility
- export compatibility
- wrapper compatibility
- discovery compatibility

Claims must name:

- target protocol version
- claim class
- support level
- known gaps

### 9.3 Support levels

Support levels are:

- `native`: direct support with no semantic translation required
- `mapped`: semantic equivalence preserved through documented normalization
- `wrapped`: support provided through an adapter or distribution wrapper over another surface
- `assumed`: compatibility expected but not yet validated

### 9.4 Compatibility restrictions

No implementation may claim ACP compatibility if it cannot support:

- the shared cycle model
- both current conditions or a clearly declared subset
- lifecycle meaning equivalent to the protocol contract
- replayable retention for audit or telemetry sufficient for verification
- machine-readable export access

### 9.5 Compatibility evidence

Every compatibility claim must point to at least one of:

- conformance result
- replay fixture result
- schema validation result
- explicit manual validation note

## 10. Independent Implementation Requirements

### 10.1 Goal

ACP becomes an ecosystem only when a team can implement it without importing Relay internals as the hidden protocol.

### 10.2 Minimum bar

A system counts as an independent ACP implementation only if:

- it does not depend on Relay source imports for core cycle execution
- it implements ACP through its own execution path
- it preserves canonical object meanings
- it can pass the conformance stack for its claimed support level
- it documents its compatibility class and gaps

### 10.3 What does not count

The following do not count as independent implementations:

- a Relay UI theme or product fork with the same core imports
- a thin wrapper over Relay that only re-exposes the same engine boundary
- a skills bundle that points back to Relay commands
- a report viewer with no cycle execution path

These may still count as proof surfaces, wrappers, or adoption paths. They do not count as independent implementations.

### 10.4 Ecosystem proof threshold

For ACP to count as a real protocol ecosystem, at least one of the following must exist beyond Relay:

- one independent implementation
- or two non-trivial proof surfaces with different boundaries plus one external adopter path validated by a third party

The first option is stronger. The second is acceptable only as an interim state.

## 11. Extension Points

### 11.1 Allowed extension areas

ACP may be extended in these areas without redefining the core protocol:

- additional metadata fields under a reserved extension namespace
- new export formats
- new client libraries
- new registry metadata
- new Relay Blocks packages
- new runtime wrappers
- new optional evaluation artifacts

### 11.2 Reserved core areas

The following may not be changed by extensions without a protocol version change:

- canonical condition meanings
- canonical lifecycle meanings
- core object identities
- required invariants for cycle execution
- compatibility support-level definitions

### 11.3 Extension declaration rules

Every extension must declare:

- extension identifier
- owner or maintainer
- target protocol version range
- whether it is required or optional
- whether it changes semantics or only packaging

Semantic changes are not extensions. They are protocol changes.

## 12. Acceptance Criteria

ACP counts as a real protocol ecosystem only when all of the following are true:

### 12.1 Protocol clarity

- a new reader can explain ACP from protocol artifacts without opening Relay
- the versioned protocol bundle is complete and current
- canonical examples exist for the current stable version

### 12.2 Verification

- the conformance stack runs end to end
- replay fixtures cover both conditions and at least one failure path
- compatibility claims are checked rather than implied

### 12.3 Client surface

- there are at least two usable ACP client surface classes
- at least one surface drives ACP through a public boundary rather than internal imports
- protocol version and normalization behavior are explicit in client docs

### 12.4 Discovery

- protocol artifacts are discoverable through machine-readable metadata
- implementations and wrappers are distinguishable
- compatibility and support levels are published in one current source of truth

### 12.5 Adoption path

- an external implementer guide exists and is current
- at least one external-consumer example exists outside Relay UI conventions
- a new implementer can validate their work with bounded effort

### 12.6 Ecosystem proof

- Relay is clearly the first implementation, not the whole protocol
- Relay Blocks are clearly the operational layer, not the protocol source of truth
- ACP has either one independent implementation or the interim ecosystem proof threshold defined in section 10.4

### 12.7 Institutional usability

- ACP outputs can be turned into readable reporting surfaces for operators, researchers, or institutions
- evidence artifacts exist that support comparison, audit, and inspection

## 13. Current Gap Assessment

As of this spec version, the current ACP repo is best understood as:

- strong protocol-first reference implementation
- real conformance and replay stack
- real proof surfaces beyond the main browser flow
- real external implementer path
- partial ecosystem proof

It is not yet the full end-state ecosystem because:

- Relay is still the only core execution engine
- wrapper distribution and proof surfaces are stronger than independent implementation diversity
- external adoption is plausible, but not yet validated by a third-party implementer

## 14. Implementation Rule

When implementation, docs, or distribution tooling diverge from this spec, the required correction order is:

1. preserve ACP protocol meaning
2. preserve explicit compatibility classification
3. preserve Relay as first implementation, not protocol synonym
4. preserve Relay Blocks as operational layer, not state owner
5. update conformance and discovery artifacts before expanding claims
