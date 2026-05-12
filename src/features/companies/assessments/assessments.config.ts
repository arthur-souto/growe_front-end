import type { AssessmentType } from "@/api/model"

export const PAGE_SIZE = 10

export type Tab = "cycle" | "evaluated" | "evaluator"

export function fmtDate(iso: string) {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleDateString("pt-BR", { month: "short" })
  const year = d.getFullYear()
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return `${day} ${month} ${year}, ${time}`
}

export function fmtDateShort(iso: string) {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleDateString("pt-BR", { month: "short" })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

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
