# Relay Production Platform Spec

Status: Child spec derived from ACP implementation specs  
Parent specs:

- `ACP_PROTOCOL_CONTRACT_SPEC.md` v0.3
- `RELAY_REFERENCE_IMPLEMENTATION_SPEC.md` v0.1
- `RELAY_WEB_APP_SPEC.md` v0.1
- `RELAY_OPERATOR_CLI_HEADLESS_SPEC.md` v0.1
- `ACP_PERSISTENCE_EXPORT_SPEC.md` v0.1
- `ACP_RELEASE_DEPLOYMENT_SPEC.md` v0.1
- `ACP_COMPATIBILITY_SPEC.md` v0.1

Version: 0.1  
Date: 2026-04-24

## 1. Purpose

This document defines the production platform requirements for `Relay`, the first implementation of `Attention Coordination Protocol (ACP)`.

Its role is to specify:

- how Relay should evolve from a serious local reference implementation into a production-capable platform
- how auth, access, workspace boundaries, persistence, observability, and deployment should work without redefining ACP
- what security, retention, and release discipline are required before serious multi-user or institutional use
- the acceptance bar for calling Relay production-ready

## 2. Normative Scope

This spec governs:

- the production platform shape of Relay
- access control and operator role boundaries
- workspace or tenant isolation rules
- persistence evolution beyond local file storage
- observability, backup, and retention expectations
- deployment topology and production release gates
- production hardening requirements for the first implementation

This spec does not govern:

- ACP protocol semantics
- Relay Blocks packaging rules except where platform integration is relevant
- institutional adoption strategy
- legal policy drafting beyond the technical controls needed to support pilot and production use

## 3. Platform Framing

Read the stack this way:

- `ACP` remains the protocol contract and source of truth.
- `Relay` remains the first implementation of ACP.
- `Relay Production Platform` is the operational environment that allows Relay to be run safely and repeatedly for real users, teams, and institutions.

Normative rule:

- production platform work may add access control, storage, deployment, and monitoring layers
- production platform work may not redefine ACP objects, lifecycle semantics, or export meanings
- if platform pressure suggests a protocol change, that change must be escalated back to the ACP specs instead of being hidden inside Relay infrastructure

## 4. Production Platform Goals

Relay production platform work should achieve all of the following:

- support real operator and participant use without local-machine assumptions
- isolate workspaces cleanly enough for multiple organizations, teams, or pilots
- preserve replay, audit, export, and evidence integrity under production conditions
- make failures visible quickly
- make recovery predictable
- reduce the chance that operator mistakes, leaked credentials, or bad deploys silently corrupt ACP evidence

## 5. Auth And Access Model

### 5.1 Auth baseline

Production Relay must move beyond anonymous local access.

Minimum supported auth model:

- authenticated user identity for every operator action
- authenticated participant identity for every participant session that can submit or view protected cycle data
- session expiration and renewal rules
- secure passwordless, SSO, magic-link, or equivalent identity flow suitable for trusted pilots

Acceptable early production options:

- managed auth provider
- organization SSO for pilots or institutional deployments
- signed invitation links for bounded participant cohorts

Not acceptable for production:

- shared operator secret only
- identity based solely on query parameters
- long-lived bearer tokens with no rotation plan
- participant access that cannot be attributed to a stable user identity

### 5.2 Access model

Relay must enforce access server-side.

Access checks must be applied to:

- cycle creation
- cycle visibility
- lifecycle transitions
- export generation and download
- audit access
- replay access
- participant contribution submission
- participant digest or baseline thread access
- feedback access

UI-only hiding does not count as access control.

### 5.3 Session requirements

Production sessions must support:

- secure cookies or equivalently protected session tokens
- CSRF protection where cookie-based browser flows are used
- revocation or invalidation on logout or operator suspension
- audit attribution from session identity to user id
- device or session metadata sufficient for security review where practical

## 6. Operator Roles And Permissions

Relay must support explicit operator role boundaries.

Minimum production roles:

- `platform_admin`: manages deployment-level settings, workspace provisioning, auth configuration, retention policies, and emergency recovery
- `workspace_admin`: manages one workspace, invites users, sets pilot defaults, views all workspace cycles, and performs destructive archive or retention actions within the workspace
- `facilitator`: creates cycles, manages lifecycle state, reviews exports, inspects routing, and runs pilot operations without changing workspace-level security settings
- `research_analyst`: views exports, telemetry, audit summaries, and replay artifacts but cannot change active cycle state
- `participant`: views and submits only within cycles they are assigned to
- `observer` optional: read-only access to selected cycles or reports without participation rights

Normative rules:

- destructive actions must be restricted to `workspace_admin` or higher unless explicitly delegated
- production export deletion, retention override, or backup restore must require elevated privileges
- operator impersonation for debugging must be disabled by default and fully audited when enabled
- participant identity must never inherit operator privileges through client-side role hints

## 7. Workspace And Tenant Model

Relay production platform must move from one local store to an explicit workspace model.

### 7.1 Workspace definition

A workspace is the minimum production isolation boundary for:

- users
- roles
- cycles
- exports
- telemetry
- audit logs
- retention policies
- prompt packs and operational defaults where supported

### 7.2 Tenant model

Production Relay should support one of these models explicitly:

- single-tenant deployment with one workspace set
- multi-workspace single deployment
- multi-tenant deployment with stronger storage and auth isolation

The model must be declared in deployment configuration, not inferred.

### 7.3 Isolation rules

Workspaces must isolate:

- cycle ids and storage namespaces
- operator visibility by default
- participant membership and invitations
- export paths and download permissions
- audit and telemetry access

Cross-workspace access must require explicit elevated privilege and full audit recording.

### 7.4 Shared infrastructure rules

Shared infrastructure is acceptable if:

- workspace scoping is enforced server-side and storage-side
- backups preserve workspace boundaries
- logs and metrics can be filtered by workspace without leaking protected content

## 8. Persistence Evolution

Relay may begin with file-backed persistence, but production Relay must evolve toward a storage model that supports concurrent access, backups, and bounded recovery.

### 8.1 Required storage properties

Production persistence must support:

- durable canonical cycle storage
- transactional or transaction-like writes for lifecycle-critical updates
- per-workspace namespacing
- indexed retrieval for cycles, exports, audit events, and telemetry summaries
- concurrent access without silent overwrite under normal production load
- migration capability from existing file-backed records

### 8.2 Canonical data preservation

Any production storage layer must preserve:

- ACP canonical object meaning
- stable ids and timestamps
- replayability
- export reproducibility
- audit attribution

Database convenience must not erase protocol-grade artifacts.

### 8.3 Chosen evolution path

The chosen path for the current production-alpha program is:

1. file-backed local store for reference implementation and backward compatibility
2. SQLite-backed canonical store for institutional production alpha
3. Postgres-compatible schema and migration path for later hosted or multi-instance production
4. object storage or artifact storage for exports, reports, and backup bundles where needed

Normative rule:

- SQLite is the first production-alpha database target.
- Postgres is the later scale-out target.
- File storage remains a compatibility surface, not the long-term production store.

### 8.4 Migration constraints

Production migration must provide:

- one documented migration path from `.acp-data` or equivalent local records
- backward readability or one-time import tooling for prior cycle artifacts
- validation checks that imported cycles still satisfy replay and export expectations

## 9. Observability

Production Relay must make failures, drift, and abnormal usage visible quickly.

### 9.1 Required observability classes

Relay production platform must support:

- structured application logs
- request-level tracing or request correlation ids
- health and readiness checks
- platform metrics
- audit visibility
- lifecycle failure alerts for operator-critical paths

### 9.2 Minimum metrics

Production metrics must include at least:

- request volume and error rate
- lifecycle transition success and failure counts
- routing job duration and failure counts
- export generation duration and failure counts
- authentication failures
- workspace-level cycle counts
- storage latency and persistence error counts

### 9.3 Audit visibility

Audit access must support:

- who changed what
- when the change happened
- which workspace and cycle were affected
- whether the action was interactive, API-driven, or automation-driven

### 9.4 Operator-facing diagnostics

The platform should expose enough operator-facing diagnostics to answer:

- is the service up
- which workspace or cycle is affected
- did auth fail, persistence fail, routing fail, export fail, or deployment fail
- what is safe to retry

## 10. Deployment Topology

Production Relay must move beyond one local process with one writable directory.

### 10.1 Minimum topology

A minimum serious production topology should include:

- one web or API service process for Relay surfaces
- one persistent storage layer
- one background worker path for routing, export, replay, or long-running jobs when those operations are no longer safe inline
- one artifact storage path for exports and generated reports if local disk is insufficient
- one secrets management path

### 10.2 Environment tiers

Relay production platform should distinguish:

- local development
- staging or pre-production
- production

Each tier must have:

- separate configuration
- separate credentials
- separate storage namespaces
- separate deploy targets

### 10.3 Job execution model

Longer-running work should be moved off the request path when production pressure requires it, especially:

- routing-heavy runs
- replay jobs
- export generation
- backup generation

Job execution must remain audit-attributed and workspace-scoped.

## 11. Backups And Recovery

Production Relay must support routine backup and bounded recovery.

### 11.1 Backup requirements

Backups must cover:

- canonical cycle data
- workspace metadata
- auth-relevant membership data where Relay stores it directly
- export artifacts or enough state to regenerate them predictably
- configuration needed to restore service safely

### 11.2 Recovery objectives

Production deployments must define and document:

- target restore time
- target acceptable data loss window
- who can initiate restore
- how restore actions are audited

### 11.3 Restore discipline

Restore procedures must support:

- restore into non-production first where practical
- validation that restored cycles remain replayable
- validation that exports and audit traces remain readable
- workspace-scoped restore where feasible to avoid unnecessary blast radius

## 12. Retention And Deletion

Relay production platform must make retention explicit.

### 12.1 Retention classes

At minimum, retention policy must distinguish:

- active cycle records
- archived cycle records
- exports and generated reports
- audit logs
- telemetry detail
- backups

### 12.2 Default retention posture

Unless a deployment has stronger regulatory needs, the default posture should be:

- preserve canonical cycle and audit records long enough for replay and pilot review
- preserve exports long enough for operator and research use
- allow bounded telemetry compaction only if replay-critical semantics are preserved

### 12.3 Deletion rules

Deletion must be:

- role-gated
- audited
- workspace-scoped
- designed to avoid orphaning evidence unexpectedly

If hard deletion is supported, the system must document exactly which artifacts are removed and which remain in backups.

## 13. Security Hardening

Production Relay must assume real exposure to mistakes and hostile traffic.

### 13.1 Network and request hardening

Production deployments must support:

- TLS in transit
- secure cookie settings where cookies are used
- input validation on all public boundaries
- rate limiting or abuse throttling for auth and submission paths
- request size limits
- upload restrictions if attachments exist later

### 13.2 Secrets handling

The platform must:

- keep secrets out of client bundles
- avoid plaintext secrets in repo-tracked files
- support rotation of deployment secrets
- separate secrets by environment

### 13.3 Dependency and platform hygiene

Production release practice should include:

- dependency update discipline
- vulnerability scanning where practical
- pinned runtime assumptions for critical services
- least-privilege deployment credentials

### 13.4 High-risk actions

These actions require elevated protection and audit:

- workspace deletion
- retention override
- backup restore
- auth provider reconfiguration
- export bulk download
- operator role escalation

## 14. Release Gates For Production

Production release candidates must pass stricter gates than reference-build releases.

Required gates:

- build
- typecheck
- tests
- conformance check
- migration or persistence smoke coverage where storage changes are in scope
- auth and access smoke coverage where auth changes are in scope
- backup or restore drill evidence at a reasonable cadence
- deployment rollback path documented for the release
- spec alignment for touched platform areas

A production release should be blocked if:

- ACP semantics are modified implicitly through infrastructure changes
- workspace boundaries are not enforced server-side
- audit attribution is incomplete for new privileged actions
- restore or rollback path is unknown

## 15. Production Acceptance Criteria

Relay counts as production-ready for serious organizational or institutional use when all of the following are true:

- authenticated users and server-side access controls are in place
- operator roles are explicit and enforced
- workspace or tenant boundaries are explicit and enforced
- persistence supports concurrent production use and recovery expectations
- observability covers auth, lifecycle, routing, export, and storage failures
- backups and restore procedures are documented and tested enough for real use
- retention and deletion rules are explicit, role-gated, and audited
- deployment tiers are separated cleanly
- production release gates are repeatable
- Relay still reads as an ACP implementation rather than a platform that has drifted into local semantics

## 16. Explicit Non-Goals For The First Production Platform Pass

Out of scope for the first serious production pass unless separately approved:

- global marketplace or registry infrastructure
- complex billing systems
- consumer-scale social features
- fully custom policy engines
- deep organization chart modeling
- high-scale realtime collaboration features unrelated to ACP core execution

## 17. File Ownership Guidance

This spec primarily governs future work on:

- auth and access modules
- workspace or tenant model modules
- persistence and migration modules
- background job infrastructure
- deployment configs and environment docs
- observability, backup, retention, and security scripts or docs
- production-readiness tests and smoke checks

## 18. Agent Execution Notes

Use this spec when assigning production platform work.

Required task shape:

- state whether the task is auth, roles, tenancy, persistence, observability, deployment, backup, retention, or security work
- identify exact modules or configs in scope
- preserve ACP object semantics and Relay role as first implementation
- require server-side enforcement for any new access rule
- require migration and rollback notes for any persistence or deployment change
- escalate any proposal that changes protocol meaning, export semantics, or replay assumptions

## 19. Follow-On Specs

This spec should eventually be complemented by narrower execution specs for:

- auth and access implementation
- workspace or tenant implementation
- observability and incident response
- backup and recovery drills
- production security review
