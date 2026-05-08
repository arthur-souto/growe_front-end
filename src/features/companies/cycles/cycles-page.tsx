import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarRange, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompanyService } from "@/api/services/company-service"
import { CycleService } from "@/api/services/cycle-service"
import { getApiErrorMessage } from "@/api/api-error"
import { useUser } from "@/hooks/useUser"
import type { CycleResumeResponse, ResumeMemberResponse } from "@/api/model"
import { PAGE_SIZE } from "../members/members.config"
import { buildRefreshMessage } from "./cycles.config"
import { CyclesGrid } from "./cycles-grid"
import { CreateCycleDialog } from "./create-cycle-dialog"

const companyService = new CompanyService()
const cycleService = new CycleService()

function useCompanyRole(members: ResumeMemberResponse[], userEmail?: string) {
  return useMemo(
    () => members.find((m) => m.email === userEmail)?.role ?? null,
    [members, userEmail]
  )
}

export default function CyclesPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useUser()

  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(0)

  const { data: cycles = [], isLoading: loading } = useQuery({
    queryKey: ["cycles", slug],
    queryFn: () => cycleService.getCycles(slug!).then((r) => r.data.content),
    enabled: !!slug,
  })
  const { data: members = [] } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 500).then((r) => r.data.content),
    enabled: !!slug,
  })

  const myRole = useCompanyRole(members, user?.email)
  const canManage = myRole === "OWNER" || myRole === "RH"

  const sorted = useMemo(
    () => [...cycles].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [cycles]
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paginated = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  async function handleRefresh() {
    if (!slug) return
    setRefreshing(true)
    try {
      const res = await cycleService.refreshCycles(slug)
      toast.success(buildRefreshMessage(res.data.activated, res.data.closed))
      queryClient.invalidateQueries({ queryKey: ["cycles", slug] })
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao atualizar status dos ciclos."))
    } finally {
      setRefreshing(false)
    }
  }

  function handleCycleCreated(cycle: CycleResumeResponse) {
    queryClient.setQueryData<CycleResumeResponse[]>(["cycles", slug], (prev = []) => [cycle, ...prev])
    setPage(0)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <CalendarRange className="size-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-none">Ciclos de Avaliação</h1>
            <p className="mt-1 text-xs text-muted-foreground hidden sm:block">
              {canManage
                ? "Crie e gerencie os períodos de avaliação. Clique em um ciclo para ver e atribuir tarefas."
                : "Acompanhe os períodos de avaliação. Clique em um ciclo para enviar suas avaliações."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar Status</span>
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Novo Ciclo</span>
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <CyclesGrid
          cycles={paginated}
          loading={loading}
          page={currentPage}
          totalPages={totalPages}
          totalItems={sorted.length}
          onPageChange={setPage}
          onCycleClick={(cycle) =>
            navigate(`/my-company/${slug}/ciclos/${cycle.id}/tarefas`, { state: cycle })
          }
        />
      </div>

      {slug && (
        <CreateCycleDialog
          open={createOpen}
          slug={slug}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCycleCreated}
        />
      )}
    </div>
  )
}
