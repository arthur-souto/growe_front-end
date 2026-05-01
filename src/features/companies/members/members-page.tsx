import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router"
import { toast } from "sonner"
import { Plus, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyService } from "@/api/services/company-service"
import { getApiErrorMessage } from "@/api/api-error"
import { useUser } from "@/hooks/useUser"
import type { CompanyMemberRole, ResumeMemberResponse } from "@/api/model"
import {
  ALL_ROLES,
  PAGE_SIZE,
  ROLE_CONFIG,
  getCurrentDate,
  getInitials,
  type SortDir,
  type SortKey,
} from "./members.config"
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

  const [members, setMembers] = useState<ResumeMemberResponse[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const hasFilters = searchInput !== "" || roleFilter !== "ALL"

  function reloadMembers() {
    if (!slug) return
    setLoading(true)
    companyService
      .getMembers(slug)
      .then((res) => setMembers(res.data.content))
      .catch((err) => toast.error(getApiErrorMessage(err, "Erro ao carregar membros.")))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reloadMembers() }, [slug])

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
    setMembers((prev) => prev.map((m) => (m.email === email ? { ...m, role } : m)))
    setSelected((prev) => (prev?.email === email ? { ...prev, role } : prev))
  }

  function handleRemoved(email: string) {
    setMembers((prev) => prev.filter((m) => m.email !== email))
    if (selected?.email === email) setSelected(null)
  }

  const stats = useMemo(() => {
    const c: Record<CompanyMemberRole, number> = { ADMIN: 0, OWNER: 0, RH: 0, MANAGER: 0, EMPLOYEE: 0 }
    members.forEach((m) => { if (m.role in c) c[m.role]++ })
    return c
  }, [members])

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
        {canManage && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5" />
              Importar
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" />
              Adicionar membro
            </Button>
          </div>
        )}
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ALL_ROLES.map((role) => {
            const active = roleFilter === role
            const cfg = ROLE_CONFIG[role]
            return (
              <button
                key={role}
                onClick={() => setRoleFilter((prev) => (prev === role ? "ALL" : role))}
                className={`flex flex-col gap-3 px-5 py-4 text-left transition-colors bg-card ${
                  active ? cfg.activeBorder : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 shrink-0 ${cfg.dot}`} />
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
                  <Skeleton className="h-8 w-12 rounded-none" />
                ) : (
                  <span className="text-4xl font-bold tabular-nums leading-none">
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
          onCreated={(m) => setMembers((prev) => [m, ...prev])}
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
