"use client"

interface PageHeaderProps {
  title: string
  subtitle?: string
  status?: { label: string; active?: boolean; color?: string }
  sourceLabel?: string
  rightContent?: React.ReactNode
  changeSourceHref?: string
}

export function PageHeader({ title, subtitle, status, sourceLabel, rightContent }: PageHeaderProps) {
  return (
    <header className="mb-6 border-b border-white/10 pb-4 flex flex-wrap justify-between items-end gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-electric-mint mb-2">{title}</h1>
        {subtitle && <p className="text-white/50 text-sm">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {status && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
            status.active !== false
              ? 'bg-electric-mint/10 text-electric-mint border-electric-mint/30'
              : 'bg-coral-pink/10 text-coral-pink border-coral-pink/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.active !== false ? 'bg-electric-mint animate-pulse' : 'bg-coral-pink'}`} />
            {status.label}
          </div>
        )}
        {rightContent}
        {sourceLabel && <div className="text-xs text-white/40">{sourceLabel}</div>}
      </div>
    </header>
  )
}
