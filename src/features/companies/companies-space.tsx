import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Building2, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CompanyService } from "@/api/services/company-service"
import type {
  CreateCompanyRequest,
  Plan,
  ResumeCompanyResponse,
  SizeRange,
} from "@/api/model"
import { NavLink } from "react-router"

const companyService = new CompanyService()

const SIZE_RANGE_LABELS: Record<SizeRange, string> = {
  ONE_TO_10: "1–10 funcionários",
  ELEVEN_TO_50: "11–50 funcionários",
  FIFTY_ONE_TO_200: "51–200 funcionários",
  TWO_HUNDRED_PLUS: "200+ funcionários",
}

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
}

const EMPTY_FORM: CreateCompanyRequest = {
  name: "",
  cnpj: "",
  sizeRange: "ONE_TO_10",
  plan: "FREE",
  companyImage: "",
}

export default function CompaniesSpace() {
  const [companies, setCompanies] = useState<ResumeCompanyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateCompanyRequest>(EMPTY_FORM)

  useEffect(() => {
    companyService
      .getMyCompanies()
      .then((res) => setCompanies(res.data.content))
      .catch(() => toast.error("Erro ao carregar empresas."))
      .finally(() => setLoading(false))
  }, [])

  function handleField(field: keyof CreateCompanyRequest, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await companyService.createCompany({
        ...form,
        companyImage: form.companyImage || undefined,
      })
      toast.success("Empresa criada com sucesso!")
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      const res = await companyService.getMyCompanies()
      setCompanies(res.data.content)
    } catch {
      toast.error("Erro ao criar empresa.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="w-full flex-1">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Empresas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as empresas vinculadas à sua conta.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Nova empresa
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar empresa</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Nome
                  </label>
                  <input
                    required
                    maxLength={200}
                    value={form.name}
                    onChange={(e) => handleField("name", e.target.value)}
                    placeholder="Nome da empresa"
                    className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    CNPJ
                  </label>
                  <input
                    required
                    pattern="\d{14}"
                    maxLength={14}
                    value={form.cnpj}
                    onChange={(e) =>
                      handleField("cnpj", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="00000000000000"
                    className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Porte
                  </label>
                  <Select
                    value={form.sizeRange}
                    onValueChange={(v) => handleField("sizeRange", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SIZE_RANGE_LABELS) as SizeRange[]).map(
                        (key) => (
                          <SelectItem key={key} value={key}>
                            {SIZE_RANGE_LABELS[key]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Plano
                  </label>
                  <Select
                    value={form.plan}
                    onValueChange={(v) => handleField("plan", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PLAN_LABELS) as Plan[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {PLAN_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    URL da imagem{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </label>
                  <input
                    value={form.companyImage}
                    onChange={(e) =>
                      handleField("companyImage", e.target.value)
                    }
                    placeholder="https://..."
                    className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Spinner className="mr-2" /> : null}
                  Criar empresa
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Building2 className="size-10 opacity-40" />
            <p className="text-sm">Nenhuma empresa encontrada.</p>
            <p className="text-xs">
              Crie sua primeira empresa clicando em "Nova empresa".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Card key={company.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {company.companyImage ? (
                      <img
                        src={company.companyImage}
                        alt={company.name}
                        className="size-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                        <Building2 className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm">
                        {company.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {company.cnpj}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {PLAN_LABELS[company.plan]}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {company.sizeRange}
                    </span>
                    {!company.isActive && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                        Inativa
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    {company.users.length > 0 ? (
                      <AvatarGroup>
                        {company.users.slice(0, 3).map((user) => (
                          <Avatar key={user.email} size="sm">
                            <AvatarImage
                              src={user.profileImage}
                              alt={user.fullName}
                            />
                            <AvatarFallback>
                              {user.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {company.users.length > 3 && (
                          <AvatarGroupCount className="text-xs">
                            +{company.users.length - 3}
                          </AvatarGroupCount>
                        )}
                      </AvatarGroup>
                    ) : (
                      <Users className="size-4 text-muted-foreground/50" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {company.users.length}{" "}
                      {company.users.length === 1 ? "membro" : "membros"}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2 pt-0">
                  <Button variant="outline" size="sm" className="flex-1">
                    Detalhes
                  </Button>

                  <Button size="sm" className="flex-1">
                    <NavLink className="w-full h-full flex items-center justify-center" to={`/my-company/${company.slug}`}>Entrar</NavLink>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
