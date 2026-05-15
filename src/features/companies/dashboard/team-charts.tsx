import type { TeamMemberSummaryResponse, CompanyMemberRole } from "@/api/model"
import { scoreBarColor, scoreColor } from "./dashboard.config"
import { cn } from "@/lib/utils"

const ROLE_LABEL: Record<CompanyMemberRole, string> = {
  OWNER: "Dono",
  ADMIN: "Admin",
  MANAGER: "Gestor",
  RH: "RH",
  EMPLOYEE: "Colaborador",
}

// ---------------------------------------------------------------------------
// Score distribution: SVG donut (left) + legend (right)
// ---------------------------------------------------------------------------

const R = 48
const SW = 11
const CX = 60
const CY = 60
const C = 2 * Math.PI * R
const GAP = 4

export function ScoreDistributionChart({ members }: { members: TeamMemberSummaryResponse[] }) {
  const high = members.filter((m) => m.overallAvgScore != null && m.overallAvgScore >= 4).length
  const mid = members.filter(
    (m) => m.overallAvgScore != null && m.overallAvgScore >= 2.5 && m.overallAvgScore < 4,
  ).length
  const low = members.filter((m) => m.overallAvgScore != null && m.overallAvgScore < 2.5).length
  const none = members.filter((m) => m.overallAvgScore == null).length
  const total = members.length || 1

  const segs = [
    { label: "Alto (≥ 4)", count: high, color: "#4ade80" },
    { label: "Médio (2.5–4)", count: mid, color: "#fbbf24" },
    { label: "Baixo (< 2.5)", count: low, color: "#f87171" },
    { label: "Sem dados", count: none, color: "rgba(255,255,255,0.18)" },
  ]

  const scored = members.filter((m) => m.overallAvgScore != null)
  const avg = scored.length
    ? scored.reduce((s, m) => s + m.overallAvgScore!, 0) / scored.length
    : null

  let cumPct = 0
  const arcs = segs.map((s) => {
    const pct = s.count / total
    const arc = Math.max(0, pct * C - (s.count > 0 ? GAP : 0))
    const startAngle = cumPct * 360 - 90
    cumPct += pct
    return { ...s, arc, startAngle }
  })

  return (
    <div className="flex flex-col justify-center w-full items-center gap-5">
      <svg width="200" height="200" viewBox="0 0 120 120" className="shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
        {arcs.map((seg) =>
          seg.arc > 0 ? (
            <circle
              key={seg.label}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={SW}
              strokeDasharray={`${seg.arc} ${C}`}
              style={{ transform: `rotate(${seg.startAngle}deg)`, transformOrigin: `${CX}px ${CY}px` }}
            />
          ) : null,
        )}
        {avg != null ? (
          <>
            <text x={CX} y={CY - 4} textAnchor="middle" fontSize="18" fontWeight="bold" fill={scoreBarColor(avg)}>
              {avg.toFixed(1)}
            </text>
            <text x={CX} y={CY + 11} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">
              média
            </text>
          </>
        ) : (
          <text x={CX} y={CY + 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">
            sem dados
          </text>
        )}
      </svg>

      <div className=" md:flex  gap-5 ">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 min-w-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-xs text-white/50 truncate">{s.label}</span>
            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: s.color }}>
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top / Bottom performers
// ---------------------------------------------------------------------------

export function TopBottomChart({ members }: { members: TeamMemberSummaryResponse[] }) {
  const ranked = [...members]
    .filter((m) => m.overallAvgScore != null)
    .sort((a, b) => (b.overallAvgScore ?? 0) - (a.overallAvgScore ?? 0))

  if (ranked.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        Nenhum membro com avaliações ainda.
      </div>
    )
  }

  const top = ranked.slice(0, 5)
  const bottom = ranked.slice(-5).reverse()

  function MemberRow({
    member,
    rank,
    accent,
  }: {
    member: TeamMemberSummaryResponse
    rank: number
    accent: string
  }) {
    return (
      <div className="flex items-center jus gap-2.5 py-2 border-b border-white/5 last:border-0">
        <span className="text-[10px] font-bold tabular-nums text-white/20 w-4 shrink-0">
          #{rank}
        </span>
        <span className="flex-1 text-xs text-white/70 truncate min-w-0">{member.memberName}</span>
        <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: accent }}>
          {member.overallAvgScore!.toFixed(2)}
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 h-full w-full  items-center gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-2">
          Top
        </p>
        <div>
          {top.map((m, i) => (
            <MemberRow key={m.memberId} member={m} rank={i + 1} accent="#4ade80" />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">
          Bottom
        </p>
        <div>
          {bottom.map((m, i) => (
            <MemberRow key={m.memberId} member={m} rank={ranked.length - i} accent="#f87171" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Average score by role
// ---------------------------------------------------------------------------

export function RoleScoreChart({ members }: { members: TeamMemberSummaryResponse[] }) {
  const roles = Array.from(new Set(members.map((m) => m.role))) as CompanyMemberRole[]

  const roleData = roles
    .map((role) => {
      const group = members.filter((m) => m.role === role && m.overallAvgScore != null)
      const avg = group.length
        ? group.reduce((sum, m) => sum + m.overallAvgScore!, 0) / group.length
        : null
      return { role, avg, count: members.filter((m) => m.role === role).length }
    })
    .filter((r) => r.avg != null)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))

  if (roleData.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        Nenhum dado por papel ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {roleData.map(({ role, avg, count }) => {
        const color = scoreBarColor(avg!)
        const pct = (avg! / 5) * 100
        return (
          <div key={role} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-white/70 truncate">{ROLE_LABEL[role]}</span>
                <span className="text-[10px] text-white/25 shrink-0">{count}×</span>
              </div>
              <span className={cn("text-sm font-bold tabular-nums shrink-0", scoreColor(avg))}>
                {avg!.toFixed(2)}
              </span>
            </div>
            <div className="h-2  bg-white/[0.07] overflow-hidden">
              <div
                className="h-full  transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
