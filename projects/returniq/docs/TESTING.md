# ReturnIQ Testing & Evaluation

## Golden-set evaluation

The committed dataset is a 100-record labeled benchmark spanning five root-cause categories:

- Size / Fit
- Fulfillment / Shipping
- Technical / Compatibility
- Customer Preference
- Quality / Defect

The project dossier reports **95.0% accuracy** and **0.952 Macro F1**. Reproduce the metrics from the saved predictions with:

```bash
python scripts/evaluate_golden_set.py
```

The evaluator reads the dataset's ground-truth and prediction columns and calculates exact-match accuracy and Macro F1. It does **not** call Gemini or regenerate predictions.

## Artifact regression checks

The project materials report a deterministic suite of 35 checks and a 96.4% composite release-gate score. Run the committed artifact checks with:

```bash
python scripts/run_regression_tests.py
```

These checks validate dataset shape, field consistency, documented metrics, and experiment arithmetic. They are **not** end-to-end tests of the deployed React application or the live Gemini API.

## Experiment arithmetic

Recalculate the EXP-1041 cohort rates and relative delta with:

```bash
python scripts/verify_experiment_calc.py
```

The script explicitly labels its cohorts as a synthetic simulation and reports a two-proportion significance check. Arithmetic consistency does not establish a causal business impact.

## Human review

Predictions below the configured confidence threshold are intended to enter a review queue. The dossier reports an approximate 2.8% correction baseline. Treat this as a project-reported figure unless independently validated against production audit logs.

## Interpretation

Treat all metrics as project-reported evaluation results. For rigorous comparisons, inspect the ground-truth labels, data sampling, class distribution, category-level precision/recall, and whether any benchmark examples were used during prompt development.
