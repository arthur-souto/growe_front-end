import { useState, useEffect } from "react"
import { useQuery, useQueries } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, ClipboardList, Clock, Loader2, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AssessmentService } from "@/api/services/assessment-service"
import { CompetencyService } from "@/api/services/competency-service"
import { CycleService } from "@/api/services/cycle-service"
import { TaskService } from "@/api/services/task-service"
import { getApiErrorMessage } from "@/api/api-error"
import { useUser } from "@/hooks/useUser"
import { cn } from "@/lib/utils"
import type {
  AssessmentType,
  CompanyMemberRole,
  CycleResumeResponse,
  EvaluationTaskResponse,
  ResumeMemberResponse,
} from "@/api/model"

const assessmentService = new AssessmentService()
const competencyService = new CompetencyService()
const cycleService = new CycleService()
const taskService = new TaskService()

const SCORE_LABELS: Record<number, string> = {
  1: "Ruim",
  2: "Fraco",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
}

const SCORE_COLORS: Record<number, { selected: string; label: string }> = {
  1: { selected: "border-red-500 bg-red-500/10 text-red-400", label: "text-red-400" },
  2: { selected: "border-orange-500 bg-orange-500/10 text-orange-400", label: "text-orange-400" },
  3: { selected: "border-amber-500 bg-amber-500/10 text-amber-400", label: "text-amber-400" },
  4: { selected: "border-emerald-500 bg-emerald-500/10 text-emerald-400", label: "text-emerald-400" },
  5: { selected: "border-green-500 bg-green-500/10 text-green-400", label: "text-green-400" },
}

export function ScoreRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const isSelected = value === n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex flex-col items-center gap-1.5 flex-1 border py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isSelected
                ? SCORE_COLORS[n].selected
                : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className="text-sm font-semibold tabular-nums leading-none">{n}</span>
            <span className={cn("text-[10px] leading-none", isSelected ? SCORE_COLORS[n].label : "text-muted-foreground/60")}>
              {SCORE_LABELS[n]}
            </span>
          </button>
        )
      })}
    </div>
  )
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

const ADMIN_ROLES: CompanyMemberRole[] = ["OWNER", "ADMIN", "RH", "MANAGER"]

function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// Star rating (kept for backwards-compat imports)
// ---------------------------------------------------------------------------

export function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  const fill = hover || value
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 outline-none transition-transform focus-visible:ring-1 focus-visible:ring-ring hover:scale-110 active:scale-95 cursor-pointer"
          >
            <Star
              className={cn(
                "size-7 transition-colors duration-100",
                n <= fill
                  ? "fill-amber-400 stroke-amber-400"
                  : "fill-transparent stroke-border",
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {value}<span className="text-xs"> / 5</span>
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Task row (step 1 list)
// ---------------------------------------------------------------------------

function TaskRow({
  task,
  cycleName,
  onClick,
}: {
  task: EvaluationTaskResponse
  cycleName: string
  onClick: () => void
}) {
  const now = new Date()
  const overdue = new Date(task.deadline) < now
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-none border px-3.5 py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        overdue && "border-l-2 border-l-red-500/50 bg-red-500/5 hover:bg-red-500/10",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{cycleName}</span>
        <span className="text-border">·</span>
        <span className={cn("flex items-center gap-1", overdue && "text-red-400 font-medium")}>
          <Clock className="size-3 shrink-0" />
          {overdue ? "Atrasado — " : ""}{fmtDeadline(task.deadline)}
        </span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Props / component
// ---------------------------------------------------------------------------

interface Props {
  open: boolean
  slug: string
  cycles: CycleResumeResponse[]
  members: ResumeMemberResponse[]
  myRole: CompanyMemberRole | null
  onClose: () => void
  onCreated: () => void
}

type Step = "pick" | "score"

export function CreateAssessmentDialog({
  open,
  slug,
  myRole,
  onClose,
  onCreated,
}: Props) {
  const { user } = useUser()
  const isAdmin = myRole != null && ADMIN_ROLES.includes(myRole)

  const [step, setStep] = useState<Step>("pick")
  const [selectedTask, setSelectedTask] = useState<EvaluationTaskResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, { score: number; comment: string }>>({})
  const [overallComment, setOverallComment] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)

  const { data: cycles = [], isLoading: loadingCycles } = useQuery({
    queryKey: ["cycles", slug],
    queryFn: () => cycleService.getCycles(slug!, 0, 500).then((r) => r.data.content),
    enabled: open && !!slug,
  })

  const taskQueries = useQueries({
    queries: cycles.map((c) => ({
      queryKey: ["tasks", c.id],
      queryFn: () => taskService.getTasks(c.id).then((r) => r.data),
      enabled: open,
    })),
  })

  const { data: competencies = [], isLoading: loadingCompetencies } = useQuery({
    queryKey: ["competencies", "cycle", selectedTask?.cycleId],
    queryFn: () => competencyService.listByCycle(selectedTask!.cycleId).then((r) => r.data.content),
    enabled: !!selectedTask?.cycleId && step === "score",
  })

  useEffect(() => {
    if (competencies.length > 0) {
      setAnswers(
        Object.fromEntries(competencies.map((c) => [c.id, { score: 0, comment: "" }]))
      )
    }
  }, [competencies])

  const isLoadingTasks = loadingCycles || taskQueries.some((q) => q.isLoading)
  const cycleMap = new Map(cycles.map((c) => [c.id, c]))

  const allPending = taskQueries
    .flatMap((q) => q.data?.content ?? [])
    .filter((t) => t.status === "PENDING")

  const pendingTasks = isAdmin
    ? allPending
    : allPending.filter((t) => t.evaluatorName.email === user?.email)

  const sortedTasks = [...pendingTasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  )

  const allScored = competencies.length > 0 && competencies.every((c) => (answers[c.id]?.score ?? 0) > 0)
  const avgScore = allScored
    ? competencies.reduce((sum, c) => sum + (answers[c.id]?.score ?? 0), 0) / competencies.length
    : 0

  function reset() {
    setStep("pick")
    setSelectedTask(null)
    setAnswers({})
    setOverallComment("")
    setSubmitError("")
    setImproving(false)
  }

  async function handleImproveComment() {
    if (!selectedTask || !overallComment.trim() || !allScored) return
    setImproving(true)
    try {
      const res = await assessmentService.improveComment({
        comment: overallComment,
        score: Math.round(avgScore),
        assessmentType: selectedTask.assessmentType,
      })
      setOverallComment(res.data.response)
      toast.success("Comentário melhorado com IA.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao melhorar comentário."))
    } finally {
      setImproving(false)
    }
  }

  function handleSelectTask(task: EvaluationTaskResponse) {
    setSelectedTask(task)
    setStep("score")
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allScored) { setSubmitError("Atribua uma nota para cada competência"); return }
    if (!selectedTask) return

    setSaving(true)
    try {
      await assessmentService.submitAssessment(selectedTask.id, {
        comment: overallComment.trim() || undefined,
        answers: competencies.map((c) => ({
          competencyId: c.id,
          score: answers[c.id].score,
          comment: answers[c.id].comment.trim() || undefined,
        })),
      })
      toast.success("Avaliação submetida com sucesso.")
      onCreated()
      reset()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao submeter avaliação."))
    } finally {
      setSaving(false)
    }
  }

  const selectedCycleName = selectedTask
    ? (cycleMap.get(selectedTask.cycleId)?.name ?? "—")
    : ""

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { reset(); onClose() }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {step === "score" && (
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="mr-0.5 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <ClipboardList className="size-4 shrink-0" />
            {step === "pick" ? "Selecionar tarefa" : "Submeter avaliação"}
          </DialogTitle>
        </DialogHeader>

        {/* ---- Step 1: pick a task ---- */}
        {step === "pick" && (
          <div className="flex flex-col gap-2 min-h-[200px]">
            {isLoadingTasks ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border px-3.5 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
              ))
            ) : sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex size-10 items-center justify-center border bg-muted">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nenhuma tarefa pendente</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Você não tem avaliações a submeter no momento.
                  </p>
                </div>
              </div>
            ) : (
              sortedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  cycleName={cycleMap.get(task.cycleId)?.name ?? "—"}
                  onClick={() => handleSelectTask(task)}
                />
              ))
            )}
          </div>
        )}

        {/* ---- Step 2: per-competency scoring + overall comment ---- */}
        {step === "score" && selectedTask && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-none border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider",
                    TYPE_STYLE[selectedTask.assessmentType],
                  )}
                >
                  {TYPE_LABEL[selectedTask.assessmentType]}
                </Badge>
                <span className="font-medium text-foreground text-sm">
                  {selectedTask.evaluatedName.fullName}
                </span>
              </div>
              <p>
                <span className="text-foreground font-medium">Ciclo: </span>
                {selectedCycleName}
              </p>
              {isAdmin && (
                <p>
                  <span className="text-foreground font-medium">Avaliador: </span>
                  {selectedTask.evaluatorName.fullName}
                </p>
              )}
            </div>

            {/* Competency rows */}
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
                        onChange={(v) => {
                          setAnswers((prev) => ({ ...prev, [c.id]: { ...prev[c.id], score: v } }))
                          setSubmitError("")
                        }}
                      />
                      <Textarea
                        value={answers[c.id]?.comment ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [c.id]: { ...prev[c.id], comment: e.target.value } }))
                        }
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
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => { reset(); onClose() }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-none"
                disabled={saving || improving || !allScored || competencies.length === 0}
              >
                {saving ? "Submetendo…" : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
