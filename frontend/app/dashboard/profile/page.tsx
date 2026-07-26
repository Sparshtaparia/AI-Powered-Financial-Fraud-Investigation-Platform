"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, User } from 'lucide-react'
import { useDataSourceStore } from '@/store/useDataSourceStore'

export default function ProfilePage() {
  const { mode, status, sourceType, loadedAt, metricsAvailable } = useDataSourceStore()
  const [profile, setProfile] = useState({
    displayName: 'Arjun Mehta',
    department: 'Traffic Operations',
    preferredMode: 'static',
    defaultCity: 'Bengaluru',
    notifications: 'enabled',
  })

  useEffect(() => {
    const saved = localStorage.getItem('trinetra_profile')
    if (saved) {
      try { setProfile(prev => ({ ...prev, ...JSON.parse(saved) })) } catch {}
    }
  }, [])

  const saveProfile = () => {
    localStorage.setItem('trinetra_profile', JSON.stringify(profile))
    alert('Profile saved')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-white/50 hover:text-white"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-warm-cream">Profile</h1>
      </div>

      <div className="bg-[#111312] border border-white/5 p-6 rounded-xl mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-electric-mint/20 rounded-full flex items-center justify-center">
          <User size={32} className="text-electric-mint" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-warm-cream">{profile.displayName}</h2>
          <p className="text-sm text-white/50">Admin · {profile.department}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Session Info</h3>
        <div className="bg-[#111312] border border-white/5 p-4 rounded-xl space-y-2">
          <Row label="Current Mode" value={mode || 'none'} />
          <Row label="Status" value={status} />
          <Row label="Data Source" value={sourceType || 'none'} />
          <Row label="Last Loaded" value={loadedAt || 'never'} />
          <Row label="Metrics Available" value={metricsAvailable ? 'Yes' : 'No'} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Editable Profile</h3>
        <ProfileRow label="Display Name" value={profile.displayName} onChange={v => setProfile(p => ({...p, displayName: v}))} />
        <ProfileRow label="Department/Role" value={profile.department} onChange={v => setProfile(p => ({...p, department: v}))} />
        <ProfileSelect label="Preferred Dashboard Mode" value={profile.preferredMode} onChange={v => setProfile(p => ({...p, preferredMode: v}))} options={['static', 'live']} />
        <ProfileSelect label="Default City" value={profile.defaultCity} onChange={v => setProfile(p => ({...p, defaultCity: v}))} options={['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad']} />
        <ProfileSelect label="Notifications" value={profile.notifications} onChange={v => setProfile(p => ({...p, notifications: v}))} options={['enabled', 'disabled']} />
        <button onClick={saveProfile} className="flex items-center gap-2 px-6 py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">
          <Save size={18} /> Save Profile
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-white/80 font-mono text-xs">{value}</span>
    </div>
  )
}

function ProfileRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-[#111312] border border-white/5 p-4 rounded-xl flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="bg-[#1a1d1b] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-48 text-right outline-none focus:border-electric-mint" />
    </div>
  )
}

function ProfileSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="bg-[#111312] border border-white/5 p-4 rounded-xl flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-[#1a1d1b] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-electric-mint">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
