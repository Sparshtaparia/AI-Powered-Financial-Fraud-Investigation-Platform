"use client"
import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useDataSourceStore } from '@/store/useDataSourceStore'
import Link from 'next/link'

export function GlobalSearch() {
  const { mode, status } = useDataSourceStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&mode=${mode || 'static'}`)
        const data = await res.json()
        setResults(data.results || [])
        setOpen(true)
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, mode])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasData = mode !== 'none' && (status === 'ready' || status === 'connected')

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={hasData ? "Search segments, zones, events..." : "Load data to enable search"}
          disabled={!hasData}
          className={`w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none ${hasData ? 'focus:border-electric-mint' : 'cursor-not-allowed opacity-50'}`}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d1b] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
          {!hasData ? (
            <div className="p-4 text-sm text-white/40 text-center">Load a dataset or connect a live source to enable search.</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-white/40 text-center">No results for &quot;{query}&quot;</div>
          ) : (
            results.map((r, i) => (
              <Link
                key={i}
                href={mode === 'live' ? '/dashboard/live' : '/dashboard/static'}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                onClick={() => { setOpen(false); setQuery('') }}
              >
                <div>
                  <div className="text-sm text-white font-medium">{r.label}</div>
                  <div className="text-xs text-white/40">{r.type === 'live_event' ? 'Live Event' : `${r.quadrant || ''} · PICQ ${typeof r.picq_score === 'number' ? r.picq_score.toFixed(0) : '?'} · RRE ${typeof r.rre_score === 'number' ? r.rre_score.toFixed(0) : '?'}%`}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.quadrant === 'Q1' ? 'bg-coral-pink/20 text-coral-pink' : r.quadrant === 'Q2' ? 'bg-butter-yellow/20 text-butter-yellow' : 'bg-white/10 text-white/50'}`}>
                  {r.quadrant || '—'}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
