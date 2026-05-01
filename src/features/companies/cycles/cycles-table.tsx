import { ArrowUpDown, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CycleResumeResponse } from "@/api/model"
import { PAGE_SIZE, fmtDate, type SortDir } from "../members/members.config"
import { fmtDateTime, type CycleSortKey } from "./cycles.config"

function RowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="pl-5"><Skeleton className="h-3 w-48" /></TableCell>
      <TableCell><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-3 w-24" /></TableCell>
    </TableRow>
  )
}

function SortButton({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string
  col: CycleSortKey
  sortKey: CycleSortKey
  sortDir: SortDir
  onSort: (k: CycleSortKey) => void
}) {
  const active = sortKey === col
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
      {active ? (
        <span className="text-[10px] opacity-70">{sortDir === "asc" ? "↑" : "↓"}</span>
      ) : (
        <ArrowUpDown className="size-3 opacity-30" />
      )}
    </button>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-none text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${
        isActive
          ? "border-green-500/40 bg-green-500/10 text-green-400"
          : "border-red-500/40 bg-red-500/10 text-red-400"
      }`}
    >
      {isActive ? "Ativo" : "Desativado"}
    </Badge>
  )
}

function EmptyState() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={5}>
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-10 items-center justify-center border bg-muted">
            <CalendarRange className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhum ciclo de avaliação</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Crie o primeiro ciclo para começar a acompanhar as avaliações.
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface Props {
  cycles: CycleResumeResponse[]
  loading: boolean
  page: number
  totalPages: number
  totalFiltered: number
  sortKey: CycleSortKey
  sortDir: SortDir
  onSort: (k: CycleSortKey) => void
  onPageChange: (p: number) => void
}

export function CyclesTable({
  cycles,
  loading,
  page,
  totalPages,
  totalFiltered,
  sortKey,
  sortDir,
  onSort,
  onPageChange,
}: Props) {
  const sortProps = { sortKey, sortDir, onSort }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="pl-5 h-9">
              <SortButton label="Nome" col="name" {...sortProps} />
            </TableHead>
            <TableHead className="w-44 h-9">
              <SortButton label="Início" col="startDate" {...sortProps} />
            </TableHead>
            <TableHead className="w-44 h-9">
              <SortButton label="Fim" col="endDate" {...sortProps} />
            </TableHead>
            <TableHead className="w-32 h-9">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </span>
            </TableHead>
            <TableHead className="w-36 h-9">
              <SortButton label="Criado em" col="createdAt" {...sortProps} />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => <RowSkeleton key={i} />)
          ) : cycles.length === 0 ? (
            <EmptyState />
          ) : (
            cycles.map((cycle) => (
              <TableRow key={cycle.id} className="transition-colors">
                <TableCell className="pl-5 py-3 text-sm font-medium">{cycle.name}</TableCell>
                <TableCell className="py-3 text-xs text-muted-foreground">
                  {fmtDateTime(cycle.startDate)}
                </TableCell>
                <TableCell className="py-3 text-xs text-muted-foreground">
                  {fmtDateTime(cycle.endDate)}
                </TableCell>
                <TableCell className="py-3">
                  <StatusBadge isActive={cycle.isActive} />
                </TableCell>
                <TableCell className="py-3 text-xs text-muted-foreground">
                  {fmtDate(cycle.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && totalPages > 1 && (
        <>
          <Separator />
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalFiltered)} de {totalFiltered}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={() => onPageChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="gap-1"
              >
                <ChevronLeft className="size-3" />
                Anterior
              </Button>
              <span className="px-3 text-xs text-muted-foreground tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="gap-1"
              >
                Próximo
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
