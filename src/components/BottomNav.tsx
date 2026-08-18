import React from 'react';
import { LayoutDashboard, SearchCode, CheckSquare, FlaskConical, UploadCloud } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  setCurrentView?: (view: string) => void;
  onViewChange?: (view: string) => void;
  onOpenUploadWizard?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  setCurrentView,
  onViewChange,
  onOpenUploadWizard,
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

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex items-center justify-around"
    >
      <button
        onClick={() => handleViewChange('dashboard')}
        aria-current={isViewActive('dashboard') ? 'page' : undefined}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
          isViewActive('dashboard') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900'
        }`}
        id="mobile-nav-dashboard"
      >
        <LayoutDashboard aria-hidden="true" className="w-5 h-5 mb-0.5" />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => handleViewChange('product-detail')}
        aria-current={isViewActive('product-detail') ? 'page' : undefined}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
          isViewActive('product-detail') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900'
        }`}
        id="mobile-nav-deepdive"
      >
        <SearchCode aria-hidden="true" className="w-5 h-5 mb-0.5" />
        <span>Deep Dive</span>
      </button>

      {/* Floating Center Upload Action */}
      <button
        onClick={onOpenUploadWizard}
        aria-label="Import New Returns Dataset"
        className="flex flex-col items-center -mt-5 p-3 rounded-full bg-slate-900 text-white shadow-lg border-2 border-white hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none transition-all"
        id="mobile-nav-upload"
      >
        <UploadCloud aria-hidden="true" className="w-5 h-5" />
      </button>

      <button
        onClick={() => handleViewChange('actions')}
        aria-current={isViewActive('actions') ? 'page' : undefined}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
          isViewActive('actions') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900'
        }`}
        id="mobile-nav-actions"
      >
        <CheckSquare aria-hidden="true" className="w-5 h-5 mb-0.5" />
        <span>Actions</span>
      </button>

      <button
        onClick={() => handleViewChange('experiments')}
        aria-current={isViewActive('experiments') ? 'page' : undefined}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
          isViewActive('experiments') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900'
        }`}
        id="mobile-nav-experiments"
      >
        <FlaskConical aria-hidden="true" className="w-5 h-5 mb-0.5" />
        <span>Experiments</span>
      </button>
    </nav>
  );
};
