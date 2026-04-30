import { useState } from "react"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CompanyService } from "@/api/services/company-service"
import type { CompanyMemberRole, CreateCompanyMemberRequest, ResumeMemberResponse } from "@/api/model"
import { ALL_ROLES, ROLE_CONFIG } from "./members.config"

const companyService = new CompanyService()

function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (member: ResumeMemberResponse) => void
  slug: string
  canAssignOwner: boolean
}

export function AddMemberDialog({ open, onClose, onCreated, slug, canAssignOwner }: Props) {
  const [form, setForm] = useState<CreateCompanyMemberRequest>({
    fullName: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCompanyMemberRequest, string>>>({})

  function validate() {
    const e: typeof errors = {}
    if (!form.fullName.trim()) e.fullName = "Nome obrigatório"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "E-mail inválido"
    if (form.password.length < 6) e.password = "Mínimo 6 caracteres"
    return e
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const res = await companyService.addMember(slug, form)
      toast.success(`${form.fullName} adicionado(a) com sucesso.`)
      onCreated({
        id: res.data.id,
        fullName: form.fullName,
        email: form.email,
        profileImage: "",
        role: form.role,
        createdAt: new Date().toISOString(),
      })
      setForm({ fullName: "", email: "", password: "", role: "EMPLOYEE" })
      setErrors({})
      onClose()
    } catch {
      toast.error("Erro ao adicionar membro. Verifique os dados e tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  function setField(key: keyof CreateCompanyMemberRequest, val: string) {
    setForm((p) => ({ ...p, [key]: val }))
    setErrors((p) => { const n = { ...p }; delete n[key]; return n })
  }

  const roles = canAssignOwner ? ALL_ROLES : ALL_ROLES.filter((r) => r !== "OWNER")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4" />
            Adicionar membro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <Field id="am-name" label="Nome completo" error={errors.fullName}>
            <Input
              id="am-name"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              placeholder="Ex: Maria Silva"
              autoComplete="off"
              className="rounded-none"
            />
          </Field>

          <Field id="am-email" label="E-mail" error={errors.email}>
            <Input
              id="am-email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="maria@empresa.com"
              autoComplete="off"
              className="rounded-none"
            />
          </Field>

          <Field id="am-pass" label="Senha temporária" error={errors.password}>
            <Input
              id="am-pass"
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="rounded-none"
            />
          </Field>

          <Field label="Função">
            <Select value={form.role} onValueChange={(v) => setField("role", v as CompanyMemberRole)}>
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adicionando…" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
