import { cn } from "@/lib/utils"

export function ScorePill({ score }: { score: number | null }) {
  if (score == null) return <span className="text-sm text-muted-foreground">—</span>

  const colorClass =
    score >= 4
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : score >= 2.5
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10"
  const dotColor = score >= 4 ? "bg-green-400" : score >= 2.5 ? "bg-amber-400" : "bg-red-400"
  const filled = Math.round(score)

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-full text-xs font-semibold tabular-nums", colorClass)}>
      <span>{score.toFixed(1)}</span>
      <span className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={cn("size-2 rounded-full", i < filled ? dotColor : "bg-white/15")} />
        ))}
      </span>
    </div>
  )
}
