# ReturnIQ Testing & Evaluation

## Golden-set evaluation
The supplied project materials describe a 100-record labeled benchmark spanning five root-cause categories:
- Size / Fit
- Fulfillment / Shipping
- Technical / Compatibility
- Customer Preference
- Quality / Defect

Reported overall accuracy is 95.0%, with macro F1 of 0.952.

## Regression checks
The project materials report a deterministic suite of 35 tests and a 96.4% release-gate score, with 35/35 suites passing.

## Human review
Predictions below the configured confidence threshold are intended to enter a review queue. The supplied documentation reports an approximate 2.8% correction baseline.

## Run the evaluation
```bash
python scripts/evaluate_golden_set.py
```

## Interpretation
Treat all metrics as project-reported results. For a rigorous assessment, inspect the ground-truth labels, evaluation script, category-level precision/recall, and any assumptions about data sampling before comparing performance with other systems.
