import { useState } from "react"
import { useParams } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BookOpen, Plus, Trash2 } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CompanyService } from "@/api/services/company-service"
import { CompetencyService } from "@/api/services/competency-service"
import { getApiErrorMessage } from "@/api/api-error"
import { useUser } from "@/hooks/useUser"

const companyService = new CompanyService()
const competencyService = new CompetencyService()

const ADMIN_ROLES = ["OWNER", "ADMIN", "RH"] as const

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function RowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="pl-6"><Skeleton className="h-3 w-36" /></TableCell>
      <TableCell><Skeleton className="h-3 w-64" /></TableCell>
      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell />
    </TableRow>
  )
}

function EmptyState() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={4}>
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-10 items-center justify-center border bg-muted">
            <BookOpen className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhuma competência cadastrada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Crie competências para usar nos ciclos de avaliação.
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface CreateDialogProps {
  open: boolean
  slug: string
  onClose: () => void
  onCreated: () => void
}

function CreateCompetencyDialog({ open, slug, onClose, onCreated }: CreateDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [nameError, setNameError] = useState("")
  const [saving, setSaving] = useState(false)

  function reset() {
    setName("")
    setDescription("")
    setNameError("")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) { setNameError("Nome obrigatório"); return }

    setSaving(true)
    try {
      await competencyService.create(slug, { name: name.trim(), description: description.trim() || undefined })
      toast.success(`Competência "${name.trim()}" criada.`)
      onCreated()
      reset()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao criar competência."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            Nova Competência
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="comp-name">Nome</Label>
            <Input
              id="comp-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError("") }}
              placeholder="Ex: Comunicação"
              className="rounded-none"
              maxLength={100}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comp-desc">Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Textarea
              id="comp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que esta competência avalia…"
              className="rounded-none resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-none" onClick={() => { reset(); onClose() }} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-none" disabled={saving}>
              {saving ? "Criando…" : "Criar competência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CompetenciesPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: members = [] } = useQuery({
    queryKey: ["members", slug],
    queryFn: () => companyService.getMembers(slug!, 0, 200).then((r) => r.data.content),
    enabled: !!slug,
  })
  const myRole = members.find((m) => m.email === user?.email)?.role ?? null
  const canManage = myRole != null && (ADMIN_ROLES as readonly string[]).includes(myRole)

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["competencies", slug, page],
    queryFn: () => competencyService.listByCompany(slug!, page, 20).then((r) => r.data),
    enabled: !!slug,
  })

  const competencies = pageData?.content ?? []
  const totalPages = pageData?.page.totalPages ?? 0
  const totalElements = pageData?.page.totalElements ?? 0

  const deleteMutation = useMutation({
    mutationFn: (competencyId: string) => competencyService.delete(slug!, competencyId),
    onSuccess: (_, competencyId) => {
      queryClient.invalidateQueries({ queryKey: ["competencies", slug] })
      queryClient.invalidateQueries({ queryKey: ["competencies", "cycle"] })
      toast.success("Competência removida.")
      // If we deleted the last item on a non-first page, go back
      if (competencies.length === 1 && page > 0) setPage((p) => p - 1)
      void competencyId
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao remover competência.")),
  })

  function handleCreated() {
    queryClient.invalidateQueries({ queryKey: ["competencies", slug] })
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4 sm:py-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen className="size-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-none">Competências</h1>
            <p className="mt-1 text-xs text-muted-foreground hidden sm:block">
              Catálogo de competências da empresa para uso nos ciclos de avaliação
            </p>
          </div>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Nova competência</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">
                Nome
                {!isLoading && totalElements > 0 && (
                  <Badge variant="outline" className="ml-2 rounded-none text-[10px] px-1.5 py-0 tabular-nums">
                    {totalElements}
                  </Badge>
                )}
              </TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-12 pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
            ) : competencies.length === 0 ? (
              <EmptyState />
            ) : (
              competencies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-6 text-sm font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-sm">
                    <p className="truncate" title={c.description}>{c.description || "—"}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</TableCell>
                  <TableCell className="pr-6">
                    {canManage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(c.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t px-4 sm:px-6 py-3">
          <Button size="sm" variant="outline" className="h-7 rounded-none text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" className="h-7 rounded-none text-xs" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próximo
          </Button>
        </div>
      )}

      {slug && (
        <CreateCompetencyDialog
          open={createOpen}
          slug={slug}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
