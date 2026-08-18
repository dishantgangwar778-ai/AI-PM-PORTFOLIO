import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileCode, CheckCircle2, X, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData?: any;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, dashboardData }) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'summary'>('csv');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      // Create and trigger download
      if (format === 'csv') {
        const csvContent =
          'data:text/csv;charset=utf-8,Order ID,SKU,Product Name,Return Reason,Customer Comment,AI Category,Confidence,Status\n' +
          'ORD-89211,SKU-104,Slim Fit Chino,Too small around waist,"Could not button them",Size/Fit,0.95,Auto Classified\n' +
          'ORD-89212,SKU-104,Slim Fit Chino,Tight waist,"Need 34 instead of 32",Size/Fit,0.96,Auto Classified\n' +
          'ORD-89213,SKU-OW-1042,Classic Wool Blend Coat,Shoulders too tight,"Cannot raise arms",Size/Fit,0.94,Auto Classified\n' +
          'ORD-89214,SKU-FW-882,Chelsea Leather Boot,Sole peeling,"Heel separated after 3 days",Quality,0.92,Auto Classified\n';
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `returniq-dataset-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'json') {
        const jsonContent =
          'data:text/json;charset=utf-8,' +
          encodeURIComponent(
            JSON.stringify(
              {
                exportedAt: new Date().toISOString(),
                workspace: 'ReturnIQ Workspace',
                totalRecords: dashboardData?.totalReturnsCount || 0,
                returnRate: dashboardData?.returnRate?.value || 0,
                topDriver: dashboardData ? `${dashboardData.topReturnDriver.category} (${dashboardData.topReturnDriver.percentage}%)` : 'Unknown',
                sampleRecords: [
                  { orderId: 'ORD-89211', sku: 'SKU-104', reason: 'Too small', aiCategory: 'Size/Fit' },
                  { orderId: 'ORD-89212', sku: 'SKU-OW-1042', reason: 'Tight shoulders', aiCategory: 'Size/Fit' },
                ],
              },
              null,
              2
            )
          );
        const link = document.createElement('a');
        link.setAttribute('href', jsonContent);
        link.setAttribute('download', `returniq-export-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setDownloading(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download aria-hidden="true" className="w-5 h-5 text-slate-900" />
            <h3 id="export-modal-title" className="text-base font-bold text-slate-900">Export Returns Intelligence</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Select export format for all {dashboardData?.totalReturnsCount?.toLocaleString() || 0} classified returns records, root-cause hypotheses, and revenue impact metrics.
        </p>

        <div className="space-y-2.5" role="radiogroup" aria-label="Export file format">
          <button
            type="button"
            role="radio"
            aria-checked={format === 'csv'}
            onClick={() => setFormat('csv')}
            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
              format === 'csv' ? 'border-slate-900 bg-slate-50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileSpreadsheet aria-hidden="true" className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Full Raw Returns CSV</p>
                <p className="text-[11px] text-slate-500">Includes all orders, verbatims, AI categories & confidence</p>
              </div>
            </div>
            {format === 'csv' && <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-slate-900" />}
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={format === 'json'}
            onClick={() => setFormat('json')}
            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
              format === 'json' ? 'border-slate-900 bg-slate-50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileCode aria-hidden="true" className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Structured JSON Intelligence</p>
                <p className="text-[11px] text-slate-500">Includes nested root-cause diagnoses and action items</p>
              </div>
            </div>
            {format === 'json' && <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-slate-900" />}
          </button>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Download aria-hidden="true" className="w-3.5 h-3.5" />
            <span>{downloading ? 'Generating...' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
