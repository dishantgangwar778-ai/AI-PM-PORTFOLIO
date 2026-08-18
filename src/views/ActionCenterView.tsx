import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  Filter,
  Plus,
  Clock,
  User,
  DollarSign,
  TrendingDown,
  ChevronDown,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { ActionPlanItem, PriorityLevel, ActionStatus } from '../types';

interface ActionCenterViewProps {
  onConvertToExperiment: (actionId: string) => void;
  onNavigateToExperiments: () => void;
}

export const ActionCenterView: React.FC<ActionCenterViewProps> = ({
  onConvertToExperiment,
  onNavigateToExperiments,
}) => {
  const [actions, setActions] = useState<ActionPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [showNewModal, setShowNewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form for custom action
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('P1 - HIGH');
  const [newSavings, setNewSavings] = useState(10000);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/actions');
      if (res.ok) {
        const data = await res.json();
        setActions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ActionStatus) => {
    try {
      const res = await fetch(`/api/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
        setToastMessage(`Action status updated to "${newStatus}"`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvert = async (actionId: string) => {
    try {
      const res = await fetch(`/api/actions/${actionId}/convert-experiment`, {
        method: 'POST',
      });
      if (res.ok) {
        setToastMessage('Converted action to live A/B experiment! Redirecting...');
        setTimeout(() => {
          setToastMessage(null);
          onNavigateToExperiments();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          problem: newDesc.trim(),
          evidence: 'Manually logged by CX Team',
          recommendation: newDesc.trim(),
          expectedImpact: 'High',
          estimatedSavingsPerWeek: newSavings,
          effort: 'Low',
          priority: newPriority,
          actionType: 'Create Jira Ticket',
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setActions([created, ...actions]);
        setShowNewModal(false);
        setNewTitle('');
        setNewDesc('');
        setToastMessage('New mitigation action created.');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredActions = actions.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && !a.priority.includes(priorityFilter)) return false;
    return true;
  });

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
            <CheckSquare className="w-6 h-6 text-slate-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Action Center</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            What should we fix first? Prioritize and track active return mitigation interventions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            id="btn-create-action"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Action</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Status:</span>
          {['All', 'Not Started', 'In Progress', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="P0">P0 - Critical</option>
            <option value="P1">P1 - High</option>
            <option value="P2">P2 - Medium</option>
          </select>
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-4">
        {filteredActions.map((action) => {
          const isP0 = action.priority.startsWith('P0');
          const isP1 = action.priority.startsWith('P1');

          return (
            <div
              key={action.id}
              className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4 ${
                isP0 ? 'border-red-200' : isP1 ? 'border-amber-200' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full font-mono ${
                      isP0
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : isP1
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {action.priority}
                  </span>
                  {action.productSku && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {action.productSku}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Created 2h ago</span>
                  </span>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">Status:</span>
                  <select
                    value={action.status}
                    onChange={(e) => handleStatusChange(action.id, e.target.value as ActionStatus)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{action.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{action.description}</p>
              </div>

              {/* Evidence & Expected Impact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evidence</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{action.evidence}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Impact</span>
                  <p className="font-bold text-emerald-600 mt-0.5">
                    ${action.estimatedSavingsPerWeek.toLocaleString()}/wk estimated savings
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owner</span>
                  <p className="font-medium text-slate-700 mt-0.5 truncate">{action.owner}</p>
                </div>
              </div>

              {/* Recommendation Callout */}
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-900">AI Recommendation:</span>
                  <span className="text-blue-800 ml-1.5">{action.recommendation}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Effort: {action.effort} • Confidence: {(action.confidenceScore * 100).toFixed(0)}%
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleConvert(action.id)}
                    className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Convert to Experiment</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Action Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-action-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 id="new-action-modal-title" className="text-base font-bold text-slate-900">Create New Action Item</h3>
            <form onSubmit={handleCreateAction} className="space-y-3 text-xs">
              <div>
                <label htmlFor="action-title-input" className="block font-semibold text-slate-700 mb-1">
                  Action Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="action-title-input"
                  type="text"
                  placeholder="e.g. Update PDP size chart for Slim Fit Chinos"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="action-desc-input" className="block font-semibold text-slate-700 mb-1">Problem & Evidence Description</label>
                <textarea
                  id="action-desc-input"
                  rows={3}
                  placeholder="Describe the returns driver or customer comments..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="action-priority-select" className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    id="action-priority-select"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                  >
                    <option value="P0 - CRITICAL">P0 - CRITICAL</option>
                    <option value="P1 - HIGH">P1 - HIGH</option>
                    <option value="P2 - MEDIUM">P2 - MEDIUM</option>
                    <option value="P3 - LOW">P3 - LOW</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="action-savings-input" className="block font-semibold text-slate-700 mb-1">Est. Savings ($/wk)</label>
                  <input
                    id="action-savings-input"
                    type="number"
                    value={newSavings}
                    onChange={(e) => setNewSavings(parseInt(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                  />
                </div>
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
                  Create Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
