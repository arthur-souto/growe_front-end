import { Navigate, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { BarChart2, ChevronRight, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyService } from "@/api/services/company-service"
import { dashboardService } from "@/api/services/dashboard-service"
import { useUser } from "@/hooks/useUser"
import { cn } from "@/lib/utils"
import { RoleBadge } from "@/features/companies/members/role-badge"
import { ADMIN_ROLES, scoreColor } from "./dashboard.config"
import { ScoreDistributionChart, TopBottomChart, RoleScoreChart } from "./team-charts"
import type { CompanyMemberRole } from "@/api/model"

const companyService = new CompanyService()

export default function TeamDashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useUser()

  const { data: members } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 500).then((r) => r.data.content),
    enabled: !!slug,
  })

  const myRole: CompanyMemberRole | null =
    members?.find((m) => m.email === user?.email)?.role ?? null

  const isAdmin = myRole != null && ADMIN_ROLES.includes(myRole as (typeof ADMIN_ROLES)[number])

  const { data: team, isLoading } = useQuery({
    queryKey: ["dashboard-team", slug],
    queryFn: () => dashboardService.getTeamDashboard(slug!).then((r) => r.data),
    enabled: !!slug && isAdmin,
  })

  if (myRole != null && !isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 sm:px-6 py-4 sm:py-5">
        <BarChart2 className="size-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none">Dashboard da Equipe</h1>
          <p className="mt-1 text-xs text-muted-foreground hidden sm:block">
            Visão geral do desempenho de todos os colaboradores
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Charts section */}
        <div className="border-b px-4 sm:px-6 py-4 sm:py-6 space-y-6">
          {isLoading || !team ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              <div className="border bg-white/3 p-5 flex flex-col gap-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Distribuição de Notas
                </h2>
                <div className="flex-1 flex items-center">
                  <ScoreDistributionChart members={team} />
                </div>
              </div>

              <div className="border bg-white/3 p-5 flex flex-col gap-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Top / Bottom
                </h2>
                <TopBottomChart members={team} />
              </div>

              <div className="border bg-white/3 p-5 flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Média por Papel
                </h2>
                <RoleScoreChart members={team} />
              </div>
            </div>
          )}
        </div>

        {/* Member list */}
        <div>
          <div className="hidden sm:flex items-center gap-4 border-b px-4 sm:px-6 py-2">
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Colaborador
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-32.5 text-center">
              Papel
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-20 text-right">
              Média
            </span>
            <span className="w-4" />
          </div>

          {isLoading || (!team && myRole == null) ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                  <Skeleton className="h-4 flex-1 max-w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-14 ml-auto" />
                  <Skeleton className="size-4" />
                </div>
              ))}
            </div>
          ) : !team?.length ? (
            <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
              Nenhum colaborador encontrado.
            </div>
          ) : (
            <div className="divide-y">
              {team.map((member) => (
                <button
                  key={member.memberId}
                  type="button"
                  onClick={() =>
                    navigate(`/my-company/${slug}/dashboard-equipe/${member.memberId}`)
                  }
                  className="w-full flex items-center gap-4 px-4 sm:px-6 py-4 text-left hover:bg-white/[0.03] transition-colors group"
                >
                  <p className="flex-1 text-sm font-medium truncate min-w-0">
                    {member.memberName}
                  </p>
                  <RoleBadge role={member.role} />
                  <div className="flex items-center gap-1.5 w-20 justify-end shrink-0">
                    {member.overallAvgScore != null ? (
                      <>
                        <TrendingUp
                          className={cn("size-3.5 shrink-0", scoreColor(member.overallAvgScore))}
                        />
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            scoreColor(member.overallAvgScore),
                          )}
                        >
                          {member.overallAvgScore.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
