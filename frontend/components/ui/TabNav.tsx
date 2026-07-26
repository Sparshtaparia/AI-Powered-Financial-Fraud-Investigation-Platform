"use client"

interface TabNavProps {
  tabs: { id: string; label: string; icon?: React.ElementType }[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function TabNav({ tabs, activeTab, onTabChange, className = "" }: TabNavProps) {
  return (
    <div className={`flex gap-3 overflow-x-auto pb-2 ${className}`}>
      {tabs.map(t => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-electric-mint text-deep-black shadow-glow-mint'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {Icon && <Icon size={14} />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
