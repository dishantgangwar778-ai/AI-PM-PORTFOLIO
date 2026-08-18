import React, { useState } from 'react';
import {
  TrendingDown,
  Search,
  Bell,
  UploadCloud,
  ChevronDown,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  Building2,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { Workspace } from '../types';

interface NavbarProps {
  currentWorkspace?: Workspace | null;
  allWorkspaces?: Workspace[];
  onOpenWorkspaceModal?: () => void;
  onOpenUploadWizard?: () => void;
  onOpenUploadModal?: () => void;
  onOpenExportModal?: () => void;
  onResetDemo?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectSku?: (sku: string) => void;
  currentView?: string;
  setCurrentView?: (view: string) => void;
  onViewChange?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentWorkspace,
  allWorkspaces = [],
  onOpenWorkspaceModal = () => {},
  onOpenUploadWizard,
  onOpenUploadModal,
  onOpenExportModal = () => {},
  onResetDemo = () => {},
  searchQuery = '',
  onSearchChange = (_q: string) => {},
  onSelectSku,
  currentView = 'dashboard',
  setCurrentView,
  onViewChange,
}) => {
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleUploadClick = () => {
    if (onOpenUploadWizard) onOpenUploadWizard();
    else if (onOpenUploadModal) onOpenUploadModal();
  };

  const handleNavigate = (viewId: string) => {
    if (setCurrentView) setCurrentView(viewId);
    if (onViewChange) onViewChange(viewId);
  };

  const sampleSearchSuggestions = [
    { type: 'SKU', label: 'SKU-104', sub: 'Slim Fit Chino (24.8% Return Rate)' },
    { type: 'SKU', label: 'SKU-OW-1042', sub: 'Classic Wool Blend Coat (34.5% Return Rate)' },
    { type: 'SKU', label: 'SKU-FW-882', sub: 'Pro-Run Sneakers V2 (Sole Separation)' },
    { type: 'Reason', label: 'Too Small / Tight Waist', sub: 'Category: Size/Fit' },
  ];

  return (
    <header role="banner" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Workspace */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="flex items-center space-x-2.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none rounded-xl p-1 group"
              id="nav-logo-btn"
              aria-label="ReturnIQ Home Dashboard"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-600 transition-colors">
                <TrendingDown aria-hidden="true" className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900 text-lg tracking-tight">ReturnIQ</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    AI 3.7
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Returns Intelligence Engine</p>
              </div>
            </button>

            {/* Workspace Selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                aria-expanded={showWorkspaceDropdown}
                aria-haspopup="true"
                aria-label="Select Active Workspace"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-700 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                id="workspace-switcher-btn"
              >
                <Building2 aria-hidden="true" className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-[160px] font-semibold">{currentWorkspace?.name || 'Acme Apparel Co.'}</span>
                <ChevronDown aria-hidden="true" className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showWorkspaceDropdown && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    Active Workspaces
                  </div>
                  {allWorkspaces.length > 0 ? (
                    allWorkspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => setShowWorkspaceDropdown(false)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none ${
                          ws.id === currentWorkspace?.id ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-medium">{ws.name}</p>
                          <p className="text-[10px] text-slate-500">{ws.industry || 'E-Commerce'}</p>
                        </div>
                        {ws.id === currentWorkspace?.id && <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-600">
                      <p className="font-medium">{currentWorkspace?.name || 'Default Workspace'}</p>
                    </div>
                  )}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowWorkspaceDropdown(false);
                        onOpenWorkspaceModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none flex items-center space-x-2"
                    >
                      <Plus aria-hidden="true" className="w-3.5 h-3.5" />
                      <span>Create New Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-4 hidden lg:block relative" role="search">
            <div className="relative">
              <label htmlFor="global-search-input" className="sr-only">
                Search SKU, root cause, or return comment
              </label>
              <Search aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-search-input"
                type="search"
                placeholder="Search SKU, root cause, or return comment..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/70 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
            </div>

            {searchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
                <div className="text-[10px] font-semibold uppercase text-slate-500 px-2 py-1">Quick Suggestions</div>
                {sampleSearchSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onMouseDown={() => {
                      if (item.type === 'SKU' && onSelectSku) {
                        onSelectSku(item.label);
                        handleNavigate('product-detail');
                      } else {
                        onSearchChange(item.label);
                        handleNavigate('returns');
                      }
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{item.label}</span>
                      <span className="text-slate-600 text-[11px] ml-2">{item.sub}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Demo Reset Button */}
            <button
              onClick={onResetDemo}
              title="Reset to synthetic Q3 returns dataset"
              aria-label="Load synthetic demonstration dataset"
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
              id="demo-dataset-btn"
            >
              <RotateCcw aria-hidden="true" className="w-3.5 h-3.5 text-slate-500" />
              <span>Demo Dataset</span>
            </button>

            {/* Export Button */}
            <button
              onClick={onOpenExportModal}
              aria-label="Export report and intelligence data"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
              id="navbar-export-btn"
            >
              <Download aria-hidden="true" className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* New Ingestion Upload Button */}
            <button
              onClick={handleUploadClick}
              aria-label="Upload new returns dataset"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              id="navbar-upload-btn"
            >
              <UploadCloud aria-hidden="true" className="w-3.5 h-3.5" />
              <span>+ New Analysis</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-expanded={showNotifications}
                aria-haspopup="true"
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 relative focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
                aria-label="Intelligence Alerts (3 unread)"
                id="notifications-btn"
              >
                <Bell aria-hidden="true" className="w-4 h-4" />
                <span aria-hidden="true" className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-2xl p-3 z-50" role="region" aria-label="Alerts panel">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Intelligence Alerts (3)</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-blue-600 font-medium hover:underline">Mark all read</button>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="p-2 rounded-lg bg-red-50/60 border border-red-100 text-xs">
                      <p className="font-semibold text-red-900">Sizing Alert: SKU-104</p>
                      <p className="text-red-800 text-[11px] mt-0.5">Return rate reached 24.8% (vs 11.3% cat benchmark).</p>
                      <span className="text-[10px] text-red-600 mt-1 block">2 hours ago</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-xs">
                      <p className="font-semibold text-amber-900">Sole Separation Spike: SKU-FW-882</p>
                      <p className="text-amber-800 text-[11px] mt-0.5">Defect mentions increased by 40% WoW in batch 2026-Q2.</p>
                      <span className="text-[10px] text-amber-700 mt-1 block">1 day ago</span>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                      <p className="font-semibold text-blue-900">Experiment EXP-1042 Statistically Significant</p>
                      <p className="text-blue-800 text-[11px] mt-0.5">Size Guidance Optimization achieved 95% confidence (-3.3% variance).</p>
                      <span className="text-[10px] text-blue-600 mt-1 block">2 days ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                aria-label="User Profile and Settings"
                className="flex items-center space-x-2 pl-2 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none rounded-xl p-1"
                id="user-profile-btn"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center ring-2 ring-slate-100">
                  DG
                </div>
                <div className="hidden xl:block text-left text-xs">
                  <p className="font-semibold text-slate-800 leading-tight">Dishant G.</p>
                  <p className="text-[10px] text-slate-500">CX & Product Lead</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">Dishant Gangwar</p>
                    <p className="text-[11px] text-slate-500 truncate">dishantgangwar778@gmail.com</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleNavigate('settings');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none flex items-center space-x-2 text-slate-700"
                  >
                    <SlidersHorizontal aria-hidden="true" className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workspace Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleNavigate('evaluation');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none flex items-center space-x-2 text-slate-700"
                  >
                    <Sparkles aria-hidden="true" className="w-3.5 h-3.5 text-blue-500" />
                    <span>AI Model Benchmark</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
