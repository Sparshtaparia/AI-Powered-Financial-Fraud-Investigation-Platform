import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normValue(series: number[], value: number): number {
  const mn = Math.min(...series)
  const mx = Math.max(...series)
  if (mx === mn) return 0
  return ((value - mn) / (mx - mn)) * 100
}

export function priorityFromRre(score: number): string {
  if (score >= 80) return "Critical"
  if (score >= 60) return "High"
  if (score >= 40) return "Medium"
  return "Monitor"
}

export function confidenceFromCount(n: number): string {
  if (n >= 100) return "High"
  if (n >= 30) return "Medium"
  return "Low"
}

export function structuralIntervention(row: { rre_score: number; active_days: number; capacity_loss: number; total_violations: number }): string {
  if (row.rre_score >= 80 && row.active_days > 20)
    return "Structural intervention + repeat enforcement (No-parking bollards, bus-stop relocation)"
  if (row.capacity_loss > 0.12)
    return "Tow-first enforcement operations"
  if (row.total_violations > 1500 && row.rre_score < 50)
    return "Signage / awareness / periodic patrol (High volume, low capacity loss)"
  return "Routine Monitor"
}

export function reasonCodes(row: { total_violations: number; capacity_loss: number; active_days: number; rre_score: number }, rreDf: { total_violations: number[]; capacity_loss: number[]; active_days: number[] }): string[] {
  const reasons: string[] = []
  const sortedViolations = [...rreDf.total_violations].sort((a, b) => a - b)
  const q75Violations = sortedViolations[Math.floor(sortedViolations.length * 0.75)]
  const sortedCapLoss = [...rreDf.capacity_loss].sort((a, b) => a - b)
  const q75CapLoss = sortedCapLoss[Math.floor(sortedCapLoss.length * 0.75)]
  const sortedActive = [...rreDf.active_days].sort((a, b) => a - b)
  const q75Active = sortedActive[Math.floor(sortedActive.length * 0.75)]

  if (row.total_violations >= q75Violations) reasons.push("High violation volume")
  if (row.capacity_loss >= q75CapLoss) reasons.push("Above-median capacity loss proxy")
  if (row.active_days >= q75Active) reasons.push("Persistent across multiple days")
  if (row.rre_score >= 60) reasons.push("Promoted by RRE impact ranking")
  if (!reasons.length) reasons.push("General monitoring threshold")
  return reasons
}

export function operationalDecision(rreScore: number, conf: string): string {
  if (rreScore >= 60 && conf === "High") return "DEPLOY (Impact-Aware Dispatch)"
  if (rreScore >= 60 && conf !== "High") return "VALIDATE (Field Check Required)"
  if (rreScore < 60 && conf === "High") return "MONITOR (Periodic check)"
  return "IGNORE (Collect more data)"
}
