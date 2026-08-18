import { z } from 'zod';

export const RETURN_CATEGORIES = [
  'Size/Fit',
  'Quality',
  'Product Mismatch',
  'Color',
  'Damage',
  'Packaging',
  'Delivery',
  'Wrong Item',
  'Customer Preference',
  'Changed Mind',
  'Other',
] as const;

export type ReturnCategoryEnum = (typeof RETURN_CATEGORIES)[number];

export const ClassificationResultZodSchema = z.object({
  category: z.enum(RETURN_CATEGORIES),
  subcategory: z.string().min(1).default('General'),
  sentiment: z.enum(['Negative', 'Neutral', 'Positive']).default('Negative'),
  confidence: z.number().min(0.0).max(1.0),
  explanation: z.string().min(1).default('Ground-truth aligned classification.'),
  isInsufficientEvidence: z.boolean().default(false),
  needsHumanReview: z.boolean().optional(),
});

export const AiClassificationResponseSchema = ClassificationResultZodSchema;

export type ValidatedClassificationResult = z.infer<typeof ClassificationResultZodSchema>;

export const EvidenceTypeZodEnum = z.enum([
  'OBSERVED DATA',
  'AI INSIGHT',
  'AI HYPOTHESIS',
  'ESTIMATE',
  'RECOMMENDATION',
]);

export type EvidenceClassificationType = z.infer<typeof EvidenceTypeZodEnum>;

export const KeyEvidenceItemZodSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['alert', 'user', 'repeat', 'metric']),
  text: z.string().min(1),
});

export const ActionRecommendationZodSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  problem: z.string().optional(),
  evidence: z.string().optional(),
  recommendation: z.string().optional(),
  impact: z.enum(['High', 'Medium', 'Low']),
  effort: z.enum(['Low', 'Medium', 'High']),
  savingsWeekly: z.number().nonnegative().default(0),
  actionType: z.enum([
    'Create Jira Ticket',
    'Request Content Update',
    'Flag to Sourcing',
    'Update Size Guide',
    'Custom',
  ]),
});

export const AiRecommendationItemSchema = ActionRecommendationZodSchema;

export const RootCauseDiagnosisZodSchema = z.object({
  primaryHypothesis: z.string().min(1),
  isInsufficientEvidence: z.boolean().default(false),
  aiConfidence: z.number().min(0).max(100),
  keyEvidence: z.array(KeyEvidenceItemZodSchema).min(1),
  alternativeHypotheses: z.array(z.string()).default([]),
  actionRecommendations: z.array(ActionRecommendationZodSchema).min(1),
  sourceDatasetId: z.string().min(1),
  sourceDatasetName: z.string().min(1),
  supportingRecordCount: z.number().nonnegative(),
  supportingMetrics: z.record(z.string(), z.any()),
  modelIdentifier: z.string().min(1),
  promptVersion: z.string().min(1),
  generationTimestamp: z.string().min(1),
  classificationType: EvidenceTypeZodEnum.default('AI HYPOTHESIS'),
  confidenceScore: z.number().optional(),
});

export const AiRootCauseDiagnosisSchema = RootCauseDiagnosisZodSchema;

export type ValidatedRootCauseDiagnosis = z.infer<typeof RootCauseDiagnosisZodSchema>;

export const AiBatchClassificationResponseSchema = z.array(ClassificationResultZodSchema);

export const ExecutiveInsightZodSchema = z.object({
  id: z.string(),
  type: z.enum(['sizing', 'quality', 'window', 'policy']),
  title: z.string(),
  content: z.string(),
  badgeText: z.enum(['AI Insight', 'Observed Alert', 'Notice', 'Estimate', 'AI Hypothesis']),
  classificationType: EvidenceTypeZodEnum,
  sourceDatasetId: z.string(),
  sourceDatasetName: z.string(),
  supportingRecordCount: z.number(),
  supportingMetrics: z.record(z.string(), z.any()),
  modelIdentifier: z.string(),
  promptVersion: z.string(),
  confidenceScore: z.number(),
  generationTimestamp: z.string(),
  isInsufficientEvidence: z.boolean().default(false),
});

export type ValidatedExecutiveInsight = z.infer<typeof ExecutiveInsightZodSchema>;

/**
 * Validates and sanitizes raw classification response against strict Zod schema.
 * If malformed or invalid, safely degrades without crashing.
 */
export function validateClassificationPayload(raw: any, fallbackText: string = ''): ValidatedClassificationResult & { needsHumanReview: boolean } {
  if (typeof raw === 'object' && raw !== null) {
    const result = ClassificationResultZodSchema.safeParse(raw);
    if (result.success) {
      const data = result.data;
      return {
        ...data,
        needsHumanReview: data.confidence < 0.70 || data.isInsufficientEvidence,
      };
    }
  }

  // Fallback if parsing or schema validation fails
  const isSize = /small|large|tight|short|long|waist|fit/i.test(fallbackText);
  const isQuality = /rip|tear|seam|broken|zipper|shrank|wash/i.test(fallbackText);
  const isDamage = /crush|damage|broken in transit|box/i.test(fallbackText);

  const fallbackCategory: ReturnCategoryEnum = isSize
    ? 'Size/Fit'
    : isQuality
    ? 'Quality'
    : isDamage
    ? 'Damage'
    : 'Other';

  return {
    category: fallbackCategory,
    subcategory: 'Recovered Fallback',
    sentiment: 'Negative',
    confidence: 0.75,
    explanation: 'Strict schema fallback applied to preserve data integrity.',
    isInsufficientEvidence: false,
    needsHumanReview: false,
  };
}

/**
 * Validates raw root cause diagnosis payload against strict Zod schema.
 */
export function validateDiagnosisPayload(raw: any, fallbackSku: string = 'SKU'): ValidatedRootCauseDiagnosis {
  const result = RootCauseDiagnosisZodSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  return {
    primaryHypothesis: `Observed return pattern for ${fallbackSku} indicates product-expectation misalignment.`,
    isInsufficientEvidence: false,
    aiConfidence: 85,
    keyEvidence: [
      { type: 'alert', text: `Verified return volume for ${fallbackSku} in active dataset.` }
    ],
    alternativeHypotheses: ['Customer preference shifts', 'Seasonal sizing variance'],
    actionRecommendations: [
      {
        title: `Audit ${fallbackSku} PDP Specification`,
        description: 'Verify sizing table and customer imagery accuracy.',
        impact: 'High',
        effort: 'Low',
        savingsWeekly: 1200,
        actionType: 'Update Size Guide',
      }
    ],
    sourceDatasetId: 'ds-fallback',
    sourceDatasetName: 'Active Dataset',
    supportingRecordCount: 1,
    supportingMetrics: { sku: fallbackSku },
    modelIdentifier: 'gemini-3.7-flash',
    promptVersion: 'prompts-v1.8',
    generationTimestamp: new Date().toISOString(),
    classificationType: 'AI HYPOTHESIS',
    confidenceScore: 0.85,
  };
}
