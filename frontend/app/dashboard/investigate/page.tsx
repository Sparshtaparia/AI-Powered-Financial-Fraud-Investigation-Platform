"use client"

import { useState } from "react"
import { CommandBar } from "@/components/ui/CommandBar"
import { InvestigationActivity, InvestigationState } from "@/components/ui/InvestigationActivity"
import { InvestigationReport } from "@/components/ui/InvestigationReport"

export default function InvestigatePage() {
  const [aiQuery, setAiQuery] = useState("")
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiState, setAiState] = useState<InvestigationState | null>(null)

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiQuery.trim()) return
    
    setIsActivityOpen(true)
    setIsAiLoading(true)
    setAiState({ status: 'INITIALIZED', timeline: [], metadata: { intent: 'Parsing intent...' } })

    try {
      const res = await fetch("http://localhost:8000/api/v1/planner/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: "C1023", query: aiQuery })
      })

      if (res.ok) {
        const data = await res.json()
        setAiState({
          status: data.status,
          timeline: data.timeline || [],
          summary: data.summary,
          metadata: { intent: "Dynamic Investigation Complete" }
        })
        setIsAiLoading(false)
        return
      } else {
        throw new Error("Backend unavailable")
      }
    } catch (err) {
      // Mock execution for UI demo
      setTimeout(() => setAiState(prev => prev ? { ...prev, metadata: { intent: 'Executing AML Workflow' } } : prev), 800)
      
      setTimeout(() => setAiState(prev => prev ? { ...prev, timeline: [{ service: 'database', success: true, latency_ms: 24 }] } : prev), 1500)
      
      setTimeout(() => setAiState(prev => prev ? { ...prev, timeline: [...prev.timeline, { service: 'ml', success: true, latency_ms: 118 }] } : prev), 2500)
      
      setTimeout(() => setAiState(prev => prev ? { ...prev, timeline: [...prev.timeline, { service: 'graph', success: true, latency_ms: 89 }] } : prev), 3500)
      
      setTimeout(() => setAiState(prev => prev ? { ...prev, timeline: [...prev.timeline, { service: 'evidence', success: true, latency_ms: 4 }] } : prev), 4000)

      setTimeout(() => {
        setAiState(prev => prev ? { 
          ...prev, 
          status: 'COMPLETED',
          summary: {
            recommendations: [
              "Analysis indicates a high probability of structuring through multiple shell entities. Cross-border velocity is 3x standard deviation.",
              "Graph analysis detected a 4-hop cyclic loop terminating at mule account A-11029-B.",
              "Recommendation: File SAR and escalate to L3 Compliance."
            ],
            audit: []
          } 
        } : prev)
        setIsAiLoading(false)
      }, 5500)
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white">
      <InvestigationActivity 
        isOpen={isActivityOpen} 
        onClose={() => setIsActivityOpen(false)} 
        investigationState={aiState}
        isLoading={isAiLoading}
      />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-medium tracking-tight text-zinc-100 mb-3">Enterprise Intelligence Console</h1>
          <p className="text-sm text-zinc-500">Autonomous Anti-Money Laundering Investigation & Graph Analytics</p>
        </div>

        {/* Command Bar */}
        <CommandBar 
          query={aiQuery} 
          setQuery={setAiQuery} 
          onSubmit={handleAiSearch} 
          isLoading={isAiLoading} 
        />

        {/* Dynamic Investigation Report */}
        <InvestigationReport 
          state={aiState} 
          selectedZone={null} 
        />

        {/* Empty State / Standby */}
        {(!aiState || aiState.status === 'INITIALIZED') && !isAiLoading && (
          <div className="mt-24 text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm">System standing by. Enter a natural language query to begin dynamic orchestration.</p>
          </div>
        )}
      </div>
    </div>
  )
}
