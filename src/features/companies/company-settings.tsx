import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { toast } from "sonner"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CompanyService } from "@/api/services/company-service"
import { navigationService } from "@/api/services/navigation-service"
import type { CompanyDetailsResponse, SizeRange, UpdateCompanyRequest } from "@/api/model"

const companyService = new CompanyService()

const SIZE_RANGE_LABELS: Record<SizeRange, string> = {
  ONE_TO_10: "1–10 funcionários",
  ELEVEN_TO_50: "11–50 funcionários",
  FIFTY_ONE_TO_200: "51–200 funcionários",
  TWO_HUNDRED_PLUS: "200+ funcionários",
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
}

const COMPANY_ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  EMPLOYEE: "Funcionário",
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter className="border-t justify-end">
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  )
}

export default function CompanySettings() {
  const { slug } = useParams<{ slug: string }>()
  const [company, setCompany] = useState<CompanyDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingAppearance, setSavingAppearance] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<{ sizeRange: SizeRange; companyImage: string }>({
    sizeRange: "ONE_TO_10",
    companyImage: "",
  })

  useEffect(() => {
    if (!slug) return
    companyService
      .getCompany(slug)
      .then((res) => {
        setCompany(res.data)
        setNewName(res.data.name)
        setForm({
          sizeRange: res.data.sizeRange,
          companyImage: res.data.companyImage ?? "",
        })
      })
      .catch(() => toast.error("Erro ao carregar configurações."))
      .finally(() => setLoading(false))
  }, [slug])

  async function saveGeneral(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!slug || !company) return
    setSavingGeneral(true)
    try {
      await companyService.updateCompany(slug, {
        name: company.name,
        sizeRange: form.sizeRange,
        companyImage: company.companyImage ?? undefined,
      })
      const res = await companyService.getCompany(slug)
      setCompany(res.data)
      toast.success("Informações atualizadas.")
    } catch {
      toast.error("Erro ao salvar.")
    } finally {
      setSavingGeneral(false)
    }
  }

  async function saveCompanyName(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!slug || !company) return
    setSavingName(true)
    try {
      await companyService.updateCompany(slug, {
        name: newName,
        sizeRange: company.sizeRange,
        companyImage: company.companyImage ?? undefined,
      })
      toast.success("Nome atualizado.")
      navigationService.navigate("/home", { replace: true })
    } catch {
      toast.error("Erro ao atualizar nome.")
      setSavingName(false)
    }
  }

  async function saveAppearance(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!slug || !company) return
    setSavingAppearance(true)
    try {
      await companyService.updateCompany(slug, {
        name: company.name,
        sizeRange: company.sizeRange,
        companyImage: form.companyImage || undefined,
      })
      const res = await companyService.getCompany(slug)
      setCompany(res.data)
      toast.success("Aparência atualizada.")
    } catch {
      toast.error("Erro ao salvar.")
    } finally {
      setSavingAppearance(false)
    }
  }

  async function handleDelete() {
    if (!slug) return
    setDeleting(true)
    try {
      await companyService.deleteCompany(slug)
      toast.success("Empresa excluída.")
      navigationService.navigate("/home", { replace: true })
    } catch {
      toast.error("Erro ao excluir empresa.")
      setDeleting(false)
    }
  }

  const previewSlug = toSlug(newName)
  const currentSlug = company?.slug ?? ""
  const slugChanged = previewSlug !== currentSlug && newName !== ""

  return (
    <div className="flex-1 overflow-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-8 border-b pb-6">
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as informações e preferências deste workspace.
        </p>
      </div>

      <div className="space-y-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* General */}
            <form onSubmit={saveGeneral}>
              <Card size="sm">
                <CardHeader className="border-b">
                  <CardTitle>Informações gerais</CardTitle>
                  <CardDescription>
                    Nome e porte visíveis para todos os membros do workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Nome da empresa" hint="Para alterar o nome, use a Zona de perigo.">
                    <Input value={company?.name ?? ""} readOnly disabled />
                  </Field>
                  <Field label="Porte">
                    <Select
                      value={form.sizeRange}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, sizeRange: v as SizeRange }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(SIZE_RANGE_LABELS) as SizeRange[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {SIZE_RANGE_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </CardContent>
                <CardFooter className="border-t justify-end">
                  <Button type="submit" size="sm" disabled={savingGeneral}>
                    {savingGeneral ? "Salvando…" : "Salvar"}
                  </Button>
                </CardFooter>
              </Card>
            </form>

            {/* Appearance */}
            <form onSubmit={saveAppearance}>
              <Card size="sm">
                <CardHeader className="border-b">
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>
                    Logo usada no workspace e nos cards da empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    {form.companyImage ? (
                      <img
                        src={form.companyImage}
                        alt="Logo"
                        className="size-14 shrink-0 object-cover ring-1 ring-border"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center bg-muted ring-1 ring-border">
                        <Building2 className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <Field
                      label="URL da imagem"
                      hint="Recomendado: imagem quadrada, mínimo 64×64 px."
                    >
                      <Input
                        type="url"
                        value={form.companyImage}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, companyImage: e.target.value }))
                        }
                        placeholder="https://exemplo.com/logo.png"
                      />
                    </Field>
                  </div>
                </CardContent>
                <CardFooter className="border-t justify-end">
                  <Button type="submit" size="sm" disabled={savingAppearance}>
                    {savingAppearance ? "Salvando…" : "Salvar"}
                  </Button>
                </CardFooter>
              </Card>
            </form>

            {/* Read-only info */}
            <Card size="sm">
              <CardHeader className="border-b">
                <CardTitle>Sobre a empresa</CardTitle>
                <CardDescription>
                  Dados gerados automaticamente. Não podem ser alterados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="CNPJ">
                  <Input value={company?.cnpj ?? ""} readOnly disabled />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Plano">
                    <Input
                      value={PLAN_LABELS[company?.plan ?? ""] ?? company?.plan ?? ""}
                      readOnly
                      disabled
                    />
                  </Field>
                  <Field label="Status">
                    <Input
                      value={company?.isActive ? "Ativa" : "Inativa"}
                      readOnly
                      disabled
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Criada em">
                    <Input
                      value={company?.createdAt ? formatDate(company.createdAt) : ""}
                      readOnly
                      disabled
                    />
                  </Field>
                  <Field label="Trial até">
                    <Input
                      value={
                        company?.trialEndsAt ? formatDate(company.trialEndsAt) : "Sem trial"
                      }
                      readOnly
                      disabled
                    />
                  </Field>
                </div>
                <Field label="Slug" hint="Usado na URL do workspace.">
                  <Input value={`/${company?.slug ?? ""}`} readOnly disabled />
                </Field>
              </CardContent>
            </Card>

            {/* Members */}
            <Card size="sm">
              <CardHeader className="border-b">
                <CardTitle>Membros</CardTitle>
                <CardDescription>
                  {company?.members.length ?? 0}{" "}
                  {company?.members.length === 1 ? "pessoa com" : "pessoas com"} acesso a este
                  workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!company?.members.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {company.members.map((member) => (
                      <li key={member.email} className="flex items-center gap-3 py-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={member.profileImage} alt={member.fullName} />
                          <AvatarFallback className="text-xs">
                            {member.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{member.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <span className="shrink-0 bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {COMPANY_ROLE_LABELS[member.companyRole] ?? member.companyRole}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card size="sm" className="border-destructive/40">
              <CardHeader className="border-b border-destructive/40">
                <CardTitle className="text-destructive">Zona de perigo</CardTitle>
                <CardDescription>Ações irreversíveis. Prossiga com cautela.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={saveCompanyName} className="flex justify-between items-center">
                  <Field label="Atualizar nome da empresa" hint="Alterar o nome gera um novo slug e redireciona para o início.">
                    <Input
                      required
                      maxLength={200}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: Acme Corp"
                    />
                    <div className="mt-2 flex items-center gap-6 text-xs text-muted-foreground">
                      <span>
                        Slug atual:{" "}
                        <code className="font-mono text-foreground">/{currentSlug}</code>
                      </span>
                      {slugChanged && (
                        <span>
                          Novo slug:{" "}
                          <code className="font-mono text-foreground">/{previewSlug}</code>
                        </span>
                      )}
                    </div>
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" variant="destructive" disabled={savingName || newName === company?.name}>
                      {savingName ? "Salvando…" : "Atualizar nome"}
                    </Button>
                  </div>
                </form>

                <div className="border-t border-destructive/30" />

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Excluir empresa</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Remove permanentemente{" "}
                      <span className="font-medium text-foreground">{company?.name}</span> e todos
                      os dados associados.
                    </p>
                  </div>

                  <AlertDialog
                    open={deleteOpen}
                    onOpenChange={(open) => {
                      setDeleteOpen(open)
                      if (!open) setDeleteConfirm("")
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" type="button">
                        Excluir empresa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é <strong>irreversível</strong>. Todos os dados de{" "}
                          <strong>{company?.name}</strong> serão permanentemente excluídos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="space-y-1.5 py-2">
                        <label className="text-sm font-medium">
                          Digite{" "}
                          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            {company?.name}
                          </code>{" "}
                          para confirmar
                        </label>
                        <Input
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder={company?.name}
                          autoComplete="off"
                        />
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <Button
                          variant="destructive"
                          disabled={deleteConfirm !== company?.name || deleting}
                          onClick={handleDelete}
                        >
                          {deleting ? "Excluindo…" : "Excluir empresa"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
