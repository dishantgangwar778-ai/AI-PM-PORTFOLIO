# EXP-1041 — PDP Size Calculator Experiment

## Purpose

This document records the arithmetic behind the ReturnIQ demo experiment labelled `EXP-1041`, which models a Product Detail Page (PDP) size-calculator intervention.

## Cohort inputs used by the verification script

| Cohort | Orders | Returns | Return rate |
|---|---:|---:|---:|
| Control | 1,250 | 234 | 18.72% |
| Treatment | 1,250 | 209 | 16.72% |

## Calculation

- Absolute difference: 16.72% − 18.72% = **−2.00 percentage points**.
- Relative change: (16.72% − 18.72%) / 18.72% × 100 = approximately **−10.7%**.
- The verification script calculates a two-proportion z statistic and two-sided p-value from these counts.

Run the arithmetic check:

```bash
python scripts/verify_experiment_calc.py
```

## Important interpretation

**These cohorts are a synthetic simulation, not verified live customer data.** The reported −10.7% is a relative difference derived from the stated counts; it is not proof that the intervention caused a reduction in actual returns. The script's simple significance test is not significant at the 0.05 level for these inputs.

Use this example to demonstrate how ReturnIQ could connect root-cause insights to an experiment and calculate its outcome. Do not describe it as independently verified production impact unless real experiment logs and cohort definitions are available.
