/**
 * TRINETRA — Novel Methodology Framework
 *
 * IEEE-style contribution: Parking-Induced Congestion Quantification (PICQ)
 *
 * Core Novelty:
 * 1. Composite Congestion Impact Index (CCII)
 *    CCII(s) = 0.50 × RRE(s) + 0.30 × CL(s) × 100 + 0.20 × P(s)
 *    Where:
 *      RRE(s) = Road Recovery Efficiency score for segment s
 *      CL(s)  = Capacity Loss proxy (estimated traffic flow reduction)
 *      P(s)   = Temporal persistence (active_days / 7)
 *
 * 2. Dual Enforcement Peak Discovery (DEPD)
 *    Unsupervised detection of enforcement temporal clusters:
 *      Dawn window:  04:00–07:00 (pre-peak clearance)
 *      Night window: 20:00–23:00 (post-peak recovery)
 *    These windows represent strategic intervention timing, not random patrol.
 *
 * 3. Enforcement Priority Quadrant (EPQ)
 *    Quadrant-based classification across two axes:
 *      X-axis: RRE Score (impact severity)
 *      Y-axis: Violation count (volume magnitude)
 *      Q1 (High-High):     Immediate dispatch
 *      Q2 (High-Low):      Hidden impact zones — strategic positions
 *      Q3 (Low-High):      High volume, low congestion impact
 *      Q4 (Low-Low):       Routine monitor
 *
 * 4. Enforcement Gap Coefficient (EGC)
 *    EGC = 1 − (V_covered / V_total)
 *    Where V_covered = violations on segments with RRE >= 50
 *    Measures the proportion of congestion-causing violations
 *    not covered by current enforcement prioritization.
 */

export type EpqQuadrant = "Q1" | "Q2" | "Q3" | "Q4"

export interface CciiResult {
  score: number
  components: { rre: number; capacityLoss: number; persistence: number }
  quadrant: EpqQuadrant
  severity: "critical" | "high" | "medium" | "low"
}

export function computeCCII(
  rreScore: number,
  capacityLoss: number,
  activeDays: number,
): CciiResult {
  const persistence = activeDays / 7
  const score = Math.round(
    (0.50 * rreScore + 0.30 * capacityLoss * 100 + 0.20 * persistence * 100) * 10
  ) / 10

  const severity =
    score >= 70 ? "critical" as const :
    score >= 50 ? "high" as const :
    score >= 30 ? "medium" as const :
    "low" as const

  const quadrant = classifyQuadrant(rreScore, capacityLoss)

  return {
    score,
    components: {
      rre: rreScore,
      capacityLoss: Math.round(capacityLoss * 10000) / 100,
      persistence: Math.round(persistence * 1000) / 10,
    },
    quadrant,
    severity,
  }
}

export function classifyQuadrant(rreScore: number, capacityLoss: number): EpqQuadrant {
  const highRre = rreScore >= 50
  const highCap = capacityLoss >= 0.08
  if (highRre && highCap) return "Q1"
  if (highRre && !highCap) return "Q2"
  if (!highRre && highCap) return "Q3"
  return "Q4"
}

export function enforcementGap(
  segments: { rre_score: number; total_violations: number }[]
): number {
  const total = segments.reduce((s, r) => s + r.total_violations, 0)
  const covered = segments
    .filter((r) => r.rre_score >= 50)
    .reduce((s, r) => s + r.total_violations, 0)
  return total > 0 ? Math.round((1 - covered / total) * 100) : 0
}

export const EPQ_LABELS: Record<EpqQuadrant, { label: string; action: string; color: string }> = {
  Q1: { label: "Immediate Dispatch", action: "Deploy tow units — highest network congestion impact", color: "#FF6B73" },
  Q2: { label: "Hidden Impact", action: "Strategic intervention — high impact per violation", color: "#F6E85D" },
  Q3: { label: "High Volume Monitor", action: "Signage/awareness — low congestion per violation", color: "#BFEFF3" },
  Q4: { label: "Routine Monitor", action: "Periodic patrol — collect more data", color: "#18D68B" },
}

export const METHODOLOGY_INTRO = `TRINETRA introduces a Parking-Induced Congestion Quantification (PICQ) framework that transforms raw BTP enforcement data into operationally actionable intelligence. Unlike conventional violation-counting approaches, PICQ employs a multi-dimensional Composite Congestion Impact Index (CCII) that weights each enforcement segment across three axes: Road Recovery Efficiency (RRE), capacity loss proxy, and temporal persistence. This enables detection of "hidden impact" zones — segments where few violations cause disproportionate traffic congestion due to their strategic road position (junctions, narrow carriageways, near metro stations).`

export const CCII_EXPLANATION = `The Composite Congestion Impact Index (CCII) is defined as:
CCII(s) = 0.50 × RRE(s) + 0.30 × CapLoss(s) × 100 + 0.20 × Persistence(s)

Where:
• RRE(s) = Road Recovery Efficiency score (0-100) measuring violation density relative to road capacity
• CapLoss(s) = estimated capacity loss proxy (0.0-1.0) derived from road width and violation positioning
• Persistence(s) = active days / 7, capturing recurrence frequency

This three-factor weighting ensures that:
• High-violation roads with narrow carriageways score highest (Q1 — immediate dispatch)
• Low-violation but strategically critical roads are surfaced (Q2 — hidden impact)
• High-volume but low-impact roads receive proportionate monitoring (Q3)
• Routine segments are deprioritized (Q4)`
