import type { EnforcementRecord } from "./types"

interface AllocInput {
  rre_score: number
  active_days: number
  total_violations: number
  capacity_loss: number
  segment_id: string
  zone_id?: string
  priority?: string
  road_name?: string
  highway_class?: string
}

function norm(val: number, min: number, max: number): number {
  if (max === min) return 0
  return (val - min) / (max - min)
}

export function allocateTeams(rreDf: AllocInput[], numTeams = 5, shiftDurationHours = 4): EnforcementRecord[] {
  const rreNorm = rreDf.map(r => r.rre_score)
  const rreMin = Math.min(...rreNorm)
  const rreMax = Math.max(...rreNorm)

  const activeNorm = rreDf.map(r => r.active_days)
  const activeMin = Math.min(...activeNorm)
  const activeMax = Math.max(...activeNorm)

  const logViolations = rreDf.map(r => Math.log1p(r.total_violations))
  const logMin = Math.min(...logViolations)
  const logMax = Math.max(...logViolations)

  const priorityWeight: Record<string, number> = {
    Critical: 1.0,
    High: 0.8,
    Medium: 0.4,
    Monitor: 0.1,
  }

  const seed = 42
  const pseudoRand = (i: number) => ((seed * (i + 1) * 16807) % 2147483647) / 2147483647

  const scored = rreDf.map((r, i) => {
    const rreN = norm(r.rre_score, rreMin, rreMax)
    const activeN = norm(r.active_days, activeMin, activeMax)
    const logN = norm(Math.log1p(r.total_violations), logMin, logMax)
    const prioW = priorityWeight[r.priority || "Monitor"] ?? 0.1
    const travelPenalty = pseudoRand(i)

    const dispatchScore =
      0.5 * rreN +
      0.2 * prioW +
      0.15 * activeN +
      0.1 * logN -
      0.05 * travelPenalty

    const capacityConstraint = Math.floor((shiftDurationHours * 60) / 40)

    return { ...r, dispatchScore, capacityConstraint }
  })

  const filtered = scored.filter(r => r.dispatchScore > 0.3)
  filtered.sort((a, b) => b.dispatchScore - a.dispatchScore)

  const top = filtered.slice(0, numTeams * Math.max(...filtered.map(r => r.capacityConstraint)))

  const actions: string[] = [
    "Tow + Patrol",
    "Signage Inspection",
    "Challan Drive",
    "Barrier Deployment",
    "Community Notice",
  ]

  const result: EnforcementRecord[] = []
  for (let i = 0; i < top.length; i++) {
    const teamIdx = i % numTeams
    const r = top[i]
    result.push({
      Team: `Unit-${String(teamIdx + 1).padStart(2, "0")}`,
      Time: `${6 + (i % shiftDurationHours)}:00`,
      Zone: r.zone_id || r.segment_id,
      Action: actions[i % actions.length],
      "Expected Recovery": Math.round(r.capacity_loss * 100 * 100) / 100,
      segment_id: r.segment_id,
      priority: r.priority || "Monitor",
    })
  }

  return result
}
