import { z } from 'zod';
import { sanitizeHtml } from './auth_middleware';

const sanitizedString = (max: number) => z.string().trim().max(max).transform(val => sanitizeHtml(val));
const sanitizedOptionalString = (max: number) => z.string().trim().max(max).optional().transform(val => val ? sanitizeHtml(val) : val);


// ============================================================================
// RETURNIQ SECURITY & REQUEST VALIDATION SCHEMAS
// ============================================================================

// Authentication
export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128).optional(),
});

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().max(128).optional(),
});

// Workspaces
export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'Workspace name is required').max(150),
  industry: z.string().trim().max(100).optional().default('Apparel & Fashion'),
});

export const SwitchWorkspaceSchema = z.object({
  id: z.string().trim().min(1, 'Workspace ID is required'),
});

// Datasets
export const ValidateDatasetSchema = z.object({
  fileName: z.string().max(255).optional(),
  rows: z.array(z.record(z.string(), z.any())).min(1, 'Rows array cannot be empty').max(50000, 'Maximum 50,000 rows permitted per upload batch'),
  columnMapping: z.record(z.string(), z.string()).optional(),
});

export const SelectDatasetSchema = z.object({
  datasetId: z.string().trim().min(1, 'datasetId is required'),
});

export const PresetDatasetSchema = z.object({
  presetKey: z.enum(['dataset-a', 'dataset-b', 'dataset-c']),
});

export const sanitizeSqlAndPrompt = (val: string) => {
  if (!val) return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/ignore previous instructions/gi, "[REDACTED]")
    .replace(/ignore all instructions/gi, "[REDACTED]")
    .replace(/system prompt/gi, "[REDACTED]")
    .replace(/reveal secret/gi, "[REDACTED]")
    .replace(/you are now/gi, "[REDACTED]");
};
const secureField = z.string().trim().max(5000).transform(sanitizeSqlAndPrompt);


export const IngestSchema = z.object({
  customer_comment: secureField.optional(),
  reason: secureField.optional(),
  sku: secureField.optional(),
  product_category: secureField.optional(),
}).passthrough();

export const IngestBatchSchema = z.object({
  rows: z.array(IngestSchema).min(1).max(50000),
});

export const UploadDatasetSchema = z.object({
  name: z.string().trim().max(200).optional(),
  fileName: z.string().trim().max(255).optional(),
  fileSize: z.string().max(50).optional(),
  rows: z.array(z.record(z.string(), z.any())).min(1, 'At least 1 row required').max(50000, 'Maximum 50,000 rows permitted per upload batch'),
  columnMapping: z.record(z.string(), z.string()).optional(),
});

// Actions
export const CreateActionSchema = z.object({
  productId: z.string().optional(),
  productSku: z.string().optional(),
  title: z.string().trim().min(1, 'Action title is required').max(300),
  description: sanitizedOptionalString(2000),
  problem: sanitizedOptionalString(2000),
  evidence: sanitizedOptionalString(2000),
  recommendation: sanitizedOptionalString(2000),
  expectedImpact: z.enum(['High', 'Medium', 'Low']).optional(),
  estimatedSavingsPerWeek: z.number().nonnegative().optional(),
  effort: z.enum(['High', 'Medium', 'Low']).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  actionType: z.string().max(100).optional(),
  owner: z.string().email().optional().or(z.string().max(100).optional()),
  priority: z.enum(['P0 - CRITICAL', 'P1 - HIGH', 'P2 - MEDIUM', 'P3 - LOW']).optional(),
  priorityScore: z.number().optional(),
});

export const UpdateActionSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: sanitizedOptionalString(2000),
  status: z.enum(['Not Started', 'In Progress', 'Blocked', 'Completed', 'Rejected']).optional(),
  owner: z.string().max(100).optional(),
  priority: z.enum(['P0 - CRITICAL', 'P1 - HIGH', 'P2 - MEDIUM', 'P3 - LOW']).optional(),
  expectedImpact: z.enum(['High', 'Medium', 'Low']).optional(),
  effort: z.enum(['High', 'Medium', 'Low']).optional(),
  recommendation: sanitizedOptionalString(2000),
}).passthrough();

// Experiments
export const CreateExperimentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: sanitizedOptionalString(2000),
  actionId: z.string().optional(),
  status: z.enum(['Proposed', 'Running', 'Completed', 'Paused', 'Archived']).optional().default('Proposed'),
  primaryMetric: z.string().max(100).optional().default('Return Rate Reduction'),
  secondaryMetrics: z.array(z.string()).optional(),
  audience: z.string().max(255).optional(),
  durationDays: z.number().int().positive().max(365).optional().default(30),
  hypothesis: sanitizedOptionalString(2000),
  controlGroup: z.object({
    name: z.string().max(100),
    description: z.string().max(500),
    returnRate: z.number(),
    sampleSize: z.number().nonnegative(),
    conversionRate: z.number(),
  }).optional(),
  treatmentGroup: z.object({
    name: z.string().max(100),
    description: z.string().max(500),
    returnRate: z.number(),
    sampleSize: z.number().nonnegative(),
    conversionRate: z.number(),
    variance: z.number().optional(),
  }).optional(),
  statisticalSignificance: z.object({
    pValue: z.number(),
    isSignificant: z.boolean(),
    confidenceLevel: z.string(),
  }).optional(),
  performanceHistory: z.array(z.any()).optional(),
});

export const UpdateExperimentSchema = z.object({
  status: z.enum(['Proposed', 'Running', 'Completed', 'Paused', 'Archived']),
});

// Human Review
export const ReviewReturnSchema = z.object({
  action: z.enum(['Accept', 'Edit', 'Reject']),
  correctedCategory: z.enum([
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
  ]).optional(),
  correctedSubcategory: z.string().max(100).optional(),
  reviewerEmail: z.string().email().optional(),
});

// AI Classifications
export const AiClassifySchema = z.object({
  text: z.string().trim().min(1, 'Text input required').max(5000).transform(val => sanitizeHtml(val)),
});

export const AiBatchClassifySchema = z.object({
  texts: z.array(z.string().trim().min(1).max(5000).transform(val => sanitizeHtml(val))).min(1).max(500, 'Batch size limit is 500 items'),
});

export const AiRootCauseSchema = z.object({
  productSku: z.string().max(100).optional(),
  productName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  topReason: z.string().max(100).optional(),
  sampleComments: z.array(z.string().max(2000).transform(val => sanitizeHtml(val))).max(100).optional(),
  returnRate: z.number().min(0).max(100).optional(),
});
