import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  Filter,
  Download,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  CheckCircle,
  Table as TableIcon,
  PieChart as PieChartIcon
} from 'lucide-react';
import { DashboardData, Product, ReturnCategory } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface DashboardViewProps {
  data: DashboardData | null;
  onSelectProduct: (sku: string) => void;
  onNavigateToReturns: (category?: string) => void;
  onNavigateToActions: () => void;
  onOpenExportModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data: initialData,
  onSelectProduct,
  onNavigateToReturns,
  onNavigateToActions,
  onOpenExportModal,
}) => {
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [timeframe, setTimeframe] = useState('Last 30 Days');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    // If filters are changed from defaults, query the backend dynamically
    const fetchFilteredData = async () => {
      setFilterLoading(true);
      try {
        const params = new URLSearchParams();
        if (timeframe) params.append('timeframe', timeframe);
        if (categoryFilter && categoryFilter !== 'All Categories') params.append('category', categoryFilter);
        const res = await fetch(`/api/dashboard?${params.toString()}`);
        if (res.ok) {
          const freshData = await res.json();
          setData(freshData);
        }
      } catch (err) {
        console.error('Error fetching filtered dashboard data:', err);
      } finally {
        setFilterLoading(false);
      }
    };

    fetchFilteredData();
  }, [timeframe, categoryFilter]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    'Size/Fit': '#2563eb', // Blue
    'Quality': '#0284c7', // Sky
    'Changed Mind': '#64748b', // Slate
    'Color': '#8b5cf6', // Purple
    'Damage': '#f43f5e', // Rose
    'Delivery': '#f59e0b', // Amber
    'Wrong Item': '#ec4899', // Pink
    'Product Mismatch': '#10b981', // Emerald
    'Customer Preference': '#a855f7',
    'Other': '#94a3b8',
  };

  const chartData = data.returnReasonsDistribution.map((item) => ({
    name: item.category,
    value: item.count,
    percentage: item.percentage,
    color: categoryColors[item.category] || '#3b82f6',
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time analysis of return trends, AI root causes, and revenue recovery opportunities.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm cursor-pointer"
            id="timeframe-select"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 60 Days">Last 60 Days</option>
            <option value="Quarter to Date (Q3)">Quarter to Date (Q3)</option>
            <option value="Year to Date (2026)">Year to Date (2026)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm cursor-pointer"
            id="category-filter-select"
          >
            <option value="All Categories">All Categories</option>
            <option value="Bottoms">Bottoms</option>
            <option value="Outerwear">Outerwear</option>
            <option value="Footwear">Footwear</option>
            <option value="Tops & Blouses">Tops & Blouses</option>
            <option value="Accessories">Accessories</option>
          </select>

          {/* Export Button */}
          <button
            onClick={onOpenExportModal}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm transition-colors"
            id="dashboard-export-btn"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Return Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Return Rate</span>
            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {data.returnRate.type}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.returnRate.value}%</span>
            <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +{data.returnRate.delta}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">vs. prev 30 days period</p>
        </div>

        {/* KPI 2: Revenue at Risk */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Revenue at Risk</span>
            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {data.revenueAtRisk.type}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.revenueAtRisk.formatted}</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              30d Period
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Pending processing / MTD impact</p>
        </div>

        {/* KPI 3: Preventable Returns (AI Insight) */}
        <div className="bg-gradient-to-br from-blue-50/50 via-white to-white border border-blue-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Preventable Return Est.</span>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
              {data.preventableReturns.type}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-950 tracking-tight">{data.preventableReturns.percentage}%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              High Opportunity
            </span>
          </div>
          <p className="text-xs text-blue-700/80 mt-2 font-semibold">{data.preventableReturns.savingsFormatted}</p>
        </div>

        {/* KPI 4: Top Return Driver */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Top Return Driver</span>
            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {data.topReturnDriver.type}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
              {data.topReturnDriver.category}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {data.topReturnDriver.percentage}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">{data.topReturnDriver.percentage}% of total volume ({data.topReturnDriver.category.toLowerCase()})</p>
        </div>
      </div>

      {/* Middle Grid: Returns Distribution + AI Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Return Reasons Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Return Reasons Distribution</h3>
                <p className="text-xs text-slate-500">Based on {data.totalReturnsCount.toLocaleString()} classified return records in current dataset.</p>
              </div>

              {/* Accessible Table Toggle */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'chart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  aria-label="Donut Chart View"
                  id="view-donut-btn"
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  aria-label="Accessible Table View"
                  id="view-table-btn"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {viewMode === 'chart' ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
                {/* Donut Chart with Center Total */}
                <div className="sm:col-span-5 h-48 sm:h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} returns`, name]}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
                    <span className="text-lg font-black text-slate-900 font-mono" id="donut-center-total-count">
                      {data.totalReturnsCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress Breakdown list */}
                <div className="sm:col-span-7 space-y-2.5">
                  {data.returnReasonsDistribution.slice(0, 5).map((item) => (
                    <div
                      key={item.category}
                      onClick={() => onNavigateToReturns(item.category)}
                      className="group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: categoryColors[item.category] || '#3b82f6' }}
                          ></span>
                          <span className="text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500 font-mono">{item.count}</span>
                          <span className="text-slate-900 font-bold w-10 text-right">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: categoryColors[item.category] || '#3b82f6',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Accessible Table View (WCAG 2.2 AA) */
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <caption className="sr-only">Returns Category Breakdown and Statistics</caption>
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th scope="col" className="p-2.5">Category</th>
                      <th scope="col" className="p-2.5 text-right">Units Returned</th>
                      <th scope="col" className="p-2.5 text-right">Share of Total</th>
                      <th scope="col" className="p-2.5 text-center">Explore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data.returnReasonsDistribution.map((item) => (
                      <tr key={item.category} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium flex items-center space-x-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: categoryColors[item.category] || '#3b82f6' }}
                          ></span>
                          <span>{item.category}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono">{item.count}</td>
                        <td className="p-2.5 text-right font-bold">{item.percentage}%</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => onNavigateToReturns(item.category)}
                            className="text-blue-600 hover:underline font-semibold text-[11px]"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Classified via Gemini 3.7 Flash Model</span>
            <button
              onClick={() => onNavigateToReturns()}
              className="text-blue-600 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Explore All {data.totalReturnsCount.toLocaleString()} Returns</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Executive Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Executive Intelligence Summary</h3>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                DATASET GROUNDED
              </span>
            </div>

            <div className="space-y-3">
              {data.executiveSummary.map((item) => {
                const badgeStyle =
                  item.classificationType === 'OBSERVED DATA'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : item.classificationType === 'AI INSIGHT'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : item.classificationType === 'AI HYPOTHESIS'
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : item.classificationType === 'ESTIMATE'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${badgeStyle} shrink-0`}
                      >
                        {item.classificationType || item.badgeText}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px] font-medium">{item.content}</p>
                    
                    {/* Provenance Footer */}
                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>
                        Dataset: <strong className="text-slate-700">{item.sourceDatasetName || 'Active Dataset'}</strong> ({item.supportingRecordCount ?? '—'} recs)
                      </span>
                      <span>
                        Conf: <strong className="text-slate-800">{Math.round((item.confidenceScore ?? 0.95) * 100)}%</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onNavigateToActions}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
              id="view-full-analysis-btn"
            >
              <span>View Action Center Priorities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Problematic Products Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Top Problematic Products</h3>
            <p className="text-xs text-slate-500">
              SKUs with the highest deviation from category benchmark return rates requiring product or sizing interventions.
            </p>
          </div>

          <button
            onClick={() => onSelectProduct('SKU-104')}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
          >
            <span>View All Inventory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
          <table className="w-full text-left">
            <caption className="sr-only">Top Problematic Products and Deviation from Benchmark</caption>
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="p-3">Product / SKU</th>
                <th scope="col" className="p-3">Category</th>
                <th scope="col" className="p-3 text-right">Return Rate</th>
                <th scope="col" className="p-3 text-right">vs. Benchmark</th>
                <th scope="col" className="p-3">Top Return Reason</th>
                <th scope="col" className="p-3 text-right">Revenue Impact</th>
                <th scope="col" className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.problematicProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Product Details */}
                  <td className="p-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={prod.imageUrl}
                        alt={`Photo of ${prod.name}`}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{prod.name}</p>
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                          {prod.sku}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="p-3 text-slate-700 font-medium">{prod.category}</td>

                  {/* Return Rate */}
                  <td className="p-3 text-right font-black text-slate-900 text-sm font-mono">
                    {prod.returnRate}%
                  </td>

                  {/* Delta vs Benchmark */}
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      <TrendingUp aria-hidden="true" className="w-3 h-3 mr-0.5" />
                      +{prod.trendDelta}%
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                      (avg {prod.categoryBenchmark}%)
                    </span>
                  </td>

                  {/* Top Reason */}
                  <td className="p-3">
                    <div className="flex items-center space-x-1.5">
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: categoryColors[prod.topReason] || '#3b82f6' }}
                      ></span>
                      <span className="font-semibold text-slate-800">{prod.topReason}</span>
                      <span className="text-[11px] text-slate-500">({prod.topReasonPercentage}%)</span>
                    </div>
                  </td>

                  {/* Revenue Impact */}
                  <td className="p-3 text-right font-mono font-semibold text-slate-900">
                    ${prod.estRevenueLoss.toLocaleString()}
                  </td>

                  {/* Deep Dive Action */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onSelectProduct(prod.sku)}
                      aria-label={`Deep dive analysis for ${prod.name} SKU ${prod.sku}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                      id={`deep-dive-btn-${prod.sku}`}
                    >
                      Deep Dive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
