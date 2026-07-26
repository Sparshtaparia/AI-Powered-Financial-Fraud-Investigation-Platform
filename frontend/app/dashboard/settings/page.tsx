"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultMode: 'static',
    mapProvider: 'MapMyIndia',
    refreshInterval: '5',
    demoLiveStream: 'true',
    mapIntelligence: 'true',
    auditPanel: 'true',
    theme: 'dark',
  })

  useEffect(() => {
    const saved = localStorage.getItem('trinetra_settings')
    if (saved) {
      try { setSettings(prev => ({ ...prev, ...JSON.parse(saved) })) } catch {}
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('trinetra_settings', JSON.stringify(settings))
    alert('Settings saved')
  }

  const apiBase = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') : ''

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-white/50 hover:text-white"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-warm-cream">Settings</h1>
      </div>
      <div className="space-y-4">
        <SettingRow label="Default Datasource Mode" value={settings.defaultMode} onChange={v => setSettings(p => ({...p, defaultMode: v}))} options={['static', 'live']} />
        <SettingRow label="Map Provider" value={settings.mapProvider} onChange={v => setSettings(p => ({...p, mapProvider: v}))} options={['MapMyIndia', 'OpenStreetMap', 'None']} />
        <SettingRow label="Refresh Interval (s)" value={settings.refreshInterval} onChange={v => setSettings(p => ({...p, refreshInterval: v}))} type="number" />
        <SettingRow label="Demo Live Stream" value={settings.demoLiveStream} onChange={v => setSettings(p => ({...p, demoLiveStream: v}))} options={['true', 'false']} />
        <SettingRow label="Map Intelligence" value={settings.mapIntelligence} onChange={v => setSettings(p => ({...p, mapIntelligence: v}))} options={['true', 'false']} />
        <SettingRow label="Audit Panel" value={settings.auditPanel} onChange={v => setSettings(p => ({...p, auditPanel: v}))} options={['true', 'false']} />
        <SettingRow label="Theme" value={settings.theme} onChange={v => setSettings(p => ({...p, theme: v}))} options={['dark', 'light']} />
        <div className="bg-[#111312] border border-white/5 p-4 rounded-xl">
          <div className="text-xs text-white/50 uppercase mb-1">API Base URL</div>
          <div className="text-sm text-white/70 font-mono">{apiBase}</div>
        </div>
        <div className="bg-[#111312] border border-white/5 p-4 rounded-xl">
          <div className="text-xs text-white/50 uppercase mb-1">Backend Connection</div>
          <div className="text-sm text-electric-mint">Connected (via proxy)</div>
        </div>
        <button onClick={saveSettings} className="flex items-center gap-2 px-6 py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">
          <Save size={18} /> Save Settings
        </button>
      </div>
    </div>
  )
}

function SettingRow({ label, value, onChange, options, type }: { label: string; value: string; onChange: (v: string) => void; options?: string[]; type?: string }) {
  return (
    <div className="bg-[#111312] border border-white/5 p-4 rounded-xl flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="bg-[#1a1d1b] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-electric-mint">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} className="bg-[#1a1d1b] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-24 text-center outline-none focus:border-electric-mint" />
      )}
    </div>
  )
}
