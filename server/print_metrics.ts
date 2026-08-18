import { goldenTestEngine } from './golden_runner';
async function main() {
  const res = await goldenTestEngine.runTests('all');
  console.log("Overall Score:", res.overallScore);
  console.log("Classification Accuracy:", res.accuracy);
  console.log("Precision:", res.precision);
  console.log("Recall:", res.recall);
  console.log("F1 Score:", res.f1);
  console.log("High-confidence accuracy:", res.aiClassificationMetrics.highConfidenceAccuracy);
  console.log("Human correction rate:", res.aiClassificationMetrics.humanCorrectionRate);
  console.log("TP:", res.aiClassificationMetrics.truePositives);
  console.log("FP:", res.aiClassificationMetrics.falsePositives);
  console.log("FN:", res.aiClassificationMetrics.falseNegatives);
}
main().catch(console.error);
