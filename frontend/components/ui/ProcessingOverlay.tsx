import { Activity, CheckCircle, Loader2, X as XIcon, Clock } from 'lucide-react'
import { useDataSourceStore } from '@/store/useDataSourceStore'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { safeParseResponse } from '@/lib/api'

type ProcessingStep =
  | "reading_source"
  | "validating_schema"
  | "normalizing_events"
  | "computing_picq"
  | "detecting_hidden_zones"
  | "building_rankings"

const stepLabels: Record<ProcessingStep, string> = {
  reading_source: "Reading source",
  validating_schema: "Validating schema",
  normalizing_events: "Normalizing parking events",
  computing_picq: "Computing PICQ/RRE",
  detecting_hidden_zones: "Detecting Hidden Impact Zones",
  building_rankings: "Building enforcement rankings",
}

const stepOrder: ProcessingStep[] = [
  "reading_source",
  "validating_schema",
  "normalizing_events",
  "computing_picq",
  "detecting_hidden_zones",
  "building_rankings",
]

const liveStepLabels: Record<ProcessingStep, string> = {
  reading_source: "Opening source connection",
  validating_schema: "Validating event schema",
  normalizing_events: "Starting stream listener",
  computing_picq: "Initializing live PICQ cache",
  detecting_hidden_zones: "Activating alerts",
  building_rankings: "Starting dispatch optimizer",
}

export function ProcessingOverlay() {
  const { status, mode, sourceType, updateState, error } = useDataSourceStore()
  const router = useRouter()
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  const isVisible = status === 'processing' || status === 'connecting' || status === 'ready' || status === 'connected'
  const isDone = status === 'ready' || status === 'connected'
  const isLive = mode === 'live'

  const timeoutLimit = isLive ? 30 : sourceType === 'processed_csv' || sourceType === 'flipkart_dataset' ? 20 : 90
  const steps = isLive ? liveStepLabels : stepLabels
  const stepKeys = stepOrder

  useEffect(() => {
    if (hasTimedOut) {
      updateState({ status: 'failed', error: `Processing took too long (${timeoutLimit}s). Try loading the stored Flipkart processed output or check backend logs.` })
    }
  }, [hasTimedOut])

  useEffect(() => {
    let elapsedInterval: NodeJS.Timeout
    let stepInterval: NodeJS.Timeout
    if (isVisible && !isDone && !hasTimedOut) {
      elapsedInterval = setInterval(() => {
        setElapsed(e => {
          if (e >= timeoutLimit) {
            setHasTimedOut(true)
            return e
          }
          return Math.round((e + 0.1) * 10) / 10
        })
      }, 100)
      stepInterval = setInterval(() => {
        setCurrentStepIdx(s => Math.min(s + 1, stepKeys.length - 1))
      }, Math.max(1500, (timeoutLimit * 1000) / stepKeys.length))
    }
    return () => {
      clearInterval(elapsedInterval)
      clearInterval(stepInterval)
    }
  }, [isVisible, isDone, hasTimedOut, timeoutLimit, stepKeys.length])

  useEffect(() => {
    if (isDone) {
      setCurrentStepIdx(stepKeys.length)
      setTimeout(() => {
        router.push(`/dashboard/${isLive ? 'live' : 'static'}`)
      }, 1000)
    }
  }, [isDone, isLive, router, stepKeys.length])

  if (!isVisible && status !== 'failed') return null

  const handleCancel = () => {
    updateState({ status: 'selected', error: null })
  }

  const handleRetry = () => {
    updateState({ status: 'selected', error: null })
    setElapsed(0)
    setCurrentStepIdx(0)
    setHasTimedOut(false)
  }

  const handleUseFlipkart = async () => {
    updateState({ selectedSourceType: 'flipkart_dataset', status: 'processing' })
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const res = await fetch(`${base}/api/static/load-flipkart`, { method: 'POST' })
      const result = await safeParseResponse(res)
      if (result.ok && result.data?.state?.status) {
        updateState(result.data.state)
      } else {
        updateState({ status: 'failed', error: result.error || 'Flipkart dataset load failed.' })
      }
    } catch (err: any) {
      updateState({ status: 'failed', error: err.message })
    }
  }

  const navToFlipkart = sourceType !== 'flipkart_dataset' && sourceType !== 'processed_csv'

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#050706] text-warm-cream">
      <div className="max-w-md w-full flex flex-col items-center">
        {status === 'failed' ? (
          <div className="text-center w-full bg-[#111312] p-8 rounded-3xl border border-coral-pink/30 shadow-[0_0_50px_rgba(255,100,100,0.1)]">
            <div className="w-16 h-16 bg-coral-pink/20 text-coral-pink rounded-full flex items-center justify-center mx-auto mb-6">
              <XIcon size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Processing Failed</h2>
            <p className="text-white/50 mb-8 text-sm px-4">{error || 'An unknown error occurred.'}</p>

            <div className="flex flex-col gap-3">
              <button onClick={handleRetry} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors font-bold">
                Retry
              </button>
              {navToFlipkart && (
                <button onClick={handleUseFlipkart} className="w-full py-3 bg-electric-mint text-deep-black hover:bg-white rounded-xl transition-colors font-bold">
                  Use Flipkart Dataset
                </button>
              )}
              <button onClick={handleCancel} className="w-full py-3 text-white/40 hover:text-white rounded-xl transition-colors text-sm uppercase tracking-widest font-bold mt-2">
                Back to Source Selection
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-24 h-24 mb-8">
                {isDone ? (
                  <div className="absolute inset-0 flex items-center justify-center text-electric-mint animate-in zoom-in">
                    <CheckCircle size={64} />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                    <div className="absolute inset-0 border-4 border-electric-mint rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity size={32} className="text-electric-mint animate-pulse" />
                    </div>
                  </>
                )}
              </div>

              <h2 className="text-3xl font-display font-bold text-center mb-2">
                {isDone
                  ? (isLive ? "Live Operations Active" : "Historical Intelligence Ready")
                  : (isLive ? "Starting Live Operations" : "Preparing Historical Intelligence")}
              </h2>

              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/50">
                <div>Source: <span className="text-white">{sourceType || '—'}</span></div>
                <div>•</div>
                <div className="flex items-center gap-1.5"><Clock size={12} /> {elapsed.toFixed(1)}s</div>
              </div>
            </div>

            <div className="w-full space-y-4 mb-8">
              {stepKeys.map((key, idx) => {
                const isActive = idx === currentStepIdx && !isDone
                const isCompleted = idx < currentStepIdx || isDone
                const label = steps[key]

                return (
                  <div
                    key={key}
                    className={`flex items-center gap-4 transition-all duration-300 ${
                      isActive ? 'opacity-100 text-electric-mint translate-x-2' :
                      isCompleted ? 'opacity-50 text-white' : 'opacity-20 text-white'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={20} className="shrink-0" />
                    ) : isActive ? (
                      <Loader2 size={20} className="shrink-0 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-current shrink-0" />
                    )}
                    <span className="font-medium">{label}</span>
                  </div>
                )
              })}
            </div>

            {!isDone && (
              <button
                onClick={handleCancel}
                className="w-full py-3 bg-coral-pink/10 hover:bg-coral-pink/20 text-coral-pink font-bold rounded-xl transition-colors"
              >
                Cancel Processing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
