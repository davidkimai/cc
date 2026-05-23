# ACP Skills V3 Behavioral Study Protocol

Status: active study protocol  
Scope: ACP Skills V3 intervention evidence  
Primary endpoint family: deliberative failure-mode reduction

## Study Question

Do ACP skill workflows, especially compositions, reduce deliberative workflow failure modes compared with no skill or metadata-only conditions under blinded surrogate adjudication?

## Evidence Ladder

1. Structural maturity: skills exist, pass maturity audit, and remain inspectable.
2. Proxy fixture-policy comparator: deterministic coverage and regression behavior, not measured proof.
3. Study A experimental slice: measured within-case crossover generation across intervention conditions.
4. Study B central surrogate adjudication: blinded dual mini-judge review with full-model arbitration.
5. Study C adherence analysis: intention-to-treat and per-protocol summaries.
6. Study D pragmatic live cohort: enriched live-provider portability and divergence analysis.
7. Human review: prepared but not yet collected.
8. Field study: not claimed.

## Study A: Primary Experimental Study

Design: stratified within-subject crossover measured study.

Unit of analysis: case-condition output.  
Clustering unit: case.  
Condition arms:

- `no_skill`: untreated / treatment-as-usual.
- `metadata_only`: low-dose informational intervention.
- `full_skill`: isolated procedural skill intervention.
- `composition`: combination therapy where a composition exists.

Case denominator: `evals/skills/studies/v3-study-program.json`, 35 cases, five per family.  
Condition order: deterministic randomization by case ID.  
Generation model: `gpt-5.4-mini` by default.

Primary dependent variables:

- substantive failure detection
- escalation correctness
- claim-boundary obedience

Secondary dependent variables:

- explanation faithfulness
- omission catch
- fairness/contestability catch
- protocol-drift catch
- artifact/trace legibility
- latency
- cost
- arbitration burden

## Study B: Central Surrogate Adjudication

Design: blinded central adjudication committee.

Judge A: `gpt-5.4-mini`.  
Judge B: `gpt-5.4-mini`.  
Arbitration: `gpt-5.4`, only for disagreement, low confidence, or flagged hard cases.

Baseline identity is hidden from judge prompts. The blinding map is preserved separately. This is surrogate adjudication, not human review.

## Study C: Treatment Fidelity

Study C reports:

- intention-to-treat outcomes by assigned condition
- per-protocol outcomes for outputs that adhered to assigned condition logic
- selected skill/composition drift
- expected artifact production
- prohibited skill or composition leakage

## Study D: Pragmatic Live Cohort

Design: small enriched live-provider cohort.

Purpose:

- portability
- ecological validity under real API calls
- label-vs-substance divergence analysis
- cost and arbitration burden

The cohort is enriched for difficult cases and composition-eligible public-hearing cases. It is not a broad comparative live wave.

## Non-Claims

This protocol does not establish:

- real-world civic efficacy
- fairness solved
- institutional legitimacy
- legal adequacy for public hearings
- operator utility without human reviewers
- field readiness

## Success Boundary

The study succeeds if it produces measured outputs, blinded adjudication, fidelity analysis, live portability artifacts, and conservative claims that a skeptical reviewer can inspect without mistaking surrogate evidence for human or field evidence.
