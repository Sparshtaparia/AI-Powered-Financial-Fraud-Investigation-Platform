"use client"

import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  className?: string
  accentColor?: string
}

export function MetricCard({ label, value, trend, trendUp, className, accentColor = "bg-electric-mint" }: MetricCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl p-6 border border-border-subtle shadow-soft relative overflow-hidden",
      className
    )}>
      <div className={cn("absolute top-0 left-0 w-1 h-full", accentColor)} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">{label}</p>
      <p className="font-display text-3xl font-bold tracking-tighter text-deep-black">{value}</p>
      {trend && (
        <p className={cn("text-sm font-bold mt-1", trendUp ? "text-electric-mint" : "text-coral-pink")}>
          {trendUp ? "+" : ""}{trend}
        </p>
      )}
    </div>
  )
}
