import { useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Users, CalendarRange, Building2, ArrowRight, Layers, Clock, ListTodo } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyService } from "@/api/services/company-service"
import { CycleService } from "@/api/services/cycle-service"
import { useUser } from "@/hooks/useUser"
import type {
  CompanyDetailsResponse,
  CompanyMemberRole,
  CycleResumeResponse,
  Plan,
  SizeRange,
} from "@/api/model"
import {
  ALL_ROLES,
  ROLE_CONFIG,
  fmtDate,
  getCurrentDate,
  getInitials,
} from "./members/members.config"

const companyService = new CompanyService()
const cycleService = new CycleService()

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Grátis",
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
}

const ROLE_DESCRIPTIONS: Record<CompanyMemberRole, string> = {
  EMPLOYEE: "Acompanhe seus ciclos de avaliação, envie suas respostas e veja o feedback que você recebeu.",
  MANAGER: "Gerencie ciclos, atribua tarefas de avaliação e acompanhe o desempenho da equipe.",
  ADMIN: "Administre membros, ciclos e tenha visibilidade completa das avaliações da empresa.",
  OWNER: "Você tem controle total da empresa na plataforma — membros, ciclos e avaliações.",
  RH: "Gerencie pessoas, coordene os ciclos de avaliação e analise os resultados da equipe.",
}

const SIZE_LABELS: Record<SizeRange, string> = {
  ONE_TO_10: "1–10 pessoas",
  ELEVEN_TO_50: "11–50 pessoas",
  FIFTY_ONE_TO_200: "51–200 pessoas",
  TWO_HUNDRED_PLUS: "200+ pessoas",
}

function fmtCnpj(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

function fmtDateRange(start: string, end: string) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  return `${fmt(start)} – ${fmt(end)}`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  loading: boolean
  numeric?: boolean
  accent?: string
}

function StatCard({ icon, label, value, loading, numeric, accent = "" }: StatCardProps) {
  return (
    <Card className={`rounded-none shadow-none gap-0 py-0 ${accent}`}>
      <CardContent className="px-5 pt-5 pb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <span className="text-muted-foreground/50">{icon}</span>
        </div>
        {loading ? (
          <Skeleton className={numeric ? "h-9 w-14" : "h-7 w-20"} />
        ) : (
          <span
            className={
              numeric
                ? "text-4xl font-bold tabular-nums leading-none"
                : "text-2xl font-bold leading-none"
            }
          >
            {value}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={onAction}
      >
        {action}
        <ArrowRight className="size-3 ml-1" />
      </Button>
    </div>
  )
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
      {message}
    </div>
  )
}

function CycleSkeletons() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="size-2.5 rounded-full shrink-0" />
          <Skeleton className="h-3.5 w-36 flex-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

function MemberSkeletons() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <Skeleton className="size-7 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared: welcome header + company info band
// ---------------------------------------------------------------------------

function WelcomeHeader({
  user,
  myRole,
}: {
  user: ReturnType<typeof useUser>["user"]
  myRole: CompanyMemberRole | null
}) {
  const firstName = user?.fullName?.split(" ")[0] ?? "Usuário"
  const roleCfg = myRole ? ROLE_CONFIG[myRole] : null
  return (
    <div className="border-b px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
        <Avatar className="size-12 sm:size-16 shrink-0 ring-2 ring-primary/20">
          <AvatarImage src={user?.profileImage ?? undefined} alt={user?.fullName} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {user?.fullName ? getInitials(user.fullName) : "—"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              Olá, <span className="text-primary">{firstName}</span>
            </h1>
            {roleCfg && (
              <span className={`text-[10px] font-semibold uppercase tracking-widest border px-2 py-0.5 shrink-0 ${roleCfg.pill}`}>
                {roleCfg.label}
              </span>
            )}
          </div>
          {myRole && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-snug max-w-lg">
              {ROLE_DESCRIPTIONS[myRole]}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground/50">{getCurrentDate()}</p>
        </div>
      </div>
    </div>
  )
}

function CompanyInfoBand({
  company,
  loading,
}: {
  company: CompanyDetailsResponse | null
  loading: boolean
}) {
  return (
    <Card className="rounded-none shadow-none gap-0 py-0">
      <CardContent className="px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="size-12 shrink-0 border flex items-center justify-center bg-muted/30 overflow-hidden">
            {loading ? (
              <Skeleton className="size-full" />
            ) : company?.companyImage ? (
              <img src={company.companyImage} alt={company.name} className="size-full object-cover" />
            ) : (
              <Building2 className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-64" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold truncate">{company?.name}</h2>
                  {company?.isActive ? (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 shrink-0">
                      Ativa
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border px-1.5 py-0.5 shrink-0">
                      Inativa
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {company ? SIZE_LABELS[company.sizeRange] : "—"}
                  {" · "}
                  CNPJ {company ? fmtCnpj(company.cnpj) : "—"}
                </p>
              </>
            )}
          </div>
          <div className="hidden sm:block shrink-0 text-right">
            {loading ? (
              <Skeleton className="h-4 w-16 ml-auto" />
            ) : (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {company ? PLAN_LABELS[company.plan] : "—"}
                </span>
                {company?.trialEndsAt && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Trial até {fmtDate(company.trialEndsAt)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Employee dashboard
// ---------------------------------------------------------------------------

function EmployeeDashboard({
  slug,
  user,
  myRole,
  company,
  cycles,
  loading,
}: {
  slug: string
  user: ReturnType<typeof useUser>["user"]
  myRole: CompanyMemberRole | null
  company: CompanyDetailsResponse | null
  cycles: CycleResumeResponse[]
  loading: boolean
}) {
  const navigate = useNavigate()

  const activeCycles = useMemo(() => cycles.filter((c) => c.isActive), [cycles])
  const sortedCycles = useMemo(
    () => [...cycles].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [cycles]
  )

  return (
    <div className="flex-1 overflow-auto">
      <WelcomeHeader user={user} myRole={myRole} />

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <CompanyInfoBand company={company} loading={loading} />

        {/* Quick action */}
        <button
          type="button"
          onClick={() => navigate(`/my-company/${slug}/minhas-tarefas`)}
          className="w-full flex items-center gap-4 border px-5 py-4 text-left transition-colors hover:bg-accent"
        >
          <div className="flex size-9 shrink-0 items-center justify-center border bg-muted/50">
            <ListTodo className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none">Minhas Tarefas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Veja avaliações pendentes, concluídas e todo o feedback que você recebeu
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<CalendarRange className="size-3.5" />}
            label="Ciclos ativos"
            loading={loading}
            value={activeCycles.length}
            numeric
            accent="border-l-4 border-l-emerald-500"
          />
          <StatCard
            icon={<Clock className="size-3.5" />}
            label="Total de ciclos"
            loading={loading}
            value={cycles.length}
            numeric
            accent="border-l-4 border-l-violet-500"
          />
        </div>

        {/* Cycles list */}
        <div>
          <SectionHeader
            title="Ciclos de avaliação"
            action="Ver todos"
            onAction={() => navigate(`/my-company/${slug}/ciclos`)}
          />
          <Card className="rounded-none shadow-none gap-0 py-0">
            <CardContent className="p-0">
              {loading ? (
                <CycleSkeletons />
              ) : sortedCycles.length === 0 ? (
                <EmptyRow message="Nenhum ciclo encontrado" />
              ) : (
                <div className="divide-y">
                  {sortedCycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/my-company/${slug}/ciclos/${cycle.id}/tarefas`, {
                          state: cycle,
                        })
                      }
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cycle.color }}
                      />
                      <span className="text-sm font-medium truncate flex-1">{cycle.name}</span>
                      {cycle.isActive ? (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 shrink-0">
                          Ativo
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border px-1.5 py-0.5 shrink-0">
                          Encerrado
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground shrink-0">
                        {fmtDateRange(cycle.startDate, cycle.endDate)}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Manager / Admin dashboard
// ---------------------------------------------------------------------------

function ManagerDashboard({
  slug,
  user,
  myRole,
  company,
  cycles,
  loading,
}: {
  slug: string
  user: ReturnType<typeof useUser>["user"]
  myRole: CompanyMemberRole | null
  company: CompanyDetailsResponse | null
  cycles: CycleResumeResponse[]
  loading: boolean
}) {
  const navigate = useNavigate()

  const roleStats = useMemo(() => {
    const c: Record<CompanyMemberRole, number> = {
      ADMIN: 0, OWNER: 0, RH: 0, MANAGER: 0, EMPLOYEE: 0,
    }
    company?.members.forEach((m) => { if (m.role in c) c[m.role]++ })
    return c
  }, [company])

  const activeCycles = useMemo(() => cycles.filter((c) => c.isActive), [cycles])
  const recentCycles = useMemo(
    () => [...cycles].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [cycles]
  )
  const recentMembers = useMemo(
    () =>
      [...(company?.members ?? [])]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 5),
    [company]
  )

  return (
    <div className="flex-1 overflow-auto">
      <WelcomeHeader user={user} myRole={myRole} />

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <CompanyInfoBand company={company} loading={loading} />

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Users className="size-3.5" />}
            label="Total de membros"
            loading={loading}
            value={company?.members.length ?? 0}
            numeric
            accent="border-l-4 border-l-blue-500"
          />
          <StatCard
            icon={<CalendarRange className="size-3.5" />}
            label="Ciclos ativos"
            loading={loading}
            value={activeCycles.length}
            numeric
            accent="border-l-4 border-l-emerald-500"
          />
          <StatCard
            icon={<Clock className="size-3.5" />}
            label="Total de ciclos"
            loading={loading}
            value={cycles.length}
            numeric
            accent="border-l-4 border-l-violet-500"
          />
          <StatCard
            icon={<Layers className="size-3.5" />}
            label="Plano atual"
            loading={loading}
            value={company ? PLAN_LABELS[company.plan] : "—"}
            accent="border-l-4 border-l-amber-500"
          />
        </div>

        {/* Members by role */}
        <div>
          <SectionHeader
            title="Membros por papel"
            action="Ver membros"
            onAction={() => navigate(`/my-company/${slug}/membros`)}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ALL_ROLES.map((role) => {
              const cfg = ROLE_CONFIG[role]
              return (
                <div key={role} className="flex flex-col gap-3 px-5 py-4 bg-card border">
                  <div className="flex items-center gap-2">
                    <span className={`size-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {cfg.label}
                    </span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-9 w-12 rounded-none" />
                  ) : (
                    <span className="text-4xl font-bold tabular-nums leading-none">
                      {roleStats[role]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom grid: recent cycles + recent members */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SectionHeader
              title="Ciclos recentes"
              action="Ver ciclos"
              onAction={() => navigate(`/my-company/${slug}/ciclos`)}
            />
            <Card className="rounded-none shadow-none gap-0 py-0">
              <CardContent className="p-0">
                {loading ? (
                  <CycleSkeletons />
                ) : recentCycles.length === 0 ? (
                  <EmptyRow message="Nenhum ciclo encontrado" />
                ) : (
                  <div className="divide-y">
                    {recentCycles.map((cycle) => (
                      <div key={cycle.id} className="flex items-center gap-3 px-5 py-3.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cycle.color }}
                        />
                        <span className="text-sm font-medium truncate flex-1">{cycle.name}</span>
                        {cycle.isActive && (
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 shrink-0">
                            Ativo
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {fmtDateRange(cycle.startDate, cycle.endDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionHeader
              title="Membros recentes"
              action="Ver membros"
              onAction={() => navigate(`/my-company/${slug}/membros`)}
            />
            <Card className="rounded-none shadow-none gap-0 py-0">
              <CardContent className="p-0">
                {loading ? (
                  <MemberSkeletons />
                ) : recentMembers.length === 0 ? (
                  <EmptyRow message="Nenhum membro encontrado" />
                ) : (
                  <div className="divide-y">
                    {recentMembers.map((member) => {
                      const cfg = ROLE_CONFIG[member.role]
                      return (
                        <div key={member.id} className="flex items-center gap-3 px-5 py-3">
                          <Avatar className="size-7 shrink-0">
                            <AvatarImage
                              src={member.profileImage || undefined}
                              alt={member.fullName}
                            />
                            <AvatarFallback className="text-[10px] font-semibold">
                              {getInitials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-widest border px-1.5 py-0.5 shrink-0 ${cfg.pill}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CompanySpace() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useUser()

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company", slug],
    queryFn: () => companyService.getCompany(slug!).then((r) => r.data),
    enabled: !!slug,
  })
  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ["cycles", slug],
    queryFn: () => cycleService.getCycles(slug!).then((r) => r.data.content),
    enabled: !!slug,
  })
  const loading = companyLoading || cyclesLoading

  const myRole = company?.members.find((m) => m.email === user?.email)?.role ?? null
  const isEmployee = myRole === "EMPLOYEE"

  const props = { slug: slug!, user, myRole, company: company ?? null, cycles, loading }

  return isEmployee ? <EmployeeDashboard {...props} /> : <ManagerDashboard {...props} />
}
