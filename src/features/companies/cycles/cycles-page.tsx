import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router"
import { toast } from "sonner"
import { Plus, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CompanyService } from "@/api/services/company-service"
import { CycleService } from "@/api/services/cycle-service"
import { getApiErrorMessage } from "@/api/api-error"
import { useUser } from "@/hooks/useUser"
import type { CycleResumeResponse, ResumeMemberResponse } from "@/api/model"
import { PAGE_SIZE, getCurrentDate, getInitials } from "../members/members.config"
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
  const { user } = useUser()

  const [cycles, setCycles] = useState<CycleResumeResponse[]>([])
  const [members, setMembers] = useState<ResumeMemberResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(0)

  const myRole = useCompanyRole(members, user?.email)
  const canManage = myRole === "OWNER" || myRole === "RH"

  const sorted = useMemo(
    () => [...cycles].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [cycles]
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paginated = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  function loadData() {
    if (!slug) return
    setLoading(true)
    Promise.all([cycleService.getCycles(slug), companyService.getMembers(slug)])
      .then(([cyclesRes, membersRes]) => {
        setCycles(cyclesRes.data.content)
        setMembers(membersRes.data.content)
      })
      .catch((err) => toast.error(getApiErrorMessage(err, "Erro ao carregar ciclos.")))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [slug])

  async function handleRefresh() {
    if (!slug) return
    setRefreshing(true)
    try {
      const res = await cycleService.refreshCycles(slug)
      toast.success(buildRefreshMessage(res.data.activated, res.data.closed))
      loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao atualizar status dos ciclos."))
    } finally {
      setRefreshing(false)
    }
  }

  function handleCycleCreated(cycle: CycleResumeResponse) {
    setCycles((prev) => [cycle, ...prev])
    setPage(0)
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "Usuário"

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={user?.profileImage ?? undefined} alt={user?.fullName} />
            <AvatarFallback className="bg-transparent text-xs font-semibold">
              {user?.fullName ? getInitials(user.fullName) : "—"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-sm font-semibold">Bem-vindo, {firstName}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{getCurrentDate()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Status
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Novo Ciclo
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        <CyclesGrid
          cycles={paginated}
          loading={loading}
          page={currentPage}
          totalPages={totalPages}
          totalItems={sorted.length}
          onPageChange={setPage}
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
