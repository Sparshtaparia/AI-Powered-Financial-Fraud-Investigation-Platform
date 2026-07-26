"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Radio, TrendingUp, MapPin, Eye, Shield, Map, CheckCircle, Bot, Settings, AlertTriangle, FileText, BarChart3, Info
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useDataSourceStore } from '@/store/useDataSourceStore'

const STATIC_NAV = [
  { id: 'overview', href: '/dashboard/static?tab=overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'picq-analytics', href: '/dashboard/static?tab=picq-analytics', label: 'PICQ Analytics', icon: BarChart3 },
  { id: 'hotspot-map', href: '/dashboard/static?tab=hotspot-map', label: 'Hotspot Map', icon: MapPin },
  { id: 'hidden-impact-zones', href: '/dashboard/static?tab=hidden-impact-zones', label: 'Hidden Impact Zones', icon: Eye },
  { id: 'enforcement-ranking', href: '/dashboard/static?tab=enforcement-ranking', label: 'Enforcement Ranking', icon: Shield },
  { id: 'map-intelligence', href: '/dashboard/static?tab=map-intelligence', label: 'Map Intelligence', icon: Map },
  { id: 'audit-verification', href: '/dashboard/static?tab=audit-verification', label: 'Audit Verification', icon: CheckCircle },
  { id: 'ask-trinetra', href: '/dashboard/ask', label: 'Ask TRINETRA', icon: Bot },
]

const DYNAMIC_NAV = [
  { id: 'live-command-center', href: '/dashboard/live', label: 'Live Command Center', icon: Radio },
  { id: 'live-map', href: '/dashboard/live', label: 'Live Map', icon: Map },
  { id: 'active-violations', href: '/dashboard/live', label: 'Active Violations', icon: AlertTriangle },
]

export function AppRail() {
  const pathname = usePathname()
  const { role, user } = useAppStore()

  const { mode, activeStaticTab } = useDataSourceStore()
  const isLiveMode = mode === 'live'
  const isStaticMode = mode === 'static'

  if (pathname === '/dashboard') return null

  const currentNavItems = isLiveMode ? DYNAMIC_NAV : STATIC_NAV

  const isActive = (item: typeof STATIC_NAV[0]) => {
    const basePath = item.href.split('?')[0]
    if (pathname !== basePath && !(basePath === '/dashboard/static' && pathname.startsWith('/dashboard/static'))) return false
    // Check tab param for static nav items
    if (basePath === '/dashboard/static' && pathname.startsWith('/dashboard/static')) {
      const itemTab = item.href.split('tab=')[1] || ''
      return activeStaticTab === itemTab
    }
    return pathname === item.href
  }

  return (
    <div className="hidden lg:flex w-[88px] h-screen bg-deep-black text-white flex-col items-center py-6 fixed left-0 top-0 z-50 shadow-2xl">
      
      {/* Logo */}
      <Link href="/dashboard" className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center mb-8 shrink-0 relative group shadow-glow-mint hover:scale-105 transition-transform">
        <span className="font-display font-bold text-deep-black text-xl">TR</span>
        <div className="absolute left-16 bg-white text-deep-black text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-soft z-50">
          TRINETRA Setup
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-3 w-full px-4 items-center overflow-visible">
        {currentNavItems.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link 
              key={item.id}
              href={item.href}
              className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all group relative ${
                active ? 'bg-electric-mint text-deep-black shadow-glow-mint' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={22} className={active ? 'animate-in zoom-in duration-300' : 'group-hover:scale-110 transition-transform'} />
              <div className="absolute left-16 bg-white text-deep-black text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-soft z-50">
                {item.label}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-4 mt-auto items-center overflow-visible">
        <Link href="/dashboard/settings" className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all group relative text-white/60 hover:text-white hover:bg-white/10">
          <Settings size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-16 bg-white text-deep-black text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-soft z-50">Settings</div>
        </Link>
        
        <Link href="/dashboard/profile" className="w-11 h-11 rounded-[14px] overflow-hidden border-2 border-white/20 hover:border-electric-mint transition-colors cursor-pointer group relative flex items-center justify-center bg-white/10">
          <span className="text-sm font-bold text-electric-mint">AM</span>
          <div className="absolute left-16 bg-white text-deep-black text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-soft z-50">
            {user?.name || "Profile"}
          </div>
        </Link>
      </div>
    </div>
  )
}
