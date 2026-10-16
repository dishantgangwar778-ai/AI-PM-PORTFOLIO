# ReturnIQ Decisions & Trade-offs

## ADR 001 — Structured AI output
**Decision:** Use a constrained output schema for AI classifications.  
**Rationale:** Structured output is easier to validate, audit, export, and consume in downstream workflows.  
**Trade-off:** Schema constraints can require careful handling of ambiguous or out-of-taxonomy comments.

## ADR 002 — Human review for low confidence
**Decision:** Route low-confidence classifications to a human review queue.  
**Rationale:** Ambiguous return comments can affect supplier and product decisions; review helps prevent unverified predictions from being treated as ground truth.  
**Trade-off:** Human review adds operational effort.

## ADR 003 — Golden-set regression gate
**Decision:** Evaluate changes against a fixed labeled dataset and regression suite.  
**Rationale:** Helps detect changes in category behavior before release.  
**Trade-off:** A fixed benchmark may not represent every future product, market, or language.

## ADR 004 — Session-oriented demonstration
**Decision:** Support a low-friction demo experience for portfolio walkthroughs.  
**Rationale:** Recruiters can explore the workflow without a lengthy account setup.  
**Trade-off:** Session state is not a substitute for production persistence, access control, or enterprise audit storage.
