"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Shield, Database, BrainCircuit, Activity, LineChart } from "lucide-react"
import { LiveTypingConsole } from "@/components/ui/live-typing-console"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-warm-cream selection:bg-electric-mint selection:text-deep-black overflow-x-hidden font-body">
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-warm-cream/90 backdrop-blur-xl border-b border-border-subtle shadow-soft py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-[1440px] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="font-display font-bold text-2xl tracking-tight text-deep-black drop-shadow-md">
                TRI<span className="inline-block ml-0.5 px-1.5 py-0.5 bg-electric-mint text-deep-black text-xl leading-none shadow-sm -translate-y-0.5">NETRA</span>
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#platform" className="text-sm font-bold text-text-secondary hover:text-deep-black transition-colors uppercase tracking-widest">Platform</a>
              <a href="#solutions" className="text-sm font-bold text-text-secondary hover:text-deep-black transition-colors uppercase tracking-widest">Solutions</a>
              <a href="#dashboard" className="text-sm font-bold text-text-secondary hover:text-deep-black transition-colors uppercase tracking-widest">Command Center</a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hidden md:block font-bold text-text-secondary hover:text-deep-black transition-colors text-sm uppercase tracking-widest">Log In</Link>
            <a href="mailto:dispatch@trinetra.btp.gov.in" className="hidden md:block font-bold text-text-secondary hover:text-deep-black transition-colors text-sm uppercase tracking-widest">Contact Dispatch</a>
            <Link
              href="/dashboard"
              className="bg-electric-mint text-deep-black px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-glow-mint uppercase tracking-widest"
            >
              Enter Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-40">
        <section id="platform" className="px-6 max-w-[1440px] mx-auto text-center mb-32 pt-16">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-border-subtle shadow-soft mb-10">
              <span className="w-2.5 h-2.5 rounded-full bg-electric-mint animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-deep-black">GridLock 2.0 — Parking Intelligence</span>
            </div>

            <h1 className="font-display text-[36px] sm:text-[64px] md:text-[80px] leading-[0.9] font-bold tracking-tighter text-deep-black mb-8">
              Parking congestion <span className="inline-block px-4 py-1 bg-butter-yellow rounded-[40px] -rotate-2 mt-4">meets AI.</span>
            </h1>

            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-4xl mx-auto leading-relaxed">
              How can AI-driven parking intelligence detect illegal parking hotspots and quantify their impact on traffic flow to enable targeted enforcement?
            </p>

            <div className="flex justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-10 py-5 bg-deep-black hover:bg-charcoal transition-colors text-warm-cream font-bold rounded-full text-lg flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-glow-mint"
              >
                Enter Command Center
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/dashboard/ask"
                className="px-10 py-5 bg-white text-deep-black font-bold rounded-full text-lg flex items-center gap-3 border border-border-subtle hover:-translate-y-1 transition-transform shadow-soft"
              >
                Ask TRINETRA
              </Link>
            </div>
          </div>

          <div id="dashboard" className="mt-24 relative mx-auto max-w-[1200px] aspect-[16/9] rounded-[40px] bg-charcoal shadow-2xl border-[8px] border-white overflow-hidden animate-float-slow scroll-mt-32">
            <div className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-charcoal">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-coral-pink" />
                <div className="w-3 h-3 rounded-full bg-butter-yellow" />
                <div className="w-3 h-3 rounded-full bg-electric-mint" />
              </div>
              <div className="h-6 w-64 bg-white/5 rounded-full flex items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer opacity-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }} />
                <span className="text-[10px] font-mono text-white/40 relative z-10">trinetra.btp.gov.in/command-center</span>
              </div>
              <div className="w-12" />
            </div>

            <div className="p-6 flex gap-6 h-full bg-charcoal">
              <div className="w-20 rounded-[24px] bg-white/5 border border-white/10 flex flex-col items-center py-6 gap-4 shrink-0">
                <div className="w-10 h-10 bg-electric-mint rounded-xl animate-pulse-soft" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5" />
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-0">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="w-48 h-8 bg-white/10 rounded-xl mb-2" />
                    <div className="w-64 h-3 bg-white/5 rounded-full" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-24 h-9 bg-white/10 rounded-full" />
                    <div className="w-32 h-9 bg-electric-mint rounded-full" />
                  </div>
                </div>
                <div className="flex gap-6 flex-1 relative">
                  <div className="flex-[2] bg-white rounded-[32px] p-6 relative overflow-hidden shadow-soft flex flex-col justify-between">
                    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-[32px]">
                      <div className="absolute top-0 left-0 w-[200%] h-full animate-shimmer-slow" style={{ background: 'linear-gradient(120deg, transparent, rgba(32, 211, 139, 0.05), transparent)' }} />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-1.5">
                        {['PICQ', 'RRE', 'HIZ', 'EGC'].map((label) => (
                          <div key={label} className="px-2.5 py-1 bg-charcoal/5 rounded-full">
                            <span className="text-[9px] font-bold text-text-secondary uppercase">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] font-mono text-deep-black/40">SEG-1042 · MG Road</div>
                    </div>

                    <div className="h-[90px] bg-charcoal/[0.02] border border-charcoal/5 rounded-2xl relative overflow-hidden mb-3">
                      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

                      <svg className="absolute inset-0 w-full h-full text-electric-mint" preserveAspectRatio="none" viewBox="0 0 500 100" fill="none">
                        <defs>
                          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(32,211,139,0.25)" />
                            <stop offset="100%" stopColor="rgba(32,211,139,0.02)" />
                          </linearGradient>
                          <linearGradient id="area2" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(191,239,243,0.15)" />
                            <stop offset="100%" stopColor="rgba(191,239,243,0)" />
                          </linearGradient>
                        </defs>
                        <path className="animate-draw-line" style={{ strokeDasharray: 900, strokeDashoffset: 900 }} d="M0,80 C80,80 120,20 200,35 C280,50 320,10 400,25 C450,32 480,15 500,20" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        <path d="M0,80 C80,80 120,20 200,35 C280,50 320,10 400,25 C450,32 480,15 500,20 L500,100 L0,100 Z" fill="url(#area)" opacity="0.5" />
                        <path d="M0,90 C100,90 150,60 250,70 C350,80 400,40 500,50 L500,100 L0,100 Z" fill="url(#area2)" opacity="0.3" />
                        <circle cx="200" cy="35" r="2.5" fill="currentColor" opacity="0.9" />
                        <circle cx="400" cy="25" r="2.5" fill="currentColor" opacity="0.9" />
                        <circle cx="500" cy="20" r="2.5" fill="currentColor" opacity="0.9" />
                        <line className="animate-scan-line" x1="0" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                      </svg>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-charcoal/[0.02] border border-charcoal/5 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="text-[9px] font-mono font-bold text-deep-black mb-0.5">PICQ 84</div>
                          <div className="text-[8px] text-text-secondary">Q2 · Hidden Impact</div>
                        </div>
                        <div className="text-[9px] font-bold text-coral-pink">+23</div>
                      </div>
                      <div className="p-2.5 bg-charcoal/[0.02] border border-charcoal/5 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="text-[9px] font-mono font-bold text-deep-black mb-0.5">RRE 17%</div>
                          <div className="text-[8px] text-text-secondary">Recovery estimate</div>
                        </div>
                        <div className="text-[9px] font-bold text-electric-mint">Dispatch</div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-electric-mint/20 rounded-full blur-[60px] animate-glow-drift" style={{ background: 'radial-gradient(circle, rgba(32,211,139,0.18), transparent 60%)' }} />
                  </div>

                  <div className="flex-1 bg-[#0A0C0F] border border-white/5 rounded-[32px] p-5 flex flex-col shadow-inner">
                    <div className="flex gap-2 items-center mb-3">
                      <div className="w-2 h-2 rounded-full bg-electric-mint animate-pulse-soft" />
                      <span className="text-[10px] text-electric-mint font-bold uppercase tracking-widest">LIVE FEED</span>
                    </div>

                    <div className="bg-[#111315] border border-white/5 rounded-2xl p-3 flex-1 flex flex-col">
                      <LiveTypingConsole
                        messages={[
                          "Monitoring Bengaluru parking corridors...",
                          "Hidden impact zone detected near junction.",
                          "PICQ score increased from 61 to 84.",
                          "Tow Unit 2 recommended. ETA 8 min.",
                          "Estimated road recovery: 17%."
                        ]}
                      />

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center bg-[#1A1D20] border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-mono text-white/60">
                          <div className="flex gap-2.5 items-center">
                            <span className="text-white/30">10:42</span>
                            <span className="text-white font-bold">SEG-1042</span>
                          </div>
                          <span className="text-electric-mint bg-electric-mint/10 px-1.5 py-0.5 rounded">PICQ +23</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#1A1D20] border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-mono text-white/60">
                          <div className="flex gap-2.5 items-center">
                            <span className="text-white/30">10:43</span>
                            <span className="text-coral-pink">Q2</span>
                          </div>
                          <span className="text-white/80">Hidden Impact Zone</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#1A1D20] border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-mono text-white/60">
                          <div className="flex gap-2.5 items-center">
                            <span className="text-white/30">10:44</span>
                            <span className="text-white font-bold">Dispatch</span>
                          </div>
                          <span className="text-white/80">Confidence <span className="text-electric-mint ml-1">93%</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="py-32 bg-deep-black text-white scroll-mt-16">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="font-display text-[48px] font-bold tracking-tighter mb-6">Parking-Induced Congestion Intelligence</h2>
              <p className="text-lg text-white/60 max-w-3xl mx-auto">On-street illegal parking and spillover near commercial areas, metro stations, and events choke carriageways. TRINETRA solves this with AI-driven detection, RRE scoring, and targeted dispatch.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: "Ingest", desc: "Connect BTP violation data", icon: Database },
                { name: "Snap", desc: "Map-match to OSM road network", icon: Activity },
                { name: "Score", desc: "Compute RRE congestion impact", icon: BrainCircuit },
                { name: "Optimize", desc: "Greedy dispatch allocation", icon: LineChart },
                { name: "Deploy", desc: "Export field enforcement plans", icon: ArrowRight },
                { name: "Learn", desc: "Close the feedback loop", icon: Shield },
              ].map((step, i) => (
                <div key={i} className="p-6 rounded-3xl border border-white/10 bg-white/5 hover:-translate-y-2 transition-transform hover:border-electric-mint/30">
                  <step.icon size={32} className="text-white/50 mb-4" />
                  <h4 className="font-display text-xl font-bold mb-2">{step.name}</h4>
                  <p className="text-sm text-white/50">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-charcoal text-white/50 py-12 text-center text-sm font-medium">
        <p>&copy; 2026 TRINETRA by Flipkart X BTP. All rights reserved.</p>
      </footer>
    </div>
  )
}
