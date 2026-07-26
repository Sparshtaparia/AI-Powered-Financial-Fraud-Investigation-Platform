"use client"

import { useEffect, useState, useMemo } from "react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts"
import {
  TrendingUp, TrendingDown, Shield, AlertTriangle, Clock, MapPin,
  Building2, Route, Gauge, ArrowUpRight, ArrowDownRight, FilterX,
} from "lucide-react"
import { useCrossFilters } from "@/lib/filters"
import { EPQ_LABELS, type EpqQuadrant } from "@/lib/methodology"
import { cn } from "@/lib/utils"

interface Analytics {
  totalViolations: number; totalSegments: number; criticalZones: number; peakCapLoss: number; avgRre: number
  topVehicleTypes: { type: string; count: number }[]
  hourlyPattern: { hour: number; count: number }[]
  dayOfWeekPattern: { day: string; count: number }[]
  offenceDistribution: { code: string; count: number }[]
  highwayDistribution: { highway: string; count: number }[]
  policeStationRanking: { station: string; count: number }[]
  topRoads: { road: string; score: number; violations: number; capLoss: number }[]
  enforcementShift: { shift: string; count: number }[]
  weeklyTrend: { week: string; violations: number; rre: number }[]
  mapMatched: { total: number; matched: number; failed: number }
  persistenceTrend: { days: number; segments: number }[]
  quadrantDistribution: { q1: number; q2: number; q3: number; q4: number }
  totalPicqScore: number
}

interface Congestion {
  congestionHotspots: { road: string; score: number; violations: number; capLoss: number; persistence: number; highway: string; severity: "critical" | "high" | "medium" | "low" }[]
  zoneClusters: { zone: string; roads: string[]; totalScore: number; avgCapLoss: number; roadCount: number }[]
  trendForecast: { week: string; predicted: number; lower: number; upper: number }[]
  impactDistribution: { range: string; count: number }[]
  congestionSummary: { totalCongestionScore: number; criticalSegments: number; avgImpactPerSegment: number; topHighwayClass: string; peakCongestionHours: string; enforcementGap: number }
}

const COLORS = ["#18D68B", "#F6E85D", "#FF6B73", "#BFEFF3", "#2064FF", "#A78BFA", "#FB923C"]
const OFFENCE_LABELS: Record<string, string> = {
  "[112]": "Wrong Parking", "[113]": "No Parking", "[107,112]": "Main Road + Wrong",
  "[107,113]": "Main Road + No Parking", "[113,116]": "No Parking + Defective Plate",
  "[112,116]": "Wrong Parking + Defective Plate", "[107]": "Main Road",
  "[112,111]": "Wrong Parking + Near Bus Stop",
}

export default function OverviewPage() {
  const [a, setA] = useState<Analytics | null>(null)
  const [c, setC] = useState<Congestion | null>(null)
  const [loading, setLoading] = useState(true)
  const f = useCrossFilters()

  useEffect(() => {
    Promise.all([
      fetch("/api/data?type=analytics").then((r) => r.json()),
      fetch("/api/data?type=congestion").then((r) => r.json()),
    ]).then(([analytics, congestion]) => {
      setA(analytics)
      setC(congestion)
    }).finally(() => setLoading(false))
  }, [])

  const filteredHourly = useMemo(() => {
    if (!a?.hourlyPattern) return []
    if (!f.hourRange && !f.dayOfWeek && !f.highway) return a.hourlyPattern
    let data = a.hourlyPattern
    if (f.hourRange) data = data.filter((h) => h.hour >= f.hourRange![0] && h.hour <= f.hourRange![1])
    return data
  }, [a?.hourlyPattern, f.hourRange, f.dayOfWeek, f.highway])

  const filteredDayOfWeek = useMemo(() => {
    if (!a?.dayOfWeekPattern) return []
    if (f.dayOfWeek) return a.dayOfWeekPattern.filter((d) => d.day === f.dayOfWeek)
    return a.dayOfWeekPattern
  }, [a?.dayOfWeekPattern, f.dayOfWeek])

  const filteredHighways = useMemo(() => {
    if (!a?.highwayDistribution) return []
    if (f.highway) return a.highwayDistribution.filter((h) => h.highway === f.highway)
    return a.highwayDistribution
  }, [a?.highwayDistribution, f.highway])

  const filteredRoads = useMemo(() => {
    if (!a?.topRoads) return []
    let data = a.topRoads
    if (f.highway) data = data.filter((r) => r.road.toLowerCase().includes(f.highway!.toLowerCase()))
    if (f.severity) {
      const threshold = f.severity === "critical" ? 70 : f.severity === "high" ? 50 : f.severity === "medium" ? 30 : 0
      data = data.filter((r) => r.score >= threshold)
    }
    return data
  }, [a?.topRoads, f.highway, f.severity])

  const filteredHotspots = useMemo(() => {
    if (!c?.congestionHotspots) return []
    let data = c.congestionHotspots
    if (f.severity) data = data.filter((h) => h.severity === f.severity)
    if (f.highway) data = data.filter((h) => h.highway === f.highway)
    return data
  }, [c?.congestionHotspots, f.severity, f.highway])

  const filteredPolice = useMemo(() => {
    if (!a?.policeStationRanking) return []
    if (f.policeStation) return a.policeStationRanking.filter((p) => p.station === f.policeStation)
    return a.policeStationRanking
  }, [a?.policeStationRanking, f.policeStation])

  const KpiCard = ({ label, value, trend, trendUp, icon: Icon, color, onClick }: {
    label: string; value: string; trend?: string; trendUp?: boolean; icon: React.ElementType; color: string; onClick?: () => void
  }) => (
    <div onClick={onClick} className={cn(
      "bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-border-subtle shadow-soft relative overflow-hidden group transition-all duration-300",
      onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-border-subtle/80" : ""
    )}>
      <div className={`absolute top-0 left-0 w-full h-1 opacity-80 group-hover:opacity-100 transition-opacity ${color}`} />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{label}</p>
          <p className="font-display text-3xl font-bold tracking-tighter text-deep-black">{value}</p>
          {trend && (
            <p className={`flex items-center gap-1 text-xs font-bold ${trendUp ? "text-electric-mint" : "text-coral-pink"}`}>
              {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${color}/10 flex items-center justify-center`}>
          <Icon size={20} className={color.replace("bg-", "text-")} />
        </div>
      </div>
    </div>
  )

  const activeCount = f.activeCount()

  if (loading || !a || !c) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-electric-mint/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 rounded-full bg-electric-mint animate-pulse" />
          </div>
          <p className="text-text-secondary font-bold">Loading intelligence data...</p>
        </div>
      </div>
    )
  }

  const violationFormatted = a.totalViolations >= 100000
    ? `${(a.totalViolations / 100000).toFixed(1)}L`
    : a.totalViolations.toLocaleString()

  const severityColors: Record<string, string> = {
    critical: "#FF6B73", high: "#F6E85D", medium: "#BFEFF3", low: "#18D68B",
  }

  const quadrantBar = (q: EpqQuadrant) => {
    const meta = EPQ_LABELS[q]
    return (
      <button key={q} onClick={() => f.setSeverity(
        q === "Q1" ? "critical" : q === "Q2" ? "high" : q === "Q3" ? "medium" : "low"
      )}
        className={cn(
          "p-3 rounded-xl border text-left transition-all hover:-translate-y-0.5",
          f.severity === (q === "Q1" ? "critical" : q === "Q2" ? "high" : q === "Q3" ? "medium" : "low")
            ? "border-electric-mint bg-electric-mint/5"
            : "border-border-subtle bg-white"
        )}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-[11px] font-bold">{q}</span>
          <span className="text-[9px] text-text-secondary font-bold">{meta.label}</span>
        </div>
        <p className="text-[10px] text-text-secondary mt-1 leading-tight">{meta.action}</p>
      </button>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tighter text-deep-black">Bengaluru Traffic Intelligence</h1>
          <p className="text-text-secondary mt-2">Parking-Induced Congestion Analytics — click any chart element to cross-filter</p>
        </div>
        {activeCount > 0 && (
          <button onClick={f.clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-border-subtle shadow-soft text-sm font-bold hover:bg-coral-pink/5 hover:border-coral-pink/30 transition-colors">
            <FilterX size={14} />
            Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total PICQ Score" value={a.totalPicqScore.toLocaleString(undefined, {maximumFractionDigits: 0})}
          trend="Overall Congestion Impact" trendUp
          icon={AlertTriangle} color="bg-coral-pink" />
        <KpiCard label="High-Recovery Zones" value={a.criticalZones.toLocaleString()}
          trend="RRE > 60" trendUp
          icon={Route} color="bg-electric-mint" />
        <KpiCard label="Enforcement Gap (EGC)" value={`${c.congestionSummary.enforcementGap}%`}
          trend="Unpenalized Impact" trendUp={false}
          icon={Shield} color="bg-butter-yellow" />
        <KpiCard label="Hidden Impact (Q2)" value={a.quadrantDistribution.q2.toString()}
          trend="Low Count, High Impact" trendUp={false}
          icon={Gauge} color="bg-sky-cyan" />
        <KpiCard label="Peak Capacity Proxy" value={`${a.peakCapLoss.toFixed(1)}%`}
          trend="Max single-segment loss" trendUp={false}
          icon={MapPin} color="bg-[#2064FF]" onClick={() => f.setSeverity("critical")} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(["Q1", "Q2", "Q3", "Q4"] as EpqQuadrant[]).map(quadrantBar)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold">Enforcement Time Pattern</h3>
              <p className="text-xs text-text-secondary">{f.hourRange ? `Filtered: ${f.hourRange[0]}:00–${f.hourRange[1]}:00` : "Click a bar to filter by hour"}</p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-electric-mint/10 border border-electric-mint/20">
              <p className="text-[10px] font-bold text-electric-mint">{c.congestionSummary.peakCongestionHours}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={filteredHourly}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18D68B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#18D68B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} stroke="#999" fontSize={11} interval={3} />
              <YAxis stroke="#999" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e0e0e0", fontSize: 12 }}
                formatter={(value: unknown) => [(value as number).toLocaleString(), "Violations"] as any}
                labelFormatter={(h) => `${h}:00 - ${h + 1}:00`} />
              <Area type="monotone" dataKey="count" stroke="#18D68B" fill="url(#hourGrad)" strokeWidth={2}
                onClick={(data: any) => {
                  if (data?.hour !== undefined) {
                    const hour = data.hour as number
                    f.setHourRange(f.hourRange?.[0] === hour ? null : [hour, hour + 1])
                  }
                }}
                style={{ cursor: "pointer" }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-5 gap-2 mt-4">
            {a.enforcementShift.map((s) => (
              <button key={s.shift} onClick={() => {
                const [lo, hi] = s.shift.includes("Dawn") ? [0, 6] : s.shift.includes("Morning") ? [6, 9] : s.shift.includes("Day") ? [9, 15] : s.shift.includes("Evening") ? [15, 18] : [18, 24]
                f.setHourRange(f.hourRange?.[0] === lo ? null : [lo, hi])
              }}
                className={cn(
                  "text-center p-2 rounded-xl transition-all",
                  f.hourRange?.[0] === (s.shift.includes("Dawn") ? 0 : s.shift.includes("Morning") ? 6 : s.shift.includes("Day") ? 9 : s.shift.includes("Evening") ? 15 : 18)
                    ? "bg-electric-mint/20 border border-electric-mint/30"
                    : "bg-warm-cream hover:bg-warm-cream-dark"
                )}>
                <p className="text-[9px] font-bold uppercase text-text-secondary">{s.shift.split(" ")[0]}</p>
                <p className="font-display text-lg font-bold">{s.count.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold">Day-of-Week Distribution</h3>
              <p className="text-xs text-text-secondary">{f.dayOfWeek ? `Filtered: ${f.dayOfWeek}` : "Click a bar to filter by day"}</p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-coral-pink/10 border border-coral-pink/20">
              <p className="text-[10px] font-bold text-coral-pink">62% Thu-Fri</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={a.dayOfWeekPattern}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#999" fontSize={11} tickFormatter={(d) => d.slice(0, 3)} />
              <YAxis stroke="#999" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e0e0e0", fontSize: 12 }}
                formatter={(value: unknown) => [(value as number).toLocaleString(), "Violations"] as any} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} style={{ cursor: "pointer" }}>
                {a.dayOfWeekPattern.map((d, i) => (
                  <Cell key={i} fill={d.day === f.dayOfWeek ? "#2064FF" : i >= 5 ? "#FF6B73" : i >= 4 ? "#F6E85D" : "#18D68B"}
                    onClick={() => f.setDayOfWeek(f.dayOfWeek === d.day ? null : d.day)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-bold">Congestion Impact Hotspots</h3>
            <p className="text-xs text-text-secondary">
              {activeCount > 0 ? `${filteredHotspots.length} matching segments` : "Click a card to filter by severity"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(["critical", "high", "medium", "low"] as const).map((s) => (
              <button key={s} onClick={() => f.setSeverity(f.severity === s ? null : s)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all text-[10px] font-bold",
                  f.severity === s ? "bg-deep-black text-warm-cream" : "hover:bg-white/50"
                )}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors[s] }} />
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {filteredHotspots.slice(0, 8).map((h, i) => (
            <button key={i} onClick={() => f.setSeverity(f.severity === h.severity ? null : h.severity)}
              className={cn(
                "bg-warm-cream rounded-2xl p-4 border text-left transition-all hover:-translate-y-0.5",
                f.severity === h.severity ? "border-electric-mint shadow-sm" : "border-border-subtle"
              )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">#{i + 1}</span>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: severityColors[h.severity] }} />
              </div>
              <p className="font-bold text-sm truncate">{h.road}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="font-mono font-bold">{h.score}</span>
                <span className="text-text-secondary">CCII</span>
                <span className="font-mono ml-auto">{h.violations.toLocaleString()}</span>
                <span className="text-text-secondary">V</span>
              </div>
              <div className="h-1.5 bg-white rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${h.score}%`, backgroundColor: severityColors[h.severity] }} />
              </div>
              <p className="text-[10px] text-text-secondary mt-1">{h.highway} · {h.capLoss}% cap loss</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <h3 className="font-display text-lg font-bold mb-4">Vehicle Type</h3>
          <p className="text-xs text-text-secondary mb-4">{f.vehicleType ? `Selected: ${f.vehicleType}` : "Click a row to filter"}</p>
          <div className="space-y-3">
            {a.topVehicleTypes.slice(0, 6).map((vt, i) => {
              const pct = (vt.count / a.topVehicleTypes.reduce((s, v) => s + v.count, 0) * 100)
              const isActive = f.vehicleType === vt.type
              return (
                <button key={vt.type} onClick={() => f.setVehicleType(isActive ? null : vt.type)}
                  className={cn("w-full text-left transition-all", isActive && "opacity-100")}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={cn("font-bold", isActive ? "text-electric-mint" : "")}>{vt.type}</span>
                    <span className="text-text-secondary font-mono">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-warm-cream rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", isActive && "ring-1 ring-electric-mint")}
                      style={{ width: `${pct}%`, backgroundColor: isActive ? "#18D68B" : COLORS[i % COLORS.length] }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <h3 className="font-display text-lg font-bold mb-4">Offence Classification</h3>
          <p className="text-xs text-text-secondary mb-4">Click segment to filter</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={a.offenceDistribution.slice(0, 5)}
                cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="count" nameKey="code"
                style={{ cursor: "pointer" }}>
                {a.offenceDistribution.slice(0, 5).map((o, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none"
                    onClick={() => f.setPriority(f.priority === o.code ? null : o.code)} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e0e0e0", fontSize: 12 }}
                formatter={(value: unknown, name: unknown) => [(value as number).toLocaleString(), OFFENCE_LABELS[name as string] || name] as any} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {a.offenceDistribution.slice(0, 4).map((o, i) => {
              const isActive = f.priority === o.code
              return (
                <button key={o.code} onClick={() => f.setPriority(isActive ? null : o.code)}
                  className={cn("flex items-center gap-2 text-xs transition-all", isActive && "font-bold")}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? "#18D68B" : COLORS[i] }} />
                  <span className={cn("truncate", isActive ? "text-electric-mint" : "text-text-secondary")}>
                    {OFFENCE_LABELS[o.code] || o.code}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <h3 className="font-display text-lg font-bold mb-4">Highway Class</h3>
          <p className="text-xs text-text-secondary mb-4">{f.highway ? `Filtered: ${f.highway}` : "Click to filter"}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={filteredHighways} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#999" fontSize={11} />
              <YAxis type="category" dataKey="highway" stroke="#999" fontSize={10} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e0e0e0", fontSize: 12 }}
                formatter={(value: unknown) => [(value as number).toLocaleString(), "Segments"] as any} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} style={{ cursor: "pointer" }}>
                {a.highwayDistribution.slice(0, 7).map((h, i) => (
                  <Cell key={i} fill={h.highway === f.highway ? "#18D68B" : COLORS[i % COLORS.length]}
                    onClick={() => f.setHighway(f.highway === h.highway ? null : h.highway)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold">Top 15 Violation Hotspots</h3>
              <p className="text-xs text-text-secondary">
                {activeCount > 0 ? `${filteredRoads.length} matching` : "Click row to drill into road"}
              </p>
            </div>
            <Building2 size={18} className="text-text-secondary" />
          </div>
          <div className="overflow-y-auto max-h-[320px] -mx-2">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">#</th>
                  <th className="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Road</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">RRE</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Violations</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Cap Loss</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoads.map((r, i) => {
                  const isActive = f.roadName === r.road
                  return (
                    <tr key={i} onClick={() => f.setRoadName(isActive ? null : r.road)}
                      className={cn(
                        "border-b border-border-subtle/30 transition-colors",
                        isActive ? "bg-electric-mint/10 cursor-pointer" : "hover:bg-warm-cream cursor-pointer",
                        !isActive && i < 3 ? "bg-warm-cream-dark" : ""
                      )}>
                      <td className="py-2.5 px-2">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          i === 0 ? "bg-butter-yellow text-deep-black" : i === 1 ? "bg-warm-cream-darker text-deep-black" : i === 2 ? "bg-coral-pink/20 text-coral-pink" : "text-text-secondary"
                        )}>{i + 1}</span>
                      </td>
                      <td className="py-2.5 px-2 font-bold truncate max-w-[160px]">{r.road}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold">{r.score.toFixed(1)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{r.violations.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-coral-pink">{r.capLoss.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold">Police Station Caseload</h3>
              <p className="text-xs text-text-secondary">{f.policeStation ? `Filtered: ${f.policeStation}` : "Click row to filter"}</p>
            </div>
            <MapPin size={18} className="text-text-secondary" />
          </div>
          <div className="overflow-y-auto max-h-[320px] -mx-2">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Rank</th>
                  <th className="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Police Station</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Cases</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-text-secondary">Share</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolice.map((ps, i) => {
                  const totalCases = a.policeStationRanking.reduce((s, p) => s + p.count, 0)
                  const share = (ps.count / totalCases * 100)
                  const isActive = f.policeStation === ps.station
                  return (
                    <tr key={i} onClick={() => f.setPoliceStation(isActive ? null : ps.station)}
                      className={cn(
                        "border-b border-border-subtle/30 transition-colors cursor-pointer",
                        isActive ? "bg-electric-mint/10" : "hover:bg-warm-cream"
                      )}>
                      <td className="py-2.5 px-2 text-text-secondary text-xs">{i + 1}</td>
                      <td className="py-2.5 px-2 font-bold truncate max-w-[160px]">{ps.station}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold">{ps.count.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-warm-cream rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", isActive ? "bg-electric-mint" : "bg-electric-mint/50")}
                              style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs text-text-secondary font-mono">{share.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <h3 className="font-display text-lg font-bold mb-6">Weekly Enforcement Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={a.weeklyTrend}>
              <defs>
                <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B73" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B73" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#999" fontSize={11} />
              <YAxis yAxisId="left" stroke="#999" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e0e0e0", fontSize: 12 }} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="violations" stroke="#FF6B73" fill="url(#weekGrad)" strokeWidth={2} name="Violations" />
              <Area yAxisId="right" type="monotone" dataKey="rre" stroke="#18D68B" fill="none" strokeWidth={2} name="Avg RRE" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-border-subtle shadow-soft hover:shadow-md transition-shadow duration-300">
          <h3 className="font-display text-lg font-bold mb-6">Congestion Forecast</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={c.trendForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#999" fontSize={11} />
              <YAxis stroke="#999" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e0e0e0", fontSize: 12 }} />
              <Legend />
              <Area type="monotone" dataKey="upper" stroke="none" fill="#FF6B73" fillOpacity={0.08} name="Upper Bound" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#FF6B73" fillOpacity={0.08} name="Lower Bound" />
              <Line type="monotone" dataKey="predicted" stroke="#18D68B" strokeWidth={2.5} dot={{ fill: "#18D68B", r: 4 }} name="Predicted" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {c.zoneClusters.slice(0, 4).map((zc) => (
          <button key={zc.zone} onClick={() => f.setHighway(f.highway === zc.zone ? null : zc.zone)}
            className={cn(
              "text-white rounded-2xl p-5 border text-left transition-all hover:-translate-y-0.5",
              f.highway === zc.zone ? "bg-electric-mint text-deep-black border-electric-mint" : "bg-charcoal border-white/10"
            )}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{zc.zone}</p>
            <p className="font-display text-3xl font-bold mt-1">{zc.totalScore}</p>
            <p className="text-xs text-white/40 mt-1">{zc.roadCount} roads · avg {zc.avgCapLoss}% cap loss</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {zc.roads.slice(0, 3).map((r, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 truncate max-w-[100px]">{r}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
