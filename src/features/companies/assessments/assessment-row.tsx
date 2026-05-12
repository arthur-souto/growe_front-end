import { useState } from "react"
import { ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { AssessmentResponse } from "@/api/model"
import { fmtDate, fmtDateShort } from "./assessments.config"
import { ScorePill } from "./score-pill"
import { TypeBadge } from "./type-badge"

export function RowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-3 w-10" /></TableCell>
      <TableCell><Skeleton className="h-3 w-40" /></TableCell>
      <TableCell><Skeleton className="h-3 w-28" /></TableCell>
    </TableRow>
  )
}

export function EmptyState({ label }: { label: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={6}>
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-10 items-center justify-center border bg-muted">
            <ClipboardCheck className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhuma avaliação encontrada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function AssessmentRow({ assessment }: { assessment: AssessmentResponse }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-accent/50"
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell className="pl-6 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{assessment.evaluator.fullName}</span>
            <span className="mt-0.5 text-xs text-white/40">{assessment.evaluator.email}</span>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{assessment.evaluated.fullName}</span>
            <span className="mt-0.5 text-xs text-white/40">{assessment.evaluated.email}</span>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <TypeBadge type={assessment.assessmentType} />
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center">
            <ScorePill score={assessment.avgScore} />
          </div>
        </TableCell>
        <TableCell className="max-w-xs py-3">
          <p className="truncate text-sm text-muted-foreground" title={assessment.comment ?? undefined}>
            {assessment.comment || "—"}
          </p>
        </TableCell>
        <TableCell className="pr-6 py-3 whitespace-nowrap min-w-30">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{fmtDateShort(assessment.createdAt)}</span>
            <span className="text-white/50 hover:text-white transition-colors">
              {open ? <ChevronUp className="size-4.5" /> : <ChevronDown className="size-4.5" />}
            </span>
          </div>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="hover:bg-transparent bg-muted/20">
          <TableCell colSpan={6} className="px-6 py-4 space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-xs">
                <span className="text-white/40">Ciclo: </span>
                <span className="text-white/70 font-medium">{assessment.cycleName}</span>
              </span>
              <span className="text-white/20">·</span>
              <span className="text-xs">
                <span className="text-white/40">Criado: </span>
                <span className="text-white/70">{fmtDate(assessment.createdAt)}</span>
              </span>
              {assessment.updatedAt !== assessment.createdAt && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-xs">
                    <span className="text-white/40">Atualizado: </span>
                    <span className="text-white/70">{fmtDate(assessment.updatedAt)}</span>
                  </span>
                </>
              )}
            </div>

            {assessment.comment && (
              <div>
                <p className="text-[11px] font-medium text-white/40 mb-1">Comentário geral</p>
                <p className="text-sm text-foreground/80 italic leading-relaxed max-w-full wrap-break-word whitespace-normal">
                  "{assessment.comment}"
                </p>
              </div>
            )}

            {assessment.answers.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-white/40 mb-2">
                  Competências ({assessment.answers.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {assessment.answers.map((a) => {
                    const colorClass =
                      a.score >= 4 ? "text-green-400"
                      : a.score >= 2.5 ? "text-amber-400"
                      : "text-red-400"
                    return (
                      <div key={a.competencyId} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium leading-none">{a.competencyName}</p>
                            {a.competencyDescription && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{a.competencyDescription}</p>
                            )}
                          </div>
                          <span className={cn("text-sm tabular-nums font-semibold shrink-0", colorClass)}>
                            {a.score.toFixed(1)}
                          </span>
                        </div>
                        {a.comment && (
                          <p className="text-xs text-muted-foreground italic">"{a.comment}"</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
