import type { DashboardComment } from "@/api/model"
import { TYPE_LABEL, TYPE_STYLE, relativeDate } from "./dashboard.config"

export function CommentCard({ comment: c }: { comment: DashboardComment }) {
  return (
    <div className="border bg-white/[0.03] px-4 py-3.5 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{c.evaluatorName}</span>
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest border ${TYPE_STYLE[c.assessmentType]}`}
        >
          {TYPE_LABEL[c.assessmentType]}
        </span>
        <span className="text-[10px] text-muted-foreground">{c.cycleName}</span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <span className="text-[10px] text-muted-foreground">
          {c.competencyName ?? "Geral"}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/60 shrink-0">
          {relativeDate(c.createdAt)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{c.comment}</p>
    </div>
  )
}
