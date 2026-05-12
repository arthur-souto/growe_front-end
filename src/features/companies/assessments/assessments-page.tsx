import { useState } from "react"
import { useParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ClipboardCheck,
  ClipboardList,
  LayoutGrid,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { AssessmentType } from "@/api/model"
import { PAGE_SIZE, TYPE_LABEL } from "./assessments.config"
import type { Tab } from "./assessments.config"
import { AssessmentRow, EmptyState, RowSkeleton } from "./assessment-row"
import { CreateAssessmentDialog } from "./create-assessment-dialog"

const assessmentService = new AssessmentService()
const companyService = new CompanyService()
const cycleService = new CycleService()

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
          ? "border-white text-white font-medium"
          : "border-transparent text-white/40 hover:text-white/70",
      )}
    >
      {children}
    </button>
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
    const matchSearch =
      !q ||
      a.evaluator.fullName.toLowerCase().includes(q) ||
      a.evaluated.fullName.toLowerCase().includes(q)
    const matchType = !typeFilter || a.assessmentType === typeFilter
    return matchSearch && matchType
  })

  const validScores = filteredAssessments
    .filter((a) => a.avgScore != null)
    .map((a) => a.avgScore as number)
  const avgAllScore =
    validScores.length > 0
      ? validScores.reduce((s, v) => s + v, 0) / validScores.length
      : null
  const typeCounts = {
    SELF: filteredAssessments.filter((a) => a.assessmentType === "SELF").length,
    PEER: filteredAssessments.filter((a) => a.assessmentType === "PEER").length,
    MANAGER: filteredAssessments.filter((a) => a.assessmentType === "MANAGER").length,
  }

  function handleTabChange(next: Tab) {
    setTab(next)
    setSearch("")
    setTypeFilter("")
  }

  function handleCreated() {
    queryClient.invalidateQueries({ queryKey: ["assessments"] })
  }

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

      {/* Selector */}
      <div className="border-b px-4 sm:px-6 py-3">
        {tab === "cycle" && (
          <Select value={selectedCycleId} onValueChange={(v) => { setSelectedCycleId(v); setCyclePage(0) }}>
            <SelectTrigger className="h-8 w-full sm:w-72 text-sm ">
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
            <SelectTrigger className="h-8 w-full sm:w-72 text-sm ">
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
            <SelectTrigger className="h-8 w-full sm:w-72 text-sm ">
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
        <div className="flex items-center gap-4 border-b px-4 sm:px-6 py-2.5 flex-wrap">
          <div className="relative flex-1 min-w-45 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome…"
              className="h-7 rounded-none pl-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 shrink-0">Tipo</span>
            <div className="flex items-center gap-1">
              {(["SELF", "PEER", "MANAGER"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTypeFilter((prev) => (prev === v ? "" : v))}
                  className={cn(
                    "h-6 px-2.5 text-[11px] font-medium border rounded-full transition-colors",
                    typeFilter === v
                      ? "bg-white/10 text-white border-white/20"
                      : "border-white/10 text-white/50 hover:text-white hover:border-white/30",
                  )}
                >
                  {TYPE_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {hasFilter && !isLoading && filteredAssessments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 border-b px-4 sm:px-6 py-3">
          <div className="border bg-white/5 px-4 py-3 h-24 flex flex-col justify-between">
            <ClipboardList className="size-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</p>
              <p className="text-3xl font-bold tabular-nums leading-none mt-0.5">{filteredAssessments.length}</p>
            </div>
          </div>
          <div className="border bg-white/5 px-4 py-3 h-24 flex flex-col justify-between">
            <TrendingUp className={cn(
              "size-4",
              avgAllScore == null ? "text-muted-foreground"
              : avgAllScore >= 4 ? "text-green-400"
              : avgAllScore >= 2.5 ? "text-amber-400"
              : "text-red-400",
            )} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Média Geral</p>
              <p className={cn(
                "text-3xl font-bold tabular-nums leading-none mt-0.5",
                avgAllScore == null ? "text-muted-foreground"
                : avgAllScore >= 4 ? "text-green-400"
                : avgAllScore >= 2.5 ? "text-amber-400"
                : "text-red-400",
              )}>
                {avgAllScore != null ? avgAllScore.toFixed(1) : "—"}
              </p>
            </div>
          </div>
          <div className="border bg-white/5 px-4 py-3 h-24 flex flex-col justify-between">
            <LayoutGrid className="size-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tipos</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="text-xs text-violet-300">Auto <span className="font-bold tabular-nums">{typeCounts.SELF}</span></span>
                <span className="text-xs text-blue-300">Pares <span className="font-bold tabular-nums">{typeCounts.PEER}</span></span>
                <span className="text-xs text-amber-300">Gestor <span className="font-bold tabular-nums">{typeCounts.MANAGER}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Avaliador</TableHead>
              <TableHead>Avaliado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Média</TableHead>
              <TableHead>Comentário</TableHead>
              <TableHead className="pr-6 whitespace-nowrap min-w-30">Data</TableHead>
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
              filteredAssessments.map((a) => <AssessmentRow key={a.id} assessment={a} />)
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
