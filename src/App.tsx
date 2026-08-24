import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { WorkspaceModal } from './components/WorkspaceModal';
import { UploadStepper } from './components/UploadStepper';
import { ExportModal } from './components/ExportModal';
import { CookieConsent } from './components/CookieConsent';
import { OnboardingWidget } from './components/OnboardingWidget';

import { DashboardView } from './views/DashboardView';
import { ProductDeepDiveView } from './views/ProductDeepDiveView';
import { ActionCenterView } from './views/ActionCenterView';
import { ExperimentCenterView } from './views/ExperimentCenterView';
import { ReturnsAnalysisView } from './views/ReturnsAnalysisView';
import { EvaluationView } from './views/EvaluationView';
import { SettingsView } from './views/SettingsView';

import { Workspace, DashboardData, Product, Experiment } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>({
    id: 'ws-default',
    name: 'Nordic Apparel Co.',
    slug: 'nordic-apparel',
    brandName: 'Nordic Apparel Co.',
    createdAt: new Date().toISOString(),
    currency: 'USD ($)',
  });

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>('SKU-104');
  const [initialReturnsCategory, setInitialReturnsCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isUploadStepperOpen, setIsUploadStepperOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.all || data.workspaces || [];
        setWorkspaces(list);
        if (list.length > 0) {
          setActiveWorkspace(list[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExperiments = async () => {
    try {
      const res = await fetch('/api/experiments');
      if (res.ok) {
        const data = await res.json();
        setExperiments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDemo = useCallback(async () => {
    try {
      await fetch('/api/dev/reset-demo', { method: 'POST' });
    } catch (e) {
      // Fallback if endpoint not present
    }
    await fetchDashboardData();
    await fetchProducts();
    await fetchExperiments();
    setCurrentView('dashboard');
  }, []);

  useEffect(() => {
    fetchWorkspaces();
    fetchDashboardData();
    fetchProducts();
    fetchExperiments();
  }, []);

  // Global escape key handler to close active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isWorkspaceModalOpen) setIsWorkspaceModalOpen(false);
        if (isUploadStepperOpen) setIsUploadStepperOpen(false);
        if (isExportModalOpen) setIsExportModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWorkspaceModalOpen, isUploadStepperOpen, isExportModalOpen]);

  const handleSelectProduct = (sku: string) => {
    setSelectedSku(sku);
    setCurrentView('deepdive');
  };

  const handleNavigateToReturns = (category?: string) => {
    if (category) {
      setInitialReturnsCategory(category);
    } else {
      setInitialReturnsCategory('All');
    }
    setCurrentView('returns');
  };

  const handleConvertToExperiment = async (actionId?: string) => {
    await fetchExperiments();
    setCurrentView('experiments');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* WCAG 2.4.1: Skip to main content link for keyboard users */}
      <a
        href="#main-content-area"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:text-xs focus:font-semibold focus:rounded-lg focus:shadow-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
      >
        Skip to main content
      </a>

      {/* Top Navbar */}
      <Navbar
        currentWorkspace={activeWorkspace}
        allWorkspaces={workspaces}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenUploadWizard={() => setIsUploadStepperOpen(true)}
        onOpenUploadModal={() => setIsUploadStepperOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetDemo={handleResetDemo}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        onSelectSku={handleSelectProduct}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onViewChange={setCurrentView}
      />

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onViewChange={setCurrentView}
          onOpenUploadWizard={() => setIsUploadStepperOpen(true)}
          totalReturnsCount={dashboardData?.totalReturnsCount}
          experiments={experiments}
        />

        {/* Dynamic Main View */}
        <main
          className="flex-1 min-w-0 focus:outline-none"
          id="main-content-area"
          role="main"
          tabIndex={-1}
          aria-label="Main content view"
        >
          {currentView === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              onSelectProduct={handleSelectProduct}
              onNavigateToReturns={handleNavigateToReturns}
              onNavigateToActions={() => setCurrentView('actions')}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {(currentView === 'deepdive' || currentView === 'product-detail') && (
            <ProductDeepDiveView
              selectedSku={selectedSku}
              onSelectSku={setSelectedSku}
              allProducts={products}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onConvertActionToExperiment={handleConvertToExperiment}
              onNavigateToActions={() => setCurrentView('actions')}
            />
          )}

          {currentView === 'actions' && (
            <ActionCenterView
              onConvertToExperiment={handleConvertToExperiment}
              onNavigateToExperiments={handleConvertToExperiment}
            />
          )}

          {currentView === 'experiments' && <ExperimentCenterView experiments={experiments} setExperiments={setExperiments} />}

          {currentView === 'returns' && (
            <ReturnsAnalysisView
              initialCategoryFilter={initialReturnsCategory}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {currentView === 'evaluation' && <EvaluationView />}

          {currentView === 'settings' && <SettingsView currentWorkspace={activeWorkspace} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        onViewChange={setCurrentView}
        onOpenUploadWizard={() => setIsUploadStepperOpen(true)}
      />

      {/* Modals */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => setActiveWorkspace(ws)}
        onCreatedWorkspace={(ws) => {
          setWorkspaces([...workspaces, ws]);
          setActiveWorkspace(ws);
        }}
      />

      <UploadStepper
        isOpen={isUploadStepperOpen}
        onClose={() => setIsUploadStepperOpen(false)}
        onUploadComplete={() => {
          fetchDashboardData();
          fetchProducts();
          setCurrentView('dashboard');
        }}
      />

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} dashboardData={dashboardData} />
      <CookieConsent />

      <OnboardingWidget setCurrentView={setCurrentView} setIsUploadStepperOpen={setIsUploadStepperOpen} />

    </div>
  );
}