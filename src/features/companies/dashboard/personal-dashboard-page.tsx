import { Navigate, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Activity, ArrowLeft, TrendingUp, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyService } from "@/api/services/company-service"
import { dashboardService } from "@/api/services/dashboard-service"
import { useUser } from "@/hooks/useUser"
import { cn } from "@/lib/utils"
import { ADMIN_ROLES, scoreColor } from "./dashboard.config"
import { CycleChart } from "./cycle-chart"
import { CommentCard } from "./comment-card"
import type { CompanyMemberRole } from "@/api/model"

const companyService = new CompanyService()

export default function PersonalDashboardPage() {
  const { slug, memberId } = useParams<{ slug: string; memberId?: string }>()
  const navigate = useNavigate()
  const { user } = useUser()

  const isOwnDashboard = !memberId

  const { data: members } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 500).then((r) => r.data.content),
    enabled: !!slug && !isOwnDashboard,
  })

  const myRole: CompanyMemberRole | null = members?.find((m) => m.email === user?.email)?.role ?? null

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", slug, memberId ?? "me"],
    queryFn: () =>
      memberId
        ? dashboardService.getMemberDashboard(slug!, memberId).then((r) => r.data)
        : dashboardService.getPersonalDashboard(slug!).then((r) => r.data),
    enabled: !!slug && (isOwnDashboard || myRole != null),
  })

  if (!isOwnDashboard && myRole != null && !ADMIN_ROLES.includes(myRole as (typeof ADMIN_ROLES)[number])) {
    return <Navigate to="/unauthorized" replace />
  }

  const score = data?.overallAvgScore ?? null
  const hasScore = score != null

  const scoreBorderClass = !isLoading && hasScore
    ? score! >= 4
      ? "bg-green-500/10 border-green-500/30"
      : score! >= 2.5
        ? "bg-amber-500/10 border-amber-500/30"
        : "bg-red-500/10 border-red-500/30"
    : "bg-white/[0.03]"

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 border-b px-4 sm:px-6 py-4 sm:py-5 flex-wrap">
        {!isOwnDashboard && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => navigate(`/my-company/${slug}/dashboard-equipe`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <Activity className="size-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none">
            {isOwnDashboard ? "Meu Desempenho" : "Desempenho do Colaborador"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground hidden sm:block">
            {isOwnDashboard
              ? "Suas avaliações, evolução por ciclo e comentários recebidos"
              : "Histórico de avaliações e evolução do colaborador"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Hero: name + score */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border bg-white/[0.03] px-5 py-5 flex flex-col gap-4 sm:col-span-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="size-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                Colaborador
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <p className="text-2xl font-bold leading-none">{data?.memberName ?? "—"}</p>
            )}
          </div>

          <div className={cn("border px-5 py-5 flex flex-col gap-4", scoreBorderClass)}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                Média Geral
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-12 w-20" />
            ) : hasScore ? (
              <p className={cn("text-4xl font-bold tabular-nums leading-none", scoreColor(score))}>
                {score!.toFixed(2)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Sem avaliações ainda</p>
            )}
          </div>
        </div>

        {/* Cycle chart */}
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Evolução por Ciclo
          </h2>
          <div className="border bg-white/[0.03] p-4">
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <CycleChart data={data?.cycleAverages ?? []} />
            )}
          </div>
        </div>

        {/* Recent comments */}
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Comentários Recentes
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !data?.recentComments?.length ? (
            <div className="border bg-white/[0.03] px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhum comentário recebido ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentComments.map((c, i) => (
                <CommentCard key={i} comment={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
