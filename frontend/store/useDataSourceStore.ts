import { create } from 'zustand'
import { safeParseResponse, getApiBaseUrl } from '@/lib/api'

export type DataSourceMode = 'none' | 'static' | 'live'
export type DataSourceStatus = 'not_configured' | 'selected' | 'validating' | 'connecting' | 'processing' | 'ready' | 'connected' | 'failed'

export interface DataSourceState {
  mode: DataSourceMode
  selectedSourceType: string | null
  sourceType: string | null
  status: DataSourceStatus
  error: string | null
  metricsAvailable: boolean
  liveActive: boolean
  loadedAt: string | null
  summary: any | null
  topSegments: any[]
  activeStaticTab: string

  // actions
  setMode: (mode: DataSourceMode) => void
  setStatus: (status: DataSourceStatus) => void
  updateState: (partial: Partial<DataSourceState>) => void
  fetchStatus: () => Promise<void>
}

const base = getApiBaseUrl()

export const useDataSourceStore = create<DataSourceState>((set) => ({
  mode: 'none',
  selectedSourceType: null,
  sourceType: null,
  status: 'not_configured',
  error: null,
  metricsAvailable: false,
  liveActive: false,
  loadedAt: null,
  summary: null,
  topSegments: [],
  activeStaticTab: 'overview',

  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  updateState: (partial) => set((state) => ({ ...state, ...partial })),
  fetchStatus: async () => {
    try {
      const res = await fetch(`${base}/api/static/status`)
      const result = await safeParseResponse(res)
      if (result.ok && result.data) {
        set({
          mode: result.data.mode as DataSourceMode,
          sourceType: result.data.source_type,
          status: result.data.status as DataSourceStatus,
          error: result.data.error,
          metricsAvailable: result.data.metrics_available,
          liveActive: result.data.live_active,
          loadedAt: result.data.loaded_at,
          summary: result.data.summary,
          topSegments: result.data.top_segments || []
        })
      }
    } catch (e) {
      console.error('Failed to fetch datasource status', e)
    }
  }
}))

// Persist to localStorage on state changes
if (typeof window !== 'undefined') {
  useDataSourceStore.subscribe((state) => {
    try {
      localStorage.setItem('trinetra_session', JSON.stringify({
        mode: state.mode,
        sourceType: state.sourceType,
        loadedAt: state.loadedAt,
        status: state.status,
      }))
    } catch {}
  })
}
