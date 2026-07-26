import os

base_path = "src/app/(dashboard)"

pages = [
    {"dir": "cases/active", "title": "Active Cases", "type": "grid", "desc": "Queue of unresolved AML cases."},
    {"dir": "cases/completed", "title": "Completed Cases", "type": "grid", "desc": "Historical archive of resolved cases."},
    {"dir": "entities/customers", "title": "Customer 360", "type": "grid", "desc": "Global registry of retail and corporate entities."},
    {"dir": "entities/accounts", "title": "Accounts", "type": "grid", "desc": "Deposit, credit, and offshore accounts."},
    {"dir": "entities/beneficiaries", "title": "Beneficiaries", "type": "grid", "desc": "Known counterparties and external payees."},
    {"dir": "entities/devices", "title": "Device Fingerprints", "type": "grid", "desc": "Tracked mobile and web access devices."},
    {"dir": "intelligence/graph", "title": "Network Graph", "type": "dashboard", "desc": "Multi-hop structural layering detection."},
    {"dir": "intelligence/risk", "title": "Risk Analytics", "type": "dashboard", "desc": "Aggregate risk score distributions and drifts."},
    {"dir": "intelligence/explainability", "title": "Explainability", "type": "dashboard", "desc": "Global SHAP value distributions across models."},
    {"dir": "operations/reports", "title": "Regulatory Reports", "type": "grid", "desc": "Auto-generated SARs and CTRs ready for submission."},
    {"dir": "operations/compliance", "title": "Compliance Status", "type": "dashboard", "desc": "Real-time SLA tracking and regulatory health."},
    {"dir": "operations/audit", "title": "Audit Logs", "type": "grid", "desc": "Immutable ledger of all analyst and AI actions."},
    {"dir": "platform/models", "title": "Model Registry", "type": "dashboard", "desc": "MLflow integrated model versions and metrics."},
    {"dir": "platform/health", "title": "System Health", "type": "dashboard", "desc": "Kafka, Neo4j, and ML Engine latency tracking."},
    {"dir": "platform/settings", "title": "Platform Settings", "type": "dashboard", "desc": "Global configurations and RBAC."}
]

grid_template = """\"use client\";
import React from 'react';
import { Search, Filter, Download } from 'lucide-react';

export default function Page() {
  return (
    <div className="h-full flex flex-col p-6 max-w-[1400px] mx-auto overflow-hidden">
      <div className="flex justify-between items-end border-b border-neutral-800 pb-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-neutral-400 mt-1">{desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-neutral-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-neutral-300 hover:text-white transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="enterprise-panel flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-5 p-4 border-b border-neutral-800 bg-neutral-900/50 text-xs font-bold text-neutral-500 uppercase tracking-widest shrink-0">
          <div>ID / Reference</div>
          <div>Primary Metric</div>
          <div>Status</div>
          <div>Last Updated</div>
          <div className="text-right">Actions</div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-neutral-950 p-2 space-y-1">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} className="grid grid-cols-5 items-center p-3 rounded hover:bg-neutral-900/50 border border-transparent hover:border-neutral-800 transition-colors group cursor-pointer">
              <div className="font-mono text-xs text-neutral-400 group-hover:text-white">REF-00{i}</div>
              <div className="text-[13px] font-bold text-neutral-300">Metric Val {i}</div>
              <div><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20">ACTIVE</span></div>
              <div className="font-mono text-xs text-neutral-500">2 mins ago</div>
              <div className="text-right"><button className="text-xs text-neutral-500 hover:text-[#39FF14]">View</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"""

dashboard_template = """\"use client\";
import React from 'react';
import { Activity, BarChart2, TrendingUp } from 'lucide-react';

export default function Page() {
  return (
    <div className="h-full flex flex-col p-6 max-w-[1400px] mx-auto overflow-hidden">
      <div className="border-b border-neutral-800 pb-4 mb-6 shrink-0">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-neutral-400 mt-1">{desc}</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6 shrink-0">
        {[1,2,3].map(i => (
          <div key={i} className="enterprise-panel p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-neutral-900 rounded flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#39FF14]" />
              </div>
              <span className="text-[10px] text-[#39FF14] font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +14%</span>
            </div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Metric {i}</p>
            <p className="text-3xl font-black text-white">84.2k</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 min-h-[300px]">
        <div className="enterprise-panel p-6 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Distribution Analysis</h3>
          <div className="flex-1 border border-neutral-800 bg-neutral-950 rounded flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, #39FF14 1px, transparent 1px), linear-gradient(180deg, #39FF14 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <BarChart2 className="w-12 h-12 text-neutral-700" />
          </div>
        </div>
        <div className="enterprise-panel p-6 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Time Series</h3>
          <div className="flex-1 border border-neutral-800 bg-neutral-950 rounded flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-gradient-to-tr from-transparent via-[#39FF14] to-transparent"></div>
             <Activity className="w-12 h-12 text-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
"""

for p in pages:
    page_path = os.path.join(base_path, p["dir"], "page.tsx")
    content = ""
    if p["type"] == "grid":
        content = grid_template.replace("{title}", p["title"]).replace("{desc}", p["desc"])
    else:
        content = dashboard_template.replace("{title}", p["title"]).replace("{desc}", p["desc"])
        
    with open(page_path, 'w') as f:
        f.write(content)
        
print("Generated 15 pages.")
