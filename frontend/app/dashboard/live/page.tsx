"use client"
import { Suspense, useState, useEffect, useRef } from 'react'
import { useDataSourceStore } from '@/store/useDataSourceStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapMyIndiaViewer } from '@/components/map/MapMyIndiaViewer'
import { Activity, Radio, Loader2, AlertCircle, Wifi, WifiOff, Map, List, Shield } from 'lucide-react'
import { safeParseResponse } from '@/lib/api'
import { MetricCard, TabNav, PageHeader, StatusBadge, PanelCard } from '@/components/ui/DesignSystem'

const DYNAMIC_TABS = [
  { id: 'live-command-center', label: 'Live Command Center', icon: Radio },
  { id: 'live-map', label: 'Live Map', icon: Map },
  { id: 'active-violations', label: 'Active Violations', icon: List },
]

export default function LiveDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050706] text-warm-cream flex items-center justify-center"><Loader2 size={32} className="animate-spin text-electric-mint mx-auto mb-4" /><p className="text-white/50">Loading...</p></div>}>
      <LiveDashboard />
    </Suspense>
  )
}

function LiveDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') || 'live-command-center'
  const { mode, status, liveActive, sourceType, fetchStatus } = useDataSourceStore()
  const [events, setEvents] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [violations, setViolations] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dispatch, setDispatch] = useState<any>(null)
  const [modelDrift, setModelDrift] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(tabParam)
  const [liveSourceType, setLiveSourceType] = useState('')
  const [liveMode, setLiveMode] = useState('')
  const [eventsReceived, setEventsReceived] = useState(0)
  const [noEventsWarning, setNoEventsWarning] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef(false)
  const noEventTimerRef = useRef<any>(null)

  useEffect(() => { fetchStatus() }, [])

  useEffect(() => {
    if (tabParam && DYNAMIC_TABS.some(t => t.id === tabParam)) setActiveTab(tabParam)
  }, [tabParam])

  useEffect(() => {
    if (!liveActive) { setLoading(false); return }

    setLoading(true); setError(null); setNoEventsWarning(false)

    const effectiveSourceType = sourceType || ''
    setLiveSourceType(effectiveSourceType)
    
    const shouldUseWebSocket = effectiveSourceType === 'websocket' || effectiveSourceType === 'demo_stream'
    const shouldUsePolling = effectiveSourceType === 'csv_polling' || effectiveSourceType === 'rest_api' || effectiveSourceType === 'kafka_yolo' || effectiveSourceType === '' || effectiveSourceType === 'demo_stream'

    if (shouldUseWebSocket) {
      const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/api/live/stream'
      const ws = new WebSocket(wsUrl); wsRef.current = ws
      ws.onopen = () => { setConnected(true); setLoading(false); setError(null) }
      ws.onclose = () => {
        setConnected(false)
        if (reconnectRef.current) setTimeout(() => { if (reconnectRef.current) window.location.reload() }, 3000)
      }
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          if (data.type === "NEW_EVENT") {
            setEvents(prev => [data.event, ...prev].slice(0, 50))
            if (data.alert) setAlerts(prev => [data.alert, ...prev].slice(0, 10))
            setEventsReceived(prev => prev + 1)
          }
        } catch {}
      }
      ws.onerror = () => {
        if (effectiveSourceType === 'websocket') {
          setError("WebSocket connection error.")
        }
      }
    } else {
      setConnected(true)
      setLoading(false)
    }

    reconnectRef.current = true

    const poll = () => {
      // Get status first for accurate source info
      fetch('/api/live/status').then(r => safeParseResponse(r)).then(d => {
        if (d.ok && d.data) {
          setLiveSourceType(d.data.source_type || effectiveSourceType)
          setLiveMode(d.data.live_mode || d.data.mode || '')
          setConnected(d.data.status === 'connected')
          setEventsReceived(d.data.events_received || 0)
        }
      }).catch(() => {})

      fetch('/api/live/events').then(r => safeParseResponse(r)).then(d => {
        if (d.ok && d.data) {
          if (d.data.events?.length) {
            setEvents(d.data.events.slice(0, 50))
            setConnected(true)
          }
          setEventsReceived(d.data.events_received || events.length)
          if (d.data.mode) setLiveMode(d.data.mode)
          if (d.data.source_type) setLiveSourceType(d.data.source_type)
        }
      }).catch(() => {})
      fetch('/api/live/alerts').then(r => safeParseResponse(r)).then(d => { if (d.ok && d.data?.alerts?.length) setAlerts(d.data.alerts.slice(0, 10)) }).catch(() => {})
      fetch('/api/live/dispatch').then(r => safeParseResponse(r)).then(d => { if (d.ok) setDispatch(d.data) }).catch(() => {})
      fetch('/api/live/model-drift').then(r => safeParseResponse(r)).then(d => { if (d.ok) setModelDrift(d.data) }).catch(() => {})
      fetch('/api/live/active-violations').then(r => safeParseResponse(r)).then(d => { if (d.ok) setViolations(d.data?.violations || []) }).catch(() => {})
    }
    const pollInterval = setInterval(poll, 3000)
    poll()

    // No-events warning timer
    noEventTimerRef.current = setTimeout(() => {
      if (events.length === 0 && eventsReceived === 0) {
        setNoEventsWarning(true)
      }
    }, 10000)

    return () => {
      reconnectRef.current = false
      if (wsRef.current) wsRef.current.close()
      clearInterval(pollInterval)
      if (noEventTimerRef.current) clearTimeout(noEventTimerRef.current)
    }
  }, [liveActive, sourceType])

  const handleStopStream = async () => {
    try { await fetch('/api/live/stop', { method: 'POST' }); useDataSourceStore.getState().fetchStatus() } catch {}
  }

  if (status === 'not_configured' || !liveActive || mode !== 'live') {
    return (
      <div className="min-h-screen bg-[#050706] text-warm-cream p-12 flex flex-col items-center justify-center font-body">
        <div className="max-w-md bg-[#111312] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white/50 relative"><Radio size={32} /></div>
          <h2 className="text-2xl font-display font-bold mb-3">No live source connected</h2>
          <p className="text-white/50 mb-8 text-sm">Start a simulated stream or connect Kafka/API/WebSocket to activate live operations.</p>
          <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">Configure Live Source</button>
        </div>
      </div>
    )
  }

  if (loading && events.length === 0 && !connected) {
    return (
      <div className="min-h-screen bg-[#050706] text-warm-cream flex items-center justify-center">
        <div className="text-center"><Loader2 size={32} className="animate-spin text-electric-mint mx-auto mb-4" /><p className="text-white/50">Connecting to live stream...</p></div>
      </div>
    )
  }

  const sourceLabel = liveSourceType || sourceType || ''
  const modeLabel = liveMode || ''
  const statusLabel = sourceLabel.replace('_', ' ').toUpperCase() + (modeLabel ? ' · ' + modeLabel.toUpperCase() : '')

  const last5Events = events.filter(e => { try { return Date.now() - new Date(e.timestamp).getTime() < 300000 } catch { return true } })
  const avgSeverity = last5Events.length > 0 ? last5Events.reduce((s, e) => s + (e.severity || 0), 0) / last5Events.length : 0
  const highestDelta = events.length > 0 ? Math.max(...events.map(e => e.picq_delta || e.severity || 0)) : 0
  const topSegment = dispatch?.segment || (events[0]?.road_segment_id)

  return (
    <div className="min-h-screen bg-[#050706] text-warm-cream p-4 md:p-6 font-body">
      <PageHeader
        title="Live Operations Command Center"
        subtitle="Streaming real-time parking violation events into dynamic PICQ and dispatch intelligence."
        status={{
          label: connected ? (statusLabel || `CONNECTED`) : 'DISCONNECTED',
          active: connected
        }}
        sourceLabel={`events: ${eventsReceived}`}
        rightContent={
          <div className="flex gap-2">
            <button onClick={() => router.push('/dashboard')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors">
              Change Source
            </button>
            <button onClick={handleStopStream} className="px-3 py-1.5 bg-coral-pink/10 hover:bg-coral-pink/20 text-coral-pink rounded-lg border border-coral-pink/20 text-xs font-bold uppercase tracking-wider transition-colors">
              Stop Stream
            </button>
          </div>
        }
      />

      {error && <div className="mb-6 p-4 bg-coral-pink/10 border border-coral-pink/30 rounded-xl flex items-start gap-3 text-coral-pink text-sm"><AlertCircle size={16} className="mt-0.5 shrink-0" /><div>{error}</div></div>}

      {noEventsWarning && events.length === 0 && (
        <div className="mb-6 p-4 bg-butter-yellow/10 border border-butter-yellow/30 rounded-xl flex items-start gap-3 text-butter-yellow text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>Connected, but no events received yet. If this is CSV polling, use replay mode or append new rows to the file.</div>
        </div>
      )}

      <TabNav tabs={DYNAMIC_TABS} activeTab={activeTab} onTabChange={(id) => { setActiveTab(id); router.push(`/dashboard/live?tab=${id}`, { scroll: false }) }} className="mb-8" />

      {activeTab === 'live-command-center' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Active Events" value={events.length} subtext={`${last5Events.length} in last 5 min`} />
            <MetricCard label="Critical Alerts" value={alerts.length} accent accentColor="coral" />
            <MetricCard label="Highest PICQ Delta" value={events.length > 0 ? `+${highestDelta.toFixed(1)}` : '—'} accent accentColor="mint" />
            <MetricCard label="Recommended Dispatch" value={topSegment || '—'} subtext={dispatch?.recommendation?.substring(0, 40) || (events.length > 0 ? 'Dispatch recommended' : 'Waiting for events')} accent accentColor="blue" />
            <MetricCard label="Avg Severity (5m)" value={avgSeverity > 0 ? avgSeverity.toFixed(2) : '—'} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {alerts.length > 0 && (
                <div className="bg-coral-pink/5 border border-coral-pink/20 rounded-[32px] p-6 shadow-soft">
                  <h2 className="text-xl font-bold font-display text-coral-pink mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-coral-pink animate-ping mr-1"></span> Critical Live Alerts
                  </h2>
                  <div className="space-y-4">
                    {alerts.slice(0, 3).map((a, i) => (
                      <div key={i} className="bg-[#111312] p-4 rounded-2xl border border-coral-pink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="font-bold text-coral-pink">{a.type || 'Alert'}</div>
                            <div className="text-[10px] bg-white/5 px-2 py-0.5 rounded font-mono uppercase tracking-widest">{a.segment_id}</div>
                          </div>
                          <p className="text-sm text-white/70">{a.message}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">PICQ</div>
                            <div className="font-bold text-lg leading-none">{a.picq_score?.toFixed(1)}</div>
                          </div>
                          <button className="px-4 py-2 bg-coral-pink/10 hover:bg-coral-pink/20 text-coral-pink rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Dispatch</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <PanelCard title="Live Incident Stream" icon={Activity} iconColor="text-electric-mint" headerRight={<span className="text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full text-white/70">{events.length} Events</span>}>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111312] text-white/40 uppercase tracking-widest text-[10px] sticky top-0">
                      <tr><th className="p-4 pl-6">Time</th><th className="p-4">Event ID</th><th className="p-4">Segment</th><th className="p-4 pr-6">Severity</th></tr>
                    </thead>
                    <tbody>
                      {events.map((e, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="p-4 pl-6 text-white/50 font-mono text-xs">{new Date(e.timestamp).toLocaleTimeString()}</td>
                          <td className="p-4 font-mono text-xs text-white/70">{e.event_id}</td>
                          <td className="p-4 font-bold font-mono">{e.road_segment_id}</td>
                          <td className="p-4 pr-6 text-coral-pink font-mono">{e.severity?.toFixed(2)}</td>
                        </tr>
                      ))}
                      {events.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-white/30">Waiting for live events...</td></tr>}
                    </tbody>
                  </table>
                </div>
              </PanelCard>
            </div>

            <div className="space-y-6">
              <PanelCard title="Tow Unit Dispatch" className="!p-6">
                <div className="space-y-3">
                  {events.length > 0 && topSegment ? (
                    <>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-electric-mint flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-electric-mint animate-pulse" /> Unit 2</span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Available</span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">Dispatch to {topSegment}<span className="block mt-1 font-mono text-[10px] text-white/50">ETA: ~8 min · {dispatch?.events_count || 0} events</span></p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-coral-pink" /> Unit 5</span>
                          <span className="text-[10px] bg-coral-pink/10 text-coral-pink border border-coral-pink/20 px-2 py-0.5 rounded uppercase tracking-widest font-bold">En Route</span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">Heading to {events[1]?.road_segment_id || dispatch?.segment}<span className="block mt-1 font-mono text-[10px] text-coral-pink">ETA: ~3 min</span></p>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-white/30 text-sm">No dispatch recommendation until live events are received.</div>
                  )}
                </div>
              </PanelCard>

              <PanelCard title="Data Trust & Drift" className="!p-6">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-white/70">Model Confidence</span><span className="text-electric-mint font-bold font-mono">{modelDrift?.confidence_score ? `${(modelDrift.confidence_score * 100).toFixed(1)}%` : '—'}</span></div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-white/70">Feature Drift</span><span className="text-butter-yellow font-bold uppercase tracking-widest text-[10px]">{modelDrift?.drift || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-white/70">Events Received</span><span className="text-white font-bold font-mono">{eventsReceived || events.length}</span></div>
                </div>
              </PanelCard>
            </div>
          </div>
        </>
      )}

      {activeTab === 'live-map' && (
        <div className="h-[600px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
          <MapMyIndiaViewer mode="live" data={events} />
        </div>
      )}

      {activeTab === 'active-violations' && (
        <PanelCard title="Active Violations" icon={Shield} iconColor="text-electric-mint" subtitle="Currently active violations from the live event stream.">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-[10px]">
                <tr><th className="p-4 pl-6">ID</th><th className="p-4">Type</th><th className="p-4">Severity</th><th className="p-4">Status</th><th className="p-4">Timestamp</th><th className="p-4 pr-6">Segment</th></tr>
              </thead>
              <tbody>
                {(violations.length > 0 ? violations : events.map(e => ({ ...e, status: (e.severity || 0) >= 0.5 ? 'active' : 'resolved' }))).map((v: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-white/70">{v.id || v.event_id || `EVT-${i}`}</td>
                    <td className="p-4">{v.type || v.violation_type || 'Parking Violation'}</td>
                    <td className="p-4"><span className={v.severity > 0.7 ? 'text-coral-pink' : v.severity > 0.4 ? 'text-butter-yellow' : 'text-white/70'}>{v.severity?.toFixed(2)}</span></td>
                    <td className="p-4"><StatusBadge status={v.status === 'active' ? 'active' : 'pass'} label={v.status} /></td>
                    <td className="p-4 font-mono text-xs text-white/50">{v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : '—'}</td>
                    <td className="p-4 pr-6 font-mono font-bold">{v.segment_id || v.road_segment_id || '—'}</td>
                  </tr>
                ))}
                {events.length === 0 && violations.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-white/30">No violations recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </PanelCard>
      )}
    </div>
  )
}
