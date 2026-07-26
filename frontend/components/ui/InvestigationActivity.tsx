"use client"

import { CheckCircle2, Circle, Loader2, Server, Clock, Activity, ChevronRight, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export interface ServiceResult {
  service: string
  success: boolean
  latency_ms: number
  payload?: any
  error?: string
}

export interface InvestigationSummary {
  recommendations: string[]
  audit: any[]
}

export interface InvestigationState {
  status: string
  timeline: ServiceResult[]
  summary?: InvestigationSummary
  metadata?: any
}

interface InvestigationActivityProps {
  isOpen: boolean
  onClose: () => void
  investigationState: InvestigationState | null
  isLoading: boolean
}

export function InvestigationActivity({ isOpen, onClose, investigationState, isLoading }: InvestigationActivityProps) {
  const getTimelineStatus = (step: string) => {
    if (!investigationState) return 'pending'
    const found = investigationState.timeline?.find(t => t.service.includes(step))
    if (found) return found.success ? 'completed' : 'failed'
    if (investigationState.summary) return 'skipped'
    return 'pending'
  }
  
  const steps = [
    { id: "intent", label: "Intent Parsed", time: "12ms", status: investigationState?.metadata?.intent ? 'completed' : (isLoading ? 'loading' : 'pending') },
    { id: "planning", label: "Investigation Planned", time: "45ms", status: investigationState?.metadata?.intent ? 'completed' : (isLoading ? 'loading' : 'pending') },
    { id: "database", label: "Database Lookup", time: "24ms", status: getTimelineStatus("database") },
    { id: "ml", label: "ML Risk Analysis", time: "118ms", status: getTimelineStatus("ml") },
    { id: "graph", label: "Graph Analysis", time: "89ms", status: getTimelineStatus("graph") },
    { id: "evidence", label: "Evidence Verification", time: "4ms", status: getTimelineStatus("evidence") },
    { id: "summary", label: "Report Generated", time: "1200ms", status: investigationState?.summary ? 'completed' : (isLoading ? 'loading' : 'pending') }
  ]

  const totalTime = investigationState?.timeline?.reduce((acc, val) => acc + val.latency_ms, 0) || 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 right-0 w-[400px] bg-zinc-950/95 backdrop-blur-3xl border-l border-zinc-800/50 z-50 flex flex-col shadow-2xl"
        >
          <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-zinc-400" />
              <h2 className="font-display font-medium text-zinc-100 text-sm tracking-wide">Investigation Activity</h2>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Header Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Server size={14} className="text-zinc-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Services</p>
                </div>
                <p className="text-xl font-medium text-zinc-200">{investigationState?.timeline?.length || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-zinc-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Exec Time</p>
                </div>
                <p className="text-xl font-medium text-zinc-200">{totalTime > 0 ? `${totalTime.toFixed(0)}ms` : '--'}</p>
              </div>
            </div>

            {/* Workflow Tracker */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6 px-1">Execution Plan</p>
              <div className="space-y-0">
                {steps.map((step, idx) => (
                  <div key={step.id} className="relative flex gap-4 pb-6 px-1">
                    {/* Line Connector */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute top-6 bottom-0 left-[11px] w-[1px] ${step.status === 'completed' ? 'bg-zinc-700' : 'bg-zinc-800/50'}`} />
                    )}
                    
                    <div className="relative z-10 shrink-0 bg-zinc-950 pt-1">
                      {step.status === 'completed' && <CheckCircle2 size={16} className="text-emerald-500/80 bg-zinc-950" />}
                      {step.status === 'failed' && <Circle size={16} className="text-red-500/80 fill-red-500/10 bg-zinc-950" />}
                      {step.status === 'skipped' && <Circle size={16} className="text-zinc-800 bg-zinc-950" />}
                      {step.status === 'loading' && <Loader2 size={16} className="text-zinc-400 animate-spin bg-zinc-950" />}
                      {step.status === 'pending' && <Circle size={16} className="text-zinc-800 bg-zinc-950" />}
                    </div>
                    
                    <div className="flex-1 flex justify-between items-start pt-1.5">
                      <div>
                        <p className={`text-sm tracking-wide ${step.status === 'completed' ? 'font-medium text-zinc-200' : step.status === 'loading' ? 'font-medium text-zinc-400' : 'text-zinc-600'}`}>
                          {step.label}
                        </p>
                        {step.id === 'intent' && step.status === 'completed' && investigationState?.metadata?.intent && (
                          <p className="text-xs text-emerald-500/70 mt-1 font-mono">{investigationState.metadata.intent}</p>
                        )}
                      </div>
                      {step.status === 'completed' && (
                        <span className="text-[10px] font-mono text-zinc-600">{step.time}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
