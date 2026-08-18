import {
  AiClassificationResponseSchema,
  AiRootCauseDiagnosisSchema,
  AiBatchClassificationResponseSchema,
  AiRecommendationItemSchema,
  validateClassificationPayload,
  validateDiagnosisPayload,
} from './ai_schemas';
import {
  classifyReturnReasonWithGemini,
  generateRootCauseDiagnosis,
  ruleBasedClassify,
} from './gemini';
import { db } from './db';

interface TestResult {
  suite: string;
  testName: string;
  status: 'PASSED' | 'FAILED';
  details: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, suite: string, details: string) {
  if (condition) {
    results.push({ suite, testName, status: 'PASSED', details });
    console.log(`✅ [${suite}] ${testName}: ${details}`);
  } else {
    results.push({ suite, testName, status: 'FAILED', details });
    console.error(`❌ [${suite}] ${testName}: FAILED - ${details}`);
  }
}

async function runAiHardeningTests() {
  console.log('================================================================');
  console.log('RETURNIQ AI LAYER HARDENING & GROUNDING VERIFICATION SUITE');
  console.log('================================================================\n');

  // ====================================================================
  // TEST SUITE 1: STRICT SCHEMA VALIDATION & MALFORMED RESPONSES
  // ====================================================================
  console.log('--- TEST SUITE 1: Strict Schema Validation & Malformed Payloads ---');

  // Test 1.1: Valid AI Classification Payload
  const validPayload = {
    category: 'Size/Fit',
    subcategory: 'Too Small',
    sentiment: 'Negative',
    confidence: 0.94,
    reasoning: 'Customer explicitly reported jeans were too tight in the waist.',
  };
  const parsed1 = AiClassificationResponseSchema.safeParse(validPayload);
  assert(parsed1.success, 'Valid Classification Payload Parsing', 'Schema Validation', 'Proper JSON payload parses cleanly.');

  // Test 1.2: Malformed JSON with Invalid Category
  const invalidCategoryPayload = {
    category: 'CompletelyMadeUpCategoryNotInTaxonomy',
    subcategory: 'Too Small',
    sentiment: 'Negative',
    confidence: 0.94,
  };
  const parsed2 = AiClassificationResponseSchema.safeParse(invalidCategoryPayload);
  assert(!parsed2.success, 'Reject Hallucinated Categories', 'Schema Validation', 'Unknown categories outside strict taxonomy are rejected by Zod.');

  // Test 1.3: Hallucinated Fields Handling
  const payloadWithExtraFields = {
    category: 'Quality',
    subcategory: 'Defective Seam',
    sentiment: 'Negative',
    confidence: 0.91,
    hallucinatedInternalStockCode: 'X-99882',
    inventedCustomerName: 'John Doe',
  };
  const safeValidated = validateClassificationPayload(payloadWithExtraFields, 'Seam ripped');
  assert(
    safeValidated.category === 'Quality' && !('hallucinatedInternalStockCode' in safeValidated),
    'Strip Hallucinated Extra Fields',
    'Schema Validation',
    'Extra fields are safely stripped and schema structure enforced.'
  );

  // Test 1.4: Non-JSON / Corrupted Text Input
  const corruptedPayload = validateClassificationPayload('THIS IS RAW CORRUPTED STRING NOT JSON', 'The zipper broke on day 1');
  assert(
    corruptedPayload.category === 'Quality' && corruptedPayload.confidence >= 0.7,
    'Corrupted JSON Fallback Recovery',
    'Schema Validation',
    'System smoothly falls back to deterministic rule engine without throwing uncaught exceptions.'
  );

  // ====================================================================
  // TEST SUITE 2: INSUFFICIENT EVIDENCE GUARDRAIL
  // ====================================================================
  console.log('\n--- TEST SUITE 2: Insufficient Evidence Guardrails ---');

  // Test 2.1: Missing Evidence / Zero Comments
  const diagnosisZeroComments = await generateRootCauseDiagnosis({
    productName: 'Sample Tee',
    sku: 'SKU-TEST-00',
    category: 'Tops',
    returnRate: 25.0,
    categoryBenchmark: 12.0,
    topReasonDistribution: [],
    sampleCustomerComments: [], // EMPTY
    datasetId: 'ds-test-empty',
    datasetName: 'Empty Test Set',
    totalRecordsCount: 0,
  });

  assert(
    diagnosisZeroComments.isInsufficientEvidence === true &&
    diagnosisZeroComments.primaryHypothesis.toLowerCase().includes('insufficient evidence'),
    'Zero Comments Guardrail',
    'Evidence Grounding',
    'AI returns "Insufficient evidence" when no supporting verbatim comments exist.'
  );

  // Test 2.2: Insufficient Sample Size (1 comment only)
  const diagnosisFewComments = await generateRootCauseDiagnosis({
    productName: 'Sample Scarf',
    sku: 'SKU-TEST-01',
    category: 'Accessories',
    returnRate: 14.0,
    categoryBenchmark: 8.0,
    topReasonDistribution: [{ reason: 'Color', percentage: 100 }],
    sampleCustomerComments: ['One isolated comment about color hue'],
    datasetId: 'ds-test-scarf',
    datasetName: 'Small Dataset',
    totalRecordsCount: 1, // Only 1 record
  });

  assert(
    diagnosisFewComments.isInsufficientEvidence === true,
    'Low Sample Size Guardrail (< 2 records)',
    'Evidence Grounding',
    'AI correctly flags insufficient evidence when sample size is statistically inadequate.'
  );

  // ====================================================================
  // TEST SUITE 3: PROVENANCE LINEAGE & METADATA TRACKING
  // ====================================================================
  console.log('\n--- TEST SUITE 3: Provenance Lineage & Grounding Metadata ---');

  // Test 3.1: Complete Provenance on Root Cause Diagnosis
  const diagnosisWithEvidence = await generateRootCauseDiagnosis({
    productName: 'Luxe Denim Jeans',
    sku: 'SKU-104',
    category: 'Bottoms',
    returnRate: 24.8,
    categoryBenchmark: 12.5,
    topReasonDistribution: [
      { reason: 'Size/Fit', percentage: 46 },
      { reason: 'Quality', percentage: 22 },
    ],
    sampleCustomerComments: [
      'Waist band is way too tight, order size up',
      'Runs smaller in the hips than standard size 32',
      'Fabric shrank significantly after first wash',
      'Buttons fell off after 2 days',
    ],
    datasetId: 'ds-q3-master',
    datasetName: 'Q3_Returns_Master.csv',
    totalRecordsCount: 1245,
  });

  assert(
    diagnosisWithEvidence.sourceDatasetId === 'ds-q3-master' &&
    diagnosisWithEvidence.sourceDatasetName === 'Q3_Returns_Master.csv' &&
    diagnosisWithEvidence.supportingRecordCount === 1245 &&
    diagnosisWithEvidence.modelIdentifier.includes('gemini') &&
    diagnosisWithEvidence.promptVersion === 'prompts-v1.8' &&
    diagnosisWithEvidence.classificationType === 'AI HYPOTHESIS' &&
    typeof diagnosisWithEvidence.confidenceScore === 'number' &&
    !!diagnosisWithEvidence.generationTimestamp,
    'Provenance Lineage Storage',
    'Auditability',
    'Insight stores all 7 required lineage fields: dataset, record count, metrics, model, prompt, conf, timestamp.'
  );

  // Test 3.2: Key Evidence Grounding
  assert(
    diagnosisWithEvidence.keyEvidence.length >= 2 &&
    diagnosisWithEvidence.keyEvidence.some((e) => e.type === 'user' || e.type === 'alert'),
    'Evidence Grounding in verbatims',
    'Auditability',
    'Root cause diagnosis outputs structured evidence items linked to customer records.'
  );

  // ====================================================================
  // TEST SUITE 4: LOW CONFIDENCE & HUMAN-IN-THE-LOOP FLAGGING
  // ====================================================================
  console.log('\n--- TEST SUITE 4: Low Confidence & Human Review Flagging ---');

  // Test 4.1: Low confidence classification triggers human review flag
  const lowConfPayload = {
    category: 'Other',
    subcategory: 'Unclear',
    sentiment: 'Neutral',
    confidence: 0.55, // Low (< 0.70)
  };
  const validatedLowConf = validateClassificationPayload(lowConfPayload, 'meh not sure');
  assert(
    validatedLowConf.needsHumanReview === true,
    'Confidence < 0.70 Flags Needs Human Review',
    'Human-in-the-Loop',
    'Any classification with confidence under 70% is automatically flagged for human review.'
  );

  // Test 4.2: High confidence classification does not trigger review flag
  const highConfPayload = {
    category: 'Size/Fit',
    subcategory: 'Too Large',
    sentiment: 'Negative',
    confidence: 0.95,
  };
  const validatedHighConf = validateClassificationPayload(highConfPayload, 'Extremely huge size XL');
  assert(
    validatedHighConf.needsHumanReview === false,
    'Confidence >= 0.70 Auto-approved',
    'Human-in-the-Loop',
    'High confidence items bypass human queue safely.'
  );

  // ====================================================================
  // TEST SUITE 5: TIMEOUT & API FAILURE RESILIENCE
  // ====================================================================
  console.log('\n--- TEST SUITE 5: Fallback & API Failure Resilience ---');

  // Test 5.1: Rule-based fallback executes accurately when API is offline
  const fallbackSizeResult = ruleBasedClassify('Sleeves are 3 inches too short and waist is tight');
  assert(
    fallbackSizeResult.category === 'Size/Fit' && fallbackSizeResult.confidence >= 0.7,
    'Rule-Based Sizing Fallback',
    'Fault Tolerance',
    'Deterministic rule classifier correctly maps sizing keywords without network call.'
  );

  const fallbackDamageResult = ruleBasedClassify('Box was crushed and bottle shattered during shipping');
  assert(
    (fallbackDamageResult.category === 'Damage' || fallbackDamageResult.category === 'Delivery') &&
    fallbackDamageResult.confidence >= 0.7,
    'Rule-Based Logistics/Damage Fallback',
    'Fault Tolerance',
    'Deterministic rule classifier correctly maps damaged shipping verbatims.'
  );

  // ====================================================================
  // TEST SUITE 6: DETERMINISTIC BUSINESS METRICS SEPARATION
  // ====================================================================
  console.log('\n--- TEST SUITE 6: Deterministic Metrics vs AI Interpretation ---');

  const dashboardData = db.getDashboardData('Last 30 Days', 'All Categories');
  assert(
    dashboardData.returnRate.type === 'Observed Data' &&
    dashboardData.revenueAtRisk.type === 'Observed Data' &&
    dashboardData.preventableReturns.type === 'AI Insight' &&
    dashboardData.executiveSummary.every((es) =>
      ['OBSERVED DATA', 'AI INSIGHT', 'AI HYPOTHESIS', 'ESTIMATE', 'RECOMMENDATION'].includes(
        es.classificationType
      )
    ),
    'Explicit Classification of Visual Elements',
    'Trust UX',
    'Observed mathematical figures are strictly marked as OBSERVED DATA; AI inferences are explicitly marked as AI INSIGHT / ESTIMATE / HYPOTHESIS.'
  );

  // Print Summary
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;

  console.log('\n================================================================');
  console.log(`AI HARDENING SUITE COMPLETED: ${passedCount}/${results.length} PASSED`);
  if (failedCount > 0) {
    console.error(`🚨 CRITICAL: ${failedCount} test(s) failed!`);
    process.exit(1);
  } else {
    console.log('🎉 ALL AI GROUNDING & HARDENING TESTS PASSED WITH 100% SUCCESS.');
    console.log('================================================================');
  }
}

runAiHardeningTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
