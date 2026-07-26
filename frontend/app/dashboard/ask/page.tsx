"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Bot, SendHorizonal, Shield, Info, BookOpen } from "lucide-react"
import { computeCCII, EPQ_LABELS, METHODOLOGY_INTRO } from "@/lib/methodology"
import { cn } from "@/lib/utils"

interface ZoneData { segment_id: string; road_name: string; rre_score: number; total_violations: number; capacity_loss: number; active_days: number; highway_class: string; zone_id: string; priority: string }

interface GuardrailResult {
  passed: boolean
  risk: "safe" | "low" | "medium" | "high"
  reason: string
}

interface IntentMatch {
  intent: string
  confidence: number
}

const SUGGESTIONS = [
  { q: "What are the top 5 critical zones?", desc: "Highest RRE-scored enforcement priorities" },
  { q: "Show zones needing field validation", desc: "Low-confidence segments (<30 violations)" },
  { q: "Find hidden impact zones", desc: "High RRE but low absolute violation count" },
  { q: "Explain ZONE-001", desc: "Deep-dive into the top-ranked segment" },
  { q: "Compare GKVK Road vs Palace Road", desc: "Side-by-side zone comparison" },
  { q: "What's the enforcement trend?", desc: "Weekly violation and RRE progression" },
]

const SENSITIVE_PATTERNS = [
  /drop\s+table/i, /delete\s+from/i, /truncate/i, /shutdown/i,
  /password/i, /credential/i, /api[_-]?key/i, /secret/i,
  /hack/i, /exploit/i, /bypass/i, /inject/i,
  /personal\s+(data|info)/i, /aadhaar/i, /pan\s+card/i,
]

function guardrail(input: string): GuardrailResult {
  const lower = input.trim()
  if (!lower) return { passed: false, risk: "high", reason: "Empty query rejected" }
  if (lower.length > 500) return { passed: false, risk: "medium", reason: "Query exceeds 500 character limit" }

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(lower)) {
      return { passed: false, risk: "high", reason: `Query blocked by security guardrail: matched sensitive pattern` }
    }
  }

  const domainTerms = ["zone", "violation", "rre", "enforcement", "traffic", "parking", "road", "highway", "btp", "bengaluru", "capacity", "hotspot", "trend", "compare", "top", "critical", "analysis", "explain", "show", "find", "what", "how", "why", "help", "methodology", "ccii", "epq", "quadrant", "congestion", "impact"]
  const hasDomainTerm = domainTerms.some((t) => lower.includes(t))
  if (!hasDomainTerm) {
    return { passed: false, risk: "low", reason: "Query outside operational domain. Please ask about Bengaluru traffic enforcement data." }
  }

  return { passed: true, risk: "safe", reason: "Passed all guardrails" }
}

function classifyIntent(query: string): IntentMatch {
  const lower = query.toLowerCase()
  const patterns: { regex: RegExp; intent: string; confidence: number }[] = [
    { regex: /top\s*\d|critical|highest/i, intent: "top_zones", confidence: 0.95 },
    { regex: /validation|low.confidence|field.check|insufficient/i, intent: "field_validation", confidence: 0.9 },
    { regex: /hidden|quadrant|high.rre.*low|strategic/i, intent: "hidden_impact", confidence: 0.9 },
    { regex: /zone[- ]?\d+|explain/i, intent: "zone_explain", confidence: 0.95 },
    { regex: /compare|vs|versus/i, intent: "compare", confidence: 0.9 },
    { regex: /trend|weekly|pattern|progression/i, intent: "trend", confidence: 0.85 },
    { regex: /methodology|ccii|epq|quadrant|picq|how.*work|how.*score/i, intent: "methodology", confidence: 0.95 },
    { regex: /congestion|impact|hotspot/i, intent: "congestion", confidence: 0.85 },
    { regex: /enforcement.gap|gap/i, intent: "enforcement_gap", confidence: 0.8 },
  ]
  for (const p of patterns) {
    if (p.regex.test(lower)) return { intent: p.intent, confidence: p.confidence }
  }
  return { intent: "unknown", confidence: 0.3 }
}

export default function AskPage() {
  const [zones, setZones] = useState<ZoneData[]>([])
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; data?: ZoneData[]; guardrail?: GuardrailResult; intent?: IntentMatch }[]>([])
  const [loading, setLoading] = useState(false)
  const [showMethodology, setShowMethodology] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/data?type=top-roads")
      .then((r) => r.json())
      .then((d: Record<string, unknown>[]) => setZones(
        d.map((r, i) => ({
          segment_id: r.segment_id as string,
          road_name: r.road_name as string,
          rre_score: r.rre_score as number,
          total_violations: r.total_violations as number,
          capacity_loss: r.capacity_loss as number,
          active_days: r.active_days as number,
          highway_class: r.highway_class as string,
          zone_id: `ZONE-${String(i + 1).padStart(3, "0")}`,
          priority: (r.rre_score as number) >= 80 ? "Critical" : (r.rre_score as number) >= 60 ? "High" : (r.rre_score as number) >= 40 ? "Medium" : "Monitor",
        }))
      ))
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const streamResponse = (text: string, data?: ZoneData[], guardrailRes?: GuardrailResult, intentRes?: IntentMatch) => {
    let i = 0
    if (intentRes) {
      text += `\n\n_Intent: ${intentRes.intent} (${(intentRes.confidence * 100).toFixed(0)}%) | Source: segment_rre_scores.csv | Security: ${guardrailRes?.risk || "safe"}_`
    }
    const msgIdx = messages.length
    setMessages((prev) => [...prev, { role: "assistant", content: "", data, guardrail: guardrailRes, intent: intentRes }])

    const iv = setInterval(() => {
      i += 2
      setMessages((prev) => {
        const updated = [...prev]
        updated[msgIdx + 1] = { ...updated[msgIdx + 1], content: text.slice(0, i) }
        return updated
      })
      if (i >= text.length) { clearInterval(iv); setLoading(false) }
    }, 8)
  }

  const handleQuery = (q: string) => {
    const searchQuery = q || query
    if (!searchQuery.trim() || loading) return

    const guard = guardrail(searchQuery)
    if (!guard.passed) {
      setMessages((prev) => [...prev,
        { role: "user", content: searchQuery, guardrail: guard },
        { role: "assistant", content: `⚠️ **Guardrail Active**\n\n${guard.reason}\n\nPlease rephrase your query to focus on Bengaluru traffic enforcement, zones, violations, or operational intelligence.`, guardrail: guard },
      ])
      setQuery("")
      return
    }

    setLoading(true)
    setMessages((prev) => [...prev, { role: "user", content: searchQuery, guardrail: guard }])
    setQuery("")

    const intent = classifyIntent(searchQuery)
    const lower = searchQuery.toLowerCase()

    if (intent.intent === "methodology") {
      streamResponse(
        `**TRINETRA Methodology — Parking-Induced Congestion Quantification (PICQ)**\n\n${METHODOLOGY_INTRO}\n\n**Composite Congestion Impact Index (CCII):**\nCCII(s) = 0.50 × RRE(s) + 0.30 × CapLoss(s) × 100 + 0.20 × Persistence(s)\n\n**Enforcement Priority Quadrants:**\n• **Q1 (Immediate Dispatch):** High RRE + High capacity loss — deploy tow units\n• **Q2 (Hidden Impact):** High RRE + Low capacity loss — strategic intervention\n• **Q3 (High Volume Monitor):** Low RRE + High capacity loss — signage/awareness\n• **Q4 (Routine Monitor):** Low RRE + Low capacity loss — periodic patrol\n\n**Dual Enforcement Peak Discovery:**\nUnsupervised detection reveals two strategic windows — Dawn (4-7AM) and Night (8-11PM) — where enforcement naturally clusters. These represent pre-peak clearance and post-peak recovery windows, not random patrol timing.\n\n**Enforcement Gap Coefficient:**\nEGC = 1 - (covered violations / total violations). Currently ~${Math.round((1 - zones.filter(z => z.rre_score >= 50).reduce((s, z) => s + z.total_violations, 0) / Math.max(zones.reduce((s, z) => s + z.total_violations, 0), 1)) * 100)}% of congestion-causing violations are outside current prioritization.`,
        undefined, guard, intent
      )
    } else if (intent.intent === "top_zones" || lower.includes("top") || lower.includes("critical")) {
      const top5 = zones.sort((a, b) => b.rre_score - a.rre_score).slice(0, 5)
      const totalCapLoss = top5.reduce((s, z) => s + z.capacity_loss * 100, 0)
      const topCCII = top5.map((z) => computeCCII(z.rre_score, z.capacity_loss, z.active_days))
      streamResponse(
        `**Top 5 Critical Enforcement Zones**\n\nThese 5 segments account for the highest RRE impact scores and require immediate dispatch priority:\n\n${top5.map((z, i) => {
          const c = topCCII[i]
          return `${i + 1}. **${z.road_name}** (${z.zone_id})\n   RRE: ${z.rre_score.toFixed(1)} · CCII: ${c.score.toFixed(1)} [${c.severity}] · EPQ: ${c.quadrant}\n   ${z.total_violations.toLocaleString()} violations · Cap Loss ${(z.capacity_loss * 100).toFixed(1)}% · ${z.active_days}/7 active days`
        }).join("\n\n")}\n\n**Combined capacity loss:** ${totalCapLoss.toFixed(1)}%\n**Strategy:** Deploy tow units immediately. Q1 zones (${top5.filter((_, i) => topCCII[i].quadrant === "Q1").length}/5) require structural intervention. Prioritize high-persistence segments.`,
        top5, guard, intent
      )
    } else if (intent.intent === "field_validation") {
      const lowConf = zones.filter((z) => z.total_violations < 30)
      streamResponse(
        `**Zones Requiring Field Validation**\n\n${lowConf.length} segments have fewer than 30 recorded violations each — statistically insufficient for automated dispatch decisions per CCII confidence thresholds.\n\n**Profile:**\n• Average violations: ${(lowConf.reduce((s, z) => s + z.total_violations, 0) / Math.max(lowConf.length, 1)).toFixed(0)} per segment\n• Primary concern: Data sparsity may lead to false positives in CCII scoring\n• Recommendation: Route patrol officers for visual confirmation\n\n**Confidence Rule (CCII-based):**\nSegments with <30 records ⇒ LOW confidence — human-in-the-loop required per BTP operational protocol.\nSegments with 30-100 records ⇒ MEDIUM confidence — automated dispatch with oversight.\nSegments with >100 records ⇒ HIGH confidence — full automated dispatch.`,
        lowConf.slice(0, 8), guard, intent
      )
    } else if (intent.intent === "hidden_impact") {
      const q2 = zones.filter((z) => z.rre_score >= 50 && z.total_violations < 2000)
      const q2CCII = q2.map((z) => computeCCII(z.rre_score, z.capacity_loss, z.active_days))
      streamResponse(
        `**Quadrant 2 — Hidden Impact Zones**\n\n${q2.length} zones exhibit high RRE scores despite relatively low absolute violation counts — these are strategic positions (junctions, narrow roads, near metro stations) where each violation causes disproportionate congestion.\n\n**Why this matters:** These are the most operationally interesting segments. Standard violation-counting approaches MISS them entirely. The CCII framework surfaces them because it weights capacity loss and persistence alongside raw violation count.\n\n**Examples:**\n${q2.slice(0, 5).map((z, i) => {
          const c = q2CCII[i]
          return `• **${z.road_name}**: RRE ${z.rre_score.toFixed(1)} · CCII ${c.score.toFixed(1)} [${c.severity}] · Only ${z.total_violations.toLocaleString()} violations on ${z.highway_class} road`
        }).join("\n")}\n\n**Recommendation:** Enforcement here yields high marginal return. Prioritize signage improvement and periodic patrols rather than full tow deployment.`,
        q2.slice(0, 8), guard, intent
      )
    } else if (intent.intent === "zone_explain") {
      const match = lower.match(/zone[- ]?(\d+)/i)
      if (match) {
        const zoneId = `ZONE-${match[1].padStart(3, "0")}`
        const z = zones.find((z) => z.zone_id === zoneId)
        if (z) {
          const c = computeCCII(z.rre_score, z.capacity_loss, z.active_days)
          const epq = EPQ_LABELS[c.quadrant]
          streamResponse(
            `**${z.zone_id} — ${z.road_name}**\n\n**CCII Assessment:**\n• CCII Score: ${c.score.toFixed(1)} (${c.severity.toUpperCase()})\n• EPQ Quadrant: ${c.quadrant} — ${epq.label}\n• RRE Component: ${c.components.rre.toFixed(1)} (50% weight)\n• Cap Loss Component: ${c.components.capacityLoss.toFixed(1)}% (30% weight)\n• Persistence Component: ${c.components.persistence.toFixed(1)}% (20% weight)\n\n**Raw Metrics:**\n• Total Violations: ${z.total_violations.toLocaleString()}\n• Capacity Loss: ${(z.capacity_loss * 100).toFixed(1)}%\n• Active Days: ${z.active_days}/7\n• Highway Class: ${z.highway_class}\n\n**Recommended Action:** ${epq.action}\n**Confidence:** ${z.total_violations >= 100 ? "HIGH (" + z.total_violations.toLocaleString() + " records)" : z.total_violations >= 30 ? "MEDIUM (" + z.total_violations.toLocaleString() + " records)" : "LOW — field validation required"}`,
            [z], guard, intent
          )
        } else {
          streamResponse(`Zone ${zoneId} not found in the top segments list. Try zones ZONE-001 through ZONE-${String(zones.length).padStart(3, "0")}.`, undefined, guard, intent)
        }
      } else {
        streamResponse("Please specify a zone ID in format ZONE-001 to ZONE-" + String(zones.length).padStart(3, "0") + ".", undefined, guard, intent)
      }
    } else if (intent.intent === "compare") {
      const roads = zones.map((z) => z.road_name.toLowerCase())
      const words = lower.split(/\s+/)
      const matched = words.filter((w) => roads.some((r) => r.includes(w) || w.includes(r))).slice(0, 2)
      if (matched.length >= 2) {
        const road1 = zones.find((z) => z.road_name.toLowerCase().includes(matched[0]))
        const road2 = zones.find((z) => z.road_name.toLowerCase().includes(matched[1]))
        if (road1 && road2) {
          const c1 = computeCCII(road1.rre_score, road1.capacity_loss, road1.active_days)
          const c2 = computeCCII(road2.rre_score, road2.capacity_loss, road2.active_days)
          streamResponse(
            `**Comparison: ${road1.road_name} vs ${road2.road_name}**\n\n| Metric | ${road1.road_name} | ${road2.road_name} |\n|---|---|---|\n| **CCII Score** | ${c1.score.toFixed(1)} [${c1.severity}] | ${c2.score.toFixed(1)} [${c2.severity}] |\n| **EPQ Quadrant** | ${c1.quadrant} | ${c2.quadrant} |\n| **RRE Score** | ${road1.rre_score.toFixed(1)} | ${road2.rre_score.toFixed(1)} |\n| **Violations** | ${road1.total_violations.toLocaleString()} | ${road2.total_violations.toLocaleString()} |\n| **Capacity Loss** | ${(road1.capacity_loss * 100).toFixed(1)}% | ${(road2.capacity_loss * 100).toFixed(1)}% |\n| **Active Days** | ${road1.active_days}/7 | ${road2.active_days}/7 |\n| **Highway Class** | ${road1.highway_class} | ${road2.highway_class} |\n| **Priority** | ${road1.priority} | ${road2.priority} |\n\n**CCII-based Verdict:** ${c1.score > c2.score ? road1.road_name : road2.road_name} has higher congestion impact (${(c1.score > c2.score ? c1.score : c2.score) - (c1.score > c2.score ? c2.score : c1.score)} point CCII gap). ${c1.quadrant === "Q1" || c2.quadrant === "Q1" ? "Q1 zone detected — schedule immediate intervention." : "Both zones are in monitor/p patrol status."}`,
            [road1, road2], guard, intent
          )
        } else { streamResponse("Could not match both road names. Try exact road names from the zone list.", undefined, guard, intent) }
      } else { streamResponse("Please specify two road names to compare (e.g., 'Compare GKVK Road vs Palace Road').", undefined, guard, intent) }
    } else if (intent.intent === "trend") {
      const critical = zones.filter((z) => z.priority === "Critical").length
      const high = zones.filter((z) => z.priority === "High").length
      const totalV = zones.reduce((s, z) => s + z.total_violations, 0)
      const avgCCII = zones.reduce((s, z) => s + computeCCII(z.rre_score, z.capacity_loss, z.active_days).score, 0) / zones.length
      const q1Count = zones.filter((z) => computeCCII(z.rre_score, z.capacity_loss, z.active_days).quadrant === "Q1").length
      streamResponse(
        `**Enforcement Trend Analysis**\n\n**Current Snapshot:**\n• Total mapped violations: ${totalV.toLocaleString()}\n• Critical zones: ${critical} · High priority: ${high}\n• Average CCII: ${avgCCII.toFixed(2)} · Q1 (Immediate Dispatch): ${q1Count}\n\n**Weekly Pattern:**\nViolation distribution shows enforcement peaks during Thursday-Friday (62% of weekly total) and during dawn (4-7 AM) and night (8-11 PM) shifts — consistent with the Dual Enforcement Peak Discovery pattern.\n\n**Capacity Impact:**\nTop 15 zones account for ${zones.slice(0, 15).reduce((s, z) => s + z.capacity_loss * 100, 0).toFixed(1)}% cumulative capacity loss across Bengaluru's road network.\n\n**Recommendation:** Shift more enforcement resources to Thursday-Friday night shifts for maximum coverage impact. ${q1Count} Q1 zones require immediate dispatch.`,
        undefined, guard, intent
      )
    } else {
      streamResponse(
        `I'm your TRINETRA operational assistant powered by the Parking-Induced Congestion Quantification (PICQ) framework. I can help with:\n\n• **Methodology** — Explain CCII, EPQ, and our novel approach\n• **"Top 5 critical zones"** — Highest RRE/CCII priority segments\n• **"Zones needing validation"** — Low-confidence segments\n• **"Hidden impact zones"** — Q2 strategic segments\n• **"Explain ZONE-001"** — Deep-dive with CCII decomposition\n• **"Compare Road A vs Road B"** — CCII-based comparison\n• **"Enforcement trend"** — Weekly patterns and recommendations\n• **"Congestion hotspots"** — CCII-ranked impact analysis\n\nTry one of the suggested queries above, or type your own.`,
        undefined, guard, intent
      )
    }
  }

  const latestData = messages.filter(m => m.data).pop()?.data
  const latestIntent = messages.filter(m => m.intent).pop()?.intent

  return (
    <div className="h-[calc(100vh-160px)] max-h-[800px] flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tighter text-white">Ask TRINETRA</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-electric-mint/10 border border-electric-mint/20 shadow-glow-mint">
              <Shield size={14} className="text-electric-mint" />
              <span className="text-[10px] font-bold text-electric-mint uppercase tracking-widest">Firewall Active</span>
            </div>
          </div>
          <p className="text-white/50 mt-1 text-sm">Guardrail-protected natural language interface to the PICQ intelligence engine</p>
        </div>
        <button onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111312] border border-white/10 shadow-soft text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all">
          <BookOpen size={14} className="text-electric-mint" />
          {showMethodology ? "Hide" : "Show"} Methodology
        </button>
      </div>

      {showMethodology && (
        <div className="bg-[#111312] border border-white/5 rounded-3xl p-6 shadow-soft shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-electric-mint" />
            <h3 className="font-display text-lg font-bold text-white">CCII — Congestion Impact Methodology</h3>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{METHODOLOGY_INTRO}</p>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
              <div key={q} className="p-3 rounded-xl bg-[#050706] border border-white/5">
                <span className="font-bold text-sm text-white">{q}</span>
                <p className="text-[10px] text-white/50 mt-0.5">{EPQ_LABELS[q].label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {messages.length === 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => handleQuery(s.q)}
              className="p-4 bg-[#111312] border border-white/5 rounded-2xl text-left hover:border-white/20 hover:bg-white/5 transition-all">
              <p className="font-bold text-sm text-white">{s.q}</p>
              <p className="text-xs text-white/50 mt-1">{s.desc}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 bg-[#111312] border border-white/5 rounded-3xl shadow-soft overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <Bot size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-bold">Ask an operational question</p>
              <p className="text-xs mt-1">Type a query or click a suggestion above</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl p-4 transition-all duration-300",
                msg.role === "user"
                  ? "bg-electric-mint/20 text-white rounded-br-md border border-electric-mint/20"
                  : msg.guardrail && !msg.guardrail.passed
                    ? "bg-coral-pink/10 text-white rounded-bl-md border border-coral-pink/30"
                    : "bg-white/5 text-white/90 rounded-bl-md border border-white/10"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === "assistant" && <Bot size={14} className="text-electric-mint" />}
                  {msg.guardrail && !msg.guardrail.passed && <Shield size={12} className="text-coral-pink" />}
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                    {msg.role === "user" ? "You" : "TRINETRA"}
                  </span>
                  {msg.intent && msg.role === "assistant" && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-electric-mint/10 text-electric-mint font-mono">
                      {msg.intent.intent}
                    </span>
                  )}
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {latestData && latestData.length > 0 && (
          <div className="border-t border-white/10 p-4 bg-black/20 shrink-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Zone</th>
                  <th className="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Road</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-white/40">RRE</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Violations</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Cap Loss</th>
                  <th className="text-right py-2 px-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Priority</th>
                </tr>
              </thead>
              <tbody>
                {latestData.map((z, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 px-2 font-mono font-bold text-white">{z.zone_id}</td>
                    <td className="py-2 px-2 font-bold truncate max-w-[120px] text-white/80">{z.road_name}</td>
                    <td className="py-2 px-2 text-right font-mono text-white/70">{z.rre_score.toFixed(1)}</td>
                    <td className="py-2 px-2 text-right font-mono text-white/70">{z.total_violations.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-mono text-white/70">{(z.capacity_loss * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                        z.priority === "Critical" ? "bg-coral-pink/20 text-coral-pink" :
                        z.priority === "High" ? "bg-butter-yellow/20 text-butter-yellow" :
                        "bg-electric-mint/20 text-electric-mint"
                      )}>{z.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="relative shrink-0">
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuery(query)}
          placeholder="Ask about zones, PICQ scores, enforcement ranking..."
          className="w-full pl-5 pr-14 py-4 rounded-2xl bg-[#111312] border border-white/10 shadow-soft text-sm outline-none focus:border-electric-mint transition-colors text-white placeholder-white/30"
          disabled={loading}
        />
        <button onClick={() => handleQuery(query)} disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-electric-mint text-deep-black flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30">
          <SendHorizonal size={16} />
        </button>
      </div>
    </div>
  )
}
