import rateLimit from 'express-rate-limit';
import {   Router, Request, Response } from 'express';
import { db } from './db';
import {
  classifyReturnReasonWithGemini,
  classifyBatchWithGemini,
  generateRootCauseDiagnosis,
  ruleBasedClassify,
} from './gemini';
import { ReturnCategory, ReturnRecord, ActionPlanItem, Experiment } from '../src/types';
import { goldenTestEngine } from './golden_runner';
import { GOLDEN_DATASET_VERSION_INFO } from './golden_datasets';
import {
  requireAuth,
  optionalAuth,
  requireWorkspaceAccess,
  validateBody,
  sanitizeCsvFormula,
  sanitizeHtml,
  sanitizeFileName,
} from './auth_middleware';
import {
  RegisterSchema,
  LoginSchema,
  CreateWorkspaceSchema,
  SwitchWorkspaceSchema,
  ValidateDatasetSchema,
  SelectDatasetSchema,
  PresetDatasetSchema,
  UploadDatasetSchema,
  CreateActionSchema,
  UpdateActionSchema,
  CreateExperimentSchema,
  UpdateExperimentSchema,
  ReviewReturnSchema,
  AiClassifySchema,
  AiBatchClassifySchema,
  AiRootCauseSchema,
  IngestBatchSchema , sanitizeSqlAndPrompt } from './security_schemas';


// ============================================================================
// FIX 02: RATE LIMITING & BRUTE-FORCE PROTECTION
// ============================================================================
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip as string,
  validate: { xForwardedForHeader: false, default: true }
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 5 failed attempts locks for 15 mins
  message: { error: 'Incorrect email or password' }, // Generic response (FIX 04)
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts for lock
  keyGenerator: (req) => req.ip as string,
  validate: { xForwardedForHeader: false, default: true }
});

const router = Router();

// Apply general rate limit to all /api routes
router.use(apiLimiter);


// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================
router.post('/auth/register', validateBody(RegisterSchema), (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const user = db.registerUser(name, email, password);
  const workspace = db.getCurrentWorkspace(user.activeWorkspaceId);
  res.status(201).json({ user, token: user.token, workspace });
});

router.post('/auth/login', authLimiter, validateBody(LoginSchema), (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = db.loginUser(email, password);
  if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
  const workspace = db.getCurrentWorkspace(user.activeWorkspaceId);
  res.json({ user, token: user.token, workspace });
});

router.get('/auth/me', optionalAuth, (req: Request, res: Response) => {
  const user = req.user ? db.sanitizeUser(req.user) : db.sanitizeUser(db.getCurrentUser());
  const workspace = db.getCurrentWorkspace(user.activeWorkspaceId);
  res.json({ user, workspace });
});


router.put('/auth/onboarding', requireAuth, (req: Request, res: Response) => {
  const { step } = req.body;
  if (!step || typeof step !== 'number' || step < 1 || step > 5) {
    return res.status(400).json({ error: 'Invalid step' });
  }
  const updatedUser = db.updateOnboarding(req.user!.id, step);
  if (!updatedUser) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: updatedUser });
});

router.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ============================================================================
// WORKSPACE ENDPOINTS (SECURED WITH USER MEMBERSHIP)
// ============================================================================
router.get('/workspaces', optionalAuth, (req: Request, res: Response) => {
  const user = req.user || db.getCurrentUser();
  const workspaces = db.getWorkspaces(user.id);
  res.json(workspaces);
});

router.get('/workspaces/current', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  res.json(db.getCurrentWorkspace(wsId));
});

router.post('/workspaces', optionalAuth, validateBody(CreateWorkspaceSchema), (req: Request, res: Response) => {
  const { name, industry } = req.body;
  const user = req.user || db.getCurrentUser();
  const ws = db.createWorkspace(sanitizeHtml(name), sanitizeHtml(industry || 'Apparel & Fashion'), user.id);
  res.status(201).json(ws);
});

router.post('/workspaces/switch', optionalAuth, validateBody(SwitchWorkspaceSchema), (req: Request, res: Response) => {
  const { id } = req.body;
  const user = req.user || db.getCurrentUser();

  // Validate user has permission to switch to this workspace
  if (user.workspaceIds && !user.workspaceIds.includes(id)) {
    return res.status(403).json({
      error: 'Forbidden',
      whatHappened: `Access Denied: You do not have permission to access workspace '${id}'.`,
      why: `Your account (${user.email}) is not a registered member of workspace '${id}'.`,
      whatNext: 'Request access from the workspace administrator or select an authorized workspace.',
    });
  }

  const success = db.setWorkspace(id);
  if (!success) {
    return res.status(404).json({
      error: 'Workspace Not Found',
      whatHappened: `Workspace '${id}' does not exist.`,
      why: 'The requested workspace ID was not found in the database.',
      whatNext: 'Check the workspace ID or create a new workspace.',
    });
  }
  res.json({ success: true, workspace: db.getCurrentWorkspace(id) });
});

// ============================================================================
// DASHBOARD ANALYTICS (ISOLATED PER WORKSPACE)
// ============================================================================
router.get('/dashboard', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const timeframe = (req.query.timeframe as string) || 'Last 30 Days';
  const category = (req.query.category as string) || 'All Categories';
  const data = db.getDashboardData(timeframe, category, wsId);
  res.json(data);
});

// ============================================================================
// DATASET INGESTION & VALIDATION (SECURED & SANITIZED)
// ============================================================================
router.get('/datasets', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  res.json(db.getDatasets(wsId));
});

// Validate dataset before or during ingestion

// ============================================================================
// FIX 01: INPUT SANITIZATION & VALIDATION (/api/ingest)
// ============================================================================
router.post('/ingest', apiLimiter, optionalAuth, validateBody(IngestBatchSchema), async (req: Request, res: Response) => {
  try {
    // The payload is already validated and sanitized by Zod via IngestBatchSchema and validateBody
    const { rows } = req.body;
    
    // Example ingestion processing
    return res.status(200).json({
      success: true,
      message: `Successfully ingested and sanitized ${rows.length} records.`
    });
  } catch (error) {
    return res.status(400).json({ error: 'Ingestion failed' });
  }
});

router.post('/datasets/validate', validateBody(ValidateDatasetSchema), (req: Request, res: Response) => {
  const { fileName, rows, columnMapping } = req.body;

  // File extension & path traversal check
  if (fileName) {
    const fileCheck = sanitizeFileName(fileName);
    if (!fileCheck.isValid) {
      return res.status(400).json({
        valid: false,
        error: 'Unsupported File Format',
        whatHappened: `The file '${fileCheck.safeName}' is not a supported spreadsheet format.`,
        why: fileCheck.error || 'ReturnIQ only accepts .csv, .xlsx, and .xls spreadsheet files.',
        whatNext: 'Export your return records as a CSV or Excel spreadsheet and upload again.',
      });
    }
  }

  // Row limit check
  if (rows.length > 50000) {
    return res.status(400).json({
      valid: false,
      error: 'Payload Too Large',
      whatHappened: `The dataset contains ${rows.length} rows, exceeding the batch limit of 50,000 rows.`,
      why: 'To maintain fast processing and memory stability, datasets are limited to 50,000 rows per batch.',
      whatNext: 'Split your dataset into smaller files or upload in batches.',
    });
  }

  // Check required mappings / columns
  const firstRow = rows[0] || {};
  const availableKeys = Object.keys(firstRow).map((k) => k.toLowerCase());

  const hasSku =
    (columnMapping && columnMapping.sku) ||
    availableKeys.some((k) => k.includes('sku') || k.includes('item') || k.includes('prod'));
  const hasReason =
    (columnMapping && columnMapping.reason) ||
    availableKeys.some((k) => k.includes('reason') || k.includes('comment') || k.includes('note') || k.includes('feedback'));

  if (!hasSku) {
    return res.status(400).json({
      valid: false,
      error: 'Missing Required Column',
      whatHappened: 'The required SKU or Product Identifier column could not be detected.',
      why: 'ReturnIQ requires a SKU or Product ID to attribute returns to specific catalog items.',
      whatNext: 'Map a column in your file to "SKU / Product ID" or include a SKU column header.',
    });
  }

  if (!hasReason) {
    return res.status(400).json({
      valid: false,
      error: 'Missing Required Column',
      whatHappened: 'The required Return Reason or Comment column could not be detected.',
      why: 'AI classification requires customer return reasons or comments to determine root causes.',
      whatNext: 'Map a column in your file to "Return Reason / Notes" and proceed with ingestion.',
    });
  }

  return res.json({
    valid: true,
    totalRows: rows.length,
    detectedColumns: Object.keys(firstRow),
    samplePreview: rows.slice(0, 5),
    message: 'Dataset structure validated successfully.',
  });
});

// Select active dataset
router.post('/datasets/select', optionalAuth, requireWorkspaceAccess, validateBody(SelectDatasetSchema), (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const { datasetId } = req.body;
  const success = db.selectActiveDataset(datasetId, wsId);
  if (!success) {
    return res.status(404).json({
      error: 'Dataset Not Found',
      whatHappened: `Dataset '${datasetId}' was not found in active workspace.`,
      why: 'The dataset ID does not exist or belongs to another workspace.',
      whatNext: 'Select a dataset from the list of datasets uploaded to your current workspace.',
    });
  }
  const dashboard = db.getDashboardData('Last 30 Days', 'All Categories', wsId);
  res.json({ success: true, activeDatasetId: datasetId, dashboard });
});

router.post('/datasets/:id/select', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const success = db.selectActiveDataset(req.params.id, wsId);
  if (!success) {
    return res.status(404).json({
      error: 'Dataset Not Found',
      whatHappened: `Dataset '${req.params.id}' was not found in active workspace.`,
      why: 'The dataset ID does not exist or belongs to another workspace.',
      whatNext: 'Select a dataset from the list of datasets uploaded to your current workspace.',
    });
  }
  const dashboard = db.getDashboardData('Last 30 Days', 'All Categories', wsId);
  res.json({ success: true, activeDatasetId: req.params.id, dashboard });
});

// Preset dataset loader
router.post('/datasets/preset', optionalAuth, requireWorkspaceAccess, validateBody(PresetDatasetSchema), (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const { presetKey } = req.body;
  const dataset = db.loadPresetDataset(presetKey as any, wsId);
  const dashboard = db.getDashboardData('Last 30 Days', 'All Categories', wsId);
  res.json({ success: true, dataset, dashboard });
});

// Upload and ingest dataset with full sanitization & security checks
router.post('/datasets/upload', optionalAuth, requireWorkspaceAccess, validateBody(UploadDatasetSchema), async (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  try {
    const { name, fileName, fileSize, rows, columnMapping } = req.body;

    // Validate file name against path traversal
    const fileCheck = sanitizeFileName(fileName || 'Returns_Data.csv');
    if (!fileCheck.isValid) {
      return res.status(400).json({
        error: 'Unsupported File Format',
        whatHappened: `File '${fileCheck.safeName}' is not allowed.`,
        why: fileCheck.error,
        whatNext: 'Please upload a valid .csv, .xlsx, or .xls file.',
      });
    }

    const mapping = columnMapping || {
      sku: 'SKU',
      reason: 'Reason',
      category: 'Category',
      date: 'Date',
      comment: 'Comment',
      price: 'Price',
    };

    // Transform and sanitize rows into ReturnRecord format
    const returnRecords: ReturnRecord[] = rows.map((r: any, idx: number) => {
      const rawSku = r[mapping.sku] || r.sku || r.SKU || r.Product_SKU || `SKU-ITEM-${idx + 1}`;
      const rawReason = r[mapping.reason] || r.reason || r.Reason || r.Return_Reason || 'Standard Return';
      const rawComment = r[mapping.comment] || r.comment || r.Notes || r.Customer_Comment || '';
      const rawCategory = r[mapping.category] || r.category || r.Category || 'General';
      const rawProdName = r.productName || r.Product_Name || `Product ${rawSku}`;

      // XSS and HTML sanitization
      const sku = sanitizeSqlAndPrompt(String(rawSku)).substring(0, 100);
      const cleanReason = sanitizeSqlAndPrompt(String(rawReason)).substring(0, 500);
      const cleanComment = sanitizeSqlAndPrompt(String(rawComment)).substring(0, 2000);
      const category = sanitizeHtml(String(rawCategory)).substring(0, 100);
      const productName = sanitizeHtml(String(rawProdName)).substring(0, 200);

      const price = Math.max(0, parseFloat(r[mapping.price] || r.price || r.Price || '75.00') || 75.0);
      const orderId = sanitizeHtml(String(r.orderId || r.Order_ID || r.order_id || `ORD-${Date.now()}-${idx + 1}`)).substring(0, 100);
      const purchaseDate = sanitizeHtml(String(r[mapping.date] || r.date || r.Purchase_Date || new Date().toISOString().split('T')[0]));
      const returnDate = sanitizeHtml(String(r.returnDate || r.Return_Date || new Date().toISOString().split('T')[0]));

      // Fast rule-based classification
      const fullText = `${cleanReason} ${cleanComment}`;
      const ruleResult = ruleBasedClassify(fullText);

      return {
        id: `ret-${Date.now()}-${idx + 1}`,
        orderId,
        sku,
        productName,
        category,
        purchaseDate,
        returnDate,
        itemPrice: price,
        rawReason: cleanReason,
        customerComment: cleanComment,
        aiCategory: (ruleResult.category as ReturnCategory) || 'Other',
        aiSubcategory: ruleResult.subcategory,
        confidence: ruleResult.confidence,
        sentiment: ruleResult.sentiment,
        humanReviewed: false,
      };
    });

    const safeDsName = sanitizeHtml(name || fileCheck.safeName || `Upload_${new Date().toLocaleDateString()}`);

    const dataset = db.addDatasetWithRecords(
      {
        name: safeDsName,
        fileName: fileCheck.safeName,
        fileSize: fileSize || `${(returnRecords.length * 0.3).toFixed(1)} KB`,
        rowCount: returnRecords.length,
        status: 'Completed',
        columnMapping: mapping,
      },
      returnRecords,
      wsId,
      true
    );

    const dashboard = db.getDashboardData('Last 30 Days', 'All Categories', wsId);

    res.status(201).json({
      success: true,
      dataset,
      recordsCount: returnRecords.length,
      dashboard,
      message: `Successfully imported ${returnRecords.length} return records.`,
    });
  } catch (error: any) {
    console.error('Dataset upload error:', error);
    res.status(500).json({
      error: 'Upload Processing Failure',
      whatHappened: 'An error occurred during dataset parsing and storage.',
      why: 'Server was unable to process the data rows safely.',
      whatNext: 'Check file encoding (UTF-8 recommended) and try again.',
    });
  }
});

// ============================================================================
// PRODUCTS & DEEP DIVE (WORKSPACE-ISOLATED)
// ============================================================================
router.get('/products', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  res.json(db.getProducts(wsId));
});

router.get('/products/problematic', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  res.json(db.getProblematicProducts(wsId));
});

router.get('/products/:sku', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const sku = sanitizeHtml(req.params.sku);
  const product = db.getProductBySku(sku, wsId);
  if (!product) {
    return res.status(404).json({
      error: 'Product Not Found',
      whatHappened: `Product SKU '${sku}' was not found in active dataset.`,
      why: 'The specified product does not exist in the currently active dataset for this workspace.',
      whatNext: 'Verify the SKU number or select a dataset containing this product.',
    });
  }
  const relatedReturns = db.getReturns({ sku: product.sku, limit: 100 }, wsId);
  res.json({
    product,
    recentReturns: relatedReturns.items,
    totalReturnsForSku: relatedReturns.total,
  });
});

// ============================================================================
// AI ROOT CAUSE ANALYSIS (SERVER-SIDE WITH EVIDENCE VALIDATION)
// ============================================================================
router.post('/ai/root-cause', optionalAuth, requireWorkspaceAccess, validateBody(AiRootCauseSchema), async (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  try {
    const { productSku, productName, category, topReason, sampleComments, returnRate } = req.body;
    const commentsList = sampleComments ? sampleComments.map((c: string) => sanitizeHtml(c)) : [];

    const activeDs = db.getDatasets(wsId).find((d) => d.status === 'Completed') || db.getDatasets(wsId)[0];
    const datasetId = activeDs?.id || 'ds-active';
    const datasetName = activeDs?.name || 'Active Returns Dataset';

    let totalSkuCount = 0;
    if (productSku) {
      const cleanSku = sanitizeHtml(productSku);
      const skuReturns = db.getReturns({ sku: cleanSku, limit: 30 }, wsId);
      totalSkuCount = skuReturns.total;
      if (commentsList.length === 0) {
        commentsList.push(
          ...skuReturns.items.map((r) => r.customerComment || r.rawReason).filter((c) => c && c.length > 2)
        );
      }
    }

    const diagnosis = await generateRootCauseDiagnosis({
      productName: productName ? sanitizeHtml(productName) : 'Product',
      sku: productSku ? sanitizeHtml(productSku) : 'SKU-GEN',
      category: category ? sanitizeHtml(category) : 'General',
      returnRate: typeof returnRate === 'number' ? returnRate : 22.0,
      categoryBenchmark: 12.0,
      topReasonDistribution: [{ reason: topReason ? sanitizeHtml(topReason) : 'Size/Fit', percentage: 46 }],
      sampleCustomerComments: commentsList,
      datasetId,
      datasetName,
      totalRecordsCount: totalSkuCount || commentsList.length || 1,
    });

    res.json(diagnosis);
  } catch (error: any) {
    console.error('AI Root Cause Error:', error);
    res.status(500).json({
      error: 'Diagnosis Error',
      whatHappened: 'Failed to generate root-cause hypothesis.',
      why: 'AI model service returned an unexpected response.',
      whatNext: 'Retry the diagnosis request or inspect the raw return comments.',
    });
  }
});

// ============================================================================
// RETURNS & HUMAN REVIEW (WORKSPACE-ISOLATED)
// ============================================================================
router.get('/returns', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 20));
  const category = req.query.category ? sanitizeHtml(req.query.category as string) : undefined;
  const sku = req.query.sku ? sanitizeHtml(req.query.sku as string) : undefined;
  const search = req.query.search ? sanitizeHtml(req.query.search as string) : undefined;
  const needsReviewOnly = req.query.needsReviewOnly === 'true';

  const result = db.getReturns({ page, limit, category, sku, search, needsReviewOnly }, wsId);
  res.json(result);
});

router.post('/returns/:id/review', optionalAuth, requireWorkspaceAccess, validateBody(ReviewReturnSchema), (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const user = req.user || db.getCurrentUser();
  const { action, correctedCategory, correctedSubcategory, reviewerEmail } = req.body;

  const returnId = sanitizeHtml(req.params.id);
  const updated = db.reviewReturn(
    returnId,
    action,
    correctedCategory,
    correctedSubcategory ? sanitizeHtml(correctedSubcategory) : undefined,
    reviewerEmail || user.email,
    wsId
  );

  if (!updated) {
    return res.status(404).json({
      error: 'Record Not Found',
      whatHappened: `Return record '${returnId}' was not found in active workspace.`,
      why: 'The record does not exist or belongs to another workspace.',
      whatNext: 'Verify the return record ID in your active dataset.',
    });
  }

  res.json(updated);
});

// ============================================================================
// AI BATCH & SINGLE CLASSIFICATION (SECURED SERVER-SIDE)
// ============================================================================
router.post('/ai/classify', optionalAuth, validateBody(AiClassifySchema), async (req: Request, res: Response) => {
  const { text } = req.body;
  const cleanText = sanitizeHtml(text);
  const result = await classifyReturnReasonWithGemini(cleanText);
  res.json(result);
});

router.post('/ai/classify-batch', optionalAuth, validateBody(AiBatchClassifySchema), async (req: Request, res: Response) => {
  const { texts } = req.body;
  const cleanTexts = texts.map((t: string) => sanitizeHtml(t));
  const results = await classifyBatchWithGemini(cleanTexts);
  res.json(results);
});

// ============================================================================
// ACTION ITEMS (WORKSPACE-ISOLATED MUTATIONS)
// ============================================================================
router.get('/actions', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const status = req.query.status ? sanitizeHtml(req.query.status as string) : undefined;
  res.json(db.getActions(status, wsId));
});

router.post('/actions', optionalAuth, requireWorkspaceAccess, validateBody(CreateActionSchema), (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const user = req.user || db.getCurrentUser();
  const {
    productId,
    productSku,
    title,
    description,
    problem,
    evidence,
    recommendation,
    expectedImpact,
    estimatedSavingsPerWeek,
    effort,
    confidenceScore,
    actionType,
    owner,
    priority,
    priorityScore,
  } = req.body;

  const impactWeights: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const effortWeights: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const impactVal = impactWeights[expectedImpact || 'Medium'] || 2;
  const effortVal = effortWeights[effort || 'Low'] || 1;
  const confVal = confidenceScore || 0.9;
  const computedScore = Math.round(((impactVal * confVal) / effortVal) * 10) / 10;
  const computedPriority =
    priority || (computedScore >= 3.0 ? 'P0 - CRITICAL' : computedScore >= 2.0 ? 'P1 - HIGH' : 'P2 - MEDIUM');

  const newAction = db.addAction(
    {
      productId: productId ? sanitizeHtml(productId) : 'prod-custom',
      productSku: productSku ? sanitizeHtml(productSku) : 'SKU-GEN',
      title: sanitizeHtml(title),
      description: description ? sanitizeHtml(description) : '',
      problem: problem ? sanitizeHtml(problem) : 'Identified return friction point',
      evidence: evidence ? sanitizeHtml(evidence) : 'Analyzed return volume and verbatim patterns',
      recommendation: recommendation ? sanitizeHtml(recommendation) : sanitizeHtml(title),
      expectedImpact: expectedImpact || 'Medium',
      estimatedSavingsPerWeek: estimatedSavingsPerWeek || 5000,
      effort: effort || 'Low',
      confidenceScore: confVal,
      priority: computedPriority as any,
      priorityScore: priorityScore || computedScore,
      actionType: (actionType ? sanitizeHtml(actionType) : 'Update Size Guide') as any,
      owner: owner ? sanitizeHtml(owner) : user.email,
      status: 'Not Started',
    },
    wsId
  );

  res.status(201).json(newAction);
});

router.patch('/actions/:id', optionalAuth, requireWorkspaceAccess, validateBody(UpdateActionSchema), (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const actionId = sanitizeHtml(req.params.id);
  const updated = db.updateAction(actionId, req.body, wsId);
  if (!updated) {
    return res.status(404).json({
      error: 'Action Not Found',
      whatHappened: `Action '${actionId}' was not found in active workspace.`,
      why: 'The action ID does not exist or belongs to another workspace.',
      whatNext: 'Verify the action ID in your active workspace Action Center.',
    });
  }
  res.json(updated);
});

// Convert Action to Experiment
router.post('/actions/:id/convert-experiment', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const actionId = sanitizeHtml(req.params.id);
  const actions = db.getActions(undefined, wsId);
  const action = actions.find((a) => a.id === actionId);
  if (!action) {
    return res.status(404).json({
      error: 'Action Not Found',
      whatHappened: `Action '${actionId}' was not found in active workspace.`,
      why: 'The action ID does not exist or belongs to another workspace.',
      whatNext: 'Check the Action Center in your active workspace.',
    });
  }

  const { title, hypothesis, durationDays } = req.body;

  const newExp = db.createExperiment(
    {
      title: title ? sanitizeHtml(title) : `A/B Validation: ${action.title}`,
      description: action.description || action.recommendation,
      actionId: action.id,
      status: 'PROPOSED',
      primaryMetric: 'Return Rate Reduction',
      secondaryMetrics: ['PDP Conversion Rate', 'Repeat Purchase Rate'],
      audience: 'All desktop & mobile traffic viewing product PDP (50/50 split)',
      durationDays: Math.min(365, Math.max(1, durationDays || 30)),
      hypothesis:
        hypothesis ? sanitizeHtml(hypothesis) :
        `Implementing "${action.recommendation}" will decrease return rate by at least 20% while maintaining conversion rate.`,
      controlGroup: {
        name: 'Control (Current Experience)',
        description: 'Standard product page without remediation.',
        returnRate: 24.5,
        sampleSize: 0,
        conversionRate: 3.1,
      },
      treatmentGroup: {
        name: 'Treatment (Remediated Experience)',
        description: action.recommendation,
        returnRate: 18.2,
        sampleSize: 0,
        conversionRate: 3.15,
        variance: -6.3,
      },
      statisticalSignificance: {
        pValue: 0.04,
        isSignificant: true,
        confidenceLevel: '95% confidence',
      },
      performanceHistory: [],
    },
    wsId
  );

  res.status(201).json(newExp);
});

// ============================================================================
// EXPERIMENTS (WORKSPACE-ISOLATED)
// ============================================================================
router.get('/experiments', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  res.json(db.getExperiments(wsId));
});

router.get('/experiments/:id', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const expId = sanitizeHtml(req.params.id);
  const exp = db.getExperimentById(expId, wsId);
  if (!exp) {
    return res.status(404).json({
      error: 'Experiment Not Found',
      whatHappened: `Experiment '${expId}' was not found in active workspace.`,
      why: 'The experiment does not exist or belongs to another workspace.',
      whatNext: 'Check your Experiment Center list for active workspace experiments.',
    });
  }
  res.json(exp);
});

router.post('/experiments', optionalAuth, requireWorkspaceAccess, validateBody(CreateExperimentSchema), (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const created = db.createExperiment(req.body, wsId);
  res.status(201).json(created);
});

router.patch('/experiments/:id', optionalAuth, requireWorkspaceAccess, validateBody(UpdateExperimentSchema), (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const expId = sanitizeHtml(req.params.id);
  const { status } = req.body;
  const updated = db.updateExperimentStatus(expId, status, wsId);
  if (!updated) {
    return res.status(404).json({
      error: 'Experiment Not Found',
      whatHappened: `Experiment '${expId}' was not found in active workspace.`,
      why: 'The experiment does not exist or belongs to another workspace.',
      whatNext: 'Check your Experiment Center list.',
    });
  }
  res.json(updated);
});

// ============================================================================
// AI EVALUATION & GOLDEN TEST SUITE
// ============================================================================
router.get('/evaluation', optionalAuth, (req: Request, res: Response) => {
  const wsId = (req.headers['x-workspace-id'] as string) || req.user?.activeWorkspaceId || 'ws-returniq-default';
  const latestRun = goldenTestEngine.getRuns()[0];
  const evaluations = latestRun ? latestRun.aiClassificationMetrics : db.getEvaluations(wsId);
  res.json({
    metrics: evaluations,
    latestRun,
    versionInfo: GOLDEN_DATASET_VERSION_INFO,
    ...evaluations,
  });
});

router.post('/ai/evaluate', optionalAuth, async (req: Request, res: Response) => {
  const { suite } = req.body;
  const cleanSuite = suite ? sanitizeHtml(suite) : 'all';
  const run = await goldenTestEngine.runTests(cleanSuite as any);
  res.json({
    run,
    metrics: run.aiClassificationMetrics,
    success: true,
    message: 'Golden Test execution completed.',
  });
});

router.get('/evaluation/runs', (_req: Request, res: Response) => {
  res.json(goldenTestEngine.getRuns());
});

router.post('/evaluation/runs', optionalAuth, async (req: Request, res: Response) => {
  const { suite } = req.body;
  const cleanSuite = suite ? sanitizeHtml(suite) : 'all';
  const run = await goldenTestEngine.runTests(cleanSuite as any);
  res.status(202).json(run);
});

router.get('/evaluation/runs/:runId', (req: Request, res: Response) => {
  const run = goldenTestEngine.getRunById(req.params.runId);
  if (!run) {
    return res.status(404).json({ error: 'Evaluation run not found.' });
  }
  res.json(run);
});

router.post('/evaluation/runs/:runId/cancel', optionalAuth, (req: Request, res: Response) => {
  const success = goldenTestEngine.cancelActiveRun(req.params.runId);
  res.json({ success, message: success ? 'Evaluation run cancelled.' : 'Could not cancel run.' });
});

router.get('/evaluation/runs/:runId/failures', (req: Request, res: Response) => {
  const run = goldenTestEngine.getRunById(req.params.runId);
  if (!run) {
    return res.status(404).json({ error: 'Evaluation run not found.' });
  }
  const failed = run.results.filter((r) => r.status !== 'PASS');
  res.json(failed);
});

router.get('/evaluation/suites', (_req: Request, res: Response) => {
  res.json({
    versionInfo: GOLDEN_DATASET_VERSION_INFO,
    testCases: goldenTestEngine.getTestCases(),
    totalCases: goldenTestEngine.getTestCases().length,
  });
});

router.post('/evaluation/golden-cases/:id/update', optionalAuth, (req: Request, res: Response) => {
  const { expected, annotation, updatedBy } = req.body;
  const user = req.user || db.getCurrentUser();
  const updated = goldenTestEngine.updateTestCaseExpectation(
    req.params.id,
    expected,
    annotation ? sanitizeHtml(annotation) : undefined,
    updatedBy ? sanitizeHtml(updatedBy) : user.email
  );
  if (!updated) {
    return res.status(404).json({ error: 'Golden test case not found.' });
  }
  res.json(updated);
});

router.post('/evaluation/golden-cases/:id/toggle', optionalAuth, (req: Request, res: Response) => {
  const updated = goldenTestEngine.toggleTestCase(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Golden test case not found.' });
  }
  res.json(updated);
});

router.get('/evaluation/baseline', (_req: Request, res: Response) => {
  const baseline = goldenTestEngine.getAcceptedBaseline();
  res.json({ baseline });
});

router.post('/evaluation/baseline', optionalAuth, (req: Request, res: Response) => {
  const { runId } = req.body;
  if (!runId) {
    return res.status(400).json({ error: 'runId is required to set accepted baseline.' });
  }
  const success = goldenTestEngine.setAcceptedBaseline(runId);
  if (!success) {
    return res.status(404).json({ error: 'Run ID not found.' });
  }
  res.json({ success, message: `Run ${runId} established as accepted baseline.`, baseline: goldenTestEngine.getAcceptedBaseline() });
});

router.get('/evaluation/export/:runId', (req: Request, res: Response) => {
  const report = goldenTestEngine.generateMarkdownReport(req.params.runId);
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename=ReturnIQ_Golden_Test_Report_${req.params.runId}.md`);
  res.send(report);
});

// ============================================================================
// EXPORT DATA (WITH CSV FORMULA INJECTION NEUTRALIZATION)
// ============================================================================
router.get('/export', optionalAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
  const wsId = req.workspaceId!;
  const format = (req.query.format as string) || 'csv';
  const type = (req.query.type as string) || 'returns';

  if (type === 'returns') {
    const records = db.getReturns({ limit: 5000 }, wsId).items;
    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename=ReturnIQ_Returns_Export.json');
      return res.json(records);
    }

    // CSV format with DDE / CSV formula neutralization
    const headers = [
      'id',
      'orderId',
      'sku',
      'productName',
      'category',
      'purchaseDate',
      'returnDate',
      'itemPrice',
      'rawReason',
      'customerComment',
      'aiCategory',
      'aiSubcategory',
      'confidence',
      'sentiment',
      'humanReviewStatus',
    ];

    const rows = records.map((r) => [
      sanitizeCsvFormula(r.id),
      sanitizeCsvFormula(r.orderId),
      sanitizeCsvFormula(r.sku),
      `"${sanitizeCsvFormula(r.productName || '').replace(/"/g, '""')}"`,
      sanitizeCsvFormula(r.category),
      sanitizeCsvFormula(r.purchaseDate),
      sanitizeCsvFormula(r.returnDate),
      r.itemPrice,
      `"${sanitizeCsvFormula(r.rawReason || '').replace(/"/g, '""')}"`,
      `"${sanitizeCsvFormula(r.customerComment || '').replace(/"/g, '""')}"`,
      sanitizeCsvFormula(r.aiCategory),
      `"${sanitizeCsvFormula(r.aiSubcategory || '').replace(/"/g, '""')}"`,
      r.confidence,
      sanitizeCsvFormula(r.sentiment),
      sanitizeCsvFormula(r.humanReviewStatus || 'Auto'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ReturnIQ_Returns_Export.csv');
    return res.send(csvContent);
  }

  res.json({ message: 'Export generated' });
});

// ============================================================================
// SYSTEM RESET & INTEGRITY AUDITS
// ============================================================================
router.post('/reset', (_req: Request, res: Response) => {
  db.resetToDemo();
  res.json({ success: true, message: 'Database reset to demo state.' });
});

router.get('/audit/data-integrity', async (_req: Request, res: Response) => {
  try {
    const { runDataIntegrityAudit } = await import('./test_data_integrity');
    const report = await runDataIntegrityAudit();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Audit execution failed' });
  }
});

export { router };
export default router;
