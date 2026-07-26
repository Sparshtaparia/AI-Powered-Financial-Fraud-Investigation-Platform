import type { LiveEvent, LiveState } from "./types"
import { safeParseResponse } from "./api"

export async function loadLiveEvents(): Promise<{ events: LiveEvent[]; state: LiveState }> {
  try {
    const res = await fetch("/api/live/events")
    const result = await safeParseResponse(res)
    if (result.ok && result.data?.events) {
      return { events: result.data.events, state: { cursor: 0, events_processed: 0, alerts_generated: 0, segment_counts: {}, alerts: [] } }
    }
    return { events: [], state: { cursor: 0, events_processed: 0, alerts_generated: 0, segment_counts: {}, alerts: [] } }
  } catch {
    return { events: [], state: { cursor: 0, events_processed: 0, alerts_generated: 0, segment_counts: {}, alerts: [] } }
  }
}

export async function loadDqReport(): Promise<any | null> {
  try {
    const res = await fetch("/api/analytics/data-trust")
    const result = await safeParseResponse(res)
    return result.ok ? result.data : null
  } catch {
    return null
  }
}