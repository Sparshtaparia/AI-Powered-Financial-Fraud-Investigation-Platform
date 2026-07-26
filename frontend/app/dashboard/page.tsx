"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Activity, ArrowRight, Server, BrainCircuit, Zap, Globe, HardDrive } from 'lucide-react'
import { DataSourceSetupModal } from '@/components/ui/DataSourceSetupModal'
import { ProcessingOverlay } from '@/components/ui/ProcessingOverlay'
import { useDataSourceStore } from '@/store/useDataSourceStore'

export default function SetupPage() {
  const router = useRouter()
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [setupMode, setSetupMode] = useState<'static' | 'live' | 'none'>('none')

  const handleSelectStatic = () => {
    setSetupMode('static')
    setIsModalOpen(true)
  }

  const handleSelectLive = () => {
    setSetupMode('live')
    setIsModalOpen(true)
  }

  const handleCompleteSetup = () => {
    setIsModalOpen(false)
    // The ProcessingOverlay will take over from here and handle navigation
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-warm-cream overflow-hidden font-body selection:bg-electric-mint selection:text-deep-black">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(circle at 70% 40%, rgba(32,211,139,0.12), transparent 30%),
          radial-gradient(circle at 25% 55%, rgba(120,160,255,0.08), transparent 28%),
          transparent
        `
      }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-[1100px] w-full z-10 flex flex-col gap-10 mt-8 mb-8">
        {/* Top: Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border-subtle shadow-soft mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-mint animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-deep-black">PICQ ENGINE SETUP</span>
          </div>
          <h1 className="text-[42px] md:text-[52px] leading-tight font-bold font-display text-deep-black mb-4 tracking-tight">Configure Intelligence Source</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Select how TRINETRA-P should receive parking-violation intelligence: historical batch data for planning or live streams for real-time operations.
          </p>
        </div>

        {/* Middle: Data source mode selector */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Historical */}
          <div 
            onClick={handleSelectStatic}
            onMouseEnter={() => setHoveredMode('static')}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-white/80 backdrop-blur-xl border border-border-subtle hover:border-blue-200 transition-all duration-300 cursor-pointer rounded-[32px] p-8 shadow-soft hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex flex-col min-h-[420px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <Database size={28} />
                </div>
                <div className="px-3 py-1 bg-deep-black/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-text-secondary">BATCH MODE</div>
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-bold font-display mb-3 text-deep-black">Historical Intelligence</h2>
              <p className="text-text-secondary mb-8 leading-relaxed text-sm">
                Analyze CSV and processed parking datasets to discover persistent violation pressure, hidden impact zones, road recovery estimates, and enforcement plans.
              </p>

              {/* Mini Preview */}
              <div className="mt-auto mb-8 bg-warm-cream rounded-2xl p-4 border border-border-subtle flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-2 bg-charcoal/20 rounded-full" />
                  <div className="w-10 h-2 bg-charcoal/10 rounded-full" />
                  <div className="w-14 h-2 bg-charcoal/10 rounded-full" />
                </div>
                <ArrowRight size={14} className="text-charcoal/30 shrink-0" />
                <div className="flex-1 h-14 bg-white rounded-xl shadow-sm border border-border-subtle flex items-end justify-between p-2 gap-1.5 overflow-hidden">
                  <div className="w-full bg-blue-200 rounded-sm" style={{ height: '30%' }} />
                  <div className="w-full bg-blue-300 rounded-sm" style={{ height: '60%' }} />
                  <div className="w-full bg-blue-400 rounded-sm" style={{ height: '40%' }} />
                  <div className="w-full bg-blue-500 rounded-sm" style={{ height: '80%' }} />
                  <div className="w-full bg-blue-600 rounded-sm" style={{ height: '100%' }} />
                </div>
              </div>
              
              <button className="w-full py-4 mt-auto rounded-2xl bg-deep-black text-white font-bold text-sm uppercase tracking-wider group-hover:bg-charcoal transition-colors shadow-soft">
                Launch Historical Mode
              </button>
            </div>
          </div>

          {/* Card 2: Live */}
          <div 
            onClick={handleSelectLive}
            onMouseEnter={() => setHoveredMode('live')}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-charcoal border border-charcoal-light hover:border-electric-mint/40 transition-all duration-300 cursor-pointer rounded-[32px] p-8 shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(24,214,139,0.25)] hover:-translate-y-1 overflow-hidden flex flex-col min-h-[420px] text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-electric-mint/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-electric-mint/20 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-electric-mint/10 text-electric-mint border border-electric-mint/20 rounded-2xl flex items-center justify-center shadow-inner relative">
                  <Activity size={28} />
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-electric-mint animate-pulse" />
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-electric-mint flex items-center gap-2">
                  STREAMING MODE
                </div>
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-bold font-display mb-3 text-white">Real-Time Operations</h2>
              <p className="text-white/60 mb-8 leading-relaxed text-sm">
                Connect Kafka, APIs, WebSockets, or CCTV inference events to update PICQ live, trigger alerts, and recommend tow dispatch actions.
              </p>

              {/* Mini Console Preview */}
              <div className="mt-auto mb-8 bg-deep-black rounded-2xl p-4 border border-white/5 flex flex-col gap-2 font-mono text-[10px] sm:text-xs text-electric-mint/80 relative overflow-hidden h-20">
                <div className="flex items-center gap-2 mb-1 opacity-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-mint animate-pulse" />
                  <span>STREAM ACTIVE</span>
                </div>
                <div className="flex flex-col gap-1 w-full animate-feed-slide" style={{ animationDuration: '4s' }}>
                  <div className="flex gap-2 whitespace-nowrap">
                    <span className="opacity-50">&gt;</span>
                    <span>SEG-1042 PICQ +23</span>
                  </div>
                  <div className="flex gap-2 whitespace-nowrap">
                    <span className="opacity-50">&gt;</span>
                    <span>Hidden impact zone detected</span>
                  </div>
                  <div className="flex gap-2 whitespace-nowrap">
                    <span className="opacity-50">&gt;</span>
                    <span className="text-white">Tow Unit 2 recommended</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-transparent to-transparent pointer-events-none" />
              </div>
              
              <button className="w-full py-4 mt-auto rounded-2xl bg-electric-mint text-deep-black font-bold text-sm uppercase tracking-wider hover:bg-white hover:shadow-glow-mint transition-all">
                Launch Live Mode
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Unified Pipeline Preview */}
        <div className="mt-2 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-border-subtle rounded-2xl p-3 shadow-soft">
            
            {/* Step 1 */}
            <div className={`flex flex-1 items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 w-full lg:w-auto ${hoveredMode === 'live' ? 'bg-charcoal text-white shadow-lg scale-[1.02]' : hoveredMode === 'static' ? 'bg-blue-50 text-blue-900 shadow-sm scale-[1.02]' : 'bg-transparent text-text-secondary'}`}>
              {hoveredMode === 'live' ? <Globe size={20} className="text-electric-mint" /> : <HardDrive size={20} className={hoveredMode === 'static' ? 'text-blue-500' : ''} />}
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Data Source</span>
                <span className="text-sm font-bold">{hoveredMode === 'live' ? 'Kafka / API / CCTV' : hoveredMode === 'static' ? 'CSV / Historical Files' : 'Data Source'}</span>
              </div>
            </div>

            <ArrowRight size={16} className={`hidden lg:block transition-colors duration-300 ${hoveredMode ? 'text-deep-black' : 'text-border-subtle'}`} />

            {/* Step 2 */}
            <div className={`flex flex-1 items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 delay-75 w-full lg:w-auto ${hoveredMode ? 'bg-white shadow-md border border-border-subtle text-deep-black scale-[1.02]' : 'bg-transparent text-text-secondary border border-transparent'}`}>
              <Server size={20} className={hoveredMode === 'live' ? 'text-electric-mint' : hoveredMode === 'static' ? 'text-blue-500' : ''} />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Ingestion</span>
                <span className="text-sm font-bold">{hoveredMode === 'live' ? 'Event Stream' : 'Event Normalizer'}</span>
              </div>
            </div>

            <ArrowRight size={16} className={`hidden lg:block transition-colors duration-300 ${hoveredMode ? 'text-deep-black' : 'text-border-subtle'}`} />

            {/* Step 3 */}
            <div className={`flex flex-1 items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 delay-150 w-full lg:w-auto ${hoveredMode ? 'bg-white shadow-md border border-border-subtle text-deep-black scale-[1.02]' : 'bg-transparent text-text-secondary border border-transparent'}`}>
              <BrainCircuit size={20} className={hoveredMode === 'live' ? 'text-electric-mint' : hoveredMode === 'static' ? 'text-blue-500' : ''} />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Core Engine</span>
                <span className="text-sm font-bold">{hoveredMode === 'live' ? 'Dynamic PICQ' : hoveredMode === 'static' ? 'PICQ + RRE' : 'PICQ Engine'}</span>
              </div>
            </div>

            <ArrowRight size={16} className={`hidden lg:block transition-colors duration-300 ${hoveredMode ? 'text-deep-black' : 'text-border-subtle'}`} />

            {/* Step 4 */}
            <div className={`flex flex-1 items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 delay-200 w-full lg:w-auto ${hoveredMode === 'live' ? 'bg-electric-mint text-deep-black shadow-glow-mint scale-[1.02]' : hoveredMode === 'static' ? 'bg-deep-black text-white shadow-lg scale-[1.02]' : 'bg-transparent text-text-secondary'}`}>
              <Zap size={20} />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Output</span>
                <span className="text-sm font-bold">{hoveredMode === 'live' ? 'Live Dispatch' : hoveredMode === 'static' ? 'Planning Dashboard' : 'Enforcement Intelligence'}</span>
              </div>
            </div>

          </div>

          {/* Mode Comparison Footer */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-xs lg:text-sm font-medium mt-4">
            <div className="flex items-center gap-2 text-text-secondary bg-white/60 px-4 py-2 rounded-full border border-border-subtle shadow-sm transition-all hover:border-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span><strong>Historical Mode answers:</strong> Where should the city plan enforcement?</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary bg-white/60 px-4 py-2 rounded-full border border-border-subtle shadow-sm transition-all hover:border-electric-mint">
              <span className="w-2 h-2 rounded-full bg-electric-mint" />
              <span><strong>Live Mode answers:</strong> Where should the next unit go now?</span>
            </div>
          </div>
        </div>

      </div>
      
      <DataSourceSetupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mode={setupMode} 
        onComplete={handleCompleteSetup} 
      />
      
      <ProcessingOverlay />
    </div>
  )
}
