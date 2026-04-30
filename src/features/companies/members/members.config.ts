import type { CompanyMemberRole } from "@/api/model"

export type SortKey = "fullName" | "email" | "role" | "createdAt"
export type SortDir = "asc" | "desc"

export const PAGE_SIZE = 10

export const ALL_ROLES: CompanyMemberRole[] = ["OWNER", "RH", "MANAGER", "EMPLOYEE"]

export const ROLE_CONFIG: Record<
  CompanyMemberRole,
  { label: string; pill: string; dot: string; activeBorder: string }
> = {
  OWNER: {
    label: "Proprietário",
    pill: "border border-violet-500/40 bg-violet-500/10 text-violet-300",
    dot: "bg-violet-400",
    activeBorder: "border-violet-500/60 bg-violet-500/10",
  },
  RH: {
    label: "RH",
    pill: "border border-blue-500/40 bg-blue-500/10 text-blue-300",
    dot: "bg-blue-400",
    activeBorder: "border-blue-500/60 bg-blue-500/10",
  },
  MANAGER: {
    label: "Gerente",
    pill: "border border-amber-500/40 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
    activeBorder: "border-amber-500/60 bg-amber-500/10",
  },
  EMPLOYEE: {
    label: "Funcionário",
    pill: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
    activeBorder: "border-emerald-500/60 bg-emerald-500/10",
  },
}

export function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export function fmtDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function getCurrentDate() {
  const d = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return d.charAt(0).toUpperCase() + d.slice(1)
}
