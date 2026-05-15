import type { AssessmentType } from "@/api/model"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export const TYPE_LABEL: Record<AssessmentType, string> = {
  SELF: "Auto",
  PEER: "Pares",
  MANAGER: "Gestor",
}

export const TYPE_STYLE: Record<AssessmentType, string> = {
  SELF: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  PEER: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  MANAGER: "border-amber-500/40 bg-amber-500/10 text-amber-300",
}

export function scoreColor(score: number | null): string {
  if (score == null) return "text-muted-foreground"
  if (score >= 4) return "text-green-400"
  if (score >= 2.5) return "text-amber-400"
  return "text-red-400"
}

export function scoreBarColor(score: number): string {
  if (score >= 4) return "#4ade80"
  if (score >= 2.5) return "#fbbf24"
  return "#f87171"
}

export function relativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR })
  } catch {
    return iso
  }
}

export const ADMIN_ROLES = ["OWNER", "MANAGER", "ADMIN"] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]
