import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  SearchCode,
  CheckSquare,
  FlaskConical,
  Sparkles,
  Settings,
  HelpCircle,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { Experiment, getLiveExperimentsCount } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView?: (view: string) => void;
  onViewChange?: (view: string) => void;
  onOpenUploadWizard?: () => void;
  onOpenHelpModal?: () => void;
  totalReturnsCount?: number;
  experiments?: Experiment[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onViewChange,
  onOpenUploadWizard,
  totalReturnsCount,
  experiments,
}) => {
  const handleViewChange = (viewId: string) => {
    if (setCurrentView) setCurrentView(viewId);
    if (onViewChange) onViewChange(viewId);
  };

  const isViewActive = (id: string) => {
    if (currentView === id) return true;
    if ((id === 'product-detail' || id === 'deepdive') && (currentView === 'product-detail' || currentView === 'deepdive')) return true;
    return false;
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'KPIs & Overview',
    },
    {
      id: 'returns',
      label: 'Returns Analysis',
      icon: FileSpreadsheet,
      badge: totalReturnsCount ? totalReturnsCount.toLocaleString() : undefined,
      description: 'Raw Logs & Taxonomy Review',
    },
    {
      id: 'product-detail',
      label: 'Product Deep Dive',
      icon: SearchCode,
      badge: 'SKU-104',
      description: 'Root-Cause & Evidence',
    },
    {
      id: 'actions',
      label: 'Action Center',
      icon: CheckSquare,
      badge: '5 Active',
      description: 'Mitigation Priorities',
    },
    {
      id: 'experiments',
      label: 'Experiment Center',
      icon: FlaskConical,
      badge: experiments && getLiveExperimentsCount(experiments) > 0 ? `${getLiveExperimentsCount(experiments)} Live` : null,
      description: 'A/B Intervention Tracking',
    },
    {
      id: 'evaluation',
      label: 'AI Benchmark & Eval',
      icon: Sparkles,
      badge: '94.2%',
      description: 'Precision & Audit Log',
    },
    {
      id: 'settings',
      label: 'Settings & Taxonomy',
      icon: Settings,
      badge: null,
      description: 'Workspaces & Webhooks',
    },
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none"
    >
      {/* Top Nav List */}
      <nav aria-label="Main Navigation" className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core Intelligence
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isViewActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              id={`sidebar-nav-${item.id}`}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-slate-200 border border-slate-700'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Action Card inside Sidebar */}
        <div className="pt-4 px-1">
          <div className="rounded-xl p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-2">
              <Zap aria-hidden="true" className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-100">Ingest Dataset</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Upload raw return files or connect your e-commerce platform.
            </p>
            <button
              onClick={onOpenUploadWizard}
              className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow transition-colors"
              id="sidebar-ingest-btn"
            >
              <UploadCloud aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Import Returns</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Status & Engine Health */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2" role="region" aria-label="System Status">
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700">Gemini 3.7 Online</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v2.4.0</span>
        </div>
        <div className="px-2 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Accuracy Benchmark</span>
          <span className="text-emerald-700 font-bold">94.2%</span>
        </div>
      </div>
    </aside>
  );
};
