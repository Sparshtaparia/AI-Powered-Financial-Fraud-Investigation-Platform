"use client"
import { cn } from "@/lib/utils"

interface PanelCardProps {
  title?: string
  subtitle?: string
  icon?: React.ElementType
  iconColor?: string
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
}

export function PanelCard({ title, subtitle, icon: Icon, iconColor = "text-electric-mint", children, className, headerRight }: PanelCardProps) {
  return (
    <div className={cn("bg-[#111312] border border-white/5 rounded-[32px] overflow-hidden shadow-soft", className)}>
      {(title || subtitle) && (
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={20} className={iconColor} />}
            <div>
              <h2 className="text-xl font-bold font-display">{title}</h2>
              {subtitle && <p className="text-white/50 text-sm mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  )
}
