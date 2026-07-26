"use client"
import { useEffect } from "react"
import Link from "next/link"
import { AppRail } from "@/components/ui/app-rail"
import { GlobalSearch } from "@/components/ui/GlobalSearch"
import { Search, Bell, Menu, LayoutDashboard, ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isSetupScreen = pathname === "/dashboard"

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trinetra_session')
      if (saved) { JSON.parse(saved) }
    } catch {}
  }, [])

  return (
    <div className="flex min-h-screen w-full bg-[#050706]">
      <AppRail />
      
      <div className={`flex-1 w-full min-h-screen flex flex-col relative pb-16 lg:pb-0 ${isSetupScreen ? 'ml-0' : 'ml-0 lg:ml-[88px]'}`}>
        
        {/* Topbar */}
        {!isSetupScreen && (
        <header className="sticky top-0 z-40 bg-[#050706]/90 backdrop-blur-xl border-b border-white/10 h-16 lg:h-20 flex justify-between items-center px-4 lg:px-8 w-full">
          <div className="flex items-center gap-2 lg:gap-4 min-w-0">
            <button className="lg:hidden w-9 h-9 bg-deep-black rounded-xl flex items-center justify-center text-white shadow-2xl shrink-0">
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-4 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border transition-all duration-200 group bg-[#111312] border-white/10 shadow-soft">
              <LayoutDashboard size={12} className="lg:w-[14px] lg:h-[14px] text-white/50" />
              <span className="font-display font-bold text-xs lg:text-sm tracking-tight truncate text-white/80">Command Center</span>
            </div>
            {!isSetupScreen && (
              <button onClick={() => router.push('/dashboard')}
                className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors border border-white/10">
                Change Data Source
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-[#111312] border border-white/10 rounded-full text-white/40 hover:border-white/30 transition-colors shadow-soft">
              <Search size={16} />
              <span className="text-sm font-medium">Search entities...</span>
              <span className="ml-8 text-xs font-bold border border-white/10 px-1.5 py-0.5 rounded bg-[#1a1d1b] text-white/30">⌘K</span>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white/80">Admin User</p>
                <p className="text-label-sm text-white/40 uppercase text-[10px]">Dispatch Control</p>
              </div>
              <button className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white/20">
                <div className="w-full h-full bg-electric-mint/20 flex items-center justify-center text-xs font-bold text-electric-mint">AM</div>
              </button>
            </div>
          </div>
        </header>
        )}

        <main className="flex-1 w-full bg-[#050706]">
          {children}
        </main>
      </div>
    </div>
  )
}
