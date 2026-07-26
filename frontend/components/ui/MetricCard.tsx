"use client"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  accent?: boolean
  accentColor?: string
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({ label, value, subtext, accent, accentColor = "border-l-electric-mint", icon, className }: MetricCardProps) {
  return (
    <div className={cn(
      "bg-[#111312] border border-white/5 p-5 rounded-3xl shadow-soft",
      accent && "border-b-2",
      accentColor === "coral" && "border-b-coral-pink",
      accentColor === "yellow" && "border-b-butter-yellow",
      accentColor === "mint" && "border-b-electric-mint",
      accentColor === "blue" && "border-b-blue-400",
      accentColor === "red" && "border-b-red-500",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">{label}</div>
          <div className={cn(
            "text-3xl font-display font-bold",
            accentColor === "coral" && "text-coral-pink",
            accentColor === "yellow" && "text-butter-yellow",
            accentColor === "mint" && "text-electric-mint",
            accentColor === "blue" && "text-blue-400",
            accentColor === "red" && "text-red-500",
            !accent && "text-white"
          )}>{value}</div>
        </div>
        {icon && <div className="text-white/20">{icon}</div>}
      </div>
      {subtext && <div className="text-[10px] text-white/30 mt-2">{subtext}</div>}
    </div>
  )
}
