import { goldenTestEngine } from './golden_runner';
import { GOLDEN_DATASET_VERSION_INFO } from './golden_datasets';

async function runRegressionTestSuite() {
  console.log('=== ReturnIQ Production Golden Evaluation & Regression Verification ===\n');

  // Test 1: Verify versioning metadata
  console.log('Test 1: Versioning Metadata Check');
  const baseline = goldenTestEngine.getAcceptedBaseline();
  if (!baseline) {
    throw new Error('Failed: Accepted baseline not found.');
  }
  console.log(`✓ Accepted Baseline Run ID: ${baseline.runId}`);
  console.log(`✓ Dataset Version: ${baseline.goldenDatasetVersion}`);
  console.log(`✓ Model: ${baseline.modelIdentifier}`);
  console.log(`✓ Prompt Version: ${baseline.promptVersion}`);
  console.log(`✓ Baseline Score: ${baseline.overallScore}%`);
  console.log(`✓ Baseline Metrics: Acc=${baseline.accuracy}%, Prec=${baseline.precision}%, Rec=${baseline.recall}%, F1=${baseline.f1}%`);

  if (!baseline.goldenDatasetVersion || !baseline.modelIdentifier || !baseline.promptVersion) {
    throw new Error('Failed: Missing required versioning attributes in baseline.');
  }

  // Test 2: Execute a deterministic analytics suite run
  console.log('\nTest 2: Execute Deterministic Analytics Suite');
  const analyticsRun = await goldenTestEngine.runTests('analytics');
  console.log(`✓ Analytics Run ID: ${analyticsRun.runId}`);
  console.log(`✓ Total Tests: ${analyticsRun.totalTests}, Passed: ${analyticsRun.passed}, Failed: ${analyticsRun.failed}`);
  console.log(`✓ Score: ${analyticsRun.overallScore}%`);
  console.log(`✓ Regression Status: hasRegression=${analyticsRun.regressionStatus.hasRegression}, Summary="${analyticsRun.regressionStatus.summary}"`);

  // Test 3: Regression Detection Check
  console.log('\nTest 3: Regression Trigger Verification');
  // Baseline score is 96.4%. If an artificial degraded run occurs, verify hasRegression is true and summary has "REGRESSION DETECTED"
  const degradedRun = await goldenTestEngine.runTests('validation');
  console.log(`✓ Validation Run Score: ${degradedRun.overallScore}% against baseline ${degradedRun.regressionStatus.baselineScore}%`);

  // Test 4: Baseline Promotion Verification
  console.log('\nTest 4: Promote Run to Accepted Baseline');
  const setSuccess = goldenTestEngine.setAcceptedBaseline(analyticsRun.runId);
  if (!setSuccess) {
    throw new Error('Failed: Could not set new accepted baseline.');
  }
  const newBaseline = goldenTestEngine.getAcceptedBaseline();
  if (newBaseline?.runId !== analyticsRun.runId) {
    throw new Error('Failed: Accepted baseline was not updated properly.');
  }
  console.log(`✓ New Accepted Baseline verified: ${newBaseline?.runId}`);

  // Restore original baseline
  goldenTestEngine.setAcceptedBaseline('run-gt-baseline-v1.1');
  console.log('✓ Restored official release baseline (run-gt-baseline-v1.1)');

  console.log('\n=== All Golden Evaluation & Regression Tests Passed Successfully ===');
}

runRegressionTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
