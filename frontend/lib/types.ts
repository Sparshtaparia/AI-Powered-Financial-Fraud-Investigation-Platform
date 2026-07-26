export interface RreRecord {
  segment_id: string
  total_violations: number
  core_parking_violations: number
  avg_severity: number
  active_days: number
  road_name: string
  highway_class: string
  persistence: number
  capacity_loss: number
  junction_penalty: number
  demand_multiplier: number
  rre_score: number
  zone_id?: string
  priority?: string
  latitude?: number
  longitude?: number
}

export interface EnforcementRecord {
  Team: string
  Time: string
  Zone: string
  Action: string
  "Expected Recovery": number
  segment_id: string
  priority: string
}

export interface LiveEvent {
  event_id: string
  timestamp: string
  segment_id: string
  parking_class: string
  latitude: number
  longitude: number
}

export interface LiveState {
  cursor: number
  events_processed: number
  alerts_generated: number
  segment_counts: Record<string, number>
  alerts: LiveAlert[]
  last_event_time?: string
}

export interface LiveAlert {
  type: string
  segment_id: string
  count: number
  message: string
}

export interface HourlyDistribution {
  hour: number
  Violations: number
}

export interface DqReport {
  overall: string
  timestamp: string
  gates: Record<string, { status: string; detail: string }>
}
