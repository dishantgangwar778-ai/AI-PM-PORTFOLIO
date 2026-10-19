#!/usr/bin/env python3
"""Evaluate the committed ReturnIQ golden set using its actual column names.

This script evaluates saved predictions in the CSV. It does not call Gemini or
re-run inference. It reports exact-match accuracy and macro F1 from the supplied
ground-truth and prediction columns.
"""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path
import sys

DATA = Path(__file__).resolve().parents[1] / "datasets" / "ReturnIQ_Golden_Evaluation_100.csv"
EXPECTED_CANDIDATES = ("groundTruth", "ground_truth", "expected", "label", "actual")
PREDICTED_CANDIDATES = ("predicted", "prediction", "predicted_label")


def choose_column(headers: list[str], candidates: tuple[str, ...]) -> str | None:
    by_lower = {header.strip().lower(): header for header in headers}
    for candidate in candidates:
        if candidate.lower() in by_lower:
            return by_lower[candidate.lower()]
    return None


def main() -> int:
    if not DATA.is_file():
        print(f"Dataset not found: {DATA}")
        return 1

    with DATA.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        headers = reader.fieldnames or []
        rows = list(reader)

    expected_col = choose_column(headers, EXPECTED_CANDIDATES)
    predicted_col = choose_column(headers, PREDICTED_CANDIDATES)
    if not expected_col or not predicted_col:
        print("Could not identify the ground-truth and prediction columns.")
        print("Available columns:", ", ".join(headers))
        print("Expected one of:", ", ".join(EXPECTED_CANDIDATES))
        print("Predicted one of:", ", ".join(PREDICTED_CANDIDATES))
        return 2

    pairs = [
        (row.get(expected_col, "").strip(), row.get(predicted_col, "").strip())
        for row in rows
    ]
    pairs = [(actual, predicted) for actual, predicted in pairs if actual and predicted]
    if not pairs:
        print("No labeled prediction rows available.")
        return 2

    correct = sum(actual == predicted for actual, predicted in pairs)
    accuracy = correct / len(pairs)
    labels = sorted({actual for actual, _ in pairs} | {predicted for _, predicted in pairs})
    f1_scores = []
    for label in labels:
        tp = sum(actual == label and predicted == label for actual, predicted in pairs)
        fp = sum(actual != label and predicted == label for actual, predicted in pairs)
        fn = sum(actual == label and predicted != label for actual, predicted in pairs)
        denominator = 2 * tp + fp + fn
        f1_scores.append((2 * tp / denominator) if denominator else 0.0)
    macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0.0

    print("ReturnIQ Golden Evaluation — saved prediction evaluation")
    print(f"Dataset: {DATA.name}")
    print(f"Rows evaluated: {len(pairs)}")
    print(f"Ground-truth column: {expected_col}")
    print(f"Prediction column: {predicted_col}")
    print(f"Exact-match accuracy: {accuracy:.3%} ({correct}/{len(pairs)})")
    print(f"Macro F1: {macro_f1:.3f}")
    print("Scope: evaluates saved CSV predictions; does not run live model inference.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
