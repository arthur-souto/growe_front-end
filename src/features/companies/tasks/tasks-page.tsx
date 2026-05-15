import { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Link2,
  Link2Off,
  Plus,
  Search,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { CompanyService } from "@/api/services/company-service"
import { CompetencyService } from "@/api/services/competency-service"
import { CycleService } from "@/api/services/cycle-service"
import { TaskService } from "@/api/services/task-service"
import { getApiErrorMessage } from "@/api/api-error"
import { useUser } from "@/hooks/useUser"
import type {
  AssessmentType,
  CompetencyResponse,
  CreateEvaluationTaskRequest,
  CycleResumeResponse,
} from "@/api/model"
import { fmtDate } from "../members/members.config"
import { cn } from "@/lib/utils"

const companyService = new CompanyService()
const competencyService = new CompetencyService()
const cycleService = new CycleService()
const taskService = new TaskService()

function fmtDeadline(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleDateString("pt-BR", { month: "short" })
  const year = d.getFullYear()
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  if (!hasTime) return `${day} ${month} ${year}`
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return `${day} ${month} ${year}, ${time}`
}

const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  SELF: "Auto",
  PEER: "Pares",
  MANAGER: "Gestor",
}

const ASSESSMENT_STYLES: Record<AssessmentType, string> = {
  SELF: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  PEER: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  MANAGER: "border-amber-500/40 bg-amber-500/10 text-amber-300",
}

const BADGE_BASE = "rounded-none text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 min-w-[90px] justify-center"

function AssessmentBadge({ type }: { type: AssessmentType }) {
  return (
    <Badge variant="outline" className={`${BADGE_BASE} border ${ASSESSMENT_STYLES[type]}`}>
      {ASSESSMENT_LABELS[type]}
    </Badge>
  )
}

function StatusBadge({ status }: { status: "PENDING" | "DONE" }) {
  return (
    <Badge
      variant="outline"
      className={`${BADGE_BASE} ${
        status === "PENDING"
          ? "border-orange-800 border bg-orange-950 text-orange-400"
          : "border-green-500/40 border bg-green-500/10 text-green-400"
      }`}
    >
      {status === "PENDING" ? "Pendente" : "Concluído"}
    </Badge>
  )
}

function RowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="pl-5"><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-3 w-28" /></TableCell>
      <TableCell><Skeleton className="h-3 w-28" /></TableCell>
    </TableRow>
  )
}

function EmptyState() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={6}>
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-10 items-center justify-center border bg-muted">
            <ClipboardList className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhuma tarefa criada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Crie a primeira tarefa para este ciclo de avaliação.
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

interface TaskForm {
  assessmentType: AssessmentType | ""
  evaluatorId: string
  evaluatedId: string
  deadline: string
}

type TaskFormErrors = Partial<Record<keyof TaskForm, string>>

const EMPTY_FORM: TaskForm = {
  assessmentType: "",
  evaluatorId: "",
  evaluatedId: "",
  deadline: "",
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cycle competency management
// ---------------------------------------------------------------------------

interface CycleCompetenciesProps {
  slug: string
  cycleId: string
  canManage: boolean
}

function CycleCompetencies({ slug, cycleId, canManage }: CycleCompetenciesProps) {
  const queryClient = useQueryClient()
  const [linkOpen, setLinkOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")

  const { data: linked = [], isLoading: loadingLinked } = useQuery({
    queryKey: ["competencies", "cycle", cycleId],
    queryFn: () => competencyService.listByCycle(cycleId).then((r) => r.data.content),
    enabled: !!cycleId,
  })

  const { data: catalogPage, isLoading: loadingCatalog } = useQuery({
    queryKey: ["competencies", slug],
    queryFn: () => competencyService.listByCompany(slug, 0, 100).then((r) => r.data),
    enabled: !!slug && canManage && linkOpen,
  })

  const linkedIds = new Set(linked.map((c: CompetencyResponse) => c.id))
  const available = (catalogPage?.content ?? []).filter((c) => !linkedIds.has(c.id))

  const linkMutation = useMutation({
    mutationFn: (competencyId: string) =>
      competencyService.linkToCycle(cycleId, { competencyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies", "cycle", cycleId] })
      toast.success("Competência vinculada ao ciclo.")
      setSelectedId("")
      setLinkOpen(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao vincular competência.")),
  })

  const unlinkMutation = useMutation({
    mutationFn: (competencyId: string) =>
      competencyService.unlinkFromCycle(cycleId, competencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies", "cycle", cycleId] })
      toast.success("Competência removida do ciclo.")
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao desvincular competência.")),
  })

  return (
    <Card className="rounded-none shadow-none gap-0 py-0">
      <CardHeader className="px-5 py-4 border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          Competências do Ciclo
          {!loadingLinked && (
            <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
              {linked.length} {linked.length === 1 ? "competência" : "competências"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loadingLinked ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-b last:border-0">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        ) : linked.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-8 items-center justify-center border bg-muted">
              <BookOpen className="size-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              Nenhuma competência vinculada.{" "}
              {canManage && "Vincule competências do catálogo para que os avaliadores as pontuem."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {linked.map((c: CompetencyResponse) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">{c.name}</p>
                  {c.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate" title={c.description}>
                      {c.description}
                    </p>
                  )}
                </div>
                {canManage && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-muted-foreground hover:text-white hover:bg-white/10 rounded p-1.5 transition-colors cursor-pointer"
                    disabled={unlinkMutation.isPending}
                    onClick={() => unlinkMutation.mutate(c.id)}
                    title="Remover do ciclo"
                  >
                    <Link2Off className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {canManage && (
          <div className="border-t px-5 py-3">
            {linkOpen ? (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedId}
                  onValueChange={setSelectedId}
                  disabled={loadingCatalog}
                >
                  <SelectTrigger className="h-8 rounded-none flex-1 text-sm">
                    <SelectValue placeholder={loadingCatalog ? "Carregando…" : "Selecionar competência…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {available.length === 0 ? (
                      <div className="py-3 text-center text-xs text-muted-foreground">
                        Todas as competências já estão vinculadas.
                      </div>
                    ) : (
                      available.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 rounded-none shrink-0"
                  disabled={!selectedId || linkMutation.isPending}
                  onClick={() => linkMutation.mutate(selectedId)}
                >
                  <Link2 className="size-3.5" />
                  {linkMutation.isPending ? "Vinculando…" : "Vincular"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-none shrink-0"
                  onClick={() => { setLinkOpen(false); setSelectedId("") }}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-none gap-1.5 text-xs"
                onClick={() => setLinkOpen(true)}
              >
                <Plus className="size-3.5" />
                Vincular competência
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TasksPage() {
  const { slug, cycleId } = useParams<{ slug: string; cycleId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const cycleFromState = location.state as CycleResumeResponse | null

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<TaskFormErrors>({})
  const [evaluatorSearch, setEvaluatorSearch] = useState("")
  const [evaluatedSearch, setEvaluatedSearch] = useState("")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<AssessmentType | "">("")
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "DONE" | "">("")

  function openDialog() { setDialogOpen(true) }
  function closeDialog() {
    setDialogOpen(false)
    setForm(EMPTY_FORM)
    setErrors({})
    setEvaluatorSearch("")
    setEvaluatedSearch("")
  }

  // Fetch cycle info when not available via navigation state (direct URL access)
  const { data: cyclesData } = useQuery({
    queryKey: ["cycles", slug],
    queryFn: () => cycleService.getCycles(slug!, 0, 500).then((r) => r.data.content),
    enabled: !cycleFromState && !!slug,
  })
  const cycle: CycleResumeResponse | undefined =
    cycleFromState ?? cyclesData?.find((c) => c.id === cycleId)

  const { data: members = [] } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 200).then((r) => r.data.content),
    enabled: !!slug,
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", cycleId],
    queryFn: () => taskService.getTasks(cycleId!).then((r) => r.data),
    enabled: !!cycleId,
  })
  const tasks = tasksData?.content ?? []

  const q = search.toLowerCase()
  const filteredTasks = tasks.filter((t) => {
    const matchSearch = !q ||
      t.evaluatorName.fullName.toLowerCase().includes(q) ||
      t.evaluatedName.fullName.toLowerCase().includes(q)
    const matchType = !typeFilter || t.assessmentType === typeFilter
    const matchStatus = !statusFilter || t.status === statusFilter
    return matchSearch && matchType && matchStatus
  })
  const hasActiveFilter = !!search || !!typeFilter || !!statusFilter

  const filteredEvaluators = members.filter((m) =>
    m.fullName.toLowerCase().includes(evaluatorSearch.toLowerCase())
  )
  const filteredEvaluated = members.filter((m) =>
    m.fullName.toLowerCase().includes(evaluatedSearch.toLowerCase())
  )

  const myMember = members.find((m) => m.email === user?.email)
  const canCreate = ["OWNER", "ADMIN", "RH", "MANAGER"].includes(myMember?.role ?? "")

  const createMutation = useMutation({
    mutationFn: (payload: CreateEvaluationTaskRequest) =>
      taskService.createTask(slug!, cycleId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", cycleId] })
      toast.success("Tarefa criada com sucesso.")
      closeDialog()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao criar tarefa.")),
  })

  function setField<K extends keyof TaskForm>(key: K, value: TaskForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "assessmentType" && value === "SELF" && myMember) {
        next.evaluatorId = myMember.id
        next.evaluatedId = myMember.id
      }
      return next
    })
    setErrors((prev) => {
      const n = { ...prev }
      delete n[key]
      return n
    })
  }

  function validate(): TaskFormErrors {
    const e: TaskFormErrors = {}
    if (!form.assessmentType) e.assessmentType = "Selecione o tipo"
    if (!form.evaluatorId) e.evaluatorId = "Selecione o avaliador"
    if (!form.evaluatedId) e.evaluatedId = "Selecione o avaliado"
    if (!form.deadline) e.deadline = "Informe o prazo"
    return e
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    createMutation.mutate({
      cycleId: cycleId!,
      evaluatorId: form.evaluatorId,
      evaluatedId: form.evaluatedId,
      assessmentType: form.assessmentType as AssessmentType,
      deadline: new Date(form.deadline).toISOString(),
    })
  }

  const isSelf = form.assessmentType === "SELF"
  const now = new Date()

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-white/10 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2 shrink-0"
          onClick={() => navigate(`/my-company/${slug}/ciclos`)}
        >
          <ArrowLeft className="size-3.5" />
          Ciclos
        </Button>

        <Separator orientation="vertical" className="h-4 shrink-0" />

        <div className="flex items-center gap-3 min-w-0 flex-1">
          {cycle ? (
            <>
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cycle.color }}
              />
              <div className="min-w-0">
                <h1 className="text-sm font-semibold leading-none truncate">{cycle.name}</h1>
                <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="size-3 shrink-0" />
                  {fmtDate(cycle.startDate)} – {fmtDate(cycle.endDate)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`rounded-none text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 shrink-0 ${
                  cycle.isActive
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-red-500/40 bg-red-500/10 text-red-400"
                }`}
              >
                {cycle.isActive ? "Ativo" : "Encerrado"}
              </Badge>
            </>
          ) : (
            <>
              <Skeleton className="size-2.5 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </>
          )}
        </div>

        {canCreate && (
          <Button size="sm" onClick={openDialog} className="shrink-0">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Criar tarefa</span>
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        {/* Tasks table */}
        <Card className="rounded-none shadow-none gap-0 py-0">
          <CardHeader className="px-5 py-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              Tarefas
              {!tasksLoading && (
                <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
                  {filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"}
                  {hasActiveFilter && tasks.length !== filteredTasks.length && (
                    <span className="text-muted-foreground/50"> de {tasks.length}</span>
                  )}
                </span>
              )}
            </CardTitle>
          </CardHeader>

          {/* Filter bar */}
          <div className="flex items-center gap-4 border-b px-4 sm:px-5 py-2.5 flex-wrap">
            <div className="relative flex-1 min-w-45 ">
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">Tipo</span>
              <div className="flex items-center gap-1">
                {(["SELF", "PEER", "MANAGER"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTypeFilter((prev) => (prev === v ? "" : v))}
                    className={cn(
                      "h-6 px-2.5 text-[11px] font-medium border   transition-colors",
                      typeFilter === v
                        ? "bg-white/10 text-white border-white/30"
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/30",
                    )}
                  >
                    {ASSESSMENT_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">Status</span>
              <div className="flex items-center gap-1">
                {(["PENDING", "DONE"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setStatusFilter((prev) => (prev === v ? "" : v))}
                    className={cn(
                      "h-6 px-2.5 text-[11px] font-medium border  transition-colors",
                      statusFilter === v
                        ? "bg-white/10 text-white border-white/30"
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/30",
                    )}
                  >
                    {v === "PENDING" ? "Pendente" : "Concluído"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-150">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  {["Avaliador", "Avaliado", "Tipo", "Status", "Prazo", "Criado por"].map(
                    (col) => (
                      <TableHead
                        key={col}
                        className={`h-9 ${col === "Avaliador" ? "pl-5" : ""}`}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {col}
                        </span>
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                ) : filteredTasks.length === 0 ? (
                  <EmptyState />
                ) : (
                  filteredTasks.map((task) => {
                    const overdue =
                      task.status === "PENDING" && new Date(task.deadline) < now
                    return (
                      <TableRow
                        key={task.id}
                        className={
                          overdue
                            ? "bg-red-500/5 hover:bg-red-500/8 border-l-2 border-l-red-500/40"
                            : ""
                        }
                      >
                        <TableCell className="pl-5 py-3 text-sm font-medium">
                          {task.evaluatorName.fullName}
                        </TableCell>
                        <TableCell className="py-3 text-sm">
                          {task.evaluatedName.fullName}
                        </TableCell>
                        <TableCell className="py-3">
                          <AssessmentBadge type={task.assessmentType} />
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell
                          className={`py-3 text-xs ${overdue ? "text-red-400 font-medium" : "text-muted-foreground"}`}
                        >
                          {fmtDeadline(task.deadline)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {task.creatorName.fullName}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {cycleId && slug && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <CycleCompetencies slug={slug} cycleId={cycleId} canManage={canCreate} />
          </div>
        )}
      </div>

      {/* Create task dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              Nova Tarefa
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4  w-full pt-1">
            <Field label="Tipo de avaliação" error={errors.assessmentType}>
              <Select
                value={form.assessmentType}
                onValueChange={(v) => setField("assessmentType", v as AssessmentType)}
              >
                <SelectTrigger className="rounded-none w-full">
                  <SelectValue placeholder="Selecionar tipo…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELF">Auto</SelectItem>
                  <SelectItem value="PEER">Pares</SelectItem>
                  <SelectItem value="MANAGER">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Avaliador" error={errors.evaluatorId}>
              <Select
                value={form.evaluatorId}
                onValueChange={(v) => setField("evaluatorId", v)}
                onOpenChange={(open) => !open && setEvaluatorSearch("")}
              >
                <SelectTrigger className="w-full rounded-none">
                  <SelectValue placeholder="Selecionar avaliador…" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Buscar…"
                      value={evaluatorSearch}
                      onChange={(e) => setEvaluatorSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredEvaluators.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      Nenhum resultado
                    </div>
                  ) : (
                    filteredEvaluators.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.fullName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Avaliado" error={errors.evaluatedId}>
              <Select
                value={form.evaluatedId}
                onValueChange={(v) => setField("evaluatedId", v)}
                onOpenChange={(open) => !open && setEvaluatedSearch("")}
              >
                <SelectTrigger className="w-full rounded-none">
                  <SelectValue placeholder="Selecionar avaliado…" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Buscar…"
                      value={evaluatedSearch}
                      onChange={(e) => setEvaluatedSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredEvaluated.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      Nenhum resultado
                    </div>
                  ) : (
                    filteredEvaluated.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.fullName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>


            {isSelf && (
              <div className="flex flex-col gap-1 border-2 p-2">
                <h1 className="text-[14px] font-bold">Auto Avaliação Escolhida</h1>
                <p>O <span>avaliador</span> e <span>avaliado</span> devem ser o mesmo.</p>
              </div>
            )}

            <Field label="Prazo" error={errors.deadline}>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={form.deadline.split("T")[0] ?? ""}
                  onChange={(e) => setField("deadline", e.target.value + "T" + (form.deadline.split("T")[1] ?? "00:00"))}
                  className="w-full sm:flex-1 h-11 sm:h-9 border border-input bg-background px-3 py-1 text-base sm:text-sm shadow-sm rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <input
                  type="time"
                  value={form.deadline.split("T")[1] ?? ""}
                  onChange={(e) => setField("deadline", (form.deadline.split("T")[0] ?? "") + "T" + e.target.value)}
                  className="w-full sm:w-28 h-11 sm:h-9 border border-input bg-background px-3 py-1 text-base sm:text-sm shadow-sm rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </Field>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="size-3.5" />
                {createMutation.isPending ? "Criando…" : "Criar tarefa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
