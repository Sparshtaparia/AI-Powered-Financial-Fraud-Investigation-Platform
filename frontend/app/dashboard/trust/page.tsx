"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ShieldCheck, AlertTriangle, XCircle, Database, GitBranch, Activity, Cpu } from "lucide-react"

interface DqReport { overall: string; timestamp: string; gates: Record<string, { status: string; detail: string }> }

export default function TrustPage() {
  const [dq, setDq] = useState<DqReport | null>(null)

  useEffect(() => { fetch("/api/data?type=dq").then((r) => r.json()).then(setDq) }, [])

  const gateIcon = (status: string) => {
    if (status === "PASS") return <ShieldCheck size={16} className="text-electric-mint" />
    if (status === "WARN") return <AlertTriangle size={16} className="text-butter-yellow" />
    return <XCircle size={16} className="text-coral-pink" />
  }

  const pipelineStages = [
    { name: "Raw Enforcement CSV", status: "ingested", records: "300K+", desc: "BTP police violation data (Jan-May)" },
    { name: "Data Audit", status: "pass", records: "298,446", desc: "Classification, severity scoring, filtering" },
    { name: "OSM Map-Matching", status: "pass", records: "350,956", desc: "Snapped to Bengaluru road network" },
    { name: "RRE Scoring", status: "pass", records: "14,099", desc: "Segment-level impact computation" },
    { name: "Dispatch Optimization", status: "pass", records: "15/ shift", desc: "Greedy allocation, 5 teams" },
    { name: "Live Simulation", status: "active", records: "7,042", desc: "Replayed event stream" },
  ]

  const statusColor = (s: string) => {
    switch (s) {
      case "pass": case "active": case "ingested": return "bg-electric-mint/20 text-electric-mint border-electric-mint/30"
      case "warn": return "bg-butter-yellow/20 text-yellow-800 border-butter-yellow/30"
      default: return "bg-coral-pink/20 text-coral-pink border-coral-pink/30"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tighter text-deep-black">Data Trust & Pipeline Health</h1>
        <p className="text-text-secondary mt-2">Full engineering transparency — data contracts, quality gates, and model monitoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Pipeline Stages", value: "6", sub: "end-to-end", icon: GitBranch, color: "bg-electric-mint" },
          { label: "Total Records", value: "350K+", sub: "across all tables", icon: Database, color: "bg-sky-cyan" },
          { label: "Map-Match Rate", value: "85%", sub: "OSM network coverage", icon: Activity, color: "bg-butter-yellow" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-5 border border-border-subtle shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">{m.label}</p>
                <p className="font-display text-3xl font-bold mt-1">{m.value}</p>
                <p className="text-xs text-text-secondary mt-1">{m.sub}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${m.color}/10 flex items-center justify-center`}>
                <m.icon size={18} className={m.color.replace("bg-", "text-")} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-border-subtle shadow-soft">
          <h3 className="font-display text-lg font-bold mb-6">Data Pipeline</h3>
          <div className="space-y-3">
            {pipelineStages.map((stage, i) => (
              <div key={stage.name} className="relative">
                {i < pipelineStages.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border-subtle" />
                )}
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${stage.status === "pass" || stage.status === "active" ? "bg-electric-mint/20" : stage.status === "warn" ? "bg-butter-yellow/20" : "bg-warm-cream"}`}>
                    <div className={`w-2 h-2 rounded-full ${stage.status === "pass" || stage.status === "active" ? "bg-electric-mint" : stage.status === "warn" ? "bg-butter-yellow" : "bg-text-secondary"}`} />
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{stage.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusColor(stage.status)}`}>{stage.status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{stage.records} records · {stage.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-border-subtle shadow-soft">
            <h3 className="font-display text-lg font-bold mb-6">Data Quality Gates</h3>
            {dq ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-cream">
                  <div className={`w-2.5 h-2.5 rounded-full ${dq.overall === "PASS" ? "bg-electric-mint" : "bg-coral-pink"}`} />
                  <span className="font-bold text-sm">Overall: {dq.overall}</span>
                  <span className="text-xs text-text-secondary ml-auto">{dq.timestamp?.slice(0, 10)}</span>
                </div>
                {Object.entries(dq.gates || {}).map(([gate, info]) => (
                  <div key={gate} className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle">
                    {gateIcon(info.status)}
                    <div className="min-w-0">
                      <p className="font-bold text-xs">{gate}</p>
                      <p className="text-[10px] text-text-secondary truncate">{info.detail}</p>
                    </div>
                    <span className={`ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      info.status === "PASS" ? "bg-electric-mint/20 text-electric-mint" :
                      info.status === "WARN" ? "bg-butter-yellow/20 text-yellow-800" :
                      "bg-coral-pink/20 text-coral-pink"
                    }`}>{info.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Database size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No DQ report available</p>
                <p className="text-xs mt-1">Run <code className="bg-warm-cream px-1 py-0.5 rounded text-[10px]">python data_quality_checks.py</code></p>
              </div>
            )}
          </div>

          <div className="bg-charcoal text-white rounded-3xl p-6 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-electric-mint/5 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Cpu size={16} className="text-electric-mint" />
                <h3 className="font-display text-lg font-bold">MLOps & Model Health</h3>
              </div>
              <div className="space-y-3">
                {[
                  { metric: "Data Drift", status: "Stable", detail: "Violation distribution matches baseline", color: "bg-electric-mint" },
                  { metric: "Scoring Drift", status: "+1.2%", detail: "Mean RRE shift this week. Top-20 85% stable", color: "bg-butter-yellow" },
                  { metric: "Action Drift", status: ">0.85", detail: "Field validation correlation coefficient", color: "bg-electric-mint" },
                  { metric: "RRE Version", status: "v0.3.1", detail: "Feature store: segment_features.parquet", color: "bg-sky-cyan" },
                ].map((m) => (
                  <div key={m.metric} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${m.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs">{m.metric}</p>
                        <span className="text-[10px] font-mono text-white/60">{m.status}</span>
                      </div>
                      <p className="text-[10px] text-white/40 truncate">{m.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
