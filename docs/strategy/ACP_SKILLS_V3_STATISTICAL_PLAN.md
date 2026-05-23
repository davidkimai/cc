# ACP Skills V3 Statistical Plan

Status: active analysis plan  
Scope: Skills V3 behavioral intervention studies A-D

## Analysis Principle

Treat ACP skills as procedural interventions. Do not collapse the evidence into one generic accuracy score. Report endpoint families, treatment fidelity, uncertainty, and disagreement burden.

## Primary Analysis

Primary analysis is intention-to-treat by assigned condition:

- `no_skill`
- `metadata_only`
- `full_skill`
- `composition`

The primary unit is the case-condition output. Case ID is the blocking unit because each case can appear in multiple conditions.

Primary endpoints:

- substantive failure detection
- escalation correctness
- claim-boundary obedience

For each condition, report mean endpoint score and case-blocked paired deltas where a comparator exists.

## Secondary Analysis

Secondary endpoints:

- explanation faithfulness
- omission catch
- fairness/contestability catch
- protocol-drift catch
- artifact/trace legibility
- latency
- cost
- arbitration rate

## Treatment Fidelity

Report two analysis sets:

- Intention-to-treat: all outputs grouped by assigned condition.
- Per-protocol: outputs where selected skill/composition follows the assigned condition logic.

Treatment adherence is not assumed. It is measured from raw generation outputs.

## Reliability Analysis

Study B reports:

- Judge A / Judge B agreement rate
- disagreement rate by family
- arbitration frequency by family
- low-confidence rate
- action-label sensitivity

Arbitration uses `gpt-5.4` only where needed. Surrogate adjudication remains a surrogate endpoint, not the true human operator endpoint.

## Effect Reporting

Use small-sample descriptive effect logic:

- report condition means
- report paired deltas within case where available
- report bootstrap confidence intervals where implemented
- avoid fragile p-value claims

The claims package should privilege direction, endpoint-specific effects, and uncertainty over binary significance language.

## Missing Endpoint Logic

Human operator utility is a missing endpoint. It must not be imputed from surrogate adjudication.

Acceptable language:

- "prepared for human review"
- "surrogate-adjudicated"
- "bounded measured-slice evidence"

Disallowed language:

- "operator utility proven"
- "field efficacy"
- "fairness solved"
- "conference-grade proof from surrogate review alone"
