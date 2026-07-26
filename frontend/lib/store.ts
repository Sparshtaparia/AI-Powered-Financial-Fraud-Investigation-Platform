import { create } from "zustand"
import type { Role } from "./rbac"

interface AppState {
  role: Role
  user: { name: string; email: string; avatar?: string } | null
  sidebarOpen: boolean
  setRole: (role: Role) => void
  setUser: (user: AppState["user"]) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  role: "admin",
  user: { name: "Arjun Mehta", email: "arjun@btp.gov.in" },
  sidebarOpen: true,
  setRole: (role) => set({ role }),
  setUser: (user) => set({ user }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
