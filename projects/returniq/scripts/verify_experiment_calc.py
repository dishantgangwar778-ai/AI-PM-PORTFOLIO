#!/usr/bin/env python3
"""Recalculate the documented synthetic ReturnIQ experiment (EXP-1041).

This script verifies arithmetic only. It does not establish a real-world effect.
Run: python scripts/verify_experiment_calc.py
"""
from math import sqrt

CONTROL_ORDERS = 1250
CONTROL_RETURNS = 234
TREATMENT_ORDERS = 1250
TREATMENT_RETURNS = 209


def main():
    p_control = CONTROL_RETURNS / CONTROL_ORDERS
    p_treatment = TREATMENT_RETURNS / TREATMENT_ORDERS
    absolute_pp = (p_treatment - p_control) * 100
    relative_pct = (p_treatment - p_control) / p_control * 100

    pooled = (CONTROL_RETURNS + TREATMENT_RETURNS) / (CONTROL_ORDERS + TREATMENT_ORDERS)
    se = sqrt(pooled * (1 - pooled) * (1 / CONTROL_ORDERS + 1 / TREATMENT_ORDERS))
    z = (p_treatment - p_control) / se

    # Two-sided p-value via the standard normal CDF, using erf.
    from math import erf
    p_value = 2 * (1 - (1 + erf(abs(z) / sqrt(2))) / 2)

    print("EXP-1041 — SYNTHETIC COHORT SIMULATION (not real customer data)")
    print(f"Control:   {CONTROL_RETURNS}/{CONTROL_ORDERS} = {p_control * 100:.2f}%")
    print(f"Treatment: {TREATMENT_RETURNS}/{TREATMENT_ORDERS} = {p_treatment * 100:.2f}%")
    print(f"Absolute delta: {absolute_pp:.2f} percentage points")
    print(f"Relative delta: {relative_pct:.2f}% (rounded: {relative_pct:.1f}%)")
    print(f"Two-proportion z: {z:.3f}")
    print(f"Two-sided p-value: {p_value:.4f}")
    print("Interpretation: this synthetic arithmetic check is not evidence of causal impact.")
    if p_value >= 0.05:
        print("Statistical note: not significant at the 0.05 level under this simple test.")


if __name__ == "__main__":
    main()
