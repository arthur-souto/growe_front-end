import type { CompanyMemberRole } from "@/api/model"
import { ROLE_CONFIG } from "./members.config"

export function RoleBadge({ role }: { role: CompanyMemberRole }) {
  const cfg = ROLE_CONFIG[role]
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest w-32.5 ${cfg.pill}`}
    >
      <span className={`size-1.5 shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
