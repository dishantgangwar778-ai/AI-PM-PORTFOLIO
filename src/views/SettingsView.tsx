import React, { useState } from 'react';
import {
  Settings,
  Building,
  Tag,
  Share2,
  Users,
  Shield,
  Key,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Workspace } from '../types';

interface SettingsViewProps {
  currentWorkspace: Workspace;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentWorkspace }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'taxonomy' | 'integrations' | 'team'>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // General settings state
  const [currency, setCurrency] = useState('USD ($)');
  const [returnWindowDays, setReturnWindowDays] = useState(30);
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');

  // Integrations state
  const [shopifyConnected, setShopifyConnected] = useState(true);
  const [loopConnected, setLoopConnected] = useState(true);
  const [gorgiasConnected, setGorgiasConnected] = useState(false);

  // Taxonomy tags
  const [taxonomyList, setTaxonomyList] = useState([
    { name: 'Size/Fit', description: 'Waist, shoulder, length, overall tight/loose fit', count: '45%' },
    { name: 'Quality', description: 'Stitching, material feel, fabric defects, zipper malfunction', count: '25%' },
    { name: 'Changed Mind', description: 'Customer regret, no longer wanted, found cheaper', count: '15%' },
    { name: 'Color', description: 'Screen color variance, shade discrepancy, dye transfer', count: '9%' },
    { name: 'Damage', description: 'Transit puncture, packaging torn, carrier damage', count: '6%' },
  ]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxDesc, setNewTaxDesc] = useState('');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Workspace settings updated successfully.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddTaxonomy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName.trim()) return;
    setTaxonomyList([...taxonomyList, { name: newTaxName.trim(), description: newTaxDesc.trim(), count: '0%' }]);
    setNewTaxName('');
    setNewTaxDesc('');
    setToastMessage('New taxonomy category added to classification engine.');
    setTimeout(() => setToastMessage(null), 2500);
  };

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
      <div>
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-slate-900" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Workspace Settings</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage workspace preferences, taxonomy definitions, and live returns data pipeline integrations.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200">
        {[
          { id: 'general', label: 'General & AI Model', icon: Building },
          { id: 'taxonomy', label: 'Returns Taxonomy', icon: Tag },
          { id: 'integrations', label: 'Integrations & Webhooks', icon: Share2 },
          { id: 'team', label: 'Team Members', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl space-y-6">
          <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Workspace Name</label>
              <input
                type="text"
                defaultValue={currentWorkspace.name}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Reporting Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="AUD ($)">AUD ($)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Return Policy Window</label>
                <input
                  type="number"
                  value={returnWindowDays}
                  onChange={(e) => setReturnWindowDays(parseInt(e.target.value) || 30)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">Gemini AI Model Endpoint</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (High speed, structured extraction)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Deep reasoning, long-context analysis)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                All requests use server-side execution with official Google AI Studio SDK.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Save Workspace Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Returns Taxonomy */}
      {activeTab === 'taxonomy' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Return Reason Taxonomy</h2>
              <p className="text-xs text-slate-500">
                Configure domain-specific categories into which Gemini classifies customer return verbatims.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {taxonomyList.map((item) => (
              <div
                key={item.name}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{item.name}</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    {item.count} share
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddTaxonomy} className="p-4 rounded-xl border border-dashed border-slate-300 space-y-3 text-xs">
            <span className="font-bold text-slate-900 block">Add Custom Taxonomy Node</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Category Name (e.g. Scent/Allergy)"
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
                className="p-2 rounded-xl border border-slate-300"
                required
              />
              <input
                type="text"
                placeholder="Keywords & Description"
                value={newTaxDesc}
                onChange={(e) => setNewTaxDesc(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 sm:col-span-2"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Integrations */}
      {activeTab === 'integrations' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">E-Commerce & Returns Portal Webhooks</h2>
            <p className="text-xs text-slate-500">
              Synchronize real-time return authorizations, tracking events, and support tickets automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Shopify */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Shopify Storefront</span>
                <p className="text-slate-500 text-[11px]">Sync orders, SKUs, customer tags, and returns</p>
                <span className="inline-block mt-2 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Connected • Live Sync
                </span>
              </div>
              <button
                onClick={() => setShopifyConnected(!shopifyConnected)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                Configure
              </button>
            </div>

            {/* Loop Returns */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Loop Returns</span>
                <p className="text-slate-500 text-[11px]">Ingest return reasons, notes, exchanges, and RMA status</p>
                <span className="inline-block mt-2 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Connected • Webhook Active
                </span>
              </div>
              <button
                onClick={() => setLoopConnected(!loopConnected)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                Configure
              </button>
            </div>

            {/* Gorgias / Zendesk */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Gorgias / Zendesk</span>
                <p className="text-slate-500 text-[11px]">Extract post-purchase customer service ticket verbatims</p>
                <span className="inline-block mt-2 font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Not Connected
                </span>
              </div>
              <button
                onClick={() => {
                  setGorgiasConnected(true);
                  setToastMessage('Gorgias integration activated.');
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Connect
              </button>
            </div>

            {/* Returnly / Happy Returns */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">Happy Returns / Returnly</span>
                <p className="text-slate-500 text-[11px]">Drop-off bar logs and condition inspections</p>
                <span className="inline-block mt-2 font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Not Connected
                </span>
              </div>
              <button className="text-xs font-semibold text-blue-600 hover:underline">Connect</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Team Members */}
      {activeTab === 'team' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Workspace Team Members</h2>
              <p className="text-xs text-slate-500">Collaborate with product designers, merchants, and CX leads.</p>
            </div>
            <button className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Teammate</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  DG
                </div>
                <div>
                  <p className="font-bold text-slate-900">Dishant Gangwar (You)</p>
                  <p className="text-slate-500 text-[11px]">dishantgangwar778@gmail.com</p>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full">
                Workspace Owner
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                  EM
                </div>
                <div>
                  <p className="font-bold text-slate-900">Elena Martinez</p>
                  <p className="text-slate-500 text-[11px]">elena@apparelbrand.com</p>
                </div>
              </div>
              <span className="font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Lead Merchant
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
