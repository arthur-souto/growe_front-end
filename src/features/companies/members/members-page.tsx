import { useState, useMemo, useEffect } from "react"
import { useParams, Navigate } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BarChart3, Briefcase, Crown, Plus, ShieldCheck, Upload, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyService } from "@/api/services/company-service"
import { useUser } from "@/hooks/useUser"
import type { LucideIcon } from "lucide-react"
import type { CompanyMemberRole, ResumeMemberResponse } from "@/api/model"
import {
  ALL_ROLES,
  PAGE_SIZE,
  ROLE_CONFIG,
  type SortDir,
  type SortKey,
} from "./members.config"

const ROLE_ICONS: Record<CompanyMemberRole, LucideIcon> = {
  ADMIN: ShieldCheck,
  OWNER: Crown,
  RH: Briefcase,
  MANAGER: BarChart3,
  EMPLOYEE: User,
}
import { AddMemberDialog } from "./add-member-dialog"
import { EditRoleDialog } from "./edit-role-dialog"
import { ImportMembersDialog } from "./import-members-dialog"
import { MemberSheet } from "./member-sheet"
import { MembersTable } from "./members-table"
import { RemoveMemberDialog } from "./remove-member-dialog"

const companyService = new CompanyService()

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useUser()

  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selected, setSelected] = useState<ResumeMemberResponse | null>(null)
  const [editTarget, setEditTarget] = useState<ResumeMemberResponse | null>(null)
  const [removeTarget, setRemoveTarget] = useState<ResumeMemberResponse | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<CompanyMemberRole | "ALL">("ALL")
  const [sortKey, setSortKey] = useState<SortKey>("fullName")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(0)

  const { data: members = [], isLoading: loading } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 500).then((r) => r.data.content),
    enabled: !!slug,
  })

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const hasFilters = searchInput !== "" || roleFilter !== "ALL"

  function reloadMembers() {
    queryClient.invalidateQueries({ queryKey: ["members", slug] })
  }

  const myRole = useMemo(
    () => members.find((m) => m.email === user?.email)?.role ?? null,
    [members, user]
  )
  const canManage = myRole === "OWNER" || myRole === "ADMIN" || myRole === "MANAGER" || myRole === "RH"
  const canAssignOwner = myRole === "OWNER"

  const filtered = useMemo(() => {
    let list = members
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== "ALL") list = list.filter((m) => m.role === roleFilter)
    return [...list].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase()
      const bv = (b[sortKey] ?? "").toString().toLowerCase()
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [members, search, roleFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const p = Math.min(page, totalPages - 1)
  const paginated = filtered.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE)

  useEffect(() => setPage(0), [search, roleFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  function clearFilters() {
    setSearchInput("")
    setSearch("")
    setRoleFilter("ALL")
  }

  function handleRoleUpdated(email: string, role: CompanyMemberRole) {
    queryClient.setQueryData<ResumeMemberResponse[]>(["members", slug], (prev = []) =>
      prev.map((m) => (m.email === email ? { ...m, role } : m))
    )
    setSelected((prev) => (prev?.email === email ? { ...prev, role } : prev))
  }

  function handleRemoved(email: string) {
    queryClient.setQueryData<ResumeMemberResponse[]>(["members", slug], (prev = []) =>
      prev.filter((m) => m.email !== email)
    )
    if (selected?.email === email) setSelected(null)
  }

  const stats = useMemo(() => {
    const c: Record<CompanyMemberRole, number> = { ADMIN: 0, OWNER: 0, RH: 0, MANAGER: 0, EMPLOYEE: 0 }
    members.forEach((m) => { if (m.role in c) c[m.role]++ })
    return c
  }, [members])

  if (!loading && myRole === "EMPLOYEE") return <Navigate to="/unauthorized" replace />

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Users className="size-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-none">Membros</h1>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {loading
                ? "Carregando…"
                : `${members.length} ${members.length === 1 ? "pessoa" : "pessoas"} na empresa · Gerencie funções e acessos`}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Adicionar membro</span>
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ALL_ROLES.map((role) => {
            const active = roleFilter === role
            const cfg = ROLE_CONFIG[role]
            const RoleIcon = ROLE_ICONS[role]
            return (
              <button
                key={role}
                onClick={() => setRoleFilter((prev) => (prev === role ? "ALL" : role))}
                className={`flex flex-col gap-2 px-4 py-3 text-left transition-colors bg-card ${
                  active ? cfg.activeBorder : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RoleIcon className={`size-3.5 shrink-0 ${cfg.iconColor}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {cfg.label}
                  </span>
                  {active && (
                    <span className="ml-auto text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      Filtrado
                    </span>
                  )}
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-10 rounded-none" />
                ) : (
                  <span className="text-2xl font-bold tabular-nums leading-none">
                    {stats[role]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <Card size="sm" className="rounded-none gap-0 py-0 shadow-none">
          <CardContent className="p-0">
            <MembersTable
              members={paginated}
              loading={loading}
              hasFilters={hasFilters}
              searchInput={searchInput}
              roleFilter={roleFilter}
              sortKey={sortKey}
              sortDir={sortDir}
              page={p}
              totalPages={totalPages}
              totalFiltered={filtered.length}
              currentUserEmail={user?.email}
              canManage={canManage}
              onSearchChange={setSearchInput}
              onRoleFilterChange={setRoleFilter}
              onSort={toggleSort}
              onClearFilters={clearFilters}
              onPageChange={setPage}
              onRowClick={setSelected}
              onEditClick={setEditTarget}
              onRemoveClick={setRemoveTarget}
            />
          </CardContent>
        </Card>
      </div>

      {slug && (
        <ImportMembersDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          slug={slug}
          onImported={reloadMembers}
        />
      )}

      {slug && (
        <AddMemberDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          slug={slug}
          canAssignOwner={canAssignOwner}
          onCreated={(m) =>
            queryClient.setQueryData<ResumeMemberResponse[]>(["members", slug], (prev = []) => [m, ...prev])
          }
        />
      )}

      {slug && editTarget && (
        <EditRoleDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          member={editTarget}
          slug={slug}
          canAssignOwner={canAssignOwner}
          onUpdated={(role) => { handleRoleUpdated(editTarget.email, role); setEditTarget(null) }}
        />
      )}

      {slug && removeTarget && (
        <RemoveMemberDialog
          open={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          member={removeTarget}
          slug={slug}
          onRemoved={() => { handleRemoved(removeTarget.email); setRemoveTarget(null) }}
        />
      )}

      {slug && (
        <MemberSheet
          member={selected}
          isCurrentUser={selected?.email === user?.email}
          onClose={() => setSelected(null)}
          canManage={canManage}
          slug={slug}
          canAssignOwner={canAssignOwner}
          onRoleUpdated={handleRoleUpdated}
          onRemoved={handleRemoved}
        />
      )}
    </div>
  )
}
