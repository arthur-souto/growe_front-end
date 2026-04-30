import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CompanyMemberRole, ResumeMemberResponse } from "@/api/model"
import { fmtDate, getInitials } from "./members.config"
import { RoleBadge } from "./role-badge"
import { EditRoleDialog } from "./edit-role-dialog"
import { RemoveMemberDialog } from "./remove-member-dialog"

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-sm break-all ${mono ? "font-mono text-xs text-muted-foreground" : ""}`}>
        {value}
      </span>
    </div>
  )
}

interface Props {
  member: ResumeMemberResponse | null
  isCurrentUser: boolean
  onClose: () => void
  canManage: boolean
  slug: string
  onRoleUpdated: (email: string, role: CompanyMemberRole) => void
  onRemoved: (email: string) => void
  canAssignOwner: boolean
}

export function MemberSheet({
  member, isCurrentUser, onClose, canManage, slug, onRoleUpdated, onRemoved, canAssignOwner,
}: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  if (!member) return null
  const canEdit = canManage && !isCurrentUser && member.role !== "OWNER"

  return (
    <>
      <Sheet open={!!member} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-sm flex flex-col p-0 overflow-y-auto gap-0">
          <SheetHeader className="p-6 pb-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 shrink-0">
                <AvatarImage src={member.profileImage || undefined} alt={member.fullName} />
                <AvatarFallback className="bg-transparent text-base font-semibold">
                  {getInitials(member.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-sm leading-tight">{member.fullName}</SheetTitle>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                      Você
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
            </div>
          </SheetHeader>

          <Separator />

          <div className="px-6 py-5 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Função
            </p>
            <div className="flex items-center justify-between">
              <RoleBadge role={member.role} />
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  Alterar
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="px-6 py-5 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Informações
            </p>
            <div className="space-y-3">
              <InfoRow label="E-mail" value={member.email} />
              <InfoRow label="Membro desde" value={fmtDate(member.createdAt)} />
              <InfoRow label="ID" value={member.id} mono />
            </div>
          </div>

          {canEdit && (
            <>
              <Separator />
              <div className="px-6 py-5">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setRemoveOpen(true)}
                >
                  Remover do workspace
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {editOpen && (
        <EditRoleDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          member={member}
          slug={slug}
          canAssignOwner={canAssignOwner}
          onUpdated={(role) => { onRoleUpdated(member.email, role); setEditOpen(false) }}
        />
      )}

      {removeOpen && (
        <RemoveMemberDialog
          open={removeOpen}
          onClose={() => setRemoveOpen(false)}
          member={member}
          slug={slug}
          onRemoved={() => { onRemoved(member.email); setRemoveOpen(false); onClose() }}
        />
      )}
    </>
  )
}
