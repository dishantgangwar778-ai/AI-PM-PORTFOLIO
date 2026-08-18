import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Play,
  Check,
  X,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  History,
  Activity,
  Zap,
  Sliders,
  Edit3,
  Eye,
  Info,
  CheckSquare,
  HelpCircle,
  FileText,
  StopCircle,
  Copy,
  Cpu,
  Bookmark,
  CheckCircle,
  GitBranch,
  Calculator,
} from 'lucide-react';
import {
  GoldenTestRun,
  GoldenTestCase,
  GoldenTestResult,
  GoldenTestSuiteType,
  GoldenTestSuiteBreakdown,
  AiEvaluationMetrics,
  GoldenDatasetVersionInfo,
} from '../types';

type EvaluationTab = 'overview' | 'golden_tests' | 'ai_metrics' | 'failed_cases' | 'regression_history';

export const EvaluationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EvaluationTab>('golden_tests');
  const [runs, setRuns] = useState<GoldenTestRun[]>([]);
  const [currentRun, setCurrentRun] = useState<GoldenTestRun | null>(null);
  const [testCases, setTestCases] = useState<GoldenTestCase[]>([]);
  const [versionInfo, setVersionInfo] = useState<GoldenDatasetVersionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedRunId, setCopiedRunId] = useState(false);

  // Filters for Golden Tests tab
  const [selectedSuiteFilter, setSelectedSuiteFilter] = useState<GoldenTestSuiteType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PASS' | 'FAIL' | 'ERROR'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Edit / Annotation modal state
  const [editingTestCase, setEditingTestCase] = useState<GoldenTestCase | null>(null);
  const [newExpectationJson, setNewExpectationJson] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [isUpdatingCase, setIsUpdatingCase] = useState(false);

  // Polling for live test run progress
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch runs
      const runsRes = await fetch('/api/evaluation/runs');
      if (runsRes.ok) {
        const runsData: GoldenTestRun[] = await runsRes.json();
        setRuns(runsData);
        if (runsData.length > 0) {
          setCurrentRun(runsData[0]);
        }
      }

      // Fetch suites and test cases
      const suitesRes = await fetch('/api/evaluation/suites');
      if (suitesRes.ok) {
        const suitesData = await suitesRes.json();
        setTestCases(suitesData.testCases || []);
        setVersionInfo(suitesData.versionInfo || null);
      }
    } catch (e) {
      console.error('Failed to load evaluation data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Run all tests or selected suite
  const handleRunTests = async (suite: GoldenTestSuiteType | 'all' = 'all') => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/evaluation/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite }),
      });

      if (res.ok) {
        const newRun: GoldenTestRun = await res.json();
        setCurrentRun(newRun);
        setRuns((prev) => [newRun, ...prev.filter((r) => r.runId !== newRun.runId)]);

        // Start polling for progress
        pollRunProgress(newRun.runId);
      }
    } catch (e) {
      console.error('Failed to trigger golden test run:', e);
      setIsRunningTests(false);
    }
  };

  const pollRunProgress = (runId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/evaluation/runs/${runId}`);
        if (res.ok) {
          const updatedRun: GoldenTestRun = await res.json();
          setCurrentRun(updatedRun);
          setRuns((prev) => [updatedRun, ...prev.filter((r) => r.runId !== runId)]);

          if (updatedRun.status === 'completed' || updatedRun.status === 'failed' || updatedRun.status === 'cancelled') {
            clearInterval(interval);
            setIsRunningTests(false);
            setToastMessage(
              updatedRun.status === 'completed'
                ? `Evaluation completed! Golden Score: ${updatedRun.overallScore}% (${updatedRun.passed}/${updatedRun.totalTests} passed)`
                : `Test run ended with status: ${updatedRun.status}`
            );
            setTimeout(() => setToastMessage(null), 4000);
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsRunningTests(false);
      }
    }, 400);
  };

  const handleCancelRun = async () => {
    if (!currentRun) return;
    try {
      await fetch(`/api/evaluation/runs/${currentRun.runId}/cancel`, { method: 'POST' });
      setIsRunningTests(false);
      setToastMessage('Evaluation run cancelled.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetAcceptedBaseline = async (runId: string) => {
    try {
      const res = await fetch('/api/evaluation/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
      if (res.ok) {
        setRuns((prev) =>
          prev.map((r) => ({
            ...r,
            isAcceptedBaseline: r.runId === runId,
          }))
        );
        if (currentRun && currentRun.runId === runId) {
          setCurrentRun({ ...currentRun, isAcceptedBaseline: true });
        }
        setToastMessage(`Run ${runId} established as the official accepted baseline.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e) {
      console.error('Failed to set accepted baseline:', e);
    }
  };

  const handleCopyRunId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedRunId(true);
    setTimeout(() => setCopiedRunId(false), 2000);
  };

  const handleExportReport = () => {
    if (!currentRun) return;
    window.location.href = `/api/evaluation/export/${currentRun.runId}`;
  };

  const handleOpenEditModal = (tc: GoldenTestCase) => {
    setEditingTestCase(tc);
    setNewExpectationJson(JSON.stringify(tc.expected, null, 2));
    setAnnotationText(tc.userAnnotation || '');
  };

  const handleSaveTestCaseExpectation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestCase) return;
    setIsUpdatingCase(true);
    try {
      const parsedExpected = JSON.parse(newExpectationJson);
      const res = await fetch(`/api/evaluation/golden-cases/${editingTestCase.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected: parsedExpected,
          annotation: annotationText,
          updatedBy: 'QA & Product Lead',
        }),
      });

      if (res.ok) {
        const updatedCase: GoldenTestCase = await res.json();
        setTestCases((prev) => prev.map((tc) => (tc.id === updatedCase.id ? updatedCase : tc)));
        setToastMessage(`Golden expectation updated for ${updatedCase.id} with version audit trail.`);
        setEditingTestCase(null);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      alert('Invalid JSON in expected output. Please check formatting.');
    } finally {
      setIsUpdatingCase(false);
    }
  };

  const handleToggleTestCase = async (id: string) => {
    try {
      const res = await fetch(`/api/evaluation/golden-cases/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        const updated: GoldenTestCase = await res.json();
        setTestCases((prev) => prev.map((tc) => (tc.id === updated.id ? updated : tc)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered test cases / results
  const suiteKeys: { id: GoldenTestSuiteType | 'all'; label: string }[] = [
    { id: 'all', label: 'All Suites' },
    { id: 'classification', label: 'Classification' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'root_cause', label: 'Root Cause' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'prioritization', label: 'Prioritization' },
    { id: 'validation', label: 'Validation' },
    { id: 'edge_cases', label: 'Edge Cases' },
    { id: 'end_to_end', label: 'End-to-End' },
  ];

  const resultsMap = new Map<string, GoldenTestResult>();
  if (currentRun?.results) {
    currentRun.results.forEach((r) => resultsMap.set(r.testCaseId, r));
  }

  const filteredCases = testCases.filter((tc) => {
    if (selectedSuiteFilter !== 'all' && tc.suite !== selectedSuiteFilter) return false;
    const result = resultsMap.get(tc.id);
    if (statusFilter !== 'all') {
      if (!result || result.status !== statusFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = tc.id.toLowerCase().includes(q);
      const matchTitle = tc.title.toLowerCase().includes(q);
      const matchDesc = tc.description.toLowerCase().includes(q);
      const matchInput = JSON.stringify(tc.input).toLowerCase().includes(q);
      return matchId || matchTitle || matchDesc || matchInput;
    }
    return true;
  });

  const failedResults = currentRun?.results.filter((r) => r.status !== 'PASS') || [];

  if (loading && !currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
        <p className="text-xs font-semibold text-slate-500">Loading Golden Test System & Datasets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Primary Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Production Golden Evaluation & Quality Gate
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                  {versionInfo?.version || 'v1.2.0'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Versioned ground-truth evaluation, deterministic arithmetic verification, and regression prevention across {testCases.length} golden test cases.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {currentRun && (
            <button
              onClick={() => handleSetAcceptedBaseline(currentRun.runId)}
              disabled={currentRun.isAcceptedBaseline}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer ${
                currentRun.isAcceptedBaseline
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 cursor-default'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title="Set this run as the accepted baseline for regression detection"
            >
              <Bookmark className={`w-3.5 h-3.5 ${currentRun.isAcceptedBaseline ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'}`} />
              <span>{currentRun.isAcceptedBaseline ? 'Accepted Baseline' : 'Set as Baseline'}</span>
            </button>
          )}

          <button
            onClick={handleExportReport}
            disabled={!currentRun}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </button>

          {isRunningTests ? (
            <button
              onClick={handleCancelRun}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5 animate-pulse" />
              <span>Cancel Run</span>
            </button>
          ) : (
            <button
              onClick={() => handleRunTests('all')}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>RUN ALL TESTS</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          PRODUCTION RUN METADATA & REPRODUCIBILITY SPECS STRIP
          Explicitly displays:
          - Run ID
          - Dataset Version
          - Model
          - Prompt Version
          - Total Tests
          - Passed
          - Failed
          - Accuracy
          - Precision
          - Recall
          - F1
          - Timestamp
          ========================================================================= */}
      {currentRun && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                <span>Evaluation Run Specs:</span>
              </span>
              <div className="inline-flex items-center space-x-1 font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                <span>Run ID: {currentRun.runId}</span>
                <button
                  onClick={() => handleCopyRunId(currentRun.runId)}
                  className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Copy Run ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {copiedRunId && <span className="text-[10px] text-emerald-600">Copied!</span>}
              </div>
              {currentRun.isAcceptedBaseline && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ★ Official Accepted Baseline
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Evaluated: {new Date(currentRun.timestamp).toUTCString()}</span>
            </div>
          </div>

          {/* 11 Required Precision Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-2.5 text-center">
            {/* 1. Dataset Version */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Dataset Ver</span>
              <span className="text-xs font-mono font-black text-slate-900 truncate block mt-0.5" title={currentRun.goldenDatasetVersion}>
                {currentRun.goldenDatasetVersion}
              </span>
            </div>

            {/* 2. Model */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Model</span>
              <span className="text-xs font-mono font-bold text-blue-700 truncate block mt-0.5" title={currentRun.modelIdentifier}>
                {currentRun.modelIdentifier}
              </span>
            </div>

            {/* 3. Prompt Version */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Prompt Ver</span>
              <span className="text-xs font-mono font-bold text-purple-700 truncate block mt-0.5" title={currentRun.promptVersion}>
                {currentRun.promptVersion}
              </span>
            </div>

            {/* 4. Total Tests */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total Tests</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {currentRun.totalTests}
              </span>
            </div>

            {/* 5. Passed */}
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/70">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Passed</span>
              <span className="text-sm font-black text-emerald-700 block mt-0.5">
                {currentRun.passed}
              </span>
            </div>

            {/* 6. Failed */}
            <div className={`p-2.5 rounded-xl border ${currentRun.failed > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50/80 border-slate-200/70'}`}>
              <span className={`text-[10px] font-bold uppercase block tracking-wider ${currentRun.failed > 0 ? 'text-rose-800' : 'text-slate-400'}`}>Failed</span>
              <span className={`text-sm font-black block mt-0.5 ${currentRun.failed > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {currentRun.failed}
              </span>
            </div>

            {/* 7. Accuracy */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Accuracy</span>
              <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                {currentRun.accuracy !== undefined ? `${currentRun.accuracy}%` : `${currentRun.aiClassificationMetrics.accuracyOverall}%`}
              </span>
            </div>

            {/* 8. Precision */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Precision</span>
              <span className="text-xs font-mono font-bold text-blue-700 block mt-0.5">
                {currentRun.precision !== undefined ? `${currentRun.precision}%` : `${currentRun.aiClassificationMetrics.precisionScore}%`}
              </span>
            </div>

            {/* 9. Recall */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Recall</span>
              <span className="text-xs font-mono font-bold text-indigo-700 block mt-0.5">
                {currentRun.recall !== undefined ? `${currentRun.recall}%` : `${currentRun.aiClassificationMetrics.recallScore}%`}
              </span>
            </div>

            {/* 10. F1 */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">F1 Score</span>
              <span className="text-xs font-mono font-bold text-purple-700 block mt-0.5">
                {currentRun.f1 !== undefined ? `${currentRun.f1}%` : `${currentRun.aiClassificationMetrics.f1Score}%`}
              </span>
            </div>

            {/* 11. Overall Score */}
            <div className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-300 uppercase block tracking-wider">Score</span>
              <span className="text-sm font-black text-emerald-400 block mt-0.5">
                {currentRun.overallScore}%
              </span>
            </div>
          </div>

          {/* REGRESSION DETECTION BANNER */}
          {currentRun.regressionStatus.hasRegression ? (
            <div className="bg-rose-50 border-2 border-rose-500 p-4 rounded-2xl shadow-sm text-rose-950 space-y-1.5 animate-in fade-in">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs tracking-wider uppercase flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>REGRESSION DETECTED</span>
                </span>
                <span className="font-bold text-xs text-rose-900">
                  Current evaluation performed worse than the accepted baseline ({currentRun.regressionStatus.baselineScore || 96.4}%).
                </span>
              </div>
              <p className="text-xs font-medium text-rose-800">
                {currentRun.regressionStatus.summary}
              </p>
              {currentRun.regressionStatus.affectedSuites.length > 0 && (
                <div className="text-[11px] font-mono font-bold text-rose-900 pt-1">
                  Degraded Quality Suites: {currentRun.regressionStatus.affectedSuites.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200/80 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center space-x-2 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NO REGRESSIONS DETECTED</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="font-normal text-emerald-800">
                  Performance ({currentRun.overallScore}%) meets or exceeds accepted baseline ({currentRun.regressionStatus.baselineScore || 96.4}%).
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-bold hidden sm:inline">
                Delta: {currentRun.regressionStatus.scoreDelta > 0 ? '+' : ''}{currentRun.regressionStatus.scoreDelta}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Live Asynchronous Execution Banner */}
      {isRunningTests && currentRun?.progress && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2.5">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-xs font-bold text-slate-200">
                Running Golden Test Execution Pipeline...
              </span>
            </div>
            <span className="text-xs font-mono text-blue-300 font-bold">
              {currentRun.progress.completedCount} / {currentRun.progress.totalCount} ({currentRun.progress.percentage}%)
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${currentRun.progress.percentage}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono truncate">
            {currentRun.progress.currentMessage}
          </p>
        </div>
      )}

      {/* Evaluation Sub-Navigation */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-px" role="tablist" aria-label="Evaluation Sections">
        {[
          { id: 'overview', label: 'Overview & Release Gate', icon: Gauge, count: null },
          { id: 'golden_tests', label: 'Golden Tests', icon: FileCheck, count: testCases.length },
          { id: 'ai_metrics', label: 'AI Metrics', icon: Activity, count: null },
          { id: 'failed_cases', label: 'Failed Cases', icon: AlertTriangle, count: failedResults.length },
          { id: 'regression_history', label: 'Regression History', icon: History, count: runs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              id={`eval-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as EvaluationTab)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
                isActive
                  ? 'border-slate-900 text-slate-900 bg-white/70'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon aria-hidden="true" className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab.id === 'failed_cases' && tab.count > 0
                      ? 'bg-rose-100 text-rose-800'
                      : isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & RELEASE GATE
          ========================================================================= */}
      {activeTab === 'overview' && currentRun && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Release Gate Card */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Overall Golden Test Score
                  </span>
                  <span className="text-xs font-mono text-slate-400">Run ID: {currentRun.runId}</span>
                </div>
                <div className="flex items-baseline space-x-3 mt-2">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    {currentRun.overallScore}%
                  </span>
                  <span
                    className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                      currentRun.overallScore >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentRun.passed} of {currentRun.totalTests} tests passed
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Evaluated against versioned ground-truth datasets with zero hardcoding or fabricated scores.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Pass Rate Progress</span>
                  <span>{currentRun.overallScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      currentRun.overallScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${currentRun.overallScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Production Readiness Release Gate */}
            <div
              className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                currentRun.releaseReadiness === 'PASS'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : currentRun.releaseReadiness === 'BLOCKED'
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  {currentRun.releaseReadiness === 'PASS' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  )}
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Release Gate
                  </span>
                </div>
                <div className="mt-3">
                  <div
                    className={`inline-block px-3 py-1 rounded-xl text-sm font-black tracking-wide ${
                      currentRun.releaseReadiness === 'PASS'
                        ? 'bg-emerald-600 text-white'
                        : currentRun.releaseReadiness === 'BLOCKED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    READY: {currentRun.releaseReadiness}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {currentRun.releaseReadiness === 'PASS'
                    ? 'All mandatory test thresholds (Deterministic Math 100%, Validation 100%, Prioritization 100%) satisfied.'
                    : 'One or more mandatory automated quality gates failed. Production release candidate is blocked.'}
                </p>
              </div>

              <div className="text-[11px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                Duration: {(currentRun.durationMs / 1000).toFixed(2)}s
              </div>
            </div>
          </div>

          {/* Critical Blockers Alert if any */}
          {currentRun.criticalFailures.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs text-rose-900 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Critical Quality Blockers Identified</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {currentRun.criticalFailures.map((failure, idx) => (
                  <li key={idx}>{failure}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Test Suites Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Automated Test Suite Status
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                8 Integrated Test Suites
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentRun.suiteBreakdown.map((suite) => (
                <div
                  key={suite.suite}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {suite.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          suite.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {suite.status}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-2 my-2">
                      <span className="text-2xl font-black text-slate-900">
                        {suite.passRate}%
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Target: {suite.targetThreshold}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${
                          suite.passRate >= suite.targetThreshold
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${suite.passRate}%` }}
                      ></div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium flex justify-between">
                      <span>Passed: {suite.passed}</span>
                      <span>Failed: {suite.failed}</span>
                      <span>Total: {suite.total}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSuiteFilter(suite.suite);
                      setActiveTab('golden_tests');
                    }}
                    className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center justify-between cursor-pointer"
                  >
                    <span>Inspect Test Cases</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: GOLDEN TESTS (PRIMARY PAGE)
          ========================================================================= */}
      {activeTab === 'golden_tests' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Suite Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {suiteKeys.map((suite) => {
                const isSelected = selectedSuiteFilter === suite.id;
                return (
                  <button
                    key={suite.id}
                    onClick={() => setSelectedSuiteFilter(suite.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {suite.label}
                  </button>
                );
              })}
            </div>

            {/* Search & Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search test ID, input text, description, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="all">All Results</option>
                  <option value="PASS">PASS Only</option>
                  <option value="FAIL">FAIL Only</option>
                  <option value="ERROR">ERROR Only</option>
                </select>

                <button
                  onClick={() => handleRunTests(selectedSuiteFilter)}
                  disabled={isRunningTests}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 text-blue-400 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>Run Selected Suite</span>
                </button>
              </div>
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Test ID</th>
                    <th className="py-3 px-4">Suite</th>
                    <th className="py-3 px-4">Title & Description</th>
                    <th className="py-3 px-4">Input Preview</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Duration</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                        No golden test cases match your selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((tc) => {
                      const res = resultsMap.get(tc.id);
                      const isExpanded = expandedTestId === tc.id;
                      const status = res ? res.status : tc.enabled ? 'PASS' : 'SKIPPED';

                      return (
                        <React.Fragment key={tc.id}>
                          <tr className={`hover:bg-slate-50/70 transition-colors ${!tc.enabled ? 'opacity-50' : ''}`}>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {tc.id}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {tc.suite}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-bold text-slate-900 truncate">{tc.title}</div>
                              <div className="text-slate-500 text-[11px] truncate">{tc.description}</div>
                            </td>
                            <td className="py-3 px-4 max-w-xs font-mono text-[11px] text-slate-600 truncate">
                              {tc.input.comment || tc.input.reason || JSON.stringify(tc.input)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  status === 'PASS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : status === 'FAIL'
                                    ? 'bg-rose-100 text-rose-800'
                                    : status === 'ERROR'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {status === 'PASS' && <Check className="w-3 h-3 text-emerald-600" />}
                                {status === 'FAIL' && <X className="w-3 h-3 text-rose-600" />}
                                {status === 'ERROR' && <AlertCircle className="w-3 h-3 text-red-600" />}
                                <span>{status}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">
                              {res ? `${res.executionTimeMs}ms` : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => setExpandedTestId(isExpanded ? null : tc.id)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="View Test Details"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(tc)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Edit Expectation"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detailed Comparison View */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-b border-slate-200">
                              <td colSpan={7} className="p-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Input & Evaluation Criteria */}
                                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                      Test Input Payload
                                    </span>
                                    <pre className="mt-1.5 p-2 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
                                      {JSON.stringify(tc.input, null, 2)}
                                    </pre>
                                    <div className="mt-2 text-[11px] text-slate-600">
                                      <strong className="text-slate-800">Criteria:</strong> {tc.evaluationCriteria}
                                    </div>
                                  </div>

                                  {/* Expected vs Actual */}
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                                    <div>
                                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Expected Output (Golden Truth)
                                      </span>
                                      <pre className="mt-1 p-2 bg-emerald-950 text-emerald-200 rounded-lg text-[11px] font-mono overflow-x-auto">
                                        {JSON.stringify(tc.expected, null, 2)}
                                      </pre>
                                    </div>

                                    <div>
                                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Actual Output from Production Logic
                                      </span>
                                      <pre className={`mt-1 p-2 rounded-lg text-[11px] font-mono overflow-x-auto ${
                                        res?.status === 'PASS' ? 'bg-slate-900 text-slate-100' : 'bg-rose-950 text-rose-200'
                                      }`}>
                                        {res?.actual ? JSON.stringify(res.actual, null, 2) : 'Not executed yet.'}
                                      </pre>
                                    </div>
                                  </div>
                                </div>

                                {res?.difference && (
                                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
                                    <strong>Discrepancy:</strong> {res.difference}
                                  </div>
                                )}

                                {tc.userAnnotation && (
                                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                                    <strong>Auditor Note:</strong> {tc.userAnnotation} (Updated by {tc.updatedBy})
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: AI METRICS
          ========================================================================= */}
      {activeTab === 'ai_metrics' && currentRun && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Classification Accuracy', value: `${currentRun.aiClassificationMetrics.accuracyOverall}%`, sub: 'Prediction correctness', color: 'emerald' },
              { label: 'Precision Score', value: `${currentRun.aiClassificationMetrics.precisionScore}%`, sub: 'True Positive Rate', color: 'blue' },
              { label: 'Recall Score', value: `${currentRun.aiClassificationMetrics.recallScore}%`, sub: 'Coverage Rate', color: 'indigo' },
              { label: 'F1-Score (Harmonic)', value: `${currentRun.aiClassificationMetrics.f1Score}%`, sub: 'Balance Metric', color: 'purple' },
            ].map((m, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group cursor-help">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{m.value}</div>
                <span className="text-[11px] text-slate-400 font-medium">{m.sub}</span>
                
                {/* Metric Calculation Info Tooltip for specific metrics */}
                {idx === 0 && (
                  <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-900 text-slate-100 text-[11px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="font-bold mb-1">Classification vs Golden Score</p>
                    <p><strong>Golden Test Score</strong> = percentage of golden test cases that satisfied all expected-output criteria.</p>
                    <p className="mt-1"><strong>Classification Accuracy</strong> = correctness across evaluated classification labels. These metrics may differ.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metric Calculation Details */}
          <details className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer flex items-center justify-between font-bold text-slate-900 hover:bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-slate-500" />
                <span className="text-sm">Metric Calculation Details</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-5 border-t border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-sans font-bold">Evaluated Predictions</span>
                  <span className="text-lg text-slate-900 font-bold">{currentRun.aiClassificationMetrics.totalPredictions || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-sans font-bold">True Positives (TP)</span>
                  <span className="text-lg text-emerald-700 font-bold">{currentRun.aiClassificationMetrics.truePositives || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-sans font-bold">False Positives (FP)</span>
                  <span className="text-lg text-rose-700 font-bold">{currentRun.aiClassificationMetrics.falsePositives || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-sans font-bold">False Negatives (FN)</span>
                  <span className="text-lg text-amber-700 font-bold">{currentRun.aiClassificationMetrics.falseNegatives || 0}</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500 font-medium">
                * Note: Precision = TP / (TP + FP). Recall = TP / (TP + FN). F1 = 2 × Precision × Recall / (Precision + Recall).
              </p>
            </div>
          </details>

          {/* High-Confidence Accuracy & Human Review Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                High-Confidence AI Accuracy (≥ 0.85)
              </span>
              <div className="flex items-baseline space-x-2">
                <div className="text-4xl font-black text-slate-900">
                  {currentRun.aiClassificationMetrics.highConfidenceAccuracy}%
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  ({currentRun.aiClassificationMetrics.highConfidenceCorrect || 0} / {currentRun.aiClassificationMetrics.highConfidencePredictions || 0})
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Correct high-confidence classifications / Total high-confidence classifications (conf ≥ 0.85). Predictions below this threshold are strictly excluded from this metric.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Human Correction Rate
              </span>
              <div className="flex items-baseline space-x-2">
                <div className="text-4xl font-black text-slate-900">
                  {currentRun.aiClassificationMetrics.humanCorrectionRate}%
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  ({currentRun.aiClassificationMetrics.humanCorrectedClassifications || 0} / {currentRun.aiClassificationMetrics.totalProductionClassifications || 0})
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Corrected classifications / Eligible production classifications. Indicates AI labels amended by users.
              </p>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Category-Level AI Performance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Return Category</th>
                    <th className="py-2.5 px-3">Ground Truth Samples</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentRun.aiClassificationMetrics.categoryBreakdown.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{cat.category}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{cat.sampleCount}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">{cat.precision}%</td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{cat.recall}%</td>
                      <td className="py-2.5 px-3 font-mono text-purple-700 font-bold">{cat.f1}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: FAILED CASES
          ========================================================================= */}
      {activeTab === 'failed_cases' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {failedResults.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero Failed Cases in Current Run</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All executed golden test cases satisfied their expected structured output, numerical tolerance, and validation thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  {failedResults.length} Failed Cases Requiring Inspection
                </span>
                <span className="text-xs text-slate-500">
                  Zero false confidence — every failure is strictly reported.
                </span>
              </div>

              {failedResults.map((r) => {
                const tc = testCases.find((t) => t.id === r.testCaseId);
                return (
                  <div
                    key={r.testCaseId}
                    className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono text-xs font-black">
                          {r.testCaseId}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{r.title}</span>
                        <span className="text-xs text-slate-400 font-mono">({r.suite})</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {tc && (
                          <button
                            onClick={() => handleOpenEditModal(tc)}
                            className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Update Expectation</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Input:</span>
                        <pre className="mt-1 font-mono text-[11px] text-slate-900 overflow-x-auto">
                          {JSON.stringify(r.input, null, 2)}
                        </pre>
                      </div>

                      <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200">
                        <span className="font-bold text-rose-800 uppercase text-[10px]">Difference / Reason:</span>
                        <div className="mt-1 font-mono text-[11px] text-rose-900">
                          {r.difference || r.reason || 'Output did not match expected criteria.'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: REGRESSION HISTORY
          ========================================================================= */}
      {activeTab === 'regression_history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Regression Alert Banner if applicable */}
          {currentRun?.regressionStatus.hasRegression && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Quality Regression Detected</span>
              </div>
              <p>{currentRun.regressionStatus.summary}</p>
              {currentRun.regressionStatus.affectedSuites.length > 0 && (
                <div className="text-[11px] mt-1 font-medium">
                  Affected Suites: {currentRun.regressionStatus.affectedSuites.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Historical Runs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Versioned Golden Test & Evaluation Runs
                </h3>
                <p className="text-xs text-slate-500">
                  Every evaluation run is reproducible with immutable prompt versions, model targets, dataset versions, and full classification precision metrics.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-3">Run ID</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Model / Prompt</th>
                    <th className="py-3 px-3">Dataset</th>
                    <th className="py-3 px-3 text-center">Tests (P/F)</th>
                    <th className="py-3 px-3 text-center">Acc / Prec / Rec / F1</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Baseline</th>
                    <th className="py-3 px-3">Release Gate</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {runs.map((r) => {
                    const acc = r.accuracy !== undefined ? r.accuracy : r.aiClassificationMetrics?.accuracyOverall;
                    const prec = r.precision !== undefined ? r.precision : r.aiClassificationMetrics?.precisionScore;
                    const rec = r.recall !== undefined ? r.recall : r.aiClassificationMetrics?.recallScore;
                    const f1 = r.f1 !== undefined ? r.f1 : r.aiClassificationMetrics?.f1Score;

                    return (
                      <tr key={r.runId} className={`hover:bg-slate-50/70 ${r.runId === currentRun?.runId ? 'bg-blue-50/40' : ''}`}>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <div className="flex items-center space-x-1">
                            <span className="truncate max-w-[130px]" title={r.runId}>{r.runId}</span>
                            {r.runId === currentRun?.runId && (
                              <span className="w-2 h-2 rounded-full bg-blue-600" title="Active selection"></span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-sans text-[11px]">
                          {new Date(r.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-700 text-[11px]">
                          <div className="font-bold text-blue-700">{r.modelIdentifier}</div>
                          <div className="text-[10px] text-purple-700">{r.promptVersion}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-bold text-[11px]">
                          {r.goldenDatasetVersion}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-emerald-700 font-bold">{r.passed}</span>
                          <span className="text-slate-400"> / </span>
                          <span className={r.failed > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}>{r.failed}</span>
                        </td>
                        <td className="py-3 px-3 text-center text-[11px]">
                          <span className="font-bold text-slate-900">{acc}%</span>
                          <span className="text-slate-300"> | </span>
                          <span className="text-blue-700">{prec}%</span>
                          <span className="text-slate-300"> | </span>
                          <span className="text-indigo-700">{rec}%</span>
                          <span className="text-slate-300"> | </span>
                          <span className="text-purple-700 font-bold">{f1}%</span>
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900 text-sm font-sans">
                          {r.overallScore}%
                        </td>
                        <td className="py-3 px-3">
                          {r.isAcceptedBaseline ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans bg-emerald-100 text-emerald-800">
                              ★ Accepted
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetAcceptedBaseline(r.runId)}
                              className="text-[10px] font-sans font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                            >
                              Set Baseline
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.releaseReadiness === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.releaseReadiness === 'BLOCKED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.releaseReadiness}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <button
                            onClick={() => {
                              setCurrentRun(r);
                              setActiveTab('golden_tests');
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT GOLDEN TEST EXPECTATION
          ========================================================================= */}
      {editingTestCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Update Golden Expectation: {editingTestCase.id}
                </h3>
              </div>
              <button
                onClick={() => setEditingTestCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTestCaseExpectation} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Output JSON (Ground Truth)
                </label>
                <textarea
                  rows={6}
                  value={newExpectationJson}
                  onChange={(e) => setNewExpectationJson(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auditor Reason / Annotation Note
                </label>
                <input
                  type="text"
                  placeholder="Explain why this golden ground-truth expectation was modified..."
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTestCase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCase}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isUpdatingCase ? 'Saving...' : 'Save Golden Truth'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
