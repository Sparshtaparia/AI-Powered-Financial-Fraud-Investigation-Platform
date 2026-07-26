"use client"

import { ShieldAlert, Fingerprint, Map, AlertTriangle, ArrowRight, Activity, Network } from "lucide-react"

interface InvestigationReportProps {
  state: any
  selectedZone: any
}

export function InvestigationReport({ state, selectedZone }: InvestigationReportProps) {
  if (!state || state.status !== 'COMPLETED') return null

  const recommendations = state.summary?.recommendations || []
  const metrics = [
    { label: "Confidence Score", value: "94%", color: "text-emerald-500" },
    { label: "Entities Analyzed", value: "1,432", color: "text-zinc-200" },
    { label: "Risk Vectors", value: "7 Detected", color: "text-amber-500" },
    { label: "Evidence Status", value: "Anchored", color: "text-zinc-200" },
  ]

  return (
    <div className="w-full mx-auto space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Executive Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{m.label}</p>
            <p className={`text-2xl font-medium tracking-tight ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Report Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="w-5 h-5 text-zinc-400" />
              <h3 className="text-lg font-medium text-zinc-100 tracking-wide">Executive Intelligence Summary</h3>
            </div>
            <div className="space-y-4">
              {recommendations.map((rec: string, i: number) => (
                <p key={i} className="text-sm text-zinc-400 leading-relaxed">{rec}</p>
              ))}
              {!recommendations.length && (
                <p className="text-sm text-zinc-500 italic">Analysis complete. No severe anomalies detected for this entity profile in the requested time window.</p>
              )}
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Network className="w-5 h-5 text-zinc-400" />
              <h3 className="text-lg font-medium text-zinc-100 tracking-wide">Detected Topologies</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="pb-3 font-medium px-4">Entity ID</th>
                    <th className="pb-3 font-medium px-4">Type</th>
                    <th className="pb-3 font-medium px-4">Risk Level</th>
                    <th className="pb-3 font-medium px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs">C-99381-X</td>
                    <td className="py-4 px-4">Shell Corp</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider">Critical</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-zinc-500 hover:text-zinc-300 transition-colors">Review <ArrowRight size={14} className="inline ml-1" /></button>
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs">A-11029-B</td>
                    <td className="py-4 px-4">Mule Account</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-[10px] font-bold uppercase tracking-wider">High</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-zinc-500 hover:text-zinc-300 transition-colors">Review <ArrowRight size={14} className="inline ml-1" /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Info */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
              <Fingerprint className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-medium text-zinc-100 tracking-wide">Evidence Ledger</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              This investigation has been securely committed to the cryptographic ledger. Any modifications to underlying data will invalidate the evidence chain.
            </p>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-500 break-all">
              hash: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
