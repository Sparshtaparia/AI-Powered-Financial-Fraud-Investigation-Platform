import { useMemo } from "react"

export type Role = "admin" | "analyst" | "operator" | "viewer"

export type Permission =
  | "view_overview"
  | "view_live"
  | "view_investigate"
  | "view_simulate"
  | "view_deploy"
  | "view_trust"
  | "view_ask"
  | "export_data"
  | "dispatch_teams"
  | "manage_users"
  | "manage_system"

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: ["*" as unknown as Permission],
  analyst: [
    "view_overview", "view_live", "view_investigate", "view_simulate",
    "view_deploy", "view_trust", "view_ask", "export_data",
  ],
  operator: [
    "view_overview", "view_live", "view_investigate", "view_ask",
    "dispatch_teams", "export_data",
  ],
  viewer: [
    "view_overview", "view_live", "view_trust", "view_ask",
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = PERMISSIONS[role]
  if (!perms) return false
  if (perms.includes("*" as unknown as Permission)) return true
  return perms.includes(permission)
}

export function usePermissions(role: Role) {
  return useMemo(() => ({
    can: (permission: Permission) => hasPermission(role, permission),
    role,
    isAdmin: role === "admin",
    isAnalyst: role === "analyst",
    isOperator: role === "operator",
    isViewer: role === "viewer",
  }), [role])
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  analyst: "Analyst",
  operator: "Field Operator",
  viewer: "Viewer",
}

export const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-coral-pink/20 text-coral-pink border-coral-pink/30",
  analyst: "bg-electric-mint/20 text-electric-mint border-electric-mint/30",
  operator: "bg-butter-yellow/20 text-yellow-800 border-butter-yellow/30",
  viewer: "bg-sky-cyan/30 text-sky-800 border-sky-cyan/30",
}
