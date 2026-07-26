"use client"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "pass" | "fail" | "warn" | "active" | "inactive"
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = {
    pass: { bg: "bg-electric-mint/10", text: "text-electric-mint", border: "border-electric-mint/20", dot: "bg-electric-mint" },
    fail: { bg: "bg-coral-pink/10", text: "text-coral-pink", border: "border-coral-pink/20", dot: "bg-coral-pink" },
    warn: { bg: "bg-butter-yellow/10", text: "text-butter-yellow", border: "border-butter-yellow/20", dot: "bg-butter-yellow" },
    active: { bg: "bg-electric-mint/10", text: "text-electric-mint", border: "border-electric-mint/30", dot: "bg-electric-mint animate-pulse" },
    inactive: { bg: "bg-white/5", text: "text-white/50", border: "border-white/10", dot: "bg-white/30" },
  }
  const c = config[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border", c.bg, c.text, c.border, className)}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label || status.toUpperCase()}
    </span>
  )
}
