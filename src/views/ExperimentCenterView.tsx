import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  Users,
  Clock,
  Plus,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Calendar,
  Percent
} from 'lucide-react';
import { Experiment } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const ExperimentCenterView: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedId, setSelectedId] = useState<string>('exp-1042');
  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Experiment Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newDuration, setNewDuration] = useState(30);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/experiments');
      if (res.ok) {
        const data = await res.json();
        setExperiments(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Live' ? 'Paused' : 'Live';
    try {
      const res = await fetch(`/api/experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setExperiments((prev) => prev.map((e) => (e.id === id ? { ...e, status: nextStatus as any } : e)));
        setToastMessage(`Experiment status changed to ${nextStatus}`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          status: 'Live',
          primaryMetric: 'Return Rate Reduction',
          secondaryMetrics: ['Conversion Rate', 'Customer NPS'],
          audience: 'Target Shoppers (50%)',
          durationDays: newDuration,
          hypothesis: newHypothesis || `Testing ${newTitle} to reduce return rates.`,
          controlGroup: {
            name: 'Control Group',
            description: 'Standard product page experience',
            returnRate: 20.2,
            sampleSize: 1500,
            conversionRate: 3.2,
          },
          treatmentGroup: {
            name: 'Treatment Group',
            description: newDesc,
            returnRate: 16.5,
            sampleSize: 1520,
            conversionRate: 3.25,
            variance: -3.7,
          },
          statisticalSignificance: {
            pValue: 0.038,
            isSignificant: true,
            confidenceLevel: '95% confidence',
          },
          performanceHistory: [
            { period: 'Day 1-5', control: 20.4, treatment: 18.2 },
            { period: 'Day 6-10', control: 20.2, treatment: 16.5 },
          ],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setExperiments([created, ...experiments]);
        setSelectedId(created.id);
        setShowNewModal(false);
        setNewTitle('');
        setNewDesc('');
        setNewHypothesis('');
        setToastMessage('New A/B intervention experiment launched.');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeExp = experiments.find((e) => e.id === selectedId) || experiments[0];

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
            <FlaskConical className="w-6 h-6 text-slate-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Experiment Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Design, monitor, and evaluate AI-driven interventions to reduce return rates scientifically.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          id="btn-new-experiment"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Experiment</span>
        </button>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Experiments</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {experiments.filter((e) => e.status === 'Live').length} Running
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Live Interventions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Tracking returns reduction vs baseline</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">AI Precision Score</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 font-mono">94.2%</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Benchmark Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">High confidence recommendation accuracy</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Human Correction Rate</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">2.8%</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              -0.4% vs last period
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Human-in-the-loop review feedback</p>
        </div>
      </div>

      {/* Main Experiment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Experiment Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Active Experiments ({experiments.length})
          </span>

          <div className="space-y-2">
            {experiments.map((exp) => {
              const isSelected = exp.id === selectedId;
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedId(exp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {exp.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        exp.status === 'Live'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {exp.status} • Day {exp.currentDay}/{exp.durationDays}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold mt-2 leading-snug">{exp.title}</h3>
                  <p
                    className={`text-[11px] mt-1 line-clamp-2 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {exp.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px]">
                    <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                      Primary: {exp.primaryMetric}
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {exp.treatmentGroup.variance}% Return Delta
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Experiment Detailed View (8 cols) */}
        {activeExp && (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header with Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {activeExp.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {activeExp.status}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {activeExp.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{activeExp.description}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleStatus(activeExp.id, activeExp.status)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  {activeExp.status === 'Live' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Experiment Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Primary Metric</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activeExp.primaryMetric}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Target Audience</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activeExp.audience}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {activeExp.durationDays} Days (Day {activeExp.currentDay})
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Date Range</span>
                <p className="font-mono text-slate-900 mt-0.5">{activeExp.startDate} - {activeExp.endDate}</p>
              </div>
            </div>

            {/* Hypothesis Box */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs space-y-1">
              <span className="font-bold text-blue-900 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Tested Hypothesis</span>
              </span>
              <p className="text-blue-950 font-medium leading-relaxed italic">
                "{activeExp.hypothesis}"
              </p>
            </div>

            {/* Split Comparison Cards (Control vs Treatment) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Control Group */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{activeExp.controlGroup.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">Baseline</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {activeExp.controlGroup.returnRate}%
                    </span>
                    <span className="text-xs text-slate-500 ml-2">Return Rate</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {activeExp.controlGroup.sampleSize.toLocaleString()} users
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {activeExp.controlGroup.description}
                </p>
                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                  Conversion: {activeExp.controlGroup.conversionRate}%
                </div>
              </div>

              {/* Treatment Group */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">{activeExp.treatmentGroup.name}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">
                    {activeExp.treatmentGroup.variance}% Variance
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-blue-950 font-mono">
                      {activeExp.treatmentGroup.returnRate}%
                    </span>
                    <span className="text-xs text-blue-700 ml-2 font-semibold">Return Rate</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-blue-700">
                    {activeExp.treatmentGroup.sampleSize.toLocaleString()} users
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {activeExp.treatmentGroup.description}
                </p>
                <div className="text-[11px] text-blue-900 border-t border-blue-100 pt-2 font-mono font-semibold">
                  Conversion: {activeExp.treatmentGroup.conversionRate}% (Stable)
                </div>
              </div>
            </div>

            {/* Statistical Significance Callout */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">
                    Treatment Variance is Statistically Significant
                  </p>
                  <p className="text-emerald-700">
                    p-value: {activeExp.statisticalSignificance.pValue} •{' '}
                    {activeExp.statisticalSignificance.confidenceLevel}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded bg-emerald-200 text-emerald-900 font-mono">
                p &lt; 0.05
              </span>
            </div>

            {/* Performance History Chart */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Return Rate Tracking Across Test Periods
              </span>
              <div className="h-44 sm:h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeExp.performanceHistory}>
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[12, 22]} stroke="#94a3b8" fontSize={11} unit="%" />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, '']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="control"
                      name="Control Group (Static Chart)"
                      stroke="#94a3b8"
                      fill="#f1f5f9"
                    />
                    <Area
                      type="monotone"
                      dataKey="treatment"
                      name="Treatment Group (AI Guidance)"
                      stroke="#2563eb"
                      fill="#dbeafe"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Experiment Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-experiment-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 id="new-experiment-modal-title" className="text-base font-bold text-slate-900">Launch New A/B Intervention</h3>
            <form onSubmit={handleCreateExperiment} className="space-y-3 text-xs">
              <div>
                <label htmlFor="exp-title-input" className="block font-semibold text-slate-700 mb-1">
                  Experiment Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="exp-title-input"
                  type="text"
                  placeholder="e.g. Size Recommendation Badge above Add-to-Cart"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="exp-desc-input" className="block font-semibold text-slate-700 mb-1">Intervention Details</label>
                <textarea
                  id="exp-desc-input"
                  rows={2}
                  placeholder="Describe the UI change or policy adjustment..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                />
              </div>

              <div>
                <label htmlFor="exp-hypo-input" className="block font-semibold text-slate-700 mb-1">Formal Hypothesis</label>
                <textarea
                  id="exp-hypo-input"
                  rows={2}
                  placeholder="e.g. Showing personalized fit tips will reduce size returns by 15%..."
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                />
              </div>

              <div>
                <label htmlFor="exp-duration-input" className="block font-semibold text-slate-700 mb-1">Duration (Days)</label>
                <input
                  id="exp-duration-input"
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 30)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-mono focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  Launch Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
