"use client"
import { useEffect, useRef, useState, useCallback } from 'react'
import { Map, MapPin, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface Segment {
  segment_id: string
  latitude: number
  longitude: number
  picq_score: number
  rre_score: number
  quadrant: string
  total_violations: number
}

interface Props {
  mode: 'static' | 'live'
  data?: Segment[]
}

declare global {
  interface Window {
    MapmyIndia: any
    mapmyindia_map: any
  }
}

const QUAD_COLORS: Record<string, string> = {
  Q1: '#EF4444',
  Q2: '#EAB308',
  Q3: '#06B6D4',
  Q4: '#22C55E',
}

const QUAD_ACTIONS: Record<string, string> = {
  Q1: 'Immediate dispatch required',
  Q2: 'Hidden impact — strategic intervention',
  Q3: 'High volume — monitor closely',
  Q4: 'Routine monitor',
}

type MapStatus = 'loading' | 'ready' | 'no_key' | 'sdk_fail' | 'init_fail' | 'no_data' | 'timeout'

export function MapMyIndiaViewer({ mode, data }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [status, setStatus] = useState<MapStatus>('loading')
  const [lastError, setLastError] = useState<string>('')
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [mapInitDone, setMapInitDone] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)

  const sdkKey = process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY || ''
  const hasValidKey = sdkKey && sdkKey !== 'your_mapmyindia_sdk_key_here'

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => { try { m.remove?.() || m.setMap?.(null) } catch {} })
    markersRef.current = []
  }, [])

  const addMarkers = useCallback((mapInstance: any, segments: Segment[]) => {
    if (!mapInstance || !window.MapmyIndia) return
    clearMarkers()
    const bounds: number[][] = []
    segments.forEach(s => {
      if (!s.latitude || !s.longitude) return
      const color = QUAD_COLORS[s.quadrant] || '#22C55E'
      const action = QUAD_ACTIONS[s.quadrant] || ''
      bounds.push([s.latitude, s.longitude])
      try {
        const marker = new window.MapmyIndia.Marker({
          map: mapInstance,
          position: [s.latitude, s.longitude],
          title: s.segment_id,
          icon: `https://apis.mapmyindia.com/advancedmaps/v1/${sdkKey}/map_load?marker=${s.latitude},${s.longitude},${color.replace('#', '')},${s.segment_id}`,
        })
        const popupHtml = `
          <div style="font-family:sans-serif;padding:8px;min-width:180px">
            <b style="color:${color}">${s.segment_id}</b><br/>
            <span>PICQ: <b>${s.picq_score?.toFixed(1) ?? '—'}</b></span><br/>
            <span>RRE: <b>${s.rre_score?.toFixed(1) ?? '—'}</b></span><br/>
            <span>Quadrant: <b style="color:${color}">${s.quadrant || '—'}</b></span><br/>
            <span>Violations: <b>${s.total_violations ?? '—'}</b></span><br/>
            <span style="font-size:11px;color:#666">${action}</span>
          </div>
        `
        try {
          const popup = new window.MapmyIndia.Popup({ content: popupHtml, offset: [0, -10] })
          marker.addListener('click', () => popup.addTo(mapInstance))
        } catch {}
        markersRef.current.push(marker)
      } catch {}
    })
    if (bounds.length > 0 && mapInstance.fitBounds) {
      try { mapInstance.fitBounds(bounds) } catch {}
    }
  }, [clearMarkers, sdkKey])

  useEffect(() => {
    if (!hasValidKey) {
      setStatus('no_key')
      setLastError('NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY is missing or placeholder')
      return
    }

    let timeoutId: NodeJS.Timeout
    let scriptEl: HTMLScriptElement | null = null

    const onSdkLoad = () => {
      setSdkLoaded(true)
      if (window.MapmyIndia && mapRef.current) {
        try {
          mapInstanceRef.current = new window.MapmyIndia.Map(mapRef.current, {
            center: [12.9716, 77.5946],
            zoomControl: true,
            location: true,
            zoom: 12,
          })
          setMapInitDone(true)
          setStatus('ready')
          if (data && data.length > 0) addMarkers(mapInstanceRef.current, data)
        } catch (e: any) {
          setStatus('init_fail')
          setLastError(e?.message || 'Map container initialization failed')
        }
      } else {
        setStatus('sdk_fail')
        setLastError('MapmyIndia SDK loaded but Map constructor not found')
      }
    }

    timeoutId = setTimeout(() => {
      if (!mapInitDone && status === 'loading') {
        setStatus('timeout')
        setLastError('Map SDK did not initialize within 8 seconds. Check key, domain whitelist, or network.')
      }
    }, 8000)

    const existing = document.getElementById('mapmyindia-sdk')
    if (existing) {
      if (window.MapmyIndia) {
        onSdkLoad()
      } else {
        existing.addEventListener('load', onSdkLoad)
        existing.addEventListener('error', () => {
          setStatus('sdk_fail')
          setLastError('Map SDK script failed to load. Check key, domain whitelist, or network.')
        })
      }
    } else {
      scriptEl = document.createElement('script')
      scriptEl.id = 'mapmyindia-sdk'
      scriptEl.src = `https://apis.mapmyindia.com/advancedmaps/v1/${sdkKey}/map_load?v=1.5`
      scriptEl.async = true
      scriptEl.defer = true
      scriptEl.onload = onSdkLoad
      scriptEl.onerror = () => {
        setStatus('sdk_fail')
        setLastError('Map SDK script failed to load. Check key, domain whitelist, or network.')
      }
      document.body.appendChild(scriptEl)
    }

    return () => {
      clearTimeout(timeoutId)
      clearMarkers()
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapInitDone && mapInstanceRef.current && data && data.length > 0) {
      addMarkers(mapInstanceRef.current, data)
    }
  }, [data, mapInitDone, addMarkers])

  const renderDiagnostic = () => {
    if (!debugOpen) return null
    return (
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-[#111312]/95 border border-white/10 rounded-xl p-4 text-xs font-mono space-y-1 backdrop-blur-md shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-white/80">Map Diagnostics</span>
          <button onClick={() => setDebugOpen(false)} className="text-white/30 hover:text-white">✕</button>
        </div>
        <div className="flex items-center gap-2"><span className="text-white/40 w-52">NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY</span><span className={hasValidKey ? 'text-electric-mint' : 'text-coral-pink'}>{hasValidKey ? '✓ present' : '✗ missing/placeholder'}</span></div>
        <div className="flex items-center gap-2"><span className="text-white/40 w-52">Map Segments count</span><span className="text-white">{data?.length ?? 0}</span></div>
        <div className="flex items-center gap-2"><span className="text-white/40 w-52">SDK load status</span><span className={sdkLoaded ? 'text-electric-mint' : 'text-coral-pink'}>{sdkLoaded ? 'loaded' : 'loading/not started'}</span></div>
        <div className="flex items-center gap-2"><span className="text-white/40 w-52">Map init status</span><span className={mapInitDone ? 'text-electric-mint' : 'text-coral-pink'}>{mapInitDone ? 'initialized' : 'not initialized'}</span></div>
        {lastError && <div className="flex items-center gap-2"><span className="text-white/40 w-52">Last error</span><span className="text-coral-pink break-all">{lastError}</span></div>}
      </div>
    )
  }

  const renderFallback = () => {
    const configs = {
      no_key: {
        icon: <XCircle size={48} className="text-coral-pink mx-auto mb-4" />,
        title: 'Map SDK Key Missing',
        desc: 'Add NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY in frontend .env.local',
        detail: 'MapMyIndia Map SDK key is not configured. Map tiles cannot be loaded without a valid SDK key.',
      },
      sdk_fail: {
        icon: <AlertTriangle size={48} className="text-butter-yellow mx-auto mb-4" />,
        title: 'Map SDK Failed to Load',
        desc: 'Check key, domain whitelist, or network.',
        detail: lastError,
      },
      init_fail: {
        icon: <AlertTriangle size={48} className="text-butter-yellow mx-auto mb-4" />,
        title: 'Map Initialization Failed',
        desc: 'Map container could not be initialized.',
        detail: lastError,
      },
      timeout: {
        icon: <Loader2 size={48} className="text-butter-yellow mx-auto mb-4 animate-spin" />,
        title: 'Map Load Timed Out',
        desc: 'Map did not become ready within 8 seconds.',
        detail: lastError,
      },
      no_data: {
        icon: <MapPin size={48} className="text-white/20 mx-auto mb-4" />,
        title: 'No Map Data Available',
        desc: 'Current dataset has no segments with usable coordinates.',
        detail: '',
      },
    }

    const cfg = configs[status as keyof typeof configs] || configs.no_key
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#111312]">
        <div className="text-center max-w-md p-8">
          {cfg.icon}
          <h3 className="text-lg font-bold font-display mb-2">{cfg.title}</h3>
          <p className="text-white/50 text-sm mb-2">{cfg.desc}</p>
          {cfg.detail && <p className="text-white/30 text-xs mb-4">{cfg.detail}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 bg-[#111312]">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {status !== 'ready' ? renderFallback() : null}

      {(!data || data.length === 0) && status === 'ready' && (
        <div className="absolute top-4 left-4 z-20 bg-[#111312]/90 border border-white/10 rounded-xl px-4 py-2 text-xs text-white/50 backdrop-blur-md">
          No segment markers to display
        </div>
      )}

      {renderDiagnostic()}

      <button
        onClick={() => setDebugOpen(d => !d)}
        className="absolute top-4 right-4 z-20 bg-[#111312]/90 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-mono text-white/40 hover:text-white/80 backdrop-blur-md transition-colors"
      >
        🛠 DEBUG
      </button>
    </div>
  )
}
