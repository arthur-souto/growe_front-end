import type { CycleAverage } from "@/api/model"
import { scoreBarColor, scoreColor } from "./dashboard.config"
import { cn } from "@/lib/utils"

const TRACK_H = 130 // px — bar track height
const TICKS = [2, 3, 4, 5]

export function CycleChart({ data }: { data: CycleAverage[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        Sem dados de ciclos ainda.
      </div>
    )
  }

  return (
    <div className="flex items-end gap-6">
      {/* Y-axis ticks */}
      <div className="flex flex-col justify-between shrink-0 pb-5" style={{ height: TRACK_H }}>
        {TICKS.slice().reverse().map((t) => (
          <span key={t} className="text-[10px] text-white/25 tabular-nums leading-none">
            {t}
          </span>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-4 flex-1 overflow-x-auto">
        {data.map((d) => {
          const pct = Math.max(0, ((d.avgScore - 1) / 4) * 100)
          const color = scoreBarColor(d.avgScore)
          return (
            <div key={d.cycleName} className="flex flex-col items-center gap-1.5 w-20 shrink-0">
              <span className={cn("text-[10px] font-bold tabular-nums", scoreColor(d.avgScore))}>
                {d.avgScore.toFixed(2)}
              </span>
              <div className="w-full relative rounded overflow-hidden bg-white/5" style={{ height: TRACK_H }}>
                {/* grid lines */}
                {TICKS.slice(0, -1).map((t) => (
                  <div
                    key={t}
                    className="absolute left-0 right-0 border-t border-white/[0.07]"
                    style={{ bottom: `${((t - 1) / 4) * 100}%` }}
                  />
                ))}
                {/* bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded transition-all"
                  style={{ height: `${pct}%`, backgroundColor: color + "99" }}
                />
              </div>
              <span className="text-[10px] text-white/35 truncate max-w-full text-center leading-tight">
                {d.cycleName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
