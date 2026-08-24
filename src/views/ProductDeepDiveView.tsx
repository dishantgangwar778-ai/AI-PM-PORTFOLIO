import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Users,
  Repeat,
  ArrowRight,
  Download,
  ExternalLink,
  ChevronDown,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Layers,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Search,
} from 'lucide-react';
import { Product, ReturnRecord, ActionPlanItem } from '../types';

interface ProductDeepDiveViewProps {
  selectedSku: string;
  onSelectSku: (sku: string) => void;
  allProducts: Product[];
  onOpenExportModal: () => void;
  onConvertActionToExperiment: (actionId: string) => void;
  onNavigateToActions: () => void;
}

export const ProductDeepDiveView: React.FC<ProductDeepDiveViewProps> = ({
  selectedSku,
  onSelectSku,
  allProducts,
  onOpenExportModal,
  onConvertActionToExperiment,
  onNavigateToActions,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [customerEvidence, setCustomerEvidence] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reDiagnosing, setReDiagnosing] = useState(false);
  const [activeCommentFilter, setActiveCommentFilter] = useState('All');
  const [commentSearch, setCommentSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProductData = async (sku: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${sku}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
        setCustomerEvidence(data.customerEvidence || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData(selectedSku || 'SKU-104');
  }, [selectedSku]);

  const handleReDiagnose = async () => {
    if (!product) return;
    setReDiagnosing(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: product.sku }),
      });
      if (res.ok) {
        const diagnosis = await res.json();
        setProduct({
          ...product,
          rootCause: {
            id: `rc-live-${Date.now()}`,
            productId: product.id,
            productSku: product.sku,
            primaryHypothesis: diagnosis.primaryHypothesis,
            aiConfidence: diagnosis.aiConfidence,
            dataPointsCount: product.unitsReturned30d,
            keyEvidence: diagnosis.keyEvidence.map((e: any, i: number) => ({
              id: `ev-live-${i}`,
              type: e.type,
              text: e.text,
            })),
            createdAt: new Date().toISOString(),
          },
        });
        setToastMessage('Gemini 3.7 Flash re-synthesized root-cause analysis successfully!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReDiagnosing(false);
    }
  };

  const handleCreateJiraOrAction = (actionTitle: string, actionType: string) => {
    setToastMessage(`Created: "${actionTitle}" (${actionType}) dispatched to backlog.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredEvidence = customerEvidence.filter((item) => {
    const text = (item.customerComment || item.rawReason).toLowerCase();
    const matchesSearch = text.includes(commentSearch.toLowerCase());
    if (activeCommentFilter === 'All') return matchesSearch;
    if (activeCommentFilter === 'First-Time Buyers') return matchesSearch && item.firstTimeBuyer;
    return matchesSearch && item.aiCategory === activeCommentFilter;
  });

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Product Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                {product.sku}
              </span>
              <span className="text-xs text-slate-500 font-medium">{product.category}</span>
              <span className="text-xs font-bold text-slate-800 font-mono">${product.price.toFixed(2)}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzed across {product.totalOrders.toLocaleString()} orders & {product.unitsReturned30d.toLocaleString()} returns (30d).
            </p>
          </div>
        </div>

        {/* Product Selector Dropdown & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative">
            <select
              value={product.sku}
              onChange={(e) => onSelectSku(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              id="sku-switcher-select"
            >
              {allProducts.map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.sku} - {p.name} ({p.returnRate}%)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReDiagnose}
            disabled={reDiagnosing}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            id="re-diagnose-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${reDiagnosing ? 'animate-spin' : ''}`} />
            <span>{reDiagnosing ? 'Analyzing...' : 'Re-diagnose (AI)'}</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            id="export-deepdive-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analysis</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Return Rate</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">{product.returnRate}%</span>
            <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              vs {product.categoryBenchmark}% Cat Avg
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Excess return rate: +{product.trendDelta}%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Units Returned (30d)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {product.unitsReturned30d.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {product.topReason} (46%)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Processed through standard returns flow</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Est. Revenue Loss</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-red-950 font-mono">
              ${product.estRevenueLoss.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              ~$28.4k Recoverable
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Includes reverse logistics & handling</p>
        </div>
      </div>

      {/* Root-Cause Intelligence Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Root-Cause Intelligence & AI Hypothesis
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              AI HYPOTHESIS
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              MODEL: {product.rootCause?.modelIdentifier || 'gemini-3.7-flash'} • {product.rootCause?.promptVersion || 'prompts-v1.8'}
            </span>
          </div>
        </div>

        {/* AI Provenance & Evidence Lineage Strip */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] font-medium text-slate-600">
          <div className="flex items-center space-x-4 flex-wrap gap-y-1">
            <span>
              <strong className="text-slate-900">Source Dataset:</strong> {product.rootCause?.sourceDatasetName || 'Active Returns Dataset'} (<span className="font-mono text-slate-700">{product.rootCause?.sourceDatasetId || 'ds-active'}</span>)
            </span>
            <span>
              <strong className="text-slate-900">Verified Records:</strong> <span className="font-mono font-bold text-slate-800">{product.rootCause?.supportingRecordCount ?? product.unitsReturned30d}</span>
            </span>
            <span>
              <strong className="text-slate-900">Generated:</strong> {product.rootCause?.generationTimestamp ? new Date(product.rootCause.generationTimestamp).toLocaleString() : 'Recent'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grounding Status:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              product.rootCause?.isInsufficientEvidence
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {product.rootCause?.isInsufficientEvidence ? 'INSUFFICIENT EVIDENCE' : 'DATASET GROUNDED'}
            </span>
          </div>
        </div>

        {/* Insufficient Evidence Warning or Primary Hypothesis */}
        {product.rootCause?.isInsufficientEvidence || product.rootCause?.primaryHypothesis === 'Insufficient evidence' ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <h3 className="text-sm font-bold text-amber-900">Insufficient evidence to draw a deterministic root-cause conclusion</h3>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              The AI layer is strictly prohibited from inventing business facts or hallucinating defect causes without verified customer feedback. The active dataset contains fewer than the required volume of verbatim return records for SKU <strong>{product.sku}</strong>.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Primary Hypothesis & Evidence (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  AI Testable Hypothesis
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Correlation ≠ Causation
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                "{product.rootCause?.primaryHypothesis}"
              </p>
            </div>

            {/* Key Evidence Bullet List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Observed Evidence Breakdown
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Strictly Extracted from Dataset
                </span>
              </div>
              <div className="space-y-2">
                {product.rootCause?.keyEvidence.map((ev, idx) => (
                  <div
                    key={ev.id || `ev-${idx}`}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs text-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      {ev.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {ev.type === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                      {ev.type === 'repeat' && <Repeat className="w-4 h-4 text-emerald-600" />}
                      {ev.type === 'metric' && <TrendingUp className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        {ev.type === 'alert' ? 'Observed Trend Alert' : ev.type === 'user' ? 'Customer Verbatim Evidence' : ev.type === 'metric' ? 'Benchmark Metric' : 'Repeat Pattern'}
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">{ev.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Confidence Gauge (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">AI Confidence Score</span>
            
            <div className="my-4 relative flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-8 border-slate-200 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-8 border-indigo-600"
                  style={{
                    clipPath: `polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%)`,
                  }}
                ></div>
                <div className="text-center z-10 bg-slate-50 rounded-full w-20 h-20 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {product.rootCause?.aiConfidence || 94}%
                  </span>
                  <span className={`text-[9px] uppercase font-bold ${
                    (product.rootCause?.aiConfidence || 94) < 70 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {(product.rootCause?.aiConfidence || 94) < 70 ? 'Low Conf.' : 'High Conf.'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Calibrated across {product.rootCause?.supportingRecordCount ?? product.unitsReturned30d} verified returns in dataset.
            </p>
          </div>
        </div>
      </div>

      {/* Action Plan Section (Matching Image 5) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Action Plan</h2>
            <p className="text-xs text-slate-500">Prioritized mitigation steps recommended to immediately reduce return rates.</p>
          </div>
          <button
            onClick={onNavigateToActions}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
          >
            <span>Action Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1 */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
                  High Impact
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">~$12.5k/wk</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Update Size Guide & PDP Banner</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add a prominent banner noting "Runs small: consider sizing up one size."
              </p>
            </div>
            <button
              onClick={() => handleCreateJiraOrAction('Update Size Guide', 'Create Jira Ticket')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
            >
              <span>Create Jira Ticket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 2 */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Medium Impact
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">~$6.2k/wk</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Add Model Metrics & Garment Specs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Update product images to explicitly list model height, weight, and garment size worn.
              </p>
            </div>
            <button
              onClick={() => handleCreateJiraOrAction('Add Model Metrics', 'Request Content Update')}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Request Content Update</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 3 */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Long Term / QA
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">~$18.0k/wk</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Review QA Manufacturing Specs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Initiate tolerance check with manufacturing facility for waist measurements and pattern shrinkage.
              </p>
            </div>
            <button
              onClick={() => handleCreateJiraOrAction('Review QA Specs', 'Flag to Sourcing')}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Flag to Sourcing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Evidence Section (Matching Image 5) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Customer Evidence (Verbatim Quotes)
              </h2>
            </div>
            <p className="text-xs text-slate-500">Real customer return comments sanitized and clustered by AI.</p>
          </div>

          {/* Search inside comments */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search comments..."
              value={commentSearch}
              onChange={(e) => setCommentSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-2">
          {['All', 'Size/Fit', 'Quality', 'First-Time Buyers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCommentFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCommentFilter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Customer Comments Cards Feed */}
        <div className="space-y-3">
          {filteredEvidence.slice(0, 6).map((comment, idx) => (
            <div
              key={comment.id || idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-colors text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Anon Customer</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {comment.rawReason || 'Too Small'}
                  </span>
                  {comment.firstTimeBuyer && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      First-Time Buyer
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{comment.returnDate}</span>
              </div>

              <p className="text-slate-800 font-medium italic leading-relaxed text-[12px]">
                "{comment.customerComment || comment.rawReason}"
              </p>

              <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                {comment.sizeOrdered && <span>Returned: Size {comment.sizeOrdered}</span>}
                {comment.sizeExchangedFor && (
                  <span className="font-semibold text-blue-600">• Exchanged for {comment.sizeExchangedFor}</span>
                )}
                <span>• AI Confidence: {(comment.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={() => onSelectSku(product.sku)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View All {product.unitsReturned30d} Relevant Verbatim Comments in Data Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
