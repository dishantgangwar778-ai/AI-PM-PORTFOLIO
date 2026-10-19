import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3,
  Bell, CheckCircle2, ChevronDown, HelpCircle, Download, Filter,
  LayoutDashboard, Lightbulb, Package, Search, Settings, ShieldCheck,
  ShoppingBag, Sparkles, Users, Workflow
} from "lucide-react";

type ReturnRecord = {
  id: string; product: string; sku: string; reason: string;
  category: string; confidence: number; status: "Auto-classified" | "Needs review";
};

const sampleReturns: ReturnRecord[] = [
  { id: "RET-2048", product: "Everyday Performance Tee", sku: "APP-101", reason: "Fabric developed a hole after one wash", category: "Quality / Defect", confidence: 97, status: "Auto-classified" },
  { id: "RET-2047", product: "Wireless Earbuds Pro", sku: "TEC-208", reason: "Left earbud will not pair with my device", category: "Compatibility", confidence: 84, status: "Needs review" },
  { id: "RET-2046", product: "Relaxed Fit Chinos", sku: "APP-044", reason: "Waist runs smaller than the size guide", category: "Size / Fit", confidence: 93, status: "Auto-classified" },
  { id: "RET-2045", product: "Insulated Travel Mug", sku: "HOM-310", reason: "Package arrived cracked", category: "Fulfillment / Shipping", confidence: 91, status: "Auto-classified" },
  { id: "RET-2044", product: "Everyday Performance Tee", sku: "APP-101", reason: "Colour looks different from the product page", category: "Customer Preference", confidence: 78, status: "Needs review" },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Returns Intelligence", icon: Package },
  { label: "Action Center", icon: Lightbulb },
  { label: "Experiments", icon: Workflow },
  { label: "AI Evaluation", icon: ShieldCheck },
];

function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All returns");
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showNotice, setShowNotice] = useState(true);

  const returns = useMemo(() => sampleReturns.filter((row) => {
    const matchesQuery = [row.id, row.product, row.sku, row.reason, row.category].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All returns" || (filter === "Needs review" && row.status === "Needs review") || (filter === "Auto-classified" && row.status === "Auto-classified");
    return matchesQuery && matchesFilter;
  }), [query, filter]);

  const pageTitle = activeNav === "Overview" ? "Returns overview" : activeNav;
  const reviewCount = sampleReturns.filter((r) => r.status === "Needs review" && !reviewed.includes(r.id)).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={21} /></div>
          <div><strong>returniq</strong><span>RETURNS INTELLIGENCE</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => setActiveNav(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === "Returns Intelligence" && <span className="nav-count">24</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><HelpCircle size={18} /><div><strong>Need a hand?</strong><span>Explore the product guide</span></div></div>
          <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
          <div className="user-profile"><div className="avatar">DK</div><div className="user-meta"><strong>Product workspace</strong><span>Portfolio demo</span></div><ChevronDown size={16} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{pageTitle}</strong></div>
          <div className="top-actions">
            <div className="environment-pill"><span className="status-dot" /> Demo environment</div>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="avatar small">DK</div>
          </div>
        </header>

        <div className="page-content">
          {showNotice && <div className="demo-notice"><Sparkles size={17} /><span><strong>Portfolio preview:</strong> this repository UI uses illustrative sample records. It is not connected to the live Cloud Run app or production data.</span><button onClick={() => setShowNotice(false)} aria-label="Dismiss notice">×</button></div>}
          <section className="page-heading">
            <div><div className="eyebrow">MONDAY, OCTOBER 19, 2026 <span>•</span> WEEKLY SNAPSHOT</div><h1>{pageTitle}</h1><p>Turn return signals into clear actions that protect customer trust and margin.</p></div>
            <div className="heading-actions"><button className="button secondary" onClick={() => window.print()}><Download size={16} /> Export view</button><button className="button primary" onClick={() => setActiveNav("Returns Intelligence")}><Activity size={16} /> Explore returns</button></div>
          </section>

          <section className="kpi-grid" aria-label="Key metrics">
            <MetricCard label="Return rate" value="16.8%" change="1.2 pts vs prior period" down icon={<ShoppingBag size={18} />} />
            <MetricCard label="Revenue at risk" value="$24,860" change="Across 38 flagged SKUs" icon={<BarChart3 size={18} />} />
            <MetricCard label="Returns analyzed" value="1,284" change="+12.4% vs prior period" up icon={<Package size={18} />} />
            <MetricCard label="Needs human review" value={String(reviewCount).padStart(2, "0")} change="Low-confidence predictions" warning icon={<Users size={18} />} />
          </section>

          <section className="content-grid">
            <article className="panel trend-panel">
              <div className="panel-heading"><div><h2>Return rate trend</h2><p>Weekly rate across the selected period</p></div><button className="select-button">Last 8 weeks <ChevronDown size={15} /></button></div>
              <div className="chart-legend"><span><i className="legend-dot purple" /> Return rate</span><span><i className="legend-dot grey" /> Target (15%)</span></div>
              <div className="chart-wrap">
                <div className="y-labels"><span>22%</span><span>19%</span><span>16%</span><span>13%</span><span>10%</span></div>
                <div className="chart">
                  <div className="grid-line" /><div className="grid-line" /><div className="grid-line target-line" /><div className="grid-line" /><div className="grid-line" />
                  <svg viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="Illustrative return rate trend line"><defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7667e8" stopOpacity=".22" /><stop offset="100%" stopColor="#7667e8" stopOpacity="0" /></linearGradient></defs><path d="M0,62 C45,74 50,87 100,80 S160,110 200,101 S260,129 300,118 S360,130 400,145 S460,125 500,153 S560,142 600,160 S660,145 700,170 L700,220 L0,220 Z" fill="url(#areaFill)" /><path d="M0,62 C45,74 50,87 100,80 S160,110 200,101 S260,129 300,118 S360,130 400,145 S460,125 500,153 S560,142 600,160 S660,145 700,170" fill="none" stroke="#7667e8" strokeWidth="3.5" strokeLinecap="round" /></svg>
                </div>
                <div className="x-labels"><span>Aug 31</span><span>Sep 7</span><span>Sep 14</span><span>Sep 21</span><span>Sep 28</span><span>Oct 5</span><span>Oct 12</span><span>Oct 19</span></div>
              </div>
              <div className="chart-footer"><span><i className="legend-dot purple" /> Current: <strong>16.8%</strong></span><span>Target: <strong>15.0%</strong></span><span className="footer-insight"><ArrowDownRight size={15} /> Trending down</span></div>
            </article>

            <article className="panel drivers-panel">
              <div className="panel-heading"><div><h2>Top return drivers</h2><p>Share of classified returns</p></div><button className="more-button" aria-label="More options">···</button></div>
              <Driver label="Quality / Defect" value={32} count="411" color="violet" />
              <Driver label="Size / Fit" value={26} count="334" color="blue" />
              <Driver label="Customer preference" value={18} count="231" color="teal" />
              <Driver label="Fulfillment / Shipping" value={14} count="180" color="orange" />
              <Driver label="Compatibility" value={10} count="128" color="pink" />
              <div className="driver-foot"><span>5 root-cause categories</span><span>View analysis →</span></div>
            </article>
          </section>

          <section className="panel returns-panel">
            <div className="panel-heading returns-heading"><div><h2>Recent return signals</h2><p>Review classifications and follow up on low-confidence predictions.</p></div><button className="button secondary small-button" onClick={() => setActiveNav("Returns Intelligence")}>View all returns <ArrowUpRight size={15} /></button></div>
            <div className="table-toolbar">
              <div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product, SKU or reason..." aria-label="Search returns" /></div>
              <label className="filter-select"><Filter size={15} /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter returns"><option>All returns</option><option>Needs review</option><option>Auto-classified</option></select></label>
            </div>
            <div className="table-scroll"><table><thead><tr><th>RETURN ID</th><th>PRODUCT</th><th>ROOT CAUSE</th><th>CONFIDENCE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
              {returns.map((row) => {
                const isReviewed = reviewed.includes(row.id);
                return <tr key={row.id}><td><span className="return-id">{row.id}</span><span className="sku">{row.sku}</span></td><td><span className="product-name">{row.product}</span><span className="reason">{row.reason}</span></td><td><span className="category-pill">{row.category}</span></td><td><div className="confidence"><div className="confidence-track"><span style={{ width: row.confidence + "%" }} /></div><strong>{row.confidence}%</strong></div></td><td>{isReviewed ? <span className="status-chip reviewed"><CheckCircle2 size={13} /> Reviewed</span> : row.status === "Needs review" ? <span className="status-chip needs-review"><AlertTriangle size={13} /> Needs review</span> : <span className="status-chip auto"><CheckCircle2 size={13} /> Auto-classified</span>}</td><td>{row.status === "Needs review" && !isReviewed ? <button className="review-button" onClick={() => setReviewed((prev) => [...prev, row.id])}>Mark reviewed</button> : <button className="row-action" onClick={() => setActiveNav("Returns Intelligence")}>Details ↗</button>}</td></tr>;
              })}
              {returns.length === 0 && <tr><td colSpan={6} className="empty-state">No returns match your search.</td></tr>}
            </tbody></table></div>
            <div className="table-footer"><span>Showing {returns.length} illustrative records</span><span>Sample data · Not production telemetry</span></div>
          </section>

          <footer className="page-footer"><span><span className="status-dot" /> All demo systems operational</span><span>ReturnIQ portfolio preview <span className="footer-separator">•</span> v2.4.0</span></footer>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, change, icon, up, down, warning }: { label: string; value: string; change: string; icon: ReactNode; up?: boolean; down?: boolean; warning?: boolean }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${warning ? "warn" : ""}`}>{icon}</div></div><div className="metric-value">{value}</div><div className={`metric-change ${warning ? "warning-text" : down ? "positive" : up ? "positive" : ""}`}>{down ? <ArrowDownRight size={14} /> : up ? <ArrowUpRight size={14} /> : warning ? <AlertTriangle size={14} /> : <Activity size={14} />}{change}</div></article>;
}

function Driver({ label, value, count, color }: { label: string; value: number; count: string; color: string }) {
  return <div className="driver-row"><div className="driver-label"><span>{label}</span><strong>{count}</strong></div><div className="driver-track"><span className={color} style={{ width: value + "%" }} /></div><div className="driver-percent">{value}%</div></div>;
}

export default App;
