import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { getApiErrorMessage } from "@/api/api-error"
import type { CompanyMemberRole, ResumeMemberResponse } from "@/api/model"
import { ALL_ROLES, ROLE_CONFIG, getInitials } from "./members.config"

const companyService = new CompanyService()

interface Props {
  open: boolean
  onClose: () => void
  member: ResumeMemberResponse
  slug: string
  onUpdated: (role: CompanyMemberRole) => void
  canAssignOwner: boolean
}

export function EditRoleDialog({ open, onClose, member, slug, onUpdated, canAssignOwner }: Props) {
  const [role, setRole] = useState<CompanyMemberRole>(member.role)
  const [saving, setSaving] = useState(false)

  useEffect(() => setRole(member.role), [member.role])

  async function handleSave() {
    setSaving(true)
    try {
      await companyService.updateMember(slug, member.id, { role })
      toast.success("Função atualizada com sucesso.")
      onUpdated(role)
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao atualizar função."))
    } finally {
      setSaving(false)
    }
  }

  const roles = canAssignOwner ? ALL_ROLES : ALL_ROLES.filter((r) => r !== "OWNER")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar função</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 border bg-muted/30 p-3">
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={member.profileImage || undefined} alt={member.fullName} />
              <AvatarFallback className="bg-transparent text-xs">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nova função</Label>
            <Select value={role} onValueChange={(v) => setRole(v as CompanyMemberRole)}>
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || role === member.role}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
