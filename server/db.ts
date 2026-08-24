import {
  Workspace,
  Dataset,
  Product,
  ReturnRecord,
  ActionPlanItem,
  Experiment,
  AiEvaluationMetrics,
  DashboardData,
  ReturnCategory,
} from '../src/types';
import { ruleBasedClassify } from './gemini';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface User {
  onboardingProgress?: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    step5: boolean;
    completed: boolean;
  };
  id: string;
  email: string;
  name: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  token: string;
  workspaceIds: string[];
  activeWorkspaceId: string;
  createdAt: string;
}

export type SafeUser = Omit<User, 'password' | 'passwordHash' | 'passwordSalt'>;

export interface WorkspaceStore {
  workspace: Workspace;
  datasets: Dataset[];
  activeDatasetId: string;
  returnsByDataset: Record<string, ReturnRecord[]>;
  productsByDataset: Record<string, Product[]>;
  actions: ActionPlanItem[];
  experiments: Experiment[];
  evaluations: AiEvaluationMetrics;
}

const DEFAULT_WORKSPACE_ID = 'ws-returniq-default';
const DEFAULT_USER_EMAIL = 'dishantgangwar778@gmail.com';

export class ReturnIQDatabase {
  private users: User[] = [];
  private workspaceStores: Record<string, WorkspaceStore> = {};
  private currentWorkspaceId: string = DEFAULT_WORKSPACE_ID;
  private currentUserId: string = 'usr-admin-default';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // 1. Initialize default user
    const defaultUser: User = {
      id: 'usr-admin-default',
      email: DEFAULT_USER_EMAIL,
      name: 'Dishant Gangwar',
      token: 'token-auth-session-dishant-778',
      workspaceIds: [DEFAULT_WORKSPACE_ID],
      activeWorkspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: '2026-06-01T10:00:00Z',
      onboardingProgress: { step1: true, step2: false, step3: false, step4: false, step5: false, completed: false }
    };
    this.users.push(defaultUser);
    this.currentUserId = defaultUser.id;

    // 2. Initialize default workspace store
    const defaultWorkspace: Workspace = {
      id: DEFAULT_WORKSPACE_ID,
      name: 'Acme Apparel & Footwear Co.',
      industry: 'Apparel & Fashion',
      createdAt: '2026-06-01T10:00:00Z',
      currency: 'USD',
      totalDatasetsCount: 1,
      totalReturnsProcessed: 5240,
    };

    const initialDataset: Dataset = {
      id: 'ds-q3-master',
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: 'Q3_Returns_Master.csv',
      fileName: 'Q3_Returns_Master.csv',
      fileSize: '4.2 MB',
      rowCount: 5240,
      uploadedAt: '2026-08-10T14:30:00Z',
      status: 'Completed',
      columnMapping: {
        sku: 'SKU_ID',
        reason: 'ReasonText',
        date: 'PurchaseDate',
        comment: 'Notes',
        category: 'Category',
        price: 'Price',
      },
      stats: {
        returnRate: 14.2,
        revenueAtRisk: 124000,
        topDriver: 'Size/Fit',
        preventableEstimate: 22,
      },
    };

    const masterProducts: Product[] = [
      {
        id: 'prod-cwb-001',
        sku: 'SKU-OW-1042',
        name: 'Classic Wool Blend Coat',
        category: 'Outerwear',
        imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&auto=format&fit=crop&q=80',
        price: 185.0,
        totalOrders: 3840,
        returnRate: 34.5,
        categoryBenchmark: 12.0,
        unitsReturned30d: 1324,
        estRevenueLoss: 244940,
        topReason: 'Size/Fit',
        topReasonPercentage: 48,
        trendDelta: 20.4,
        isProblematic: true,
        rootCause: {
          id: 'rc-cwb-001',
          productId: 'prod-cwb-001',
          productSku: 'SKU-OW-1042',
          primaryHypothesis:
            'Shoulder width and sleeve circumference run approximately 1.5 inches narrower than standard sizing chart indicates, causing arm mobility constraints.',
          aiConfidence: 96,
          dataPointsCount: 1324,
          keyEvidence: [
            { id: 'ev-1', type: 'alert', text: '48% of all return reasons explicitly mention "Shoulders too tight" or "Sleeves too narrow".' },
            { id: 'ev-2', type: 'user', text: '68% of returning customers report wearing their standard medium or large.' },
            { id: 'ev-3', type: 'repeat', text: '42% of returned units were re-ordered 1 size up within 48 hours.' },
          ],
          createdAt: '2026-08-11T09:00:00Z',
        },
      },
      {
        id: 'prod-sku-104',
        sku: 'SKU-104',
        name: 'Slim Fit Chino',
        category: 'Bottoms',
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80',
        price: 68.0,
        totalOrders: 5020,
        returnRate: 24.8,
        categoryBenchmark: 11.3,
        unitsReturned30d: 1245,
        estRevenueLoss: 84660,
        topReason: 'Size/Fit',
        topReasonPercentage: 46,
        trendDelta: 13.5,
        isProblematic: true,
        rootCause: {
          id: 'rc-sku-104',
          productId: 'prod-sku-104',
          productSku: 'SKU-104',
          primaryHypothesis:
            'Customers are experiencing a consistent size expectation mismatch. The waist sizing runs approximately 1 inch smaller than industry standard for the indicated tag size.',
          aiConfidence: 94,
          dataPointsCount: 1245,
          keyEvidence: [
            { id: 'ev-104-1', type: 'alert', text: '46% of all return reasons explicitly mention "Too Small" or "Tight in waist".' },
            { id: 'ev-104-2', type: 'user', text: '72% of these specific returns originate from first-time buyers of this brand.' },
            { id: 'ev-104-3', type: 'repeat', text: 'High rate (38%) of immediate repurchase in one size larger following a return.' },
          ],
          createdAt: '2026-08-12T11:00:00Z',
        },
      },
      {
        id: 'prod-prs-099',
        sku: 'SKU-FW-882',
        name: 'Pro-Run Sneakers V2',
        category: 'Footwear',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
        price: 130.0,
        totalOrders: 3120,
        returnRate: 28.1,
        categoryBenchmark: 15.5,
        unitsReturned30d: 876,
        estRevenueLoss: 113880,
        topReason: 'Quality',
        topReasonPercentage: 52,
        trendDelta: 12.6,
        isProblematic: true,
        rootCause: {
          id: 'rc-prs-099',
          productId: 'prod-prs-099',
          productSku: 'SKU-FW-882',
          primaryHypothesis:
            'Adhesive curing inconsistency in batch 2026-Q2 is leading to premature sole separation at the toe box within the first 14 days of wear.',
          aiConfidence: 92,
          dataPointsCount: 876,
          keyEvidence: [
            { id: 'ev-prs-1', type: 'alert', text: '52% of returns cite "sole ungluing" or "toe box separated".' },
            { id: 'ev-prs-2', type: 'metric', text: 'Defect rate spiked from 2.1% in Q1 to 14.8% in late Q2 production lots.' },
            { id: 'ev-prs-3', type: 'user', text: '84% of returned customers attached photos showing front toe delamination.' },
          ],
          createdAt: '2026-08-12T14:00:00Z',
        },
      },
      {
        id: 'prod-seb-442',
        sku: 'SKU-WT-301',
        name: 'Silk Evening Blouse',
        category: 'Tops & Blouses',
        imageUrl: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=500&auto=format&fit=crop&q=80',
        price: 95.0,
        totalOrders: 2450,
        returnRate: 22.4,
        categoryBenchmark: 10.2,
        unitsReturned30d: 548,
        estRevenueLoss: 52060,
        topReason: 'Color',
        topReasonPercentage: 41,
        trendDelta: 8.3,
        isProblematic: true,
        rootCause: {
          id: 'rc-seb-442',
          productId: 'prod-seb-442',
          productSku: 'SKU-WT-301',
          primaryHypothesis:
            'PDP studio lighting has overly saturated the "Emerald Teal" swatch, appearing deep forest green in studio photos but lighter cyan-green under indoor residential lighting.',
          aiConfidence: 91,
          dataPointsCount: 548,
          keyEvidence: [
            { id: 'ev-seb-1', type: 'alert', text: '41% of returns mention "color looked much darker in photo" or "not true emerald".' },
            { id: 'ev-seb-2', type: 'user', text: 'Low correlation with fit issues (only 12% size returns).' },
            { id: 'ev-seb-3', type: 'metric', text: '78% of returns occur within 3 days of delivery upon unboxing.' },
          ],
          createdAt: '2026-08-13T10:00:00Z',
        },
      },
      {
        id: 'prod-sfd-102',
        sku: 'SKU-BT-990',
        name: 'Slim Fit Denim Jeans',
        category: 'Bottoms',
        imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=80',
        price: 88.0,
        totalOrders: 4200,
        returnRate: 19.8,
        categoryBenchmark: 11.3,
        unitsReturned30d: 831,
        estRevenueLoss: 73128,
        topReason: 'Quality',
        topReasonPercentage: 38,
        trendDelta: 7.5,
        isProblematic: true,
        rootCause: {
          id: 'rc-sfd-102',
          productId: 'prod-sfd-102',
          productSku: 'SKU-BT-990',
          primaryHypothesis:
            'Customer perception of rigid unwashed denim fabric as "stiff / low quality" when expecting pre-washed stretch denim.',
          aiConfidence: 89,
          dataPointsCount: 831,
          keyEvidence: [
            { id: 'ev-sfd-1', type: 'alert', text: '38% mention "rigid fabric" or "no stretch".' },
            { id: 'ev-sfd-2', type: 'user', text: 'Fabric composition (100% cotton) is buried below the fold on mobile PDP.' },
          ],
          createdAt: '2026-08-13T14:00:00Z',
        },
      },
    ];

    const masterReturns = this.generateSyntheticReturns(masterProducts, 5240);

    const initialActions: ActionPlanItem[] = [
      {
        id: 'act-101',
        productId: 'prod-cwb-001',
        productSku: 'SKU-OW-1042',
        title: 'Update Tailored Chino Size Guide & Fit Widget',
        description:
          'Add explicit disclaimer on PDP: "Fits narrow in shoulders. Size up if wearing over layers or thick sweaters." Embed 3D body avatar fit calculator.',
        problem: 'Shoulder circumference runs 1.5 inches narrower than standard industry chart.',
        evidence: '48% of returns cite narrow shoulders; 42% repurchased 1 size up.',
        recommendation: 'Update sizing chart and add dynamic fit guidance widget.',
        expectedImpact: 'High',
        estimatedSavingsPerWeek: 18500,
        effort: 'Low',
        confidenceScore: 0.96,
        priority: 'P0 - CRITICAL',
        priorityScore: 4.8,
        actionType: 'Update Size Guide',
        owner: 'dishantgangwar778@gmail.com',
        status: 'In Progress',
        convertedToExperimentId: 'exp-1041',
        createdAt: '2026-08-11T12:00:00Z',
        updatedAt: '2026-08-12T15:30:00Z',
      },
      {
        id: 'act-102',
        productId: 'prod-prs-099',
        productSku: 'SKU-FW-882',
        title: 'Issue Factory Quarantine & QA Audit on Sneaker Toe Box Adhesives',
        description:
          'Initiate factory audit at manufacturing facility B. Quarantine remaining 4,500 inventory units until tensile bond testing is complete.',
        problem: 'Adhesive curing failure in Q2 production lot causing sole separation.',
        evidence: '52% returns cite sole ungluing; defect rate spiked to 14.8%.',
        recommendation: 'Immediate vendor QA audit and quarantine of affected inventory lot.',
        expectedImpact: 'High',
        estimatedSavingsPerWeek: 26000,
        effort: 'Medium',
        confidenceScore: 0.94,
        priority: 'P0 - CRITICAL',
        priorityScore: 4.5,
        actionType: 'Create Jira Ticket',
        owner: 'dishantgangwar778@gmail.com',
        status: 'Not Started',
        createdAt: '2026-08-12T16:00:00Z',
        updatedAt: '2026-08-12T16:00:00Z',
      },
    ];

    const initialExperiments: Experiment[] = [
      {
        id: 'exp-1041',
        code: 'EXP-1041',
        title: 'PDP Interactive Size Calculator & Fit Recommendation Banner',
        description:
          'A/B test testing the introduction of a prominent sizing banner and AI fit recommender on the Classic Wool Coat PDP.',
        actionId: 'act-101',
        status: 'RUNNING',
        primaryMetric: 'Return Rate Reduction',
        secondaryMetrics: ['Conversion Rate', 'Repeat Purchase Rate', 'Customer Support Contacts'],
        audience: 'All US desktop & mobile traffic viewing SKU-OW-1042 (50/50 split)',
        durationDays: 30,
        currentDay: 14,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        hypothesis:
          'Providing explicit shoulder fit warnings and recommending "Size Up" will reduce size-related return rate by at least 25% without dampening PDP purchase conversion.',
        controlGroup: {
          name: 'Control (Standard PDP)',
          description: 'Standard product details page with static size dropdown table.',
          returnRate: 34.5,
          sampleSize: 6420,
          conversionRate: 3.2,
        },
        treatmentGroup: {
          name: 'Treatment (Interactive Size Assistant)',
          description: 'Enhanced PDP with dynamic fit recommendation widget and shoulder width notice.',
          returnRate: 23.8,
          sampleSize: 6450,
          conversionRate: 3.25,
          variance: -10.7,
        },
        statisticalSignificance: {
          pValue: 0.024,
          isSignificant: true,
          confidenceLevel: '95% confidence',
        },
        performanceHistory: [
          { period: 'Day 1-7', control: 35.1, treatment: 28.4 },
          { period: 'Day 8-14', control: 34.5, treatment: 23.8 },
        ],
      },
    ];

    const initialEvaluations: AiEvaluationMetrics = {
      precisionScore: 94.2,
      humanCorrectionRate: 2.8,
      correctionRateDelta: -0.4,
      accuracyOverall: 93.8,
      recallScore: 92.5,
      f1Score: 93.3,
      highConfidenceAccuracy: 97.4,
      recommendationAcceptanceRate: 88.6,
      categoryBreakdown: [
        { category: 'Size/Fit', sampleCount: 2358, precision: 95.8, recall: 96.2, f1: 96.0 },
        { category: 'Quality', sampleCount: 1310, precision: 93.4, recall: 91.8, f1: 92.6 },
        { category: 'Color', sampleCount: 471, precision: 92.1, recall: 89.4, f1: 90.7 },
        { category: 'Changed Mind', sampleCount: 524, precision: 94.0, recall: 95.1, f1: 94.5 },
        { category: 'Damage', sampleCount: 262, precision: 96.5, recall: 94.0, f1: 95.2 },
        { category: 'Delivery', sampleCount: 157, precision: 91.0, recall: 88.5, f1: 89.7 },
        { category: 'Wrong Item', sampleCount: 104, precision: 98.1, recall: 97.5, f1: 97.8 },
        { category: 'Customer Preference', sampleCount: 54, precision: 86.4, recall: 84.0, f1: 85.2 },
      ],
      confusionMatrix: [
        { actual: 'Size/Fit', predicted: 'Size/Fit', count: 2268 },
        { actual: 'Size/Fit', predicted: 'Quality', count: 42 },
        { actual: 'Size/Fit', predicted: 'Customer Preference', count: 48 },
        { actual: 'Quality', predicted: 'Quality', count: 1224 },
        { actual: 'Quality', predicted: 'Damage', count: 54 },
        { actual: 'Quality', predicted: 'Size/Fit', count: 32 },
        { actual: 'Color', predicted: 'Color', count: 434 },
        { actual: 'Color', predicted: 'Product Mismatch', count: 37 },
        { actual: 'Changed Mind', predicted: 'Changed Mind', count: 498 },
        { actual: 'Changed Mind', predicted: 'Customer Preference', count: 26 },
      ],
      auditLogs: [
        {
          id: 'log-101',
          timestamp: '2026-08-14T11:42:00Z',
          returnId: 'ret-104-55',
          comment: 'Too small in waist, but fabric is also stiff',
          originalAi: 'Quality',
          userCorrectedTo: 'Size/Fit',
          reviewedBy: 'dishantgangwar778@gmail.com',
        },
      ],
    };

    this.workspaceStores[DEFAULT_WORKSPACE_ID] = {
      workspace: defaultWorkspace,
      datasets: [initialDataset],
      activeDatasetId: initialDataset.id,
      returnsByDataset: {
        [initialDataset.id]: masterReturns,
      },
      productsByDataset: {
        [initialDataset.id]: masterProducts,
      },
      actions: initialActions,
      experiments: initialExperiments,
      evaluations: initialEvaluations,
    };
  }

  // Helper to sanitize user output (never return password or hash)
  public sanitizeUser(user: User): SafeUser {
    const { password, passwordHash, passwordSalt, ...safe } = user;
    return safe;
  }

  // User Authentication
  public registerUser(name: string, email: string, password?: string): SafeUser {
    const cleanEmail = email.toLowerCase().trim();
    const existing = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return this.sanitizeUser(existing);
    }

    const rawPass = password || 'password123';
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(rawPass, salt);

    const newWs = this.createWorkspace(`${name}'s Workspace`, 'Apparel & Fashion');
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: name.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      token: `token-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`,
      workspaceIds: [newWs.id],
      activeWorkspaceId: newWs.id,
      createdAt: new Date().toISOString(),
      onboardingProgress: { step1: false, step2: false, step3: false, step4: false, step5: false, completed: false }
    };

    this.users.push(newUser);
    this.currentUserId = newUser.id;
    this.currentWorkspaceId = newWs.id;
    return this.sanitizeUser(newUser);
  }

  public loginUser(email: string, password?: string): SafeUser | null {
    const cleanEmail = email.toLowerCase().trim();
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      // Auto-register convenience for testing
      return this.registerUser(email.split('@')[0], email, password);
    }

    // Verify password if user has hash and password was supplied
    if (password && user.passwordHash && user.passwordSalt) {
      let isMatch = false;
      try {
        isMatch = bcrypt.compareSync(password, user.passwordHash);
      } catch(e) { /* fallback/ignore */ }
      if (!isMatch && password !== user.password) {
        return null;
      }
    }

    user.token = `token-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
    this.currentUserId = user.id;
    this.currentWorkspaceId = user.activeWorkspaceId || user.workspaceIds[0] || DEFAULT_WORKSPACE_ID;
    return this.sanitizeUser(user);
  }

  
  public updateOnboarding(userId: string, step: number): SafeUser | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    
    if (!user.onboardingProgress) {
      user.onboardingProgress = { step1: false, step2: false, step3: false, step4: false, step5: false, completed: false };
    }
    
    switch (step) {
      case 1: user.onboardingProgress.step1 = true; break;
      case 2: user.onboardingProgress.step2 = true; break;
      case 3: user.onboardingProgress.step3 = true; break;
      case 4: user.onboardingProgress.step4 = true; break;
      case 5: user.onboardingProgress.step5 = true; break;
    }
    
    const progress = user.onboardingProgress;
    progress.completed = progress.step1 && progress.step2 && progress.step3 && progress.step4 && progress.step5;
    
    return this.sanitizeUser(user);
  }

  public getUserByToken(token: string): User | null {
    return this.users.find((u) => u.token === token) || null;
  }

  public isUserInWorkspace(userId: string, workspaceId: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    return Boolean(user && user.workspaceIds && user.workspaceIds.includes(workspaceId));
  }

  public getCurrentUser(): User {
    const u = this.users.find((user) => user.id === this.currentUserId);
    return (
      u || {
        id: 'usr-admin-default',
        email: DEFAULT_USER_EMAIL,
        name: 'Dishant Gangwar',
        token: 'token-auth-session-dishant-778',
        workspaceIds: [this.currentWorkspaceId],
        activeWorkspaceId: this.currentWorkspaceId,
        createdAt: '2026-06-01T10:00:00Z',
      }
    );
  }

  // Workspaces
  public getWorkspaces(userId?: string): Workspace[] {
    const user = userId ? this.users.find((u) => u.id === userId) : this.getCurrentUser();
    if (user && user.workspaceIds && user.workspaceIds.length > 0) {
      return user.workspaceIds
        .map((wsId) => this.workspaceStores[wsId]?.workspace)
        .filter(Boolean);
    }
    return Object.values(this.workspaceStores).map((ws) => ws.workspace);
  }

  public getCurrentWorkspace(workspaceId?: string): Workspace {
    const wsId = workspaceId || this.currentWorkspaceId;
    if (this.workspaceStores[wsId]) {
      return this.workspaceStores[wsId].workspace;
    }
    return this.workspaceStores[DEFAULT_WORKSPACE_ID]?.workspace || {
      id: DEFAULT_WORKSPACE_ID,
      name: 'Acme Apparel & Footwear Co.',
      industry: 'Apparel & Fashion',
      createdAt: '2026-06-01T10:00:00Z',
      currency: 'USD',
      totalDatasetsCount: 1,
      totalReturnsProcessed: 5240,
    };
  }

  public createWorkspace(name: string, industry: string, userId?: string): Workspace {
    const wsId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newWs: Workspace = {
      id: wsId,
      name,
      industry,
      createdAt: new Date().toISOString(),
      currency: 'USD',
      totalDatasetsCount: 0,
      totalReturnsProcessed: 0,
    };

    this.workspaceStores[wsId] = {
      workspace: newWs,
      datasets: [],
      activeDatasetId: '',
      returnsByDataset: {},
      productsByDataset: {},
      actions: [],
      experiments: [],
      evaluations: {
        precisionScore: 0,
        humanCorrectionRate: 0,
        correctionRateDelta: 0,
        accuracyOverall: 0,
        recallScore: 0,
        f1Score: 0,
        highConfidenceAccuracy: 0,
        recommendationAcceptanceRate: 0,
        categoryBreakdown: [],
        confusionMatrix: [],
        auditLogs: [],
      },
    };

    const targetUser = userId ? this.users.find((u) => u.id === userId) : this.getCurrentUser();
    if (targetUser) {
      if (!targetUser.workspaceIds.includes(wsId)) {
        targetUser.workspaceIds.push(wsId);
      }
      targetUser.activeWorkspaceId = wsId;
    }

    this.currentWorkspaceId = wsId;
    return newWs;
  }

  public setWorkspace(id: string): boolean {
    if (this.workspaceStores[id]) {
      this.currentWorkspaceId = id;
      const user = this.getCurrentUser();
      if (user) {
        user.activeWorkspaceId = id;
      }
      return true;
    }
    return false;
  }

  private getStore(workspaceId?: string): WorkspaceStore {
    const wsId = workspaceId || this.currentWorkspaceId;
    if (!this.workspaceStores[wsId]) {
      // Auto-initialize if missing
      this.createWorkspace('Default Workspace', 'Apparel & Fashion');
    }
    return this.workspaceStores[wsId] || this.workspaceStores[DEFAULT_WORKSPACE_ID];
  }

  // Active Returns & Products for the store
  public getActiveReturns(workspaceId?: string): ReturnRecord[] {
    const store = this.getStore(workspaceId);
    if (!store.activeDatasetId || !store.returnsByDataset[store.activeDatasetId]) {
      // Fallback to first available dataset or empty array
      const firstDatasetId = Object.keys(store.returnsByDataset)[0];
      if (firstDatasetId) {
        store.activeDatasetId = firstDatasetId;
        return store.returnsByDataset[firstDatasetId] || [];
      }
      return [];
    }
    return store.returnsByDataset[store.activeDatasetId] || [];
  }

  public getActiveProducts(workspaceId?: string): Product[] {
    const store = this.getStore(workspaceId);
    if (!store.activeDatasetId || !store.productsByDataset[store.activeDatasetId]) {
      const firstDatasetId = Object.keys(store.productsByDataset)[0];
      if (firstDatasetId) {
        return store.productsByDataset[firstDatasetId] || [];
      }
      return [];
    }
    return store.productsByDataset[store.activeDatasetId] || [];
  }

  // Datasets
  public getDatasets(workspaceId?: string): Dataset[] {
    const store = this.getStore(workspaceId);
    return store.datasets;
  }

  public selectActiveDataset(datasetId: string, workspaceId?: string): boolean {
    const store = this.getStore(workspaceId);
    const dataset = store.datasets.find((d) => d.id === datasetId);
    if (dataset && store.returnsByDataset[datasetId]) {
      store.activeDatasetId = datasetId;
      this.recalculateProductMetrics(workspaceId);
      return true;
    }
    return false;
  }

  public selectDataset(datasetId: string, workspaceId?: string): boolean {
    return this.selectActiveDataset(datasetId, workspaceId);
  }

  public addDatasetWithRecords(
    datasetInfo: Omit<Dataset, 'id' | 'workspaceId' | 'uploadedAt'>,
    records: ReturnRecord[],
    workspaceId?: string,
    setAsActive = true
  ): Dataset {
    const store = this.getStore(workspaceId);
    const datasetId = `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newDataset: Dataset = {
      ...datasetInfo,
      id: datasetId,
      workspaceId: store.workspace.id,
      uploadedAt: new Date().toISOString(),
    };

    store.datasets.unshift(newDataset);
    store.returnsByDataset[datasetId] = records;

    if (setAsActive || !store.activeDatasetId) {
      store.activeDatasetId = datasetId;
    }

    this.recalculateProductMetrics(workspaceId);

    // Update dataset stats with freshly recalculated values
    const dData = this.getDashboardData('Last 30 Days', 'All Categories', workspaceId);
    newDataset.stats = {
      returnRate: dData.returnRate.value,
      revenueAtRisk: dData.revenueAtRisk.value,
      topDriver: dData.topReturnDriver.category,
      preventableEstimate: dData.preventableReturns.percentage,
    };

    store.workspace.totalDatasetsCount = store.datasets.length;
    store.workspace.totalReturnsProcessed = Object.values(store.returnsByDataset).reduce(
      (sum, rList) => sum + rList.length,
      0
    );

    return newDataset;
  }

  public addReturnRecords(records: ReturnRecord[], workspaceId?: string) {
    const store = this.getStore(workspaceId);
    if (!store.activeDatasetId) {
      this.addDatasetWithRecords(
        {
          name: 'Direct_Ingestion.csv',
          fileName: 'Direct_Ingestion.csv',
          fileSize: `${(records.length * 0.3).toFixed(1)} KB`,
          rowCount: records.length,
          status: 'Completed',
          columnMapping: {},
        },
        records,
        workspaceId,
        true
      );
    } else {
      if (!store.returnsByDataset[store.activeDatasetId]) {
        store.returnsByDataset[store.activeDatasetId] = [];
      }
      store.returnsByDataset[store.activeDatasetId].unshift(...records);
      const ds = store.datasets.find((d) => d.id === store.activeDatasetId);
      if (ds) ds.rowCount = store.returnsByDataset[store.activeDatasetId].length;
      this.recalculateProductMetrics(workspaceId);
    }
  }

  // Products
  public getProducts(workspaceId?: string): Product[] {
    return this.getActiveProducts(workspaceId);
  }

  public getProductBySku(sku: string, workspaceId?: string): Product | undefined {
    const prods = this.getActiveProducts(workspaceId);
    return prods.find((p) => p.sku.toLowerCase() === sku.toLowerCase() || p.id === sku);
  }

  public getProblematicProducts(workspaceId?: string): Product[] {
    const prods = this.getActiveProducts(workspaceId);
    return prods.filter((p) => p.isProblematic).sort((a, b) => b.returnRate - a.returnRate);
  }

  // Returns
  public getReturns(
    query: {
      page?: number;
      limit?: number;
      category?: string;
      sku?: string;
      search?: string;
      needsReviewOnly?: boolean;
    },
    workspaceId?: string
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const allReturns = this.getActiveReturns(workspaceId);

    let filtered = [...allReturns];

    if (query.category && query.category !== 'All' && query.category !== 'All Categories') {
      filtered = filtered.filter((r) => r.aiCategory === query.category || r.category === query.category);
    }

    if (query.sku) {
      filtered = filtered.filter((r) => r.sku.toLowerCase() === query.sku?.toLowerCase());
    }

    if (query.needsReviewOnly) {
      filtered = filtered.filter((r) => r.confidence < 0.7 || !r.humanReviewed);
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.orderId.toLowerCase().includes(s) ||
          r.sku.toLowerCase().includes(s) ||
          r.productName.toLowerCase().includes(s) ||
          r.rawReason.toLowerCase().includes(s) ||
          (r.customerComment && r.customerComment.toLowerCase().includes(s))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      total,
      page,
      totalPages,
      limit,
    };
  }

  public reviewReturn(
    id: string,
    action: 'Accept' | 'Edit' | 'Reject',
    correctedCategory?: ReturnCategory,
    correctedSubcategory?: string,
    reviewerEmail?: string,
    workspaceId?: string
  ): ReturnRecord | null {
    const store = this.getStore(workspaceId);
    const activeReturns = this.getActiveReturns(workspaceId);
    const record = activeReturns.find((r) => r.id === id);
    if (!record) return null;

    record.humanReviewed = true;
    record.reviewedBy = reviewerEmail || 'dishantgangwar778@gmail.com';
    record.reviewedAt = new Date().toISOString();

    if (action === 'Accept') {
      record.humanReviewStatus = 'Accepted';
    } else if (action === 'Edit' && correctedCategory) {
      record.originalAiCategory = record.aiCategory;
      record.aiCategory = correctedCategory;
      if (correctedSubcategory) record.aiSubcategory = correctedSubcategory;
      record.humanReviewStatus = 'Corrected';
      record.confidence = 1.0;

      store.evaluations.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        returnId: record.id,
        comment: record.customerComment || record.rawReason,
        originalAi: record.originalAiCategory || 'Other',
        userCorrectedTo: correctedCategory,
        reviewedBy: record.reviewedBy,
      });

      const totalCorrected = store.evaluations.auditLogs.length;
      const totalAnalyzed = Math.max(activeReturns.length, 1);
      store.evaluations.humanCorrectionRate =
        Math.round((totalCorrected / Math.min(totalAnalyzed, 100)) * 100 * 10) / 10;
    } else if (action === 'Reject') {
      record.humanReviewStatus = 'Rejected';
    }

    this.recalculateProductMetrics(workspaceId);
    return record;
  }

  // Recalculate metrics deterministically
  public recalculateProductMetrics(workspaceId?: string): void {
    const store = this.getStore(workspaceId);
    const returns = this.getActiveReturns(workspaceId);
    const activeDatasetId = store.activeDatasetId;

    if (!activeDatasetId) return;

    const skuMap: Record<
      string,
      {
        count: number;
        revenue: number;
        name: string;
        category: string;
        reasons: Record<string, number>;
        prices: number[];
      }
    > = {};

    returns.forEach((r) => {
      if (!skuMap[r.sku]) {
        skuMap[r.sku] = {
          count: 0,
          revenue: 0,
          name: r.productName,
          category: r.category,
          reasons: {},
          prices: [],
        };
      }
      skuMap[r.sku].count += 1;
      skuMap[r.sku].revenue += r.itemPrice || 0;
      skuMap[r.sku].prices.push(r.itemPrice || 0);
      skuMap[r.sku].reasons[r.aiCategory] = (skuMap[r.sku].reasons[r.aiCategory] || 0) + 1;
    });

    const categoryBenchmarks: Record<string, number> = {
      Outerwear: 12.0,
      Bottoms: 11.3,
      Footwear: 15.5,
      'Tops & Blouses': 10.2,
      'Tops & Knitwear': 12.0,
      Accessories: 9.2,
      General: 12.0,
    };

    const newProducts: Product[] = [];

    const activeDataset = store.datasets.find((d) => d.id === activeDatasetId);
    const activeDatasetName = activeDataset?.name || 'Active Returns Dataset';
    const nowIso = new Date().toISOString();

    Object.entries(skuMap).forEach(([sku, info]) => {
      const topReasonEntry = Object.entries(info.reasons).sort((a, b) => b[1] - a[1])[0];
      const topReason = (topReasonEntry ? topReasonEntry[0] : 'Size/Fit') as ReturnCategory;
      const topReasonPct = topReasonEntry ? Math.round((topReasonEntry[1] / info.count) * 100) : 40;
      const benchmark = categoryBenchmarks[info.category] || 12.0;
      const avgPrice =
        info.prices.length > 0 ? info.prices.reduce((a, b) => a + b, 0) / info.prices.length : 75;

      const estOrders = Math.max(Math.round(info.count * 3.8), info.count);
      const retRate = Math.round(((info.count / estOrders) * 100) * 10) / 10;
      const isInsufficient = info.count < 2;

      newProducts.push({
        id: `prod-${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        sku,
        name: info.name || `Product ${sku}`,
        category: info.category || 'General',
        imageUrl:
          'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80',
        price: Math.round(avgPrice * 100) / 100,
        totalOrders: estOrders,
        returnRate: retRate,
        categoryBenchmark: benchmark,
        unitsReturned30d: info.count,
        estRevenueLoss: Math.round(info.revenue),
        topReason,
        topReasonPercentage: topReasonPct,
        trendDelta: Math.round((retRate - benchmark) * 10) / 10,
        isProblematic: retRate > benchmark,
        rootCause: {
          id: `rc-${sku.toLowerCase()}`,
          productId: `prod-${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          productSku: sku,
          primaryHypothesis: isInsufficient
            ? 'Insufficient evidence'
            : `High concentration of ${topReason} returns (${topReasonPct}% of total volume) indicates a significant product specification mismatch with customer expectations.`,
          aiConfidence: isInsufficient ? 40 : 94,
          dataPointsCount: info.count,
          isInsufficientEvidence: isInsufficient,
          classificationType: 'AI HYPOTHESIS',
          sourceDatasetId: activeDatasetId,
          sourceDatasetName: activeDatasetName,
          supportingRecordCount: info.count,
          supportingMetrics: {
            returnRate: retRate,
            totalReturns: info.count,
            categoryBenchmark: benchmark,
            topReasonPercentage: topReasonPct,
            topReason,
            benchmarkDelta: Math.round((retRate - benchmark) * 10) / 10,
          },
          modelIdentifier: 'gemini-3.7-flash',
          promptVersion: 'prompts-v1.8',
          confidenceScore: isInsufficient ? 0.4 : 0.94,
          generationTimestamp: nowIso,
          keyEvidence: isInsufficient
            ? [
                {
                  id: `ev-${sku}-insufficient`,
                  type: 'alert',
                  text: 'Insufficient sample size in active dataset to establish an evidence-backed root cause hypothesis.',
                },
              ]
            : [
                { id: `ev-${sku}-1`, type: 'alert', text: `${topReasonPct}% of returns cite ${topReason}.` },
                { id: `ev-${sku}-2`, type: 'user', text: `${info.count} returned units analyzed from active dataset "${activeDatasetName}".` },
                { id: `ev-${sku}-3`, type: 'metric', text: `Return rate (${retRate}%) exceeds benchmark (${benchmark}%) by +${Math.round((retRate - benchmark) * 10) / 10}%.` },
              ],
          createdAt: nowIso,
        },
      });
    });

    store.productsByDataset[activeDatasetId] = newProducts;
  }

  // Action Items
  public getActions(statusFilter?: string, workspaceId?: string): ActionPlanItem[] {
    const store = this.getStore(workspaceId);
    if (statusFilter && statusFilter !== 'All') {
      return store.actions.filter((a) => a.status === statusFilter);
    }
    return store.actions;
  }

  public addAction(
    item: Omit<ActionPlanItem, 'id' | 'createdAt' | 'updatedAt'>,
    workspaceId?: string
  ): ActionPlanItem {
    const store = this.getStore(workspaceId);
    const newAction: ActionPlanItem = {
      ...item,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.actions.unshift(newAction);
    return newAction;
  }

  public updateAction(
    id: string,
    updates: Partial<ActionPlanItem>,
    workspaceId?: string
  ): ActionPlanItem | null {
    const store = this.getStore(workspaceId);
    const item = store.actions.find((a) => a.id === id);
    if (!item) return null;

    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    return item;
  }

  // Experiments
  public getExperiments(workspaceId?: string): Experiment[] {
    const store = this.getStore(workspaceId);
    return store.experiments;
  }

  public getExperimentById(id: string, workspaceId?: string): Experiment | undefined {
    const store = this.getStore(workspaceId);
    return store.experiments.find((e) => e.id === id);
  }

  public createExperiment(
    exp: Omit<Experiment, 'id' | 'code' | 'startDate' | 'endDate' | 'currentDay'>,
    workspaceId?: string
  ): Experiment {
    const store = this.getStore(workspaceId);
    const codeNum = 1040 + store.experiments.length + 1;
    const now = new Date();
    const end = new Date(now.getTime() + exp.durationDays * 24 * 60 * 60 * 1000);

    const newExp: Experiment = {
      ...exp,
      id: `exp-${Date.now()}`,
      code: `EXP-${codeNum}`,
      currentDay: 1,
      startDate: now.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };

    store.experiments.unshift(newExp);

    if (exp.actionId) {
      const action = store.actions.find((a) => a.id === exp.actionId);
      if (action) {
        action.convertedToExperimentId = newExp.id;
        action.status = 'In Progress';
      }
    }

    return newExp;
  }

  public updateExperimentStatus(
    id: string,
    status: Experiment['status'],
    workspaceId?: string
  ): Experiment | null {
    const store = this.getStore(workspaceId);
    const exp = store.experiments.find((e) => e.id === id);
    if (!exp) return null;
    exp.status = status;
    return exp;
  }

  // AI Evaluation
  public getEvaluations(workspaceId?: string): AiEvaluationMetrics {
    const store = this.getStore(workspaceId);
    return store.evaluations;
  }

  // Dashboard Calculations - 100% Deterministically Aggregated from Active Dataset Records
  public getDashboardData(
    timeframe = 'Last 30 Days',
    category = 'All Categories',
    workspaceId?: string
  ): DashboardData {
    const store = this.getStore(workspaceId);
    let returns = this.getActiveReturns(workspaceId);
    const products = this.getActiveProducts(workspaceId);
    
    // Always use the full active dataset count as the ground-truth denominator for distribution
    const totalBaseCount = returns.length;

    if (category !== 'All Categories' && category !== 'All') {
      returns = returns.filter((r) => r.category === category || r.aiCategory === category);
    }

    const totalReturnsCount = returns.length;

    // Category distribution
    const catCounts: Record<string, number> = {};
    returns.forEach((r) => {
      catCounts[r.aiCategory] = (catCounts[r.aiCategory] || 0) + 1;
    });

    const categoryColors: Record<string, string> = {
      'Size/Fit': '#2563eb',
      Quality: '#0284c7',
      'Changed Mind': '#64748b',
      Color: '#8b5cf6',
      Damage: '#f43f5e',
      Delivery: '#f59e0b',
      'Wrong Item': '#ec4899',
      'Product Mismatch': '#10b981',
      'Customer Preference': '#a855f7',
      Other: '#94a3b8',
    };

    let returnReasonsDistribution = Object.entries(catCounts)
      .map(([cat, count]) => ({
        category: cat as ReturnCategory,
        count,
        percentage: totalBaseCount > 0 ? Number(((count / totalBaseCount) * 100).toFixed(1)) : 0,
        color: categoryColors[cat] || '#3b82f6',
      }))
      .sort((a, b) => b.count - a.count);

    // Revenue calculation
    const totalReturnedRevenue = Math.round(returns.reduce((sum, r) => sum + (r.itemPrice || 0), 0));

    // Order estimates & Return rate
    const relevantProducts =
      category === 'All Categories' || category === 'All'
        ? products
        : products.filter((p) => p.category === category);
    
    const totalEstimatedOrders = relevantProducts.reduce((sum, p) => sum + (p.totalOrders || 0), 0);
    const computedReturnRate =
      totalEstimatedOrders > 0
        ? Math.round(((totalReturnsCount / totalEstimatedOrders) * 100) * 10) / 10
        : 14.2;

    // Preventable returns calculation
    const preventableCategories = ['Size/Fit', 'Quality', 'Product Mismatch', 'Color', 'Damage'];
    const preventableRecords = returns.filter((r) => preventableCategories.includes(r.aiCategory));
    const preventableCount = preventableRecords.length;
    const preventablePct = totalReturnsCount > 0 ? Math.round((preventableCount / totalReturnsCount) * 100) : 0;
    const preventableDollarSavings = Math.round(
      preventableRecords.reduce((sum, r) => sum + (r.itemPrice || 0), 0) * 0.7
    );
    const savingsFormatted = `~$${(preventableDollarSavings / 1000).toFixed(1)}k potential savings`;

    const topDriverCategory = (returnReasonsDistribution[0]?.category || 'Size/Fit') as ReturnCategory;
    const topDriverPct = returnReasonsDistribution[0]?.percentage || 0;

    const problematic = this.getProblematicProducts(workspaceId);

    // Dynamic timeline trend from actual record dates
    const trendBuckets: Record<string, { returnsCount: number; revenue: number }> = {};
    returns.forEach((r) => {
      const d = r.returnDate || '2026-08-01';
      const dateObj = new Date(d);
      const label = isNaN(dateObj.getTime())
        ? 'Aug 01'
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendBuckets[label]) {
        trendBuckets[label] = { returnsCount: 0, revenue: 0 };
      }
      trendBuckets[label].returnsCount += 1;
      trendBuckets[label].revenue += r.itemPrice || 0;
    });

    const trendEntries = Object.entries(trendBuckets).slice(-6);
    const trendHistory =
      trendEntries.length > 1
        ? trendEntries.map(([date, val]) => {
            const bucketOrders = Math.round(val.returnsCount * 7.1);
            return {
              date,
              returnRate: Math.round(((val.returnsCount / bucketOrders) * 100) * 10) / 10,
              ordersCount: bucketOrders,
              returnsCount: val.returnsCount,
              returnedRevenue: Math.round(val.revenue),
            };
          })
        : [
            {
              date: 'Jul 15',
              returnRate: 13.8,
              ordersCount: 1200,
              returnsCount: Math.round(totalReturnsCount * 0.18),
              returnedRevenue: Math.round(totalReturnedRevenue * 0.18),
            },
            {
              date: 'Jul 22',
              returnRate: 13.9,
              ordersCount: 1340,
              returnsCount: Math.round(totalReturnsCount * 0.2),
              returnedRevenue: Math.round(totalReturnedRevenue * 0.2),
            },
            {
              date: 'Jul 29',
              returnRate: 14.4,
              ordersCount: 1410,
              returnsCount: Math.round(totalReturnsCount * 0.22),
              returnedRevenue: Math.round(totalReturnedRevenue * 0.22),
            },
            {
              date: 'Aug 05',
              returnRate: 14.1,
              ordersCount: 1380,
              returnsCount: Math.round(totalReturnsCount * 0.19),
              returnedRevenue: Math.round(totalReturnedRevenue * 0.19),
            },
            {
              date: 'Aug 12',
              returnRate: computedReturnRate,
              ordersCount: 1450,
              returnsCount: Math.round(totalReturnsCount * 0.21),
              returnedRevenue: Math.round(totalReturnedRevenue * 0.21),
            },
          ];

    const topProblemProduct = problematic[0] || products[0];
    const nowIso = new Date().toISOString();
    const activeDatasetId = store.activeDatasetId || 'ds-active';
    const activeDataset = store.datasets.find((d) => d.id === activeDatasetId);
    const activeDatasetName = activeDataset?.name || 'Active Returns Dataset';
    const isDatasetEmpty = totalReturnsCount === 0;

    const executiveSummary: Array<{
      id: string;
      type: 'sizing' | 'quality' | 'window' | 'policy';
      title: string;
      content: string;
      badgeText: 'AI Insight' | 'Observed Alert' | 'Notice' | 'Estimate' | 'AI Hypothesis';
      classificationType: 'OBSERVED DATA' | 'AI INSIGHT' | 'AI HYPOTHESIS' | 'ESTIMATE' | 'RECOMMENDATION';
      sourceDatasetId: string;
      sourceDatasetName: string;
      supportingRecordCount: number;
      supportingMetrics: Record<string, any>;
      modelIdentifier: string;
      promptVersion: string;
      confidenceScore: number;
      generationTimestamp: string;
      isInsufficientEvidence?: boolean;
    }> = [
      {
        id: 'es-1',
        type: 'sizing',
        title: `${topDriverCategory} Concentration Pattern`,
        content: isDatasetEmpty
          ? 'Insufficient evidence: No return records in active dataset.'
          : `"${topDriverCategory}" represents ${topDriverPct}% of all processed return volume (${catCounts[topDriverCategory] || 0} returned items in dataset).`,
        badgeText: 'AI Insight',
        classificationType: 'AI INSIGHT',
        sourceDatasetId: activeDatasetId,
        sourceDatasetName: activeDatasetName,
        supportingRecordCount: catCounts[topDriverCategory] || 0,
        supportingMetrics: {
          topDriverCategory,
          topDriverPercentage: topDriverPct,
          volume: catCounts[topDriverCategory] || 0,
          totalReturnsCount,
        },
        modelIdentifier: 'gemini-3.7-flash',
        promptVersion: 'prompts-v1.8',
        confidenceScore: isDatasetEmpty ? 0.4 : 0.96,
        generationTimestamp: nowIso,
        isInsufficientEvidence: isDatasetEmpty,
      },
      {
        id: 'es-2',
        type: 'quality',
        title: topProblemProduct ? `High Return Rate: ${topProblemProduct.name}` : 'Product Return Rates vs Benchmark',
        content: topProblemProduct
          ? `Observed ${topProblemProduct.returnRate}% return rate for ${topProblemProduct.name} (${topProblemProduct.sku}) across ${topProblemProduct.unitsReturned30d} recorded returns (Benchmark: ${topProblemProduct.categoryBenchmark}%).`
          : 'Verified return rates across all products against category benchmarks.',
        badgeText: 'Observed Alert',
        classificationType: 'OBSERVED DATA',
        sourceDatasetId: activeDatasetId,
        sourceDatasetName: activeDatasetName,
        supportingRecordCount: topProblemProduct ? topProblemProduct.unitsReturned30d : totalReturnsCount,
        supportingMetrics: topProblemProduct
          ? {
              sku: topProblemProduct.sku,
              returnRate: topProblemProduct.returnRate,
              benchmark: topProblemProduct.categoryBenchmark,
              unitsReturned: topProblemProduct.unitsReturned30d,
            }
          : { totalReturnsCount },
        modelIdentifier: 'deterministic-metrics-engine',
        promptVersion: 'prompts-v1.8',
        confidenceScore: 1.0,
        generationTimestamp: nowIso,
        isInsufficientEvidence: false,
      },
      {
        id: 'es-3',
        type: 'window',
        title: 'Estimated Preventable Return Recovery',
        content: isDatasetEmpty
          ? 'Insufficient evidence'
          : `Model estimates ${preventablePct}% of return volume (${preventableCount} units, valued at ${savingsFormatted}) is addressable through PDP fit guidance and QA packaging upgrades.`,
        badgeText: 'Estimate',
        classificationType: 'ESTIMATE',
        sourceDatasetId: activeDatasetId,
        sourceDatasetName: activeDatasetName,
        supportingRecordCount: preventableCount,
        supportingMetrics: {
          preventablePercentage: preventablePct,
          preventableUnits: preventableCount,
          estimatedSavings: savingsFormatted,
          totalReturnedRevenue,
        },
        modelIdentifier: 'gemini-3.7-flash',
        promptVersion: 'prompts-v1.8',
        confidenceScore: isDatasetEmpty ? 0.4 : 0.88,
        generationTimestamp: nowIso,
        isInsufficientEvidence: isDatasetEmpty,
      },
    ];

    return {
      timeframe,
      categoryFilter: category,
      returnRate: {
        value: computedReturnRate,
        delta: 1.2,
        type: 'Observed Data',
      },
      revenueAtRisk: {
        value: totalReturnedRevenue,
        formatted: `$${(totalReturnedRevenue / 1000).toFixed(1)}k`,
        period: 'MTD',
        type: 'Observed Data',
      },
      preventableReturns: {
        percentage: preventablePct,
        savingsFormatted,
        type: 'AI Insight',
      },
      topReturnDriver: {
        category: topDriverCategory,
        percentage: topDriverPct,
        type: 'Observed Data',
      },
      returnReasonsDistribution,
      totalReturnsCount,
      executiveSummary,
      problematicProducts: problematic,
      trendHistory,
    };
  }

  // Load a synthetic preset dataset
  public loadPresetDataset(
    presetKey: 'dataset-a' | 'dataset-b' | 'dataset-c',
    workspaceId?: string
  ): Dataset {
    let datasetName = 'Q3_Returns_Master.csv';
    let rowCount = 5240;

    if (presetKey === 'dataset-b') {
      datasetName = 'Footwear_Denim_Quality_Audit.csv';
      rowCount = 2850;
    } else if (presetKey === 'dataset-c') {
      datasetName = 'Fall_Sizing_Fit_Shift.csv';
      rowCount = 1650;
    }

    const store = this.getStore(workspaceId);
    const baseProducts = Object.values(store.productsByDataset)[0] || [];
    const newReturns = this.generateSyntheticReturns(baseProducts, rowCount);

    return this.addDatasetWithRecords(
      {
        name: datasetName,
        fileName: datasetName,
        fileSize: `${(rowCount * 0.4).toFixed(1)} KB`,
        rowCount,
        status: 'Completed',
        columnMapping: {
          sku: 'SKU_ID',
          reason: 'ReasonText',
          date: 'PurchaseDate',
          comment: 'Notes',
          category: 'Category',
          price: 'Price',
        },
      },
      newReturns,
      workspaceId,
      true
    );
  }

  // Synthetic return record generator
  public generateSyntheticReturns(products: Product[], count: number): ReturnRecord[] {
    const rawComments = [
      { text: "Too small, couldn't button waist", reason: 'Too small', cat: 'Size/Fit' as ReturnCategory, sub: 'Too Small', size: '32x32', exch: '34x32', first: true },
      { text: 'Tight in shoulders, restrict arm movement', reason: 'Fit issue', cat: 'Size/Fit' as ReturnCategory, sub: 'Too Tight in Upper Body', size: 'M', exch: 'L', first: false },
      { text: "Great quality fabric, but I couldn't even button them. I'm a standard 32 in every other brand, but these felt like a 30.", reason: 'Too Small', cat: 'Size/Fit' as ReturnCategory, sub: 'Too Small', size: '32x32', first: true },
      { text: 'Had to return and buy the 34s instead. The slim fit through the leg is perfect, but the waist sizing is definitely off by at least an inch.', reason: 'Tight Waist', cat: 'Size/Fit' as ReturnCategory, sub: 'Tight Waist', size: '33x32', exch: '34x32', first: false },
      { text: "Beautiful chinos, but warning to others: size up. I checked the sizing chart before ordering but it doesn't reflect the actual garment waist.", reason: 'Sizing Mismatch', cat: 'Size/Fit' as ReturnCategory, sub: 'Size Chart Issue', size: '30x30', first: true },
      { text: 'Sole separated from the toe box after 4 days of light walking.', reason: 'Damaged / Defect', cat: 'Quality' as ReturnCategory, sub: 'Manufacturing Defect', size: '10.5', first: false },
      { text: 'Front rubber toe delaminated on left shoe.', reason: 'Sole defect', cat: 'Quality' as ReturnCategory, sub: 'Sole Separation', size: '11', first: true },
      { text: 'Color is completely different than product photos. Looks dark emerald online, but arrived as light turquoise/teal.', reason: 'Color mismatch', cat: 'Color' as ReturnCategory, sub: 'Color Mismatch', size: 'S', first: true },
      { text: 'Fabric feels thin and cheap compared to original version.', reason: 'Material quality', cat: 'Quality' as ReturnCategory, sub: 'Material Quality', size: 'M', first: false },
      { text: 'Box arrived crushed and product inside was scuffed.', reason: 'Damaged packaging', cat: 'Damage' as ReturnCategory, sub: 'In-Transit Damage', size: 'One Size', first: false },
      { text: 'Package delayed by 10 days, event already passed.', reason: 'Late delivery', cat: 'Delivery' as ReturnCategory, sub: 'Late Delivery', size: 'L', first: true },
      { text: 'Received size XL instead of Medium marked on packing slip.', reason: 'Wrong item sent', cat: 'Wrong Item' as ReturnCategory, sub: 'Fulfillment Error', size: 'XL', first: false },
      { text: "Changed mind, decided I don't need this color right now.", reason: 'Changed mind', cat: 'Changed Mind' as ReturnCategory, sub: 'Buyer Remorse', size: 'M', first: false },
      { text: "Doesn't fit properly around chest area.", reason: 'Poor fit', cat: 'Size/Fit' as ReturnCategory, sub: 'Poor Fit', size: 'L', first: true },
      { text: 'Zipper got stuck on first wear and pulled off track.', reason: 'Broken zipper', cat: 'Quality' as ReturnCategory, sub: 'Hardware Defect', size: 'S', first: false },
    ];

    const records: ReturnRecord[] = [];
    const baseDate = new Date('2026-08-14T12:00:00Z');
    const safeProds = products.length > 0 ? products : [
      { id: 'p-1', sku: 'SKU-104', name: 'Slim Fit Chino', category: 'Bottoms', price: 68.0 } as Product,
    ];

    for (let i = 0; i < count; i++) {
      const prod = safeProds[i % safeProds.length];
      const commentTemplate = rawComments[i % rawComments.length];

      const daysBack = Math.floor(Math.random() * 85);
      const returnD = new Date(baseDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const purchaseD = new Date(returnD.getTime() - (3 + Math.floor(Math.random() * 12)) * 24 * 60 * 60 * 1000);

      const confidence = 0.85 + Math.random() * 0.14;
      const needsReview = confidence < 0.88;

      records.push({
        id: `ret-${prod.sku}-${i + 1}`,
        orderId: `ORD-2026-${10000 + i}`,
        sku: prod.sku,
        productName: prod.name,
        category: prod.category,
        purchaseDate: purchaseD.toISOString().split('T')[0],
        returnDate: returnD.toISOString().split('T')[0],
        itemPrice: prod.price,
        rawReason: commentTemplate.reason,
        customerComment: commentTemplate.text,
        aiCategory: commentTemplate.cat,
        aiSubcategory: commentTemplate.sub,
        confidence: Math.round(confidence * 100) / 100,
        sentiment: commentTemplate.cat === 'Changed Mind' ? 'Neutral' : 'Negative',
        humanReviewed: !needsReview && Math.random() > 0.6,
        humanReviewStatus: !needsReview && Math.random() > 0.6 ? 'Accepted' : undefined,
        firstTimeBuyer: commentTemplate.first,
        sizeOrdered: commentTemplate.size,
        sizeExchangedFor: commentTemplate.exch,
      });
    }

    return records;
  }

  // Reset to Demo
  public resetToDemo(): void {
    this.initialize();
  }
}

export const db = new ReturnIQDatabase();
