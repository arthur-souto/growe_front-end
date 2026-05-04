import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { CycleResumeResponse } from "@/api/model"
import { PAGE_SIZE, fmtDate, getInitials } from "../members/members.config"

function fmtDateTime(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-none shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${
        isActive
          ? "border-green-500/40 bg-green-500/10 text-green-400"
          : "border-red-500/40 bg-red-500/10 text-red-400"
      }`}
    >
      {isActive ? "Ativo" : "Encerrado"}
    </Badge>
  )
}

function CycleCard({
  cycle,
  onSelect,
}: {
  cycle: CycleResumeResponse
  onSelect?: (cycle: CycleResumeResponse) => void
}) {
  return (
    <Card
      className={`rounded-none shadow-none flex flex-col border-l-4 transition-colors ${
        onSelect ? "cursor-pointer hover:bg-muted/40" : ""
      }`}
      style={{ borderLeftColor: cycle.color || "#6366f1" }}
      onClick={() => onSelect?.(cycle)}
    >
      <CardHeader className="p-5 pb-4 space-y-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-semibold leading-snug">{cycle.name}</CardTitle>
          <StatusBadge isActive={cycle.isActive} />
        </div>
        {cycle.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {cycle.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5 pt-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" />
          <span>
            {fmtDateTime(cycle.startDate)}
            <span className="mx-1.5 opacity-40">→</span>
            {fmtDateTime(cycle.endDate)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="size-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">{cycle.tasksCount ?? 0}</span>
            {" "}tarefa{cycle.tasksCount !== 1 ? "s" : ""}
          </span>
        </div>

        <Separator />

        <div className="flex items-center gap-2.5">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={cycle.creatorProfile || undefined} alt={cycle.creatorName} />
            <AvatarFallback className="text-[10px] font-semibold">
              {getInitials(cycle.creatorName || "—")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{cycle.creatorName || "—"}</p>
            <p className="text-[11px] text-muted-foreground">
              Criado em {fmtDateTime(cycle.createdAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CardSkeleton() {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5 pb-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-20 shrink-0" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 pt-0">
        <Skeleton className="h-3 w-full" />
        <Separator />
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex size-12 items-center justify-center border bg-muted">
        <CalendarRange className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Nenhum ciclo de avaliação</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Crie o primeiro ciclo para começar a acompanhar as avaliações.
        </p>
      </div>
    </div>
  )
}

interface Props {
  cycles: CycleResumeResponse[]
  loading: boolean
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (p: number) => void
  onCycleClick?: (cycle: CycleResumeResponse) => void
}

export function CyclesGrid({ cycles, loading, page, totalPages, totalItems, onPageChange, onCycleClick }: Props) {
  const start = page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalItems)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : cycles.length === 0 ? (
          <EmptyState />
        ) : (
          cycles.map((cycle) => (
            <CycleCard key={cycle.id} cycle={cycle} onSelect={onCycleClick} />
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-xs text-muted-foreground">
            {start}–{end} de {totalItems}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="gap-1 rounded-none"
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
              className="gap-1 rounded-none"
            >
              Próximo
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
