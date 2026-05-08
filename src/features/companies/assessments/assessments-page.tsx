import { useState } from "react"
import { useParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, ClipboardCheck, Plus, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AssessmentService } from "@/api/services/assessment-service"
import { CompanyService } from "@/api/services/company-service"
import { CycleService } from "@/api/services/cycle-service"
import { useUser } from "@/hooks/useUser"
import { cn } from "@/lib/utils"
import type { AssessmentResponse, AssessmentType } from "@/api/model"
import { CreateAssessmentDialog } from "./create-assessment-dialog"

const assessmentService = new AssessmentService()
const companyService = new CompanyService()
const cycleService = new CycleService()

const PAGE_SIZE = 10

type Tab = "cycle" | "evaluated" | "evaluator"

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const TYPE_LABEL: Record<AssessmentType, string> = {
  SELF: "Self",
  PEER: "Peer",
  MANAGER: "Manager",
}

const TYPE_STYLE: Record<AssessmentType, string> = {
  SELF: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  PEER: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  MANAGER: "border-amber-500/40 bg-amber-500/10 text-amber-300",
}

const SCORE_TEXT: Record<number, string> = {
  1: "text-red-400",
  2: "text-orange-400",
  3: "text-amber-400",
  4: "text-emerald-400",
  5: "text-green-400",
}

function TypeBadge({ type }: { type: AssessmentType }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        TYPE_STYLE[type],
      )}
    >
      {TYPE_LABEL[type]}
    </Badge>
  )
}

function ScorePill({ score }: { score: number | null }) {
  const colorClass = score != null ? (SCORE_TEXT[Math.round(score)] ?? "text-amber-400") : "text-muted-foreground"
  return (
    <span className={cn("tabular-nums font-semibold text-sm", colorClass)}>
      {score != null ? score.toFixed(1) : "—"}
      {score != null && <span className="text-muted-foreground font-normal text-xs">/5</span>}
    </span>
  )
}

function RowSkeleton() {
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

function EmptyState({ label }: { label: string }) {
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2.5 text-sm transition-colors",
        active
          ? "border-primary text-foreground font-medium"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function AssessmentRow({ assessment }: { assessment: AssessmentResponse }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-accent/50"
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell className="pl-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{assessment.evaluator.fullName}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{assessment.evaluator.email}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{assessment.evaluated.fullName}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{assessment.evaluated.email}</span>
          </div>
        </TableCell>
        <TableCell><TypeBadge type={assessment.assessmentType} /></TableCell>
        <TableCell><ScorePill score={assessment.avgScore} /></TableCell>
        <TableCell className="max-w-xs">
          <p className="truncate text-sm text-muted-foreground" title={assessment.comment ?? undefined}>
            {assessment.comment || "—"}
          </p>
        </TableCell>
        <TableCell className="pr-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{fmtDate(assessment.createdAt)}</span>
            <span className="text-muted-foreground hover:text-foreground transition-colors">
              {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </span>
          </div>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="hover:bg-transparent bg-muted/20">
          <TableCell colSpan={6} className="px-6 py-4 space-y-4">
            {/* Meta: cycle + timestamps */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>Ciclo: <span className="text-foreground font-medium">{assessment.cycleName}</span></span>
              <span>·</span>
              <span>Criado: {fmtDate(assessment.createdAt)}</span>
              {assessment.updatedAt !== assessment.createdAt && (
                <>
                  <span>·</span>
                  <span>Atualizado: {fmtDate(assessment.updatedAt)}</span>
                </>
              )}
            </div>

            {/* Overall comment — hidden if null */}
            {assessment.comment && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1">Comentário geral</p>
                <p className="text-sm text-foreground/80 italic leading-relaxed">"{assessment.comment}"</p>
              </div>
            )}

            {/* Per-competency answers */}
            {assessment.answers.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-2">
                  Competências ({assessment.answers.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {assessment.answers.map((a) => {
                    const colorClass = SCORE_TEXT[Math.round(a.score)] ?? "text-amber-400"
                    return (
                      <div key={a.competencyId} className="border px-3 py-2.5 space-y-1">
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

export default function AssessmentsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>("cycle")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<AssessmentType | "">("")
  const [selectedCycleId, setSelectedCycleId] = useState<string>("")
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string>("")
  const [cyclePage, setCyclePage] = useState(0)
  const [evaluatedPage, setEvaluatedPage] = useState(0)
  const [evaluatorPage, setEvaluatorPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: members = [] } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 200).then((r) => r.data.content),
    enabled: !!slug,
  })

  const { data: cyclesData } = useQuery({
    queryKey: ["cycles", slug],
    queryFn: () => cycleService.getCycles(slug!, 0, 500).then((r) => r.data.content),
    enabled: !!slug,
  })
  const cycles = cyclesData ?? []

  const myRole = members.find((m) => m.email === user?.email)?.role ?? null
  const canCreate = myRole != null

  const { data: byCycleData, isLoading: loadingCycle } = useQuery({
    queryKey: ["assessments", "cycle", selectedCycleId, cyclePage],
    queryFn: () =>
      assessmentService.findAllByCycle(selectedCycleId, cyclePage, PAGE_SIZE).then((r) => r.data),
    enabled: !!selectedCycleId && tab === "cycle",
  })

  const { data: byEvaluatedData, isLoading: loadingEvaluated } = useQuery({
    queryKey: ["assessments", "evaluated", selectedMemberId, evaluatedPage],
    queryFn: () =>
      assessmentService
        .findAllByEvaluated(selectedMemberId, evaluatedPage, PAGE_SIZE)
        .then((r) => r.data),
    enabled: !!selectedMemberId && tab === "evaluated",
  })

  const { data: byEvaluatorData, isLoading: loadingEvaluator } = useQuery({
    queryKey: ["assessments", "evaluator", selectedEvaluatorId, evaluatorPage],
    queryFn: () =>
      assessmentService
        .findAllByEvaluator(selectedEvaluatorId, evaluatorPage, PAGE_SIZE)
        .then((r) => r.data),
    enabled: !!selectedEvaluatorId && tab === "evaluator",
  })

  const cycleAssessments = byCycleData?.content ?? []
  const cycleTotalPages = byCycleData?.page.totalPages ?? 0

  const evaluatedAssessments = byEvaluatedData?.content ?? []
  const evaluatedTotalPages = byEvaluatedData?.page.totalPages ?? 0

  const evaluatorAssessments = byEvaluatorData?.content ?? []
  const evaluatorTotalPages = byEvaluatorData?.page.totalPages ?? 0

  function handleTabChange(next: Tab) {
    setTab(next)
    setSearch("")
    setTypeFilter("")
  }

  function handleCreated() {
    queryClient.invalidateQueries({ queryKey: ["assessments"] })
  }

  const isLoading =
    tab === "cycle" ? loadingCycle :
    tab === "evaluated" ? loadingEvaluated :
    loadingEvaluator
  const assessments =
    tab === "cycle" ? cycleAssessments :
    tab === "evaluated" ? evaluatedAssessments :
    evaluatorAssessments
  const totalPages =
    tab === "cycle" ? cycleTotalPages :
    tab === "evaluated" ? evaluatedTotalPages :
    evaluatorTotalPages
  const page =
    tab === "cycle" ? cyclePage :
    tab === "evaluated" ? evaluatedPage :
    evaluatorPage
  const setPage =
    tab === "cycle" ? setCyclePage :
    tab === "evaluated" ? setEvaluatedPage :
    setEvaluatorPage
  const hasFilter =
    tab === "cycle" ? !!selectedCycleId :
    tab === "evaluated" ? !!selectedMemberId :
    !!selectedEvaluatorId

  const q = search.toLowerCase()
  const filteredAssessments = assessments.filter((a) => {
    const matchSearch = !q ||
      a.evaluator.fullName.toLowerCase().includes(q) ||
      a.evaluated.fullName.toLowerCase().includes(q)
    const matchType = !typeFilter || a.assessmentType === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4 sm:py-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <ClipboardCheck className="size-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-none">Avaliações</h1>
            <p className="mt-1 text-xs text-muted-foreground hidden sm:block">
              Visualize todas as avaliações submetidas — filtre por ciclo ou por colaborador
            </p>
          </div>
        </div>
        {canCreate && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setDialogOpen(true)}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Nova avaliação</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="-mb-px flex border-b px-4 sm:px-6 overflow-x-auto">
        <TabButton active={tab === "cycle"} onClick={() => handleTabChange("cycle")}>
          Por ciclo
        </TabButton>
        <TabButton active={tab === "evaluated"} onClick={() => handleTabChange("evaluated")}>
          Por avaliado
        </TabButton>
        <TabButton active={tab === "evaluator"} onClick={() => handleTabChange("evaluator")}>
          Por avaliador
        </TabButton>
      </div>

      {/* Filter */}
      <div className="border-b px-4 sm:px-6 py-3">
        {tab === "cycle" && (
          <Select value={selectedCycleId} onValueChange={(v) => { setSelectedCycleId(v); setCyclePage(0) }}>
            <SelectTrigger className="h-8 w-full sm:w-72 rounded-none text-sm">
              <SelectValue placeholder="Selecione um ciclo…" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tab === "evaluated" && (
          <Select value={selectedMemberId} onValueChange={(v) => { setSelectedMemberId(v); setEvaluatedPage(0) }}>
            <SelectTrigger className="h-8 w-full sm:w-72 rounded-none text-sm">
              <SelectValue placeholder="Selecione o avaliado…" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tab === "evaluator" && (
          <Select value={selectedEvaluatorId} onValueChange={(v) => { setSelectedEvaluatorId(v); setEvaluatorPage(0) }}>
            <SelectTrigger className="h-8 w-full sm:w-72 rounded-none text-sm">
              <SelectValue placeholder="Selecione o avaliador…" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Search + type filter */}
      {hasFilter && (
        <div className="flex items-center gap-2 border-b px-4 sm:px-6 py-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome…"
              className="h-7 rounded-none pl-8 text-xs"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {([["", "Tipo"], ["SELF", "Self"], ["PEER", "Peer"], ["MANAGER", "Manager"]] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setTypeFilter(v as AssessmentType | "")}
                className={cn(
                  "h-7 px-2.5 text-[11px] font-medium border transition-colors",
                  typeFilter === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Avaliador</TableHead>
              <TableHead>Avaliado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Média</TableHead>
              <TableHead>Comentário</TableHead>
              <TableHead className="pr-6">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasFilter ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6}>
                  <p className="py-14 text-center text-sm text-muted-foreground">
                    {tab === "cycle"
                      ? "Selecione um ciclo para ver as avaliações."
                      : tab === "evaluated"
                      ? "Selecione o avaliado para ver as avaliações."
                      : "Selecione o avaliador para ver as avaliações."}
                  </p>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => <RowSkeleton key={i} />)
            ) : filteredAssessments.length === 0 ? (
              <EmptyState
                label={
                  search || typeFilter
                    ? "Nenhum resultado para os filtros aplicados."
                    : tab === "cycle"
                    ? "Nenhuma avaliação submetida neste ciclo."
                    : tab === "evaluated"
                    ? "Nenhuma avaliação encontrada para este avaliado."
                    : "Nenhuma avaliação encontrada para este avaliador."
                }
              />
            ) : (
              filteredAssessments.map((a) => (
                <AssessmentRow key={a.id} assessment={a} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {hasFilter && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t px-4 sm:px-6 py-3">
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-none text-xs"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-none text-xs"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próximo
          </Button>
        </div>
      )}

      <CreateAssessmentDialog
        open={dialogOpen}
        slug={slug!}
        cycles={cycles}
        members={members}
        myRole={myRole}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
