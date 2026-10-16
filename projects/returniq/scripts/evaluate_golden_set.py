#!/usr/bin/env python3
"""Evaluate ReturnIQ golden-set predictions when a compatible CSV is present.

This lightweight script expects a CSV with columns named 'expected' and 'predicted'.
It prints accuracy and a classification report. If those columns are absent, it
prints the available columns and exits with a helpful message.
"""
from pathlib import Path
import sys

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report

DATA = Path(__file__).resolve().parents[1] / "datasets" / "ReturnIQ_Golden_Evaluation_100.csv"

def main() -> int:
    if not DATA.exists():
        print(f"Dataset not found: {DATA}")
        return 1
    df = pd.read_csv(DATA)
    required = {"expected", "predicted"}
    if not required.issubset(df.columns):
        print("This dataset does not contain the generic 'expected' and 'predicted' columns.")
        print("Available columns:", ", ".join(map(str, df.columns)))
        print("Map the dataset's ground-truth and prediction columns before evaluating.")
        return 2
    clean = df.dropna(subset=["expected", "predicted"])
    if clean.empty:
        print("No labeled prediction rows available.")
        return 2
    print(f"Rows evaluated: {len(clean)}")
    print(f"Accuracy: {accuracy_score(clean['expected'], clean['predicted']):.3%}")
    print(classification_report(clean["expected"], clean["predicted"], zero_division=0))
    return 0

if __name__ == "__main__":
    sys.exit(main())
