# Protocol Implementer Review Casebook

## Happy path

An adopter references discovery, uses canonical lifecycle tokens, and passes conformance fixtures.

## Failure path

An adapter introduces `routing_completed` as a cycle status. Mark non-conformant.

## Ambiguity / escalation path

The adapter exports compatible JSON but lacks replay evidence. Escalate before compatibility claims.

## Anti-pattern

Do not accept renamed fields because the UI still works.

