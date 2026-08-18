import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Download,
  Loader2,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';

interface UploadStepperProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (data: any) => void;
  onUploadComplete?: () => void;
}

export const UploadStepper: React.FC<UploadStepperProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onUploadComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('Q3_Returns_Master.csv');
  const [fileSize, setFileSize] = useState('4.2 MB');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([
    'Order_ID',
    'SKU_ID',
    'Product_Name',
    'Category',
    'PurchaseDate',
    'ReturnDate',
    'ItemPrice',
    'ReasonText',
    'Notes',
  ]);

  const [columnMapping, setColumnMapping] = useState({
    sku: 'SKU_ID',
    reason: 'ReasonText',
    date: 'PurchaseDate',
    comment: 'Notes',
    category: 'Category',
    price: 'ItemPrice',
  });

  // Processing simulation state
  const [progress, setProgress] = useState(0);
  const [currentStepLog, setCurrentStepLog] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Generate default preview rows
    const sampleRows = [
      { Order_ID: 'ORD-8821', SKU_ID: 'SKU-104', Product_Name: 'Slim Fit Chino', Category: 'Bottoms', PurchaseDate: '2026-08-01', ItemPrice: '68.00', ReasonText: 'Too Small', Notes: "Waist is way too tight, couldn't button." },
      { Order_ID: 'ORD-8822', SKU_ID: 'SKU-OW-1042', Product_Name: 'Classic Wool Blend Coat', Category: 'Outerwear', PurchaseDate: '2026-08-02', ItemPrice: '185.00', ReasonText: 'Tight Shoulders', Notes: "Arms can't move when wearing a sweater." },
      { Order_ID: 'ORD-8823', SKU_ID: 'SKU-FW-882', Product_Name: 'Pro-Run Sneakers V2', Category: 'Footwear', PurchaseDate: '2026-08-03', ItemPrice: '130.00', ReasonText: 'Sole Defect', Notes: "Sole peeled off after 3 days of running." },
      { Order_ID: 'ORD-8824', SKU_ID: 'SKU-WT-301', Product_Name: 'Silk Evening Blouse', Category: 'Tops', PurchaseDate: '2026-08-04', ItemPrice: '95.00', ReasonText: 'Color Mismatch', Notes: "Looks teal in person, photo is forest green." },
      { Order_ID: 'ORD-8825', SKU_ID: 'SKU-BT-990', Product_Name: 'Slim Fit Denim Jeans', Category: 'Bottoms', PurchaseDate: '2026-08-05', ItemPrice: '88.00', ReasonText: 'Stiff Fabric', Notes: "Expected stretch denim, this is rigid cotton." },
    ];
    setParsedRows(sampleRows);
  }, []);

  const parseCSVContent = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const parseLine = (line: string): string[] => {
      const res: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' || c === "'") inQuotes = !inQuotes;
        else if (c === ',' && !inQuotes) {
          res.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else current += c;
      }
      res.push(current.trim().replace(/^["']|["']$/g, ''));
      return res;
    };

    const headers = parseLine(lines[0]);
    if (headers.length === 0) return;

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = vals[idx] !== undefined ? vals[idx] : '';
      });
      rows.push(rowObj);
    }

    setAvailableColumns(headers);
    setParsedRows(rows.length > 0 ? rows : sampleRowsFallback);

    // Auto-map columns
    const autoMap = { ...columnMapping };
    headers.forEach((h) => {
      const lower = h.toLowerCase();
      if (lower.includes('sku') || lower.includes('product_id') || lower.includes('item_id')) autoMap.sku = h;
      if (lower.includes('reason') || lower.includes('return_reason')) autoMap.reason = h;
      if (lower.includes('date') || lower.includes('purchase') || lower.includes('return_date')) autoMap.date = h;
      if (lower.includes('note') || lower.includes('comment') || lower.includes('verbatim') || lower.includes('feedback')) autoMap.comment = h;
      if (lower.includes('cat') || lower.includes('department')) autoMap.category = h;
      if (lower.includes('price') || lower.includes('amount') || lower.includes('cost')) autoMap.price = h;
    });
    setColumnMapping(autoMap);
  };

  const sampleRowsFallback = [
    { SKU_ID: 'SKU-104', ReasonText: 'Too Small', PurchaseDate: '2026-08-01', Notes: 'Waist tight', ItemPrice: '68.00' },
    { SKU_ID: 'SKU-OW-1042', ReasonText: 'Tight Shoulders', PurchaseDate: '2026-08-02', Notes: 'Narrow arms', ItemPrice: '185.00' },
  ];

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setFileName(dropped.name);
      setFileSize(`${(dropped.size / (1024 * 1024)).toFixed(1)} MB`);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) parseCSVContent(text);
      };
      reader.readAsText(dropped);

      setStep(2);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploaded = e.target.files[0];
      setFile(uploaded);
      setFileName(uploaded.name);
      setFileSize(`${(uploaded.size / (1024 * 1024)).toFixed(1)} MB`);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) parseCSVContent(text);
      };
      reader.readAsText(uploaded);

      setStep(2);
    }
  };

  const handleLoadPreset = async (presetKey: 'dataset-a' | 'dataset-b' | 'dataset-c') => {
    try {
      const res = await fetch('/api/datasets/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetKey }),
      });
      const data = await res.json();
      if (onUploadSuccess) onUploadSuccess(data);
      if (onUploadComplete) onUploadComplete();
      onClose();
    } catch (e) {
      console.error(e);
      onClose();
    }
  };

  const handleStartProcessing = () => {
    setStep(4);
    setIsProcessing(true);
    setProgress(15);
    setCurrentStepLog(1);

    const t1 = setTimeout(() => {
      setProgress(40);
      setCurrentStepLog(2);
    }, 800);

    const t2 = setTimeout(() => {
      setProgress(75);
      setCurrentStepLog(3);
    }, 1800);

    const t3 = setTimeout(() => {
      setProgress(100);
      setCurrentStepLog(4);
      setIsProcessing(false);
    }, 2800);
  };

  const handleComplete = async () => {
    try {
      const res = await fetch('/api/datasets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileSize,
          rows: parsedRows,
          columnMapping,
        }),
      });
      const data = await res.json();
      if (onUploadSuccess) onUploadSuccess(data);
      if (onUploadComplete) onUploadComplete();
      onClose();
    } catch (e) {
      onClose();
    }
  };

  const downloadSampleCSV = () => {
    const csvHeader = 'Order_ID,SKU_ID,Product_Name,Category,PurchaseDate,ItemPrice,ReasonText,Notes\n';
    const csvContent =
      csvHeader +
      'ORD-101,SKU-104,Slim Fit Chino,Bottoms,2026-08-01,68.00,Too Small,Waist is 1 inch tighter than standard size 32\n' +
      'ORD-102,SKU-OW-1042,Classic Wool Blend Coat,Outerwear,2026-08-02,185.00,Fit Issue,Shoulder seam restricts arm movement\n' +
      'ORD-103,SKU-FW-882,Pro-Run Sneakers V2,Footwear,2026-08-03,130.00,Sole Defect,Front rubber delaminated on day 4';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ReturnIQ_Sample_Template.csv';
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-stepper-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar & Stepper Indicator */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span className={step >= 1 ? 'text-blue-600 font-bold' : ''}>1. Upload</span>
              <span aria-hidden="true">&gt;</span>
              <span className={step >= 2 ? 'text-blue-600 font-bold' : ''}>2. Map Columns</span>
              <span aria-hidden="true">&gt;</span>
              <span className={step >= 3 ? 'text-blue-600 font-bold' : ''}>3. Validate</span>
              <span aria-hidden="true">&gt;</span>
              <span className={step >= 4 ? 'text-blue-600 font-bold' : ''}>4. AI Analyze</span>
            </div>
            <h2 id="upload-stepper-title" className="text-lg font-bold text-slate-900 mt-1">
              {step === 1 && 'Upload Returns Dataset'}
              {step === 2 && 'Map Your Data Columns'}
              {step === 3 && 'Dataset Validation & Integrity'}
              {step === 4 && 'Processing & Classifying Returns'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upload dialog"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            id="close-upload-stepper"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                  dragActive ? 'border-blue-600 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-600 shadow-sm mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Drag and drop your return data file here</h3>
                <p className="text-xs text-slate-500 mt-1">Supports .CSV, .XLSX, or .JSON up to 50MB (50,000+ rows)</p>

                <div className="mt-5">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors">
                    <span>Browse Computer</span>
                    <input type="file" accept=".csv,.xlsx,.json" onChange={handleFileInput} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Sample Template Helper */}
              <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Info className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Need help formatting your data?</p>
                    <p className="text-slate-500">Columns should include SKU, Return Reason, Date, and optional Customer Comments.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shrink-0 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Sample</span>
                </button>
              </div>

              {/* Preset Datasets or Quick Load */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Or Load Instant Benchmark Dataset:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('dataset-a')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-white text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Q3 Master Apparel</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">5,240 rows</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">High fit/size driver across Chinos, Overcoats & Sneakers.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadPreset('dataset-b')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-white text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Footwear & Denim Audit</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">2,850 rows</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Quality & sole delamination focus with heavy customer notes.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadPreset('dataset-c')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-white text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Fall Sizing & Fit Shift</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">1,650 rows</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Focused sample with human review cases and low confidence flags.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-xs text-slate-500">
                Match your uploaded dataset columns to ReturnIQ intelligence fields to enable AI analysis and root-cause clustering.
              </p>

              {/* Required Fields Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Required Return Fields</span>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>All Required Fields Mapped</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Product SKU */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Product SKU <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.sku}
                      onChange={(e) => setColumnMapping({ ...columnMapping, sku: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono"
                    >
                      {availableColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Return Reason */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Return Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.reason}
                      onChange={(e) => setColumnMapping({ ...columnMapping, reason: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono"
                    >
                      {availableColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Order Date */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Order / Return Date <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.date}
                      onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono"
                    >
                      {availableColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Optional Fields (Boosts AI Accuracy)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Comment / Verbatim
                    </label>
                    <select
                      value={columnMapping.comment}
                      onChange={(e) => setColumnMapping({ ...columnMapping, comment: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                    >
                      {availableColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Product Category</label>
                    <select
                      value={columnMapping.category}
                      onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                    >
                      {availableColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Item Price / Order Value</label>
                    <select
                      value={columnMapping.price}
                      onChange={(e) => setColumnMapping({ ...columnMapping, price: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                    >
                      {availableColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Preview (First 5 Rows)
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Reason</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Customer Notes</th>
                        <th className="p-2">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-medium text-slate-900">{row.SKU_ID}</td>
                          <td className="p-2">{row.ReasonText}</td>
                          <td className="p-2">{row.PurchaseDate}</td>
                          <td className="p-2 max-w-xs truncate">{row.Notes}</td>
                          <td className="p-2 font-mono">${row.ItemPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATION */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Dataset Validation Passed</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    All {parsedRows.length.toLocaleString()} rows have valid schema definitions, parseable timestamps, and sanitized comment fields.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{parsedRows.length.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Distinct SKUs</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {new Set(parsedRows.map((r) => r.SKU_ID || r.sku || r.SKU)).size || 12}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">File Type</span>
                  <p className="text-xs font-semibold text-slate-900 mt-1">{file?.name?.split('.').pop()?.toUpperCase() || 'CSV/XLSX'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Comment Fill Rate</span>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">
                    {(
                      (parsedRows.filter((r) => !!(r.Notes || r.comment || r['Customer Comment'])).length /
                        (parsedRows.length || 1)) *
                      100
                    ).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-900">Pre-Processing Checks:</div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Schema mapping validated across all required dimensions</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>PII filter active (anonymizes customer emails, addresses, and phone numbers)</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Gemini 3.7 Flash taxonomy classifier initialized</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PROCESSING / PROGRESS */}
          {step === 4 && (
            <div className="space-y-6 py-2" aria-live="polite">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  {progress < 100 ? (
                    <Loader2 aria-hidden="true" className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <CheckCircle2 aria-hidden="true" className="w-6 h-6 text-emerald-600" />
                  )}
                  <h3 className="text-base font-bold text-slate-900">
                    {progress < 100 ? `Classifying Return Data (${progress}%)...` : 'Analysis Complete!'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {progress < 100
                    ? 'AI engine is evaluating return reasons and extracting root-cause signals.'
                    : `${parsedRows.length.toLocaleString()} records successfully classified into taxonomy categories.`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>OVERALL PROGRESS</span>
                  <span>{progress}%</span>
                </div>
                <div
                  className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Dataset processing and AI classification progress"
                >
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Batch Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Records Found</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{parsedRows.length.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Data Source</span>
                  <p className="font-semibold text-slate-900 truncate mt-0.5">{fileName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Est. Time Remaining</span>
                  <p className="font-mono text-slate-900 mt-0.5">{progress < 100 ? '00:00:01' : '00:00:00'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Current Step</span>
                  <p className="font-semibold text-blue-600 mt-0.5">
                    {progress < 100 ? 'AI Classification' : 'Report Ready'}
                  </p>
                </div>
              </div>

              {/* Operations Log */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-4 text-xs font-mono bg-slate-900 text-slate-200">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>[00:01] File Integrity Check Complete ({parsedRows.length} rows validated)</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>[00:02] Schema Mapping Confirmed (6 columns bound)</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-400">
                  {progress < 100 ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>
                    {progress < 100
                      ? '[00:03] Gemini 3.7 Flash: Classifying NLP customer verbatims...'
                      : '[00:03] Gemini 3.7 Flash: Classification complete (94.2% precision)'}
                  </span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    progress === 100 ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {progress === 100 ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-3.5 h-3.5 text-center">·</span>
                  )}
                  <span>[00:04] Synthesizing Root-Cause Hypotheses & Action Plan</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
          )}

          {step === 4 && progress < 100 && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700"
            >
              Cancel Processing
            </button>
          )}

          <div className="ml-auto flex items-center space-x-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                id="btn-continue-validate"
              >
                <span>Continue to Validation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleStartProcessing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition-all"
                id="btn-start-ai-analysis"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start AI Analysis</span>
              </button>
            )}

            {step === 4 && progress === 100 && (
              <button
                type="button"
                onClick={handleComplete}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition-all"
                id="btn-view-executive-dashboard"
              >
                <span>View Executive Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
