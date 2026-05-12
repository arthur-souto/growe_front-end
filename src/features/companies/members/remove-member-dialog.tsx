import { useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CompanyService } from "@/api/services/company-service"
import { getApiErrorMessage } from "@/api/api-error"
import type { ResumeMemberResponse } from "@/api/model"
import { getInitials } from "./members.config"
import { RoleBadge } from "./role-badge"

const companyService = new CompanyService()

interface Props {
  open: boolean
  onClose: () => void
  member: ResumeMemberResponse
  slug: string
  onRemoved: () => void
}

export function RemoveMemberDialog({ open, onClose, member, slug, onRemoved }: Props) {
  const [removing, setRemoving] = useState(false)

  async function handleRemove() {
    setRemoving(true)
    try {
      await companyService.removeMember(slug, member.id)
      toast.success(`${member.fullName} removido(a) da empresa.`)
      onRemoved()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover membro."))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover membro</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover{" "}
            <span className="font-semibold text-foreground">{member.fullName}</span> desta
            empresa? Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-3 border bg-muted/30 p-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={member.profileImage || undefined} alt={member.fullName} />
            <AvatarFallback className="bg-transparent text-xs">
              {getInitials(member.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{member.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>
          <RoleBadge role={member.role} />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleRemove} disabled={removing}>
            {removing ? "Removendo…" : "Remover"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
