"use client"
import { Suspense, useState, useEffect, useCallback } from 'react'
import { useDataSourceStore } from '@/store/useDataSourceStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapMyIndiaViewer } from '@/components/map/MapMyIndiaViewer'
import { safeParseResponse } from '@/lib/api'
import { Database, Loader2, AlertCircle, FileText, Map, Shield, CheckCircle, TrendingUp, MapPin, Eye, Bot, BarChart3, Info } from 'lucide-react'
import { MetricCard, TabNav, PageHeader, StatusBadge, PanelCard } from '@/components/ui/DesignSystem'

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'historical-description', label: 'Historical Description', icon: Info },
  { id: 'picq-analytics', label: 'PICQ Analytics', icon: BarChart3 },
  { id: 'hotspot-map', label: 'Hotspot Map', icon: MapPin },
  { id: 'hidden-impact-zones', label: 'Hidden Impact Zones', icon: Eye },
  { id: 'enforcement-ranking', label: 'Enforcement Ranking', icon: Shield },
  { id: 'map-intelligence', label: 'Map Intelligence', icon: Map },
  { id: 'audit-verification', label: 'Audit Verification', icon: CheckCircle },
  { id: 'ask-trinetra', label: 'Ask TRINETRA', icon: Bot },
]

const QUADRANT_LABELS: Record<string, string> = { Q1: 'Immediate Dispatch (Q1)', Q2: 'Hidden Impact Zones (Q2)', Q3: 'High Volume Monitor (Q3)', Q4: 'Routine Monitor (Q4)' }
const QUADRANT_COLORS: Record<string, string> = { Q1: 'text-coral-pink', Q2: 'text-butter-yellow', Q3: 'text-sky-cyan', Q4: 'text-white/50' }

export default function StaticDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050706] text-warm-cream flex items-center justify-center"><Loader2 size={32} className="animate-spin text-electric-mint mx-auto mb-4" /><p className="text-white/50">Loading...</p></div>}>
      <StaticDashboard />
    </Suspense>
  )
}

function StaticDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') || 'overview'
  const { mode, status, metricsAvailable, sourceType, fetchStatus } = useDataSourceStore()
  const [summary, setSummary] = useState<any>({})
  const [segments, setSegments] = useState<any[]>([])
  const [enforcementSegments, setEnforcementSegments] = useState<any[]>([])
  const [quadrants, setQuadrants] = useState<any>({})
  const [auditData, setAuditData] = useState<any>(null)
  const [picqDist, setPicqDist] = useState<any>(null)
  const [hiddenZones, setHiddenZones] = useState<any[]>([])
  const [mapSegments, setMapSegments] = useState<any[]>([])
  const [mapLatLonAvailable, setMapLatLonAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(tabParam)

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId)
    useDataSourceStore.getState().updateState({ activeStaticTab: tabId })
    router.push(`/dashboard/static?tab=${tabId}`, { scroll: false })
  }, [router])

  useEffect(() => { fetchStatus() }, [])

  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
      useDataSourceStore.getState().updateState({ activeStaticTab: tabParam })
    }
  }, [tabParam])

  useEffect(() => {
    if (metricsAvailable) {
      setLoading(true); setError(null)
      Promise.all([
        fetch('/api/analytics/summary').then(r => safeParseResponse(r).then(d => d.ok ? d.data : null)),
        fetch('/api/picq/quadrants').then(r => safeParseResponse(r).then(d => d.ok ? d.data : { segments: [] })),
        fetch('/api/analytics/quadrants').then(r => safeParseResponse(r).then(d => d.ok ? d.data : { quadrants: {} })),
        fetch('/api/analytics/audit-verification').then(r => safeParseResponse(r).then(d => d.ok ? d.data : null)),
        fetch('/api/analytics/map-segments').then(r => safeParseResponse(r).then(d => d.ok ? d.data : { segments: [], lat_lon_available: false })),
        fetch('/api/analytics/enforcement-ranking').then(r => safeParseResponse(r).then(d => d.ok ? d.data : { segments: [] })),
        fetch('/api/analytics/picq-distribution').then(r => safeParseResponse(r).then(d => d.ok ? d.data : null)),
        fetch('/api/analytics/hidden-impact-zones').then(r => safeParseResponse(r).then(d => d.ok ? d.data : { zones: [] })),
      ]).then(([summaryData, segmentsData, quadrantsData, audit, mapData, enforceData, picqData, hiddenData]) => {
        if (summaryData?.error) setError(summaryData.error)
        setSummary(summaryData || {})
        setSegments(segmentsData?.segments || [])
        setQuadrants(quadrantsData?.quadrants || {})
        setAuditData(audit)
        setMapSegments(mapData?.segments || [])
        setMapLatLonAvailable(mapData?.lat_lon_available !== false)
        setEnforcementSegments(enforceData?.segments || [])
        setPicqDist(picqData)
        setHiddenZones(hiddenData?.zones || [])
      }).catch(e => setError(e.message)).finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [metricsAvailable])

  if (status === 'not_configured' || mode !== 'static') {
    return (
      <div className="min-h-screen bg-[#050706] text-warm-cream p-12 flex flex-col items-center justify-center font-body">
        <div className="max-w-md bg-[#111312] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white/50"><Database size={32} /></div>
          <h2 className="text-2xl font-display font-bold mb-3">No historical source loaded</h2>
          <p className="text-white/50 mb-8 text-sm">Choose a CSV, processed score file, or sample dataset to generate PICQ intelligence.</p>
          <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">Configure Source</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050706] text-warm-cream flex items-center justify-center">
        <div className="text-center"><Loader2 size={32} className="animate-spin text-electric-mint mx-auto mb-4" /><p className="text-white/50">Loading intelligence data...</p></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050706] text-warm-cream p-4 md:p-6 font-body">
      <PageHeader
        title="Historical Intelligence Dashboard"
        subtitle="Static Mode: analyzing persistent illegal-parking pressure and enforcement recovery potential."
        status={{ label: 'STATIC READY', active: true }}
        sourceLabel={`source: ${sourceType || 'segment_rre_scores.csv'}`}
        rightContent={
          <button onClick={() => router.push('/dashboard')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors">
            Change Data Source
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-coral-pink/10 border border-coral-pink/30 rounded-xl flex items-start gap-3 text-coral-pink text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>{error}. Displaying available metrics.</div>
        </div>
      )}

      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} className="mb-8" />

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Total Analyzed Segments" value={summary?.total_analyzed_segments ?? 0} />
            <MetricCard label="Average PICQ" value={summary?.average_picq?.toFixed(1) ?? '0.0'} />
            <MetricCard label="Peak PICQ" value={summary?.peak_picq?.toFixed(1) ?? '0.0'} accent accentColor="coral" />
            <MetricCard label="Critical RRE Zones" value={summary?.critical_rre_zones ?? 0} accent accentColor="red" />
            <MetricCard label="Hidden Impact Zones" value={summary?.hidden_impact_zones ?? 0} accent accentColor="yellow" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PanelCard title="Top Enforcement Segments" icon={Shield} iconColor="text-electric-mint">
                <div className="overflow-x-auto">
                  {segments.length === 0 ? (
                    <div className="p-12 text-center text-white/30">No segment data available.</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-[10px]">
                        <tr>
                          <th className="p-4 pl-6">Segment / Zone</th>
                          <th className="p-4">PICQ Score</th>
                          <th className="p-4">RRE Score</th>
                          <th className="p-4">Quadrant</th>
                          <th className="p-4 pr-6">Violations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segments.slice(0, 10).map((s: any, i: number) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 pl-6 font-mono font-medium">{s.segment_id || s.zone_id || `SEG-${String(i + 1).padStart(4, '0')}`}</td>
                            <td className="p-4"><div className="flex items-center gap-3"><span className="w-8 text-right font-mono">{typeof s.picq_score === 'number' ? s.picq_score.toFixed(1) : s.picq_score}</span><div className="w-24 bg-white/5 rounded-full h-1.5"><div className="bg-electric-mint h-1.5 rounded-full" style={{ width: `${Math.min(Number(s.picq_score) || 0, 100)}%` }}></div></div></div></td>
                            <td className="p-4 font-mono">{typeof s.rre_score === 'number' ? s.rre_score.toFixed(1) : s.rre_score}</td>
                            <td className="p-4"><StatusBadge status={s.quadrant === 'Q1' ? 'fail' : s.quadrant === 'Q2' ? 'warn' : s.quadrant === 'Q3' ? 'pass' : 'inactive'} label={s.quadrant} /></td>
                            <td className="p-4 pr-6 text-white/70">{s.total_violations || s.violations || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </PanelCard>
            </div>

            <div className="flex flex-col gap-6">
              <PanelCard title="Quadrant Distribution">
                <div className="p-6 space-y-4">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                    const count = quadrants[q] ?? 0
                    return (
                      <div key={q} className="flex justify-between items-center text-sm">
                        <span className={QUADRANT_COLORS[q]}>{QUADRANT_LABELS[q]}</span>
                        <span className={`font-mono font-bold ${QUADRANT_COLORS[q]}`}>{count.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </PanelCard>
              <PanelCard title="Methodology Summary">
                <div className="p-6">
                  <p className="text-sm text-white/50 leading-relaxed">TRINETRA-P calculates Parking-Induced Congestion Quotient (PICQ) by cross-referencing violation volume with road capacity. Road Recovery Estimate (RRE) predicts traffic flow improvement upon enforcement.</p>
                </div>
              </PanelCard>
            </div>
          </div>
        </>
      )}

      {activeTab === 'historical-description' && (
        <PanelCard>
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display text-electric-mint mb-2">Dataset Source</h2>
              <p className="text-white/70">Source: <strong>{sourceType || 'segment_rre_scores.csv'}</strong></p>
              <p className="text-white/50 text-sm mt-1">{summary?.total_analyzed_segments ?? 0} segments loaded for analysis.</p>
            </div>
            <div className="border-t border-white/5 pt-6">
              <h2 className="text-xl font-bold font-display text-electric-mint mb-2">PICQ Methodology</h2>
              <p className="text-white/60 leading-relaxed text-sm">The Parking-Induced Congestion Quotient (PICQ) measures congestion impact severity per road segment. It combines violation volume (Parking Obstruction Pressure), road capacity sensitivity (Road Context Criticality), historical persistence, and demand multipliers into a normalized 0–100 score. Higher PICQ indicates greater enforcement urgency.</p>
            </div>
            <div className="border-t border-white/5 pt-6">
              <h2 className="text-xl font-bold font-display text-electric-mint mb-2">RRE (Road Recovery Estimate)</h2>
              <p className="text-white/60 leading-relaxed text-sm">RRE predicts the percentage of traffic flow recovery achievable by enforcing against illegal parking on a segment. It factors capacity loss, severity of violations, demand pressure, junction penalties, and violation persistence. RRE &gt; 60 indicates high-impact zones.</p>
            </div>
            <div className="border-t border-white/5 pt-6">
              <h2 className="text-xl font-bold font-display text-electric-mint mb-2">Quadrant Classification</h2>
              <p className="text-white/60 leading-relaxed text-sm">Segments are classified into four quadrants by comparing violations and PICQ to median values. Q1: Immediate Dispatch (high violations, high PICQ). Q2: Hidden Impact Zones (low violations, high PICQ — under-policed). Q3: High Volume Monitor (high violations, low PICQ). Q4: Routine Monitor (low violations, low PICQ).</p>
            </div>
            <div className="border-t border-white/5 pt-6 bg-electric-mint/5 rounded-xl p-6">
              <h2 className="text-lg font-bold font-display text-electric-mint mb-2">What This Dashboard Answers</h2>
              <p className="text-white/70 text-sm italic">Where should the city plan enforcement based on historical illegal-parking congestion impact?</p>
            </div>
            <div className="border-t border-white/5 pt-6 bg-coral-pink/5 rounded-xl p-6">
              <h2 className="text-lg font-bold font-display text-coral-pink mb-2">Limitations</h2>
              <p className="text-white/60 text-sm">Static dataset does not represent live traffic unless connected to live/polling source.</p>
            </div>
          </div>
        </PanelCard>
      )}

      {activeTab === 'picq-analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Average PICQ" value={picqDist?.average?.toFixed(1) ?? '—'} />
            <MetricCard label="Median PICQ" value={picqDist?.median?.toFixed(1) ?? '—'} />
            <MetricCard label="Max PICQ" value={picqDist?.max?.toFixed(1) ?? '—'} accent accentColor="coral" />
            <MetricCard label="Min PICQ" value={picqDist?.min?.toFixed(1) ?? '—'} />
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <PanelCard title="PICQ Score Distribution">
                <div className="p-6">
                  {picqDist?.distribution ? (
                    <div className="space-y-2">
                      {picqDist.distribution.map((d: any, i: number) => {
                        const maxCount = Math.max(...picqDist.distribution.map((x: any) => x.count), 1)
                        return (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="w-16 text-right text-white/50 font-mono text-xs">{d.range}</span>
                            <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                              <div className="h-full rounded-full bg-electric-mint/60 transition-all" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                            </div>
                            <span className="w-8 text-right font-mono text-xs text-white/70">{d.count}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-white/30">PICQ distribution data not available.</div>
                  )}
                </div>
              </PanelCard>
            </div>
            <div className="lg:col-span-2">
              <PanelCard title="PICQ by Quadrant">
                <div className="p-6 space-y-4">
                  {picqDist?.by_quadrant ? (
                    Object.entries(picqDist.by_quadrant).map(([q, data]: [string, any]) => (
                      <div key={q} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0">
                        <span className={QUADRANT_COLORS[q]}>{QUADRANT_LABELS[q]}</span>
                        <div className="text-right">
                          <span className="font-mono font-bold">{data.avg}</span>
                          <span className="text-white/30 text-xs ml-1">avg</span>
                          <span className="text-white/50 ml-2 text-xs font-mono">({data.count})</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-white/30">No quadrant data.</div>
                  )}
                </div>
              </PanelCard>
            </div>
          </div>

          <PanelCard title="Top PICQ Segments">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-[10px]">
                  <tr><th className="p-4 pl-6">Segment</th><th className="p-4">PICQ</th><th className="p-4">RRE</th><th className="p-4 pr-6">Quadrant</th></tr>
                </thead>
                <tbody>
                  {(picqDist?.top_segments || segments.slice(0, 10)).map((s: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-mono font-medium">{s.segment_id}</td>
                      <td className="p-4 font-mono">{typeof s.picq_score === 'number' ? s.picq_score.toFixed(1) : s.picq_score}</td>
                      <td className="p-4 font-mono text-white/70">{typeof s.rre_score === 'number' ? s.rre_score.toFixed(1) : s.rre_score}</td>
                      <td className="p-4 pr-6"><StatusBadge status={s.quadrant === 'Q1' ? 'fail' : s.quadrant === 'Q2' ? 'warn' : s.quadrant === 'Q3' ? 'pass' : 'inactive'} label={s.quadrant || '—'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelCard>
        </div>
      )}

      {activeTab === 'hotspot-map' && (
        <div>
          {mapLatLonAvailable && mapSegments.length > 0 ? (
            <div className="h-[600px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
              <MapMyIndiaViewer mode="static" data={mapSegments} />
            </div>
          ) : (
            <PanelCard>
              <div className="p-12 text-center">
                <MapPin size={48} className="text-white/20 mx-auto mb-4" />
                <h2 className="text-xl font-bold font-display mb-3">Hotspot Map Unavailable</h2>
                <p className="text-white/50 max-w-md mx-auto mb-6">Hotspot Map requires latitude/longitude or road-segment geometry. The current dataset does not contain usable coordinates.</p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => handleTabChange('overview')} className="px-6 py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">View Overview</button>
                  <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20">Upload Geo-enabled Dataset</button>
                </div>
              </div>
            </PanelCard>
          )}
        </div>
      )}

      {activeTab === 'hidden-impact-zones' && (
        <PanelCard title="Hidden Impact Zones (Q2)" subtitle="Segments with high PICQ but low violation counts — under-policed strategic positions" icon={Eye} iconColor="text-butter-yellow">
          <div className="p-4 border-b border-white/5 bg-butter-yellow/5">
            <p className="text-xs text-butter-yellow/80">Q2 segments are the most operationally valuable. Each violation here causes disproportionate congestion. Standard violation-counting approaches miss them entirely.</p>
          </div>
          {hiddenZones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-[10px]">
                  <tr><th className="p-4 pl-6">Segment</th><th className="p-4">PICQ</th><th className="p-4">RRE</th><th className="p-4">Violations</th><th className="p-4 pr-6">Recommended Action</th></tr>
                </thead>
                <tbody>
                  {hiddenZones.map((s: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-mono font-medium text-butter-yellow">{s.segment_id}</td>
                      <td className="p-4 font-mono">{typeof s.picq_score === 'number' ? s.picq_score.toFixed(1) : s.picq_score}</td>
                      <td className="p-4 font-mono">{typeof s.rre_score === 'number' ? s.rre_score.toFixed(1) : s.rre_score}</td>
                      <td className="p-4 text-white/70">{s.total_violations || s.violations || '—'}</td>
                      <td className="p-4 pr-6">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-butter-yellow/10 text-butter-yellow border border-butter-yellow/20">
                          Strategic Intervention
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-white/30">
              <Eye size={32} className="mx-auto mb-3 opacity-50" />
              <p>No Hidden Impact Zones (Q2) detected in the current dataset.</p>
              <p className="text-xs mt-1 text-white/20">Q2 zones require segments with high PICQ but relatively low violation counts.</p>
            </div>
          )}
        </PanelCard>
      )}

      {activeTab === 'enforcement-ranking' && (
        <PanelCard title="Enforcement Ranking" subtitle="Segments ranked by enforcement_score (0.45×PICQ + 0.35×RRE + 0.20×Violations)" icon={Shield} iconColor="text-electric-mint">
          {enforcementSegments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-[10px]">
                  <tr><th className="p-4 pl-6">Rank</th><th className="p-4">Segment ID</th><th className="p-4">PICQ</th><th className="p-4">RRE</th><th className="p-4">Quadrant</th><th className="p-4">Violations</th><th className="p-4">Enf. Score</th><th className="p-4 pr-6">Priority</th></tr>
                </thead>
                <tbody>
                  {enforcementSegments.map((s: any, i: number) => {
                    const enfScore = s.enforcement_score || (Number(s.picq_score) * 0.45 + Number(s.rre_score) * 0.35)
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 pl-6 font-mono text-white/50">#{i + 1}</td>
                        <td className="p-4 font-mono font-medium">{s.segment_id}</td>
                        <td className="p-4 font-mono">{typeof s.picq_score === 'number' ? s.picq_score.toFixed(1) : s.picq_score}</td>
                        <td className="p-4 font-mono">{typeof s.rre_score === 'number' ? s.rre_score.toFixed(1) : s.rre_score}</td>
                        <td className="p-4"><StatusBadge status={s.quadrant === 'Q1' ? 'fail' : s.quadrant === 'Q2' ? 'warn' : s.quadrant === 'Q3' ? 'pass' : 'inactive'} label={s.quadrant || '—'} /></td>
                        <td className="p-4 text-white/70">{s.total_violations ?? '—'}</td>
                        <td className="p-4 font-mono text-electric-mint font-bold">{typeof enfScore === 'number' ? enfScore.toFixed(2) : enfScore}</td>
                        <td className="p-4 pr-6">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            enfScore > 0.7 ? 'bg-coral-pink/20 text-coral-pink' :
                            enfScore > 0.4 ? 'bg-butter-yellow/20 text-butter-yellow' :
                            'bg-white/5 text-white/50'
                          }`}>{enfScore > 0.7 ? 'Critical' : enfScore > 0.4 ? 'High' : 'Standard'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-white/30">No enforcement ranking data available.</div>
          )}
        </PanelCard>
      )}

      {activeTab === 'map-intelligence' && (
        <div>
          {mapSegments.length > 0 ? (
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex-1 h-[500px] xl:h-[600px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                <MapMyIndiaViewer mode="static" data={mapSegments} />
              </div>
              <div className="w-full xl:w-80 space-y-4">
                <PanelCard title="Segment Legend">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#EF4444]" /><span className="text-white/70">Q1 — Immediate Dispatch</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#EAB308]" /><span className="text-white/70">Q2 — Hidden Impact Zones</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#06B6D4]" /><span className="text-white/70">Q3 — High Volume Monitor</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22C55E]" /><span className="text-white/70">Q4 — Routine Monitor</span></div>
                  </div>
                </PanelCard>
                <PanelCard title="Map Stats">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-white/40">Total markers</span><span className="text-white font-mono">{mapSegments.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Q1 (immediate)</span><span className="text-[#EF4444] font-mono">{mapSegments.filter(s => s.quadrant === 'Q1').length}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Q2 (hidden)</span><span className="text-[#EAB308] font-mono">{mapSegments.filter(s => s.quadrant === 'Q2').length}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Q3 (monitor)</span><span className="text-[#06B6D4] font-mono">{mapSegments.filter(s => s.quadrant === 'Q3').length}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Q4 (routine)</span><span className="text-[#22C55E] font-mono">{mapSegments.filter(s => s.quadrant === 'Q4').length}</span></div>
                  </div>
                </PanelCard>
                <p className="text-[10px] text-white/30 text-center">Use the DEBUG button on the map for diagnostics</p>
              </div>
            </div>
          ) : (
            <PanelCard>
              <div className="p-12 text-center">
                <Map size={48} className="text-white/20 mx-auto mb-4" />
                <h2 className="text-xl font-bold font-display mb-3">Map Intelligence Unavailable</h2>
                <p className="text-white/50 max-w-md mx-auto mb-4">Map Intelligence requires latitude/longitude or road-segment geometry. Current dataset has no usable coordinates.</p>
                <div className="bg-white/5 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
                  <div className="flex items-center gap-2"><span className="text-white/40 w-44">Map Provider Configured</span><span className="text-electric-mint font-bold">{process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY && process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY !== 'your_mapmyindia_sdk_key_here' ? '✓ Yes' : '✗ No'}</span></div>
                  <div className="flex items-center gap-2"><span className="text-white/40 w-44">Coordinate Rows</span><span className="text-white font-mono">{mapSegments.length}</span></div>
                </div>
                {(!process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY || process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY === 'your_mapmyindia_sdk_key_here') && (
                  <div className="mb-4 p-3 bg-butter-yellow/10 border border-butter-yellow/20 rounded-xl text-xs text-butter-yellow text-left">
                    <p className="font-bold mb-1">Map provider is not configured.</p>
                    <p>Add MapMyIndia keys in environment variables:</p>
                    <pre className="mt-1 text-[10px] text-butter-yellow/70 font-mono">
NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY=&lt;your_sdk_key&gt;
MAPMYINDIA_REST_API_KEY=&lt;your_rest_key&gt;
MAPMYINDIA_CLIENT_ID=&lt;your_client_id&gt;
MAPMYINDIA_CLIENT_SECRET=&lt;your_secret&gt;
                    </pre>
                  </div>
                )}
                <div className="flex gap-4 justify-center">
                  <button onClick={() => handleTabChange('enforcement-ranking')} className="px-6 py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">View Enforcement Ranking</button>
                  <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20">Upload Geo-enabled Dataset</button>
                </div>
              </div>
            </PanelCard>
          )}
        </div>
      )}

      {activeTab === 'audit-verification' && (
        <PanelCard title="Audit Verification" subtitle="Mathematical verification of all displayed metrics from loaded data.">
          {auditData?.checks ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-[10px]">
                  <tr><th className="p-4 pl-6">Metric</th><th className="p-4">Formula</th><th className="p-4">Computed</th><th className="p-4">Displayed</th><th className="p-4 pr-6">Status</th></tr>
                </thead>
                <tbody>
                  {auditData.checks.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-medium">{c.metric}</td>
                      <td className="p-4 font-mono text-xs text-white/50">{c.formula}</td>
                      <td className="p-4 font-mono">{c.computed}</td>
                      <td className="p-4 font-mono">{c.displayed}</td>
                      <td className="p-4 pr-6"><StatusBadge status={c.passed ? 'pass' : 'fail'} label={c.passed ? 'PASS' : 'FAIL'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs">
                <span className="text-white/50">Source: {auditData.source_file || 'loaded dataset'}</span>
                <span className="text-white/50">Rows: {auditData.row_count}</span>
                <span className="text-white/50">Missing PICQ: {auditData.missing_picq}</span>
                <span className="text-white/50">Missing RRE: {auditData.missing_rre}</span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-white/30">Audit data not available. Load a dataset first.</div>
          )}
        </PanelCard>
      )}

      {activeTab === 'ask-trinetra' && (
        <div className="h-[calc(100vh-320px)] max-h-[720px] flex flex-col bg-[#111312] border border-white/5 rounded-[32px] overflow-hidden shadow-soft">
          <div className="p-4 border-b border-white/5 flex items-center gap-2 shrink-0">
            <Bot size={18} className="text-electric-mint" />
            <span className="font-bold font-display text-sm">Ask TRINETRA</span>
            <span className="ml-auto text-[10px] bg-electric-mint/10 text-electric-mint px-2 py-0.5 rounded-full border border-electric-mint/20">Firewall Active</span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Bot size={20} className="text-electric-mint mt-1 shrink-0" />
              <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 text-sm text-white/80">
                I'm your TRINETRA operational assistant. Ask me about PICQ scores, enforcement rankings, hidden impact zones, or methodology.
              </div>
            </div>
            {[
              "What are the top enforcement zones?",
              "Explain Hidden Impact Zones",
              "Show PICQ distribution",
              "Verify dashboard metrics",
              "Explain RRE methodology",
              "Which segments need immediate dispatch?"
            ].map((s, i) => (
              <button key={i} onClick={() => handleTabChange('enforcement-ranking')}
                className="block w-full text-left p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-white/60 hover:text-white transition-colors border border-white/5">
                {s}
              </button>
            ))}
          </div>
          <div className="shrink-0 p-3 border-t border-white/5">
            <div className="flex gap-2">
              <input type="text" placeholder="Type a question..." readOnly
                className="flex-1 bg-[#1a1d1b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/50 outline-none" />
              <button className="px-4 py-2 bg-electric-mint text-deep-black rounded-xl text-xs font-bold hover:bg-white transition-colors">Ask</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
