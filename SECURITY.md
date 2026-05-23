# Security Policy

## Scope

ACP includes:

- a local web application (`Relay`)
- a local API server and CLI
- protocol bundle artifacts and implementer guidance
- scripts that generate exports, reports, demos, and evaluation outputs

Please report vulnerabilities involving authentication, authorization, data exposure, unsafe file handling, injection, dependency risk, or secret handling.

## Reporting a vulnerability

Please **do not** disclose exploitable vulnerabilities in a public GitHub issue.

Preferred route:

1. use GitHub's private vulnerability reporting for this repository, if enabled
2. if private reporting is unavailable, contact the maintainer directly through the email listed in the repository profile or associated paper materials

When reporting, include:

- affected component or path
- impact summary
- reproduction steps or proof of concept
- any environment assumptions
- whether the issue is local-only or remotely reachable

We will try to acknowledge reports promptly, reproduce them, and coordinate a fix before public disclosure.

## Supported versions

Security fixes are expected only for the current actively maintained branch/release surface.

At present, that means:

- the current `main` branch
- the current paper/reviewer-facing repository state

Older local artifact snapshots, scratch branches, and stale generated outputs should not be assumed to receive backported fixes.

## Handling secrets and local data

- keep API keys in environment variables such as `OPENAI_API_KEY`
- never commit secrets, tokens, or provider credentials
- do not attach raw sensitive local data to issues or pull requests
- prefer synthetic or minimized reproduction bundles when sharing examples

## Disclosure expectations

ACP is a research/engineering repository, but it should still meet basic responsible disclosure norms. Please give maintainers a reasonable chance to investigate and patch issues before broad public discussion of exploit details.
