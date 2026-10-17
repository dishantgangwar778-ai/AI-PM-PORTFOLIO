#!/usr/bin/env python3
"""Reproducible ReturnIQ artifact regression checks.

These 35 checks validate committed project artifacts and documented invariants.
They do NOT execute the deployed React app or prove production behavior.
Run from this directory's project root:
    python scripts/run_regression_tests.py
"""
from __future__ import annotations

import csv
import math
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets" / "ReturnIQ_Golden_Evaluation_100.csv"
TESTING = ROOT / "docs" / "TESTING.md"
CASE_STUDY = ROOT / "docs" / "CASE_STUDY.md"
REQUIRED_COLUMNS = {
    "orderId", "sku", "productName", "category", "returnReason",
    "customerComment", "groundTruth", "gtSubcat", "predicted",
    "predSubcat", "confidence", "sentiment", "isMatch",
}
CATEGORIES = {
    "Size/Fit", "Fulfillment/Shipping", "Technical/Compatibility",
    "Customer Preference", "Quality/Defect",
}


def load_rows():
    with DATA.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


class ReturnIQArtifactRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = load_rows()
        cls.headers = set(cls.rows[0].keys()) if cls.rows else set()
        cls.testing = TESTING.read_text(encoding="utf-8")
        cls.case_study = CASE_STUDY.read_text(encoding="utf-8")

    # 1–5: dataset presence and shape
    def test_01_dataset_exists(self): self.assertTrue(DATA.is_file())
    def test_02_dataset_has_rows(self): self.assertGreater(len(self.rows), 0)
    def test_03_dataset_has_expected_columns(self): self.assertTrue(REQUIRED_COLUMNS.issubset(self.headers))
    def test_04_dataset_has_100_records(self): self.assertEqual(len(self.rows), 100)
    def test_05_order_ids_are_unique(self): self.assertEqual(len({r["orderId"] for r in self.rows}), len(self.rows))

    # 6–15: row-level data quality
    def test_06_order_ids_nonempty(self): self.assertTrue(all(r["orderId"].strip() for r in self.rows))
    def test_07_skus_nonempty(self): self.assertTrue(all(r["sku"].strip() for r in self.rows))
    def test_08_product_names_nonempty(self): self.assertTrue(all(r["productName"].strip() for r in self.rows))
    def test_09_return_reasons_nonempty(self): self.assertTrue(all(r["returnReason"].strip() for r in self.rows))
    def test_10_customer_comments_nonempty(self): self.assertTrue(all(r["customerComment"].strip() for r in self.rows))
    def test_11_ground_truth_nonempty(self): self.assertTrue(all(r["groundTruth"].strip() for r in self.rows))
    def test_12_predictions_nonempty(self): self.assertTrue(all(r["predicted"].strip() for r in self.rows))
    def test_13_subcategory_truth_nonempty(self): self.assertTrue(all(r["gtSubcat"].strip() for r in self.rows))
    def test_14_subcategory_prediction_nonempty(self): self.assertTrue(all(r["predSubcat"].strip() for r in self.rows))
    def test_15_sentiment_nonempty(self): self.assertTrue(all(r["sentiment"].strip() for r in self.rows))

    # 16–23: typed fields and consistency
    def test_16_confidence_is_numeric(self): self.assertTrue(all(self._confidence(r) is not None for r in self.rows))
    def test_17_confidence_at_least_zero(self): self.assertTrue(all(self._confidence(r) >= 0 for r in self.rows))
    def test_18_confidence_at_most_one(self): self.assertTrue(all(self._confidence(r) <= 1 for r in self.rows))
    def test_19_match_values_are_boolean_text(self): self.assertTrue(all(r["isMatch"].strip().lower() in {"true", "false"} for r in self.rows))
    def test_20_match_flag_matches_labels(self): self.assertTrue(all((r["groundTruth"].strip() == r["predicted"].strip()) == (r["isMatch"].strip().lower() == "true") for r in self.rows))
    def test_21_at_least_one_correct_record(self): self.assertTrue(any(r["isMatch"].strip().lower() == "true" for r in self.rows))
    def test_22_at_least_one_incorrect_record(self): self.assertTrue(any(r["isMatch"].strip().lower() == "false" for r in self.rows))
    def test_23_accuracy_matches_reported_95_percent(self):
        accuracy = sum(r["isMatch"].strip().lower() == "true" for r in self.rows) / len(self.rows)
        self.assertAlmostEqual(accuracy, 0.95, places=6)

    # 24–29: category and artifact checks
    def test_24_truth_has_multiple_categories(self): self.assertGreater(len({r["groundTruth"] for r in self.rows}), 1)
    def test_25_prediction_has_multiple_categories(self): self.assertGreater(len({r["predicted"] for r in self.rows}), 1)
    def test_26_quality_defect_category_present(self): self.assertTrue(any("quality" in r["groundTruth"].lower() for r in self.rows))
    def test_27_testing_doc_exists(self): self.assertTrue(TESTING.is_file())
    def test_28_case_study_exists(self): self.assertTrue(CASE_STUDY.is_file())
    def test_29_testing_doc_labels_metrics_reported(self): self.assertIn("project-reported", self.testing.lower())

    # 30–35: documentation and experiment math contract
    def test_30_case_study_labels_figures_reported(self): self.assertIn("project-reported", self.case_study.lower())
    def test_31_testing_doc_mentions_35_checks(self): self.assertIn("35", self.testing)
    def test_32_case_study_mentions_experiment_delta(self): self.assertIn("-10.7%", self.case_study)
    def test_33_control_rate_recomputes(self): self.assertAlmostEqual(234 / 1250 * 100, 18.72, places=2)
    def test_34_treatment_rate_recomputes(self): self.assertAlmostEqual(209 / 1250 * 100, 16.72, places=2)
    def test_35_relative_delta_recomputes(self):
        control = 234 / 1250
        treatment = 209 / 1250
        self.assertAlmostEqual((treatment - control) / control * 100, -10.6837606838, places=6)

    @staticmethod
    def _confidence(row):
        try:
            value = float(row["confidence"])
            return value if math.isfinite(value) else None
        except (TypeError, ValueError):
            return None


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(ReturnIQArtifactRegression)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print(f"\nArtifact regression checks: {result.testsRun - len(result.failures) - len(result.errors)}/{result.testsRun} passed")
    print("Scope: committed dataset/docs invariants only; not deployed-app integration tests.")
    raise SystemExit(0 if result.wasSuccessful() else 1)
