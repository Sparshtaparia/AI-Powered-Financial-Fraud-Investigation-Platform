"use client"

import { Search, Loader2, Command } from "lucide-react"

interface CommandBarProps {
  query: string
  setQuery: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  placeholder?: string
}

export function CommandBar({ query, setQuery, onSubmit, isLoading, placeholder = "Investigate customer C1023..." }: CommandBarProps) {
  return (
    <div className="w-full max-w-4xl mx-auto my-8 relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
      <form 
        onSubmit={onSubmit} 
        className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
      >
        <div className="pl-6 pr-4 py-4 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          ) : (
            <Command className="w-6 h-6 text-zinc-400" />
          )}
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? "Executing investigation workflow..." : placeholder}
          className="flex-1 bg-transparent border-none outline-none text-lg text-zinc-100 placeholder-zinc-500 py-5 w-full font-medium tracking-wide disabled:opacity-50"
          autoFocus
        />
        <div className="pr-6 pl-4 flex items-center justify-center">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
            Enter
          </kbd>
        </div>
      </form>
    </div>
  )
}
