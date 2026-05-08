import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Users,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CompanyMemberRole, ResumeMemberResponse } from "@/api/model"
import { ALL_ROLES, PAGE_SIZE, ROLE_CONFIG, fmtDate, getInitials, type SortDir, type SortKey } from "./members.config"
import { RoleBadge } from "./role-badge"

function RowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="pl-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 shrink-0" />
          <Skeleton className="h-3 w-28" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-3 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell />
    </TableRow>
  )
}

function SortBtn({
  label, col, sortKey, sortDir, onSort,
}: {
  label: string
  col: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = sortKey === col
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors hover:text-foreground ${active ? "text-foreground" : "text-muted-foreground"}`}
    >
      {label}
      {active ? (
        <span className="text-[10px] opacity-70">{sortDir === "asc" ? "↑" : "↓"}</span>
      ) : (
        <ArrowUpDown className="size-3 opacity-30" />
      )}
    </button>
  )
}

interface Props {
  members: ResumeMemberResponse[]
  loading: boolean
  hasFilters: boolean
  searchInput: string
  roleFilter: CompanyMemberRole | "ALL"
  sortKey: SortKey
  sortDir: SortDir
  page: number
  totalPages: number
  totalFiltered: number
  currentUserEmail?: string
  canManage: boolean
  onSearchChange: (v: string) => void
  onRoleFilterChange: (v: CompanyMemberRole | "ALL") => void
  onSort: (k: SortKey) => void
  onClearFilters: () => void
  onPageChange: (p: number) => void
  onRowClick: (m: ResumeMemberResponse) => void
  onEditClick: (m: ResumeMemberResponse) => void
  onRemoveClick: (m: ResumeMemberResponse) => void
}

export function MembersTable({
  members, loading, hasFilters, searchInput, roleFilter, sortKey, sortDir,
  page, totalPages, totalFiltered, currentUserEmail, canManage,
  onSearchChange, onRoleFilterChange, onSort, onClearFilters, onPageChange,
  onRowClick, onEditClick, onRemoveClick,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="h-8 rounded-none pl-9 pr-8 text-xs"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Select value={roleFilter} onValueChange={(v) => onRoleFilterChange(v as CompanyMemberRole | "ALL")}>
          <SelectTrigger className="w-40 h-8 rounded-none text-xs shrink-0">
            <SelectValue placeholder="Função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as funções</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearFilters}
            className="h-8 text-muted-foreground gap-1 shrink-0"
          >
            <X className="size-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
      <Table className="min-w-[520px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="pl-5 h-9">
              <SortBtn label="Nome" col="fullName" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead className="h-9">
              <SortBtn label="E-mail" col="email" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead className="w-36 h-9">
              <SortBtn label="Função" col="role" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead className="w-36 h-9">
              <SortBtn label="Desde" col="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead className="w-10 pr-5 h-9" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => <RowSkeleton key={i} />)
          ) : members.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5}>
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex size-10 items-center justify-center border bg-muted">
                    <Users className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {hasFilters ? "Nenhum resultado" : "Nenhum membro"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {hasFilters
                        ? "Tente ajustar os filtros ou a busca."
                        : "Adicione o primeiro membro para começar."}
                    </p>
                  </div>
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={onClearFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const isMe = member.email === currentUserEmail
              const canEdit = canManage && !isMe && member.role !== "OWNER"

              return (
                <TableRow
                  key={member.email}
                  className="group cursor-pointer transition-colors"
                  onClick={() => onRowClick(member)}
                >
                  <TableCell className="pl-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage src={member.profileImage || undefined} alt={member.fullName} />
                        <AvatarFallback className="bg-transparent text-[10px] font-semibold">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{member.fullName}</span>
                        {isMe && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[9px] shrink-0">
                            Você
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {fmtDate(member.createdAt)}
                  </TableCell>
                  <TableCell className="py-2.5 pr-5" onClick={(e) => e.stopPropagation()}>
                    {canEdit ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none">
                          <DropdownMenuItem onSelect={() => onEditClick(member)}>
                            Editar função
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => onRemoveClick(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            Remover membro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : isMe ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-xs" disabled className="opacity-20">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="rounded-none">
                          Você não pode editar seu próprio perfil
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      </div>

      {!loading && totalPages > 1 && (
        <>
          <Separator />
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalFiltered)} de {totalFiltered}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={() => onPageChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="gap-1"
              >
                <ChevronLeft className="size-3" />
                Anterior
              </Button>
              <span className="px-3 text-xs text-muted-foreground tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="gap-1"
              >
                Próximo
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
