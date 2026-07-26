import { X } from 'lucide-react'
import { HistoricalSourceConfig } from './HistoricalSourceConfig'
import { LiveSourceConfig } from './LiveSourceConfig'

interface Props {
  isOpen: boolean
  onClose: () => void
  mode: 'static' | 'live' | 'none'
  onComplete: () => void
}

export function DataSourceSetupModal({ isOpen, onClose, mode, onComplete }: Props) {
  if (!isOpen || mode === 'none') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#111312] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="p-8">
          {mode === 'static' ? (
            <HistoricalSourceConfig onComplete={onComplete} />
          ) : (
            <LiveSourceConfig onComplete={onComplete} />
          )}
        </div>
      </div>
    </div>
  )
}
