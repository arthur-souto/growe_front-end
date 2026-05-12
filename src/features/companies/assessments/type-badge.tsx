import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AssessmentType } from "@/api/model"
import { TYPE_LABEL, TYPE_STYLE } from "./assessments.config"

export function TypeBadge({ type }: { type: AssessmentType }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-none border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider min-w-20 justify-center",
        TYPE_STYLE[type],
      )}
    >
      {TYPE_LABEL[type]}
    </Badge>
  )
}
