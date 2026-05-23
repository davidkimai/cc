# Research CLI Operator Casebook

## Happy path

The operator builds if needed, runs a CLI export command, captures JSON output, and records the artifact path.

## Failure path

The CLI rejects a transition because lifecycle state is invalid. Stop and inspect, do not force state.

## Ambiguity / escalation path

The command succeeds but output shape differs from the expected contract. Escalate to conformance review.

## Anti-pattern

Do not hand-edit JSON output and treat it as a Relay export.

