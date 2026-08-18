import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ReturnRecord, ReturnCategory } from '../types';

interface ReturnsAnalysisViewProps {
  initialCategoryFilter?: string;
  onOpenExportModal: () => void;
}

export const ReturnsAnalysisView: React.FC<ReturnsAnalysisViewProps> = ({
  initialCategoryFilter,
  onOpenExportModal,
}) => {
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter || 'All');
  const [search, setSearch] = useState('');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<ReturnCategory>('Size/Fit');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Gemini Sandbox
  const [sandboxReason, setSandboxReason] = useState('Too small around waist');
  const [sandboxComment, setSandboxComment] = useState("I couldn't button them, felt like a 30 rather than 32");
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (categoryFilter && categoryFilter !== 'All') params.append('category', categoryFilter);
      if (search) params.append('search', search);
      if (needsReviewOnly) params.append('needsReviewOnly', 'true');

      const res = await fetch(`/api/returns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.items);
        setTotalRecords(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, categoryFilter, needsReviewOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReturns();
  };

  const handleReviewAction = async (
    id: string,
    action: 'Accept' | 'Edit' | 'Reject',
    correctedCategory?: ReturnCategory
  ) => {
    try {
      const res = await fetch(`/api/returns/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          correctedCategory: correctedCategory || editCategory,
          reviewerEmail: 'dishantgangwar778@gmail.com',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
        setEditingRecordId(null);
        setToastMessage(`Record ${action === 'Edit' ? 're-classified' : action.toLowerCase() + 'ed'} successfully.`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestGeminiSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setSandboxLoading(true);
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: sandboxReason,
          comment: sandboxComment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxLoading(false);
    }
  };

  const categoriesList: ReturnCategory[] = [
    'Size/Fit',
    'Quality',
    'Color',
    'Product Mismatch',
    'Damage',
    'Changed Mind',
    'Delivery',
    'Wrong Item',
    'Customer Preference',
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-slate-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Returns Analysis & Review
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Explore {totalRecords ? totalRecords.toLocaleString() : 'all'} classified records, verify AI predictions, and perform human-in-the-loop audits.
          </p>
        </div>

        <button
          onClick={onOpenExportModal}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Records (CSV)</span>
        </button>
      </div>

      {/* Live Gemini Classifier Sandbox Component */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Live Gemini 3.7 Classification Sandbox</h3>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Real-Time Prompt Test
          </span>
        </div>

        <form onSubmit={handleTestGeminiSandbox} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-4">
            <label className="block text-slate-400 mb-1 font-semibold">Raw Return Reason</label>
            <input
              type="text"
              value={sandboxReason}
              onChange={(e) => setSandboxReason(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-slate-400 mb-1 font-semibold">Customer Comment / Verbatim</label>
            <input
              type="text"
              value={sandboxComment}
              onChange={(e) => setSandboxComment(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={sandboxLoading}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center space-x-1.5 shadow transition-colors"
            >
              {sandboxLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Classify</span>
                </>
              )}
            </button>
          </div>
        </form>

        {sandboxResult && (
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-white">Classified Category:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-bold border border-blue-400/40">
                {sandboxResult.category}
              </span>
              <span className="text-slate-400">Subcategory: {sandboxResult.subcategory}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300">
              <span>Confidence: {(sandboxResult.confidence * 100).toFixed(0)}%</span>
              <span className="text-[11px] text-slate-400 italic truncate max-w-xs">{sandboxResult.explanation}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, SKU, Reason, or Comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </form>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Needs Review Filter Toggle */}
          <button
            onClick={() => {
              setNeedsReviewOnly(!needsReviewOnly);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors ${
              needsReviewOnly
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Needs Review (&lt;88% Conf)</span>
          </button>
        </div>
      </div>

      {/* Main Returns Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <caption className="sr-only">Customer Returns Records with AI Classification and Human Review</caption>
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="p-3">Order / SKU</th>
                <th scope="col" className="p-3">Raw Reason & Comment</th>
                <th scope="col" className="p-3">AI Taxonomy Classification</th>
                <th scope="col" className="p-3 text-center">Confidence</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3 text-center">Human-in-the-Loop Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map((r) => {
                const isEditing = editingRecordId === r.id;
                const isLowConf = r.confidence < 0.88;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order & SKU */}
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{r.orderId}</p>
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                        {r.sku}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.returnDate}</p>
                    </td>

                    {/* Customer Verbatim */}
                    <td className="p-3 max-w-sm">
                      <div className="font-semibold text-slate-900">{r.rawReason}</div>
                      {r.customerComment && (
                        <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-2">
                          "{r.customerComment}"
                        </p>
                      )}
                      {r.sizeOrdered && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Ordered: Size {r.sizeOrdered}
                        </span>
                      )}
                    </td>

                    {/* AI Taxonomy Classification */}
                    <td className="p-3">
                      {isEditing ? (
                        <div className="flex items-center space-x-1.5">
                          <label htmlFor={`edit-cat-${r.id}`} className="sr-only">Edit Category</label>
                          <select
                            id={`edit-cat-${r.id}`}
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as ReturnCategory)}
                            className="p-1 rounded border border-slate-300 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            {categoriesList.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleReviewAction(r.id, 'Edit')}
                            aria-label={`Save correction for order ${r.orderId}`}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                          >
                            <Check aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRecordId(null)}
                            aria-label={`Cancel editing order ${r.orderId}`}
                            className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                          >
                            <X aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900">{r.aiCategory}</span>
                            {r.humanReviewStatus === 'Corrected' && (
                              <span className="text-[9px] font-mono uppercase bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                                User Edited
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">{r.aiSubcategory}</span>
                        </div>
                      )}
                    </td>

                    {/* Confidence Score */}
                    <td className="p-3 text-center font-mono">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          isLowConf
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        {(r.confidence * 100).toFixed(0)}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      {r.humanReviewStatus ? (
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            r.humanReviewStatus === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : r.humanReviewStatus === 'Corrected'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {r.humanReviewStatus}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500">Auto Classified</span>
                      )}
                    </td>

                    {/* Review Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleReviewAction(r.id, 'Accept')}
                          aria-label={`Accept AI classification for order ${r.orderId}`}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecordId(r.id);
                            setEditCategory(r.aiCategory);
                          }}
                          aria-label={`Edit taxonomy for order ${r.orderId}`}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, totalRecords)} of {totalRecords} total records
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold text-slate-800">
              Page {page} of {totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              aria-label="Next page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            >
              <ChevronRight aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
