"use client"

import { useEffect, useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Beaker, Users, Clock, Building2, TrendingUp, Gauge } from "lucide-react"
import { allocateTeams } from "@/lib/optimizer"
import { priorityFromRre } from "@/lib/utils"

interface RreRow { segment_id: string; total_violations: number; active_days: number; capacity_loss: number; rre_score: number; road_name: string; highway_class: string; zone_id: string; priority: string; core_parking_violations?: number; avg_severity?: number; persistence?: number; junction_penalty?: number; demand_multiplier?: number }

const COLORS = ["#18D68B", "#F6E85D", "#FF6B73", "#BFEFF3", "#2064FF", "#A78BFA"]

export default function SimulatePage() {
  const [data, setData] = useState<RreRow[]>([])
  const [numTeams, setNumTeams] = useState(5)
  const [shiftHours, setShiftHours] = useState(4)

  useEffect(() => {
    fetch("/api/data?type=top-roads")
      .then((r) => r.json())
      .then((d: Record<string, unknown>[]) => setData(
        d.map((r, i) => ({
          segment_id: r.segment_id as string,
          total_violations: r.total_violations as number,
          active_days: r.active_days as number,
          capacity_loss: r.capacity_loss as number,
          rre_score: r.rre_score as number,
          road_name: r.road_name as string,
          highway_class: r.highway_class as string,
          zone_id: `ZONE-${String(i + 1).padStart(3, "0")}`,
          priority: priorityFromRre(r.rre_score as number),
        }))
      ))
  }, [])

  const result = useMemo(() => allocateTeams(data, numTeams, shiftHours), [data, numTeams, shiftHours])
  const uniqueTargets = useMemo(() => { const s = new Set<string>(); return result.filter((r) => { const d = s.has(r.Zone); s.add(r.Zone); return !d }) }, [result])

  const totalRecovered = uniqueTargets.reduce((s, r) => s + r["Expected Recovery"], 0)
  const zonesCovered = uniqueTargets.length
  const totalHours = numTeams * shiftHours
  const rrePerHour = totalHours > 0 ? totalRecovered / totalHours : 0
  const criticalCount = data.filter((r) => (r.rre_score || 0) > 60).length
  const highCoverage = criticalCount > 0 ? (zonesCovered / criticalCount) * 100 : 0
  const priorityDist = useMemo(() => {
    const counts: Record<string, number> = {}
    uniqueTargets.forEach((r) => { counts[r.priority] = (counts[r.priority] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [uniqueTargets])

  const teamDist = useMemo(() => {
    const counts: Record<string, number> = {}
    result.forEach((r) => { counts[r.Team] = (counts[r.Team] || 0) + 1 })
    return Object.entries(counts).map(([team, zones]) => ({ team, zones }))
  }, [result])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tighter text-deep-black">Dispatch Simulator</h1>
        <p className="text-text-secondary mt-2">Optimize resource allocation — adjust teams & shifts, measure capacity recovery ROI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-border-subtle shadow-soft">
          <div className="flex items-center gap-2 mb-6">
            <Beaker size={18} className="text-electric-mint" />
            <h3 className="font-display text-lg font-bold">Resource Configuration</h3>
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-text-secondary" />
                  <span className="text-sm font-bold">Tow / Patrol Teams</span>
                </div>
                <span className="font-display text-3xl font-bold text-electric-mint">{numTeams}</span>
              </div>
              <input type="range" min={1} max={15} value={numTeams} onChange={(e) => setNumTeams(Number(e.target.value))} className="w-full accent-electric-mint" />
              <div className="flex justify-between text-xs text-text-secondary mt-1"><span>1</span><span>15</span></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-secondary" />
                  <span className="text-sm font-bold">Shift Duration</span>
                </div>
                <span className="font-display text-3xl font-bold text-electric-mint">{shiftHours}h</span>
              </div>
              <input type="range" min={2} max={8} value={shiftHours} onChange={(e) => setShiftHours(Number(e.target.value))} className="w-full accent-electric-mint" />
              <div className="flex justify-between text-xs text-text-secondary mt-1"><span>2h</span><span>8h</span></div>
            </div>
            <div className="bg-charcoal text-white rounded-2xl p-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total Officer Hours</p>
              <p className="font-display text-4xl font-bold mt-1">{totalHours}</p>
              <div className="h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-electric-mint" style={{ width: `${(totalHours / 120) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border-subtle shadow-soft">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-electric-mint" />
            <h3 className="font-display text-lg font-bold">Projected Impact</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-warm-cream rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Zones Serviced</p>
              <p className="font-display text-3xl font-bold mt-1">{zonesCovered}</p>
              <p className="text-xs text-text-secondary mt-1">{highCoverage.toFixed(0)}% high-priority coverage</p>
            </div>
            <div className="bg-warm-cream rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Capacity Recovery</p>
              <p className="font-display text-3xl font-bold mt-1">{totalRecovered.toFixed(0)}</p>
              <p className="text-xs text-text-secondary mt-1">RRE units recovered</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border-subtle/50">
              <span className="text-sm text-text-secondary">Efficiency</span>
              <span className="font-bold font-mono">{rrePerHour.toFixed(2)} RRE/hr</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-subtle/50">
              <span className="text-sm text-text-secondary">Critical Zones</span>
              <span className="font-bold">{criticalCount}</span>
            </div>
          </div>

          <div className="mt-6 bg-charcoal rounded-2xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2">Recovery Target</p>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-electric-mint transition-all duration-700" style={{ width: `${Math.min((totalRecovered / 200) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-white/30">
              <span>0</span>
              <span>{totalRecovered.toFixed(0)} / 200</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-border-subtle shadow-soft">
          <h3 className="font-display text-lg font-bold mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                {priorityDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {priorityDist.map((p, i) => (
              <div key={p.name} className="text-center">
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[i] }} />
                <p className="text-[10px] font-bold">{p.name}</p>
                <p className="text-xs text-text-secondary">{p.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border-subtle shadow-soft">
          <h3 className="font-display text-lg font-bold mb-4">Team Allocation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={teamDist} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="team" stroke="#999" fontSize={10} />
              <YAxis stroke="#999" fontSize={10} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 11 }} />
              <Bar dataKey="zones" radius={[4, 4, 0, 0]} fill="#18D68B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border-subtle">
          <h3 className="font-display text-lg font-bold">Dispatch Plan</h3>
          <p className="text-xs text-text-secondary">{result.length} actions across {numTeams} units</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-cream/50">
                <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Team</th>
                <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Zone</th>
                <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Time</th>
                <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Action</th>
                <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Recovery</th>
                <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Priority</th>
              </tr>
            </thead>
            <tbody>
              {result.map((r, i) => (
                <tr key={i} className="border-b border-border-subtle/30 hover:bg-warm-cream transition-colors">
                  <td className="py-3 px-4"><span className="font-mono font-bold text-xs">{r.Team}</span></td>
                  <td className="py-3 px-4 font-bold">{r.Zone}</td>
                  <td className="py-3 px-4 font-mono text-xs">{r.Time}</td>
                  <td className="py-3 px-4">{r.Action}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-electric-mint">{r["Expected Recovery"].toFixed(1)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.priority === "Critical" ? "bg-coral-pink/20 text-coral-pink" :
                      r.priority === "High" ? "bg-butter-yellow/20 text-yellow-800" :
                      "bg-electric-mint/20 text-electric-mint"
                    }`}>{r.priority}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
