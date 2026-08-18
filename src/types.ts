export type ReturnCategory = 
  | 'Size/Fit'
  | 'Quality'
  | 'Product Mismatch'
  | 'Color'
  | 'Damage'
  | 'Packaging'
  | 'Delivery'
  | 'Wrong Item'
  | 'Customer Preference'
  | 'Changed Mind'
  | 'Other';

export type PriorityLevel = 'P0 - CRITICAL' | 'P1 - HIGH' | 'P2 - MEDIUM' | 'P3 - LOW';

export type EvidenceClassificationType =
  | 'OBSERVED DATA'
  | 'AI INSIGHT'
  | 'AI HYPOTHESIS'
  | 'ESTIMATE'
  | 'RECOMMENDATION';

export type ActionStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed' | 'Rejected';

export type ExperimentStatus = 'Proposed' | 'Live' | 'Running' | 'Paused' | 'Completed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Product Manager' | 'Category Manager' | 'CX Lead' | 'Founder';
}

export interface Workspace {
  id: string;
  name: string;
  industry: string;
  createdAt: string;
  currency: string;
  totalDatasetsCount: number;
  totalReturnsProcessed: number;
}

export interface Dataset {
  id: string;
  workspaceId: string;
  name: string;
  fileName: string;
  fileSize: string;
  rowCount: number;
  uploadedAt: string;
  status: 'Uploaded' | 'Mapping' | 'Validating' | 'Processing' | 'Completed' | 'Failed';
  columnMapping: Record<string, string>;
  stats?: {
    returnRate: number;
    revenueAtRisk: number;
    topDriver: string;
    preventableEstimate: number;
  };
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  sku: string;
  productName: string;
  category: string;
  purchaseDate: string;
  returnDate: string;
  itemPrice: number;
  rawReason: string;
  customerComment?: string;
  aiCategory: ReturnCategory;
  aiSubcategory: string;
  confidence: number;
  sentiment: 'Negative' | 'Neutral' | 'Positive';
  humanReviewed: boolean;
  humanReviewStatus?: 'Accepted' | 'Corrected' | 'Rejected';
  originalAiCategory?: ReturnCategory;
  firstTimeBuyer?: boolean;
  sizeOrdered?: string;
  sizeExchangedFor?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  totalOrders: number;
  returnRate: number; // e.g. 24.8%
  categoryBenchmark: number; // e.g. 11.3%
  unitsReturned30d: number;
  estRevenueLoss: number;
  topReason: ReturnCategory;
  topReasonPercentage: number;
  trendDelta: number; // +13.5%
  isProblematic: boolean;
  rootCause?: RootCauseInsight;
  actionPlans?: ActionPlanItem[];
}

export interface RootCauseInsight {
  id: string;
  productId: string;
  productSku: string;
  primaryHypothesis: string;
  aiConfidence: number; // e.g. 94
  dataPointsCount: number; // e.g. 1245
  keyEvidence: {
    id?: string;
    type: 'alert' | 'user' | 'repeat' | 'metric';
    text: string;
  }[];
  alternativeHypotheses?: string[];
  classificationType?: EvidenceClassificationType; // 'AI HYPOTHESIS'
  sourceDatasetId?: string;
  sourceDatasetName?: string;
  supportingRecordCount?: number;
  supportingMetrics?: {
    returnRate?: number;
    totalReturns?: number;
    categoryBenchmark?: number;
    topReasonPercentage?: number;
    topReason?: string;
    [key: string]: any;
  };
  modelIdentifier?: string;
  promptVersion?: string;
  confidenceScore?: number;
  generationTimestamp?: string;
  isInsufficientEvidence?: boolean;
  createdAt: string;
}

export interface ActionPlanItem {
  id: string;
  productId?: string;
  productSku?: string;
  title: string;
  description: string;
  problem: string;
  evidence: string;
  recommendation: string;
  expectedImpact: 'High' | 'Medium' | 'Low';
  estimatedSavingsPerWeek: number;
  effort: 'Low' | 'Medium' | 'High';
  confidenceScore: number;
  priority: PriorityLevel;
  priorityScore: number; // (Impact x Confidence) / Effort
  actionType: 'Create Jira Ticket' | 'Request Content Update' | 'Flag to Sourcing' | 'Update Size Guide' | 'Custom';
  owner: string;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
  convertedToExperimentId?: string;
}

export interface Experiment {
  id: string;
  code: string; // e.g. EXP-1042
  title: string;
  description: string;
  actionId?: string;
  status: ExperimentStatus;
  primaryMetric: string;
  secondaryMetrics: string[];
  audience: string;
  durationDays: number;
  currentDay: number;
  startDate: string;
  endDate: string;
  hypothesis: string;
  controlGroup: {
    name: string;
    description: string;
    returnRate: number;
    sampleSize: number;
    conversionRate: number;
  };
  treatmentGroup: {
    name: string;
    description: string;
    returnRate: number;
    sampleSize: number;
    conversionRate: number;
    variance: number;
  };
  statisticalSignificance: {
    pValue: number;
    isSignificant: boolean;
    confidenceLevel: string; // "95% confidence"
  };
  performanceHistory: {
    period: string;
    control: number;
    treatment: number;
  }[];
}

export interface AiEvaluationMetrics {
  precisionScore: number; // 94.2%
  humanCorrectionRate: number; // 2.8%
  correctionRateDelta: number; // -0.4%
  accuracyOverall: number; // 93.8%
  recallScore: number; // 92.5%
  f1Score: number; // 93.3%
  highConfidenceAccuracy: number; // 97.4%
  recommendationAcceptanceRate: number; // 88.6%
  
  // Metric Calculation Details
  totalPredictions?: number;
  truePositives?: number;
  falsePositives?: number;
  falseNegatives?: number;
  trueNegatives?: number;
  highConfidencePredictions?: number;
  highConfidenceCorrect?: number;
  totalProductionClassifications?: number;
  humanCorrectedClassifications?: number;

  categoryBreakdown: {
    category: ReturnCategory;
    sampleCount: number;
    precision: number;
    recall: number;
    f1: number;
  }[];
  confusionMatrix: {
    actual: string;
    predicted: string;
    count: number;
  }[];
  auditLogs: {
    id: string;
    timestamp: string;
    returnId: string;
    comment: string;
    originalAi: string;
    userCorrectedTo: string;
    reviewedBy: string;
  }[];
}

export interface DashboardData {
  timeframe: string;
  categoryFilter: string;
  returnRate: {
    value: number | null; // 14.2% or null if unavailable
    delta: number | null; // +1.2%
    type: 'Observed Data' | EvidenceClassificationType | 'Unavailable';
    isUnavailable?: boolean;
    numerator?: number;
    denominator?: number;
  };
  revenueAtRisk: {
    value: number; // 124000
    formatted: string; // "$124k"
    period: 'MTD' | 'Pending Processing';
    type: 'Observed Data' | EvidenceClassificationType;
  };
  preventableReturns: {
    percentage: number; // 22%
    savingsFormatted: string; // "~$27.2k potential savings"
    type: 'AI Insight' | EvidenceClassificationType;
  };
  topReturnDriver: {
    category: ReturnCategory; // "Size/Fit"
    percentage: number; // 45%
    type: 'Observed Data' | EvidenceClassificationType;
  };
  returnReasonsDistribution: {
    category: ReturnCategory;
    count: number;
    percentage: number;
    color: string;
  }[];
  totalReturnsCount: number; // 3421 or 5240
  executiveSummary: {
    id: string;
    type: 'sizing' | 'quality' | 'window' | 'policy';
    title: string;
    content: string;
    badgeText: 'AI Insight' | 'Observed Alert' | 'Notice' | 'Estimate' | 'AI Hypothesis';
    classificationType?: EvidenceClassificationType;
    sourceDatasetId?: string;
    sourceDatasetName?: string;
    supportingRecordCount?: number;
    supportingMetrics?: Record<string, any>;
    modelIdentifier?: string;
    promptVersion?: string;
    confidenceScore?: number;
    generationTimestamp?: string;
    isInsufficientEvidence?: boolean;
  }[];
  problematicProducts: Product[];
  trendHistory: {
    date: string;
    returnRate: number;
    ordersCount: number;
    returnsCount: number;
    returnedRevenue: number;
  }[];
}

// Golden Test & Automated Evaluation System Types
export type GoldenTestSuiteType =
  | 'classification'
  | 'analytics'
  | 'root_cause'
  | 'recommendations'
  | 'prioritization'
  | 'validation'
  | 'edge_cases'
  | 'end_to_end';

export type GoldenTestStatus = 'PASS' | 'FAIL' | 'ERROR' | 'SKIPPED';

export interface GoldenTestCase {
  id: string;
  suite: GoldenTestSuiteType;
  title: string;
  description: string;
  input: any;
  expected: any;
  evaluationCriteria?: string;
  tags?: string[];
  version: string;
  enabled: boolean;
  userAnnotation?: string;
  isCustomExpectation?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface GoldenTestResult {
  testCaseId: string;
  suite: GoldenTestSuiteType;
  title: string;
  status: GoldenTestStatus;
  input: any;
  expected: any;
  actual: any;
  difference?: string;
  reason?: string;
  executionTimeMs: number;
  errorDetails?: string;
  evaluatedAt: string;
  confidence?: number;
  humanReviewRequired?: boolean;
}

export interface GoldenTestSuiteBreakdown {
  suite: GoldenTestSuiteType;
  label: string;
  total: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  passRate: number;
  targetThreshold: number;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
}

export interface GoldenTestRun {
  runId: string;
  timestamp: string;
  appVersion: string;
  modelIdentifier: string;
  promptVersion: string;
  goldenDatasetVersion: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    currentSuite?: string;
    completedCount: number;
    totalCount: number;
    percentage: number;
    currentMessage: string;
  };
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  overallScore: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  durationMs: number;
  isAcceptedBaseline?: boolean;
  baselineRunId?: string;
  suiteBreakdown: GoldenTestSuiteBreakdown[];
  releaseReadiness: 'PASS' | 'FAIL' | 'BLOCKED';
  regressionStatus: {
    hasRegression: boolean;
    previousScore: number;
    baselineScore: number;
    scoreDelta: number;
    affectedSuites: string[];
    summary: string;
  };
  criticalFailures: string[];
  aiClassificationMetrics: AiEvaluationMetrics;
  results: GoldenTestResult[];
}

export interface GoldenDatasetVersionInfo {
  version: string;
  createdAt: string;
  changeSummary: string;
  changedBy: string;
  testCount: number;
}
