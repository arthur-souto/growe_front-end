import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react"
import { ScoreRating } from "@/features/companies/assessments/create-assessment-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { AssessmentService } from "@/api/services/assessment-service"
import { CompanyService } from "@/api/services/company-service"
import { CompetencyService } from "@/api/services/competency-service"
import { CycleService } from "@/api/services/cycle-service"
import { TaskService } from "@/api/services/task-service"
import { getApiErrorMessage } from "@/api/api-error"
import { useUser } from "@/hooks/useUser"
import { cn } from "@/lib/utils"
import type {
  AssessmentResponse,
  AssessmentType,
  EvaluationTaskResponse,
} from "@/api/model"

const assessmentService = new AssessmentService()
const companyService = new CompanyService()
const competencyService = new CompetencyService()
const cycleService = new CycleService()
const taskService = new TaskService()

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

type Tab = "pending" | "done" | "received" | "given"

const PAGE_SIZE = 10

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// Score display
// ---------------------------------------------------------------------------

const SCORE_LABELS: Record<number, string> = {
  1: "Ruim", 2: "Fraco", 3: "Regular", 4: "Bom", 5: "Excelente",
}
const SCORE_COLORS: Record<number, string> = {
  1: "border-red-500/40 bg-red-500/10 text-red-400",
  2: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  3: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  4: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  5: "border-green-500/40 bg-green-500/10 text-green-400",
}

function ScoreDisplay({ score }: { score: number | null }) {
  const n = score != null ? Math.round(score) : 0
  return (
    <div className={cn("flex flex-col items-center justify-center border px-3 py-2 min-w-[56px]", SCORE_COLORS[n] ?? SCORE_COLORS[3])}>
      <span className="text-base font-bold tabular-nums leading-none">{score != null ? score.toFixed(1) : "—"}</span>
      <span className="text-[10px] leading-none mt-1 font-medium">{SCORE_LABELS[n] ?? "—"}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

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
        "border-b-2 px-4 py-2.5 text-sm transition-colors whitespace-nowrap",
        active
          ? "border-primary text-foreground font-medium"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Submit dialog
// ---------------------------------------------------------------------------

interface SubmitDialogProps {
  task: EvaluationTaskResponse | null
  cycleName: string
  onClose: () => void
  onSubmitted: () => void
}

function SubmitTaskDialog({ task, cycleName, onClose, onSubmitted }: SubmitDialogProps) {
  const [answers, setAnswers] = useState<Record<string, { score: number; comment: string }>>({})
  const [overallComment, setOverallComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const { data: competencies = [], isLoading: loadingCompetencies } = useQuery({
    queryKey: ["competencies", "cycle", task?.cycleId],
    queryFn: () => competencyService.listByCycle(task!.cycleId).then((r) => r.data.content),
    enabled: !!task?.cycleId,
  })

  useEffect(() => {
    if (competencies.length > 0) {
      setAnswers(
        Object.fromEntries(competencies.map((c) => [c.id, { score: 0, comment: "" }]))
      )
    }
  }, [competencies])

  function reset() {
    setAnswers({})
    setOverallComment("")
    setSubmitError("")
    setImproving(false)
  }

  function setAnswerScore(competencyId: string, score: number) {
    setAnswers((prev) => ({ ...prev, [competencyId]: { ...prev[competencyId], score } }))
    setSubmitError("")
  }

  function setAnswerComment(competencyId: string, comment: string) {
    setAnswers((prev) => ({ ...prev, [competencyId]: { ...prev[competencyId], comment } }))
  }

  const allScored = competencies.length > 0 && competencies.every((c) => (answers[c.id]?.score ?? 0) > 0)

  const avgScore = allScored
    ? competencies.reduce((sum, c) => sum + (answers[c.id]?.score ?? 0), 0) / competencies.length
    : 0

  async function handleImproveComment() {
    if (!task || !overallComment.trim() || !allScored) return
    setImproving(true)
    try {
      const res = await assessmentService.improveComment({
        comment: overallComment,
        score: Math.round(avgScore),
        assessmentType: task.assessmentType,
      })
      setOverallComment(res.data.response)
      toast.success("Comentário melhorado com IA.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao melhorar comentário."))
    } finally {
      setImproving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allScored) { setSubmitError("Atribua uma nota para cada competência"); return }
    if (!task) return

    setSaving(true)
    try {
      await assessmentService.submitAssessment(task.id, {
        comment: overallComment.trim() || undefined,
        answers: competencies.map((c) => ({
          competencyId: c.id,
          score: answers[c.id].score,
          comment: answers[c.id].comment.trim() || undefined,
        })),
      })
      toast.success("Avaliação submetida com sucesso.")
      onSubmitted()
      reset()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao submeter avaliação."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!task} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 shrink-0" />
            Submeter avaliação
          </DialogTitle>
        </DialogHeader>

        {task && (
          <div className="rounded-none border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground space-y-1 -mt-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider shrink-0",
                  TYPE_STYLE[task.assessmentType],
                )}
              >
                {TYPE_LABEL[task.assessmentType]}
              </Badge>
              <span className="font-medium text-foreground truncate">{task.evaluatedName.fullName}</span>
            </div>
            <p><span className="text-foreground font-medium">Ciclo: </span>{cycleName}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Per-competency scoring */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Competências</Label>
            {loadingCompetencies ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border px-3.5 py-3 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : competencies.length === 0 ? (
              <p className="text-xs text-muted-foreground border px-3.5 py-3">
                Este ciclo não possui competências configuradas. Peça ao administrador para vincular competências ao ciclo.
              </p>
            ) : (
              <div className="space-y-2">
                {competencies.map((c) => (
                  <div key={c.id} className="border px-3.5 py-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium leading-none">{c.name}</p>
                      {c.description && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{c.description}</p>
                      )}
                    </div>
                    <ScoreRating
                      value={answers[c.id]?.score ?? 0}
                      onChange={(v) => setAnswerScore(c.id, v)}
                    />
                    <Textarea
                      value={answers[c.id]?.comment ?? ""}
                      onChange={(e) => setAnswerComment(c.id, e.target.value)}
                      placeholder="Comentário opcional para esta competência…"
                      className="rounded-none resize-none h-16 text-xs"
                      disabled={improving}
                    />
                  </div>
                ))}
              </div>
            )}
            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          </div>

          {/* Overall comment + AI */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Comentário geral <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Adicione um comentário geral opcional…"
              className="rounded-none resize-none h-20 text-sm"
              disabled={improving}
            />
            <button
              type="button"
              onClick={handleImproveComment}
              disabled={improving || !overallComment.trim() || !allScored}
              className={cn(
                "w-full flex items-center gap-3 border px-3.5 py-2.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                !improving && overallComment.trim() && allScored
                  ? "border-violet-500/30 hover:bg-violet-500/5 cursor-pointer"
                  : "border-border cursor-not-allowed",
              )}
            >
              <div className={cn(
                "flex size-7 shrink-0 items-center justify-center border transition-colors",
                !improving && overallComment.trim() && allScored
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                  : "border-border bg-muted text-muted-foreground/40",
              )}>
                {improving
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Sparkles className="size-3.5" />
                }
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={cn(
                  "text-xs font-medium leading-none",
                  !improving && overallComment.trim() && allScored ? "text-foreground" : "text-muted-foreground/60",
                )}>
                  {improving ? "Melhorando comentário…" : "Melhorar com IA"}
                </span>
                <span className="text-[11px] leading-none text-muted-foreground">
                  {improving
                    ? "Aguarde enquanto reescrevemos o texto"
                    : !allScored
                    ? "Avalie todas as competências primeiro"
                    : !overallComment.trim()
                    ? "Escreva um comentário para ativar"
                    : "Reescreve com linguagem mais profissional"}
                </span>
              </div>
            </button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-none" onClick={() => { reset(); onClose() }} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-none" disabled={saving || improving || !allScored || competencies.length === 0}>
              {saving ? "Submetendo…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Task card (pending / done)
// ---------------------------------------------------------------------------

function TaskCard({
  task,
  cycleName,
  onEvaluate,
}: {
  task: EvaluationTaskResponse
  cycleName: string
  onEvaluate?: (t: EvaluationTaskResponse) => void
}) {
  const now = new Date()
  const overdue = task.status === "PENDING" && new Date(task.deadline) < now

  return (
    <div
      className={cn(
        "flex items-center gap-4 border px-4 py-3 transition-colors",
        overdue && "border-l-2 border-l-red-500/50 bg-red-500/5",
      )}
    >
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider shrink-0",
              TYPE_STYLE[task.assessmentType],
            )}
          >
            {TYPE_LABEL[task.assessmentType]}
          </Badge>
          <span className="text-sm font-medium truncate">{task.evaluatedName.fullName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{cycleName}</span>
          <span className="text-border">·</span>
          {task.status === "PENDING" ? (
            <span className={cn("flex items-center gap-1", overdue && "text-red-400 font-medium")}>
              <Clock className="size-3 shrink-0" />
              {overdue ? "Atrasado — " : "Prazo: "}{fmtShort(task.deadline)}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="size-3 shrink-0" />
              Concluído em {fmtShort(task.completedAt!)}
            </span>
          )}
        </div>
      </div>

      {task.status === "PENDING" && onEvaluate && (
        <Button size="sm" variant="outline" className="rounded-none shrink-0 h-7 text-xs" onClick={() => onEvaluate(task)}>
          Avaliar
        </Button>
      )}
      {task.status === "DONE" && (
        <CheckCircle2 className="size-4 text-green-400 shrink-0" />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assessment card (received / given) — full detail
// ---------------------------------------------------------------------------

function scoreTextColor(score: number) {
  const map: Record<number, string> = {
    1: "text-red-400", 2: "text-orange-400", 3: "text-amber-400",
    4: "text-emerald-400", 5: "text-green-400",
  }
  return map[Math.round(score)] ?? "text-muted-foreground"
}

function AssessmentCard({ assessment }: { assessment: AssessmentResponse }) {
  return (
    <div className="border divide-y">
      {/* Header: type · cycle · timestamps */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className={cn(
              "rounded-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider shrink-0",
              TYPE_STYLE[assessment.assessmentType],
            )}
          >
            {TYPE_LABEL[assessment.assessmentType]}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">{assessment.cycleName}</span>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-[11px] text-muted-foreground">
            Criado: {fmtDate(assessment.createdAt)}
          </p>
          {assessment.updatedAt !== assessment.createdAt && (
            <p className="text-[11px] text-muted-foreground">
              Atualizado: {fmtDate(assessment.updatedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Score + parties */}
      <div className="flex items-start gap-4 px-4 py-3">
        <ScoreDisplay score={assessment.avgScore} />
        <div className="w-px self-stretch bg-border shrink-0" />
        <div className="flex flex-col gap-1.5 text-xs min-w-0">
          <div className="min-w-0">
            <span className="text-muted-foreground">Avaliador: </span>
            <span className="font-medium text-foreground">{assessment.evaluator.fullName}</span>
            <span className="ml-1 text-muted-foreground break-all">· {assessment.evaluator.email}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground">Avaliado: </span>
            <span className="font-medium text-foreground">{assessment.evaluated.fullName}</span>
            <span className="ml-1 text-muted-foreground break-all">· {assessment.evaluated.email}</span>
          </div>
        </div>
      </div>

      {/* Overall comment — hidden if null */}
      {assessment.comment && (
        <div className="px-4 py-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Comentário geral</p>
          <p className="text-sm text-foreground/80 italic leading-relaxed">"{assessment.comment}"</p>
        </div>
      )}

      {/* Per-competency answers */}
      {assessment.answers.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            Competências ({assessment.answers.length})
          </p>
          <div className="space-y-1.5">
            {assessment.answers.map((a) => (
              <div key={a.competencyId} className="flex items-start gap-3 border px-3 py-2.5">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-medium leading-none">{a.competencyName}</p>
                  {a.competencyDescription && (
                    <p className="text-[11px] text-muted-foreground">{a.competencyDescription}</p>
                  )}
                  {a.comment && (
                    <p className="text-xs text-muted-foreground italic">"{a.comment}"</p>
                  )}
                </div>
                <span className={cn("shrink-0 text-sm tabular-nums font-semibold", scoreTextColor(a.score))}>
                  {a.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeletons / empty states
// ---------------------------------------------------------------------------

function TaskSkeleton() {
  return (
    <div className="flex items-center gap-4 border px-4 py-3">
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-7 w-16" />
    </div>
  )
}

function ReceivedSkeleton() {
  return (
    <div className="border px-4 py-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

function EmptyState({ icon: Icon = ClipboardList, title, description }: {
  icon?: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-10 items-center justify-center border bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MyTasksPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>("pending")
  const [selectedTask, setSelectedTask] = useState<EvaluationTaskResponse | null>(null)
  const [receivedPage, setReceivedPage] = useState(0)
  const [givenPage, setGivenPage] = useState(0)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<AssessmentType | "">("")

  useEffect(() => { setSearch(""); setTypeFilter("") }, [tab])

  const { data: members = [] } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 200).then((r) => r.data.content),
    enabled: !!slug,
  })
  const myMemberId = members.find((m) => m.email === user?.email)?.id

  const { data: cycles = [], isLoading: loadingCycles } = useQuery({
    queryKey: ["cycles", slug],
    queryFn: () => cycleService.getCycles(slug!, 0, 500).then((r) => r.data.content),
    enabled: !!slug,
  })

  const taskQueries = useQueries({
    queries: cycles.map((c) => ({
      queryKey: ["tasks", c.id],
      queryFn: () => taskService.getTasks(c.id).then((r) => r.data),
    })),
  })

  const isLoadingTasks = loadingCycles || taskQueries.some((q) => q.isLoading)
  const cycleMap = new Map(cycles.map((c) => [c.id, c]))

  const allTasks = taskQueries.flatMap((q) => q.data?.content ?? [])
  const myTasks = allTasks.filter((t) => t.evaluatorName.email === user?.email)

  const pendingTasks = myTasks
    .filter((t) => t.status === "PENDING")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  const doneTasks = myTasks
    .filter((t) => t.status === "DONE")
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

  const { data: receivedData, isLoading: loadingReceived } = useQuery({
    queryKey: ["assessments", "evaluated", myMemberId, receivedPage],
    queryFn: () =>
      assessmentService.findAllByEvaluated(myMemberId!, receivedPage, PAGE_SIZE).then((r) => r.data),
    enabled: !!myMemberId && tab === "received",
  })

  const { data: givenData, isLoading: loadingGiven } = useQuery({
    queryKey: ["assessments", "evaluator", myMemberId, givenPage],
    queryFn: () =>
      assessmentService.findAllByEvaluator(myMemberId!, givenPage, PAGE_SIZE).then((r) => r.data),
    enabled: !!myMemberId && tab === "given",
  })

  const receivedAssessments = receivedData?.content ?? []
  const receivedTotalPages = receivedData?.page.totalPages ?? 0

  const q = search.toLowerCase()
  const filteredPending = pendingTasks.filter((t) =>
    (!q || t.evaluatedName.fullName.toLowerCase().includes(q)) &&
    (!typeFilter || t.assessmentType === typeFilter)
  )
  const filteredDone = doneTasks.filter((t) =>
    (!q || t.evaluatedName.fullName.toLowerCase().includes(q)) &&
    (!typeFilter || t.assessmentType === typeFilter)
  )
  const filteredReceived = receivedAssessments.filter((a) =>
    (!q || a.evaluator.fullName.toLowerCase().includes(q)) &&
    (!typeFilter || a.assessmentType === typeFilter)
  )
  const filteredGiven = (givenData?.content ?? []).filter((a) =>
    (!q || a.evaluated.fullName.toLowerCase().includes(q)) &&
    (!typeFilter || a.assessmentType === typeFilter)
  )

  function handleSubmitted() {
    queryClient.invalidateQueries({ queryKey: ["tasks"] })
    queryClient.invalidateQueries({ queryKey: ["assessments"] })
  }

  const selectedCycleName = selectedTask
    ? (cycleMap.get(selectedTask.cycleId)?.name ?? "—")
    : ""

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 sm:px-6 py-4 sm:py-5">
        <ClipboardList className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-sm font-semibold leading-none">Minhas Tarefas</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Suas avaliações pendentes, concluídas e recebidas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="-mb-px flex border-b px-4 sm:px-6 overflow-x-auto">
        <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
          Pendentes
          {!isLoadingTasks && pendingTasks.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {pendingTasks.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "done"} onClick={() => setTab("done")}>
          Concluídas
        </TabButton>
        <TabButton active={tab === "received"} onClick={() => setTab("received")}>
          Recebidas
          {receivedData && receivedData.page.totalElements > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {receivedData.page.totalElements}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "given"} onClick={() => setTab("given")}>
          Feitas por mim
          {givenData && givenData.page.totalElements > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {givenData.page.totalElements}
            </span>
          )}
        </TabButton>
      </div>

      {/* Filter bar */}
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Pending / Done */}
        {(tab === "pending" || tab === "done") && (
          <div className="flex flex-col gap-2">
            {isLoadingTasks ? (
              Array.from({ length: 4 }).map((_, i) => <TaskSkeleton key={i} />)
            ) : (tab === "pending" ? filteredPending : filteredDone).length === 0 ? (
              <EmptyState
                title="Nenhuma tarefa encontrada"
                description={
                  tab === "pending"
                    ? "Você não tem avaliações pendentes."
                    : "Nenhuma avaliação concluída ainda."
                }
              />
            ) : (
              (tab === "pending" ? filteredPending : filteredDone).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  cycleName={cycleMap.get(task.cycleId)?.name ?? "—"}
                  onEvaluate={tab === "pending" ? setSelectedTask : undefined}
                />
              ))
            )}
          </div>
        )}

        {/* Received assessments */}
        {tab === "received" && (
          <>
            <div className="flex flex-col gap-2">
              {loadingReceived ? (
                Array.from({ length: 3 }).map((_, i) => <ReceivedSkeleton key={i} />)
              ) : filteredReceived.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="Nenhuma avaliação recebida"
                  description="Você ainda não foi avaliado em nenhum ciclo."
                />
              ) : (
                filteredReceived.map((a) => (
                  <AssessmentCard key={a.id} assessment={a} />
                ))
              )}
            </div>

            {receivedTotalPages > 1 && (
              <div className="flex items-center justify-end gap-2 border-t mt-4 pt-3">
                <Button size="sm" variant="outline" className="h-7 rounded-none text-xs" disabled={receivedPage === 0} onClick={() => setReceivedPage((p) => p - 1)}>
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">{receivedPage + 1} / {receivedTotalPages}</span>
                <Button size="sm" variant="outline" className="h-7 rounded-none text-xs" disabled={receivedPage + 1 >= receivedTotalPages} onClick={() => setReceivedPage((p) => p + 1)}>
                  Próximo
                </Button>
              </div>
            )}
          </>
        )}

        {/* Given assessments */}
        {tab === "given" && (
          <>
            <div className="flex flex-col gap-2">
              {loadingGiven ? (
                Array.from({ length: 3 }).map((_, i) => <ReceivedSkeleton key={i} />)
              ) : filteredGiven.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhuma avaliação feita"
                  description="Você ainda não submeteu avaliações como avaliador."
                />
              ) : (
                filteredGiven.map((a) => (
                  <AssessmentCard key={a.id} assessment={a} />
                ))
              )}
            </div>

            {(givenData?.page.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-end gap-2 border-t mt-4 pt-3">
                <Button size="sm" variant="outline" className="h-7 rounded-none text-xs" disabled={givenPage === 0} onClick={() => setGivenPage((p) => p - 1)}>
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">{givenPage + 1} / {givenData?.page.totalPages}</span>
                <Button size="sm" variant="outline" className="h-7 rounded-none text-xs" disabled={givenPage + 1 >= (givenData?.page.totalPages ?? 0)} onClick={() => setGivenPage((p) => p + 1)}>
                  Próximo
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <SubmitTaskDialog
        task={selectedTask}
        cycleName={selectedCycleName}
        onClose={() => setSelectedTask(null)}
        onSubmitted={handleSubmitted}
      />
    </div>
  )
}
