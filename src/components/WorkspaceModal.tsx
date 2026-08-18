import React, { useState } from 'react';
import {
  TrendingDown,
  Building2,
  Compass,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  Layers,
  Plus,
} from 'lucide-react';
import { Workspace } from '../types';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces?: Workspace[];
  activeWorkspace?: Workspace | null;
  onSelectWorkspace?: (ws: Workspace) => void;
  onCreatedWorkspace?: (ws: Workspace) => void;
  onCreateWorkspace?: (name: string, industry: string) => void;
  onLoadDemo?: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreatedWorkspace,
  onCreateWorkspace,
  onLoadDemo,
}) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [industry, setIndustry] = useState('Apparel & Fashion');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setLoading(true);
    try {
      if (onCreateWorkspace) {
        onCreateWorkspace(workspaceName.trim(), industry);
      } else {
        const res = await fetch('/api/workspaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: workspaceName.trim(), industry }),
        });
        if (res.ok) {
          const newWs = await res.json();
          if (onCreatedWorkspace) onCreatedWorkspace(newWs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setWorkspaceName('');
      onClose();
    }
  };

  const industries = [
    'Apparel & Fashion',
    'Footwear & Shoes',
    'Electronics & Gadgets',
    'Home, Furniture & Living',
    'Beauty, Skincare & Cosmetics',
    'Sports, Outdoor & Fitness',
    'Luxury Goods & Jewelry',
    'General D2C / E-Commerce',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none transition-colors"
          id="close-workspace-modal"
          aria-label="Close workspace modal"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-100 overflow-y-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-md mb-4">
            <TrendingDown aria-hidden="true" className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">ReturnIQ</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              Workspace Setup
            </span>
          </div>
          <h2 id="workspace-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            Transform messy return data into evidence-backed product decisions.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
            Connect your CRM, analyze return reasons with AI, and uncover actionable insights to improve product quality and reduce return rates.
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Active Workspaces List if available */}
          {workspaces.length > 0 && (
            <div className="space-y-2 mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Switch Workspace
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      if (onSelectWorkspace) onSelectWorkspace(ws);
                      onClose();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
                      ws.id === activeWorkspace?.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-semibold">{ws.name}</p>
                      <p className="text-[10px] text-slate-500">{ws.industry || 'E-Commerce'}</p>
                    </div>
                    {ws.id === activeWorkspace?.id && (
                      <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ws-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Workspace Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="ws-name"
                  type="text"
                  placeholder="e.g. Acme Corp Analytics"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">This is usually your company or team name.</p>
            </div>

            <div>
              <label htmlFor="ws-industry" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Industry & Category
              </label>
              <div className="relative">
                <Layers aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="ws-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!workspaceName.trim() || loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none transition-all"
              id="get-started-btn"
            >
              <span>{loading ? 'Creating Workspace...' : 'Create Workspace'}</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center" aria-hidden="true">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              OR
            </span>
          </div>

          {/* Demo Button */}
          <button
            type="button"
            onClick={() => {
              if (onLoadDemo) onLoadDemo();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none transition-colors group"
            id="try-demo-dataset-modal-btn"
          >
            <Compass aria-hidden="true" className="w-4 h-4 text-blue-600 group-hover:rotate-45 transition-transform" />
            <span>Explore with 5,240-Record Demo Dataset</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            By creating a workspace, you agree to our Terms of Service and Privacy Policy. All customer comments are sanitized for PII prior to AI processing.
          </p>
        </div>
      </div>
    </div>
  );
};
