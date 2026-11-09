import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { InsetCard } from '@/components/ui/Card'
import { PillTabs } from '@/components/ui/PillTabs'
import { useTheme } from '@/context/ThemeContext'
import { recentActivities } from '@/data/activity'
import { studyWeek } from '@/data/dashboard'
import { performanceByPeriod } from '@/data/performance'
import { formatMinutes } from '@/lib/format'
import type { ActivityItem, PeriodKey } from '@/types'

const options: { value: PeriodKey; label: string }[] = [
  { value: '30d', label: '30 dias' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
]

const activityDot: Record<ActivityItem['type'], string> = {
  progress: 'bg-accent',
  completion: 'bg-accent-2',
  points: 'bg-accent',
  assignment: 'bg-[#334766]',
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey?: string; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-elevated px-3 py-2 shadow-panel">
      <p className="font-display text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="mt-1 text-sm font-semibold text-ink">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.dataKey === 'average' ? 'Equipe' : 'Você'}: {entry.value} pts
        </p>
      ))}
    </div>
  )
}

export function LearningEvolution() {
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const { isDark } = useTheme()
  const data = performanceByPeriod[period]
  const total = useMemo(() => data.reduce((sum, item) => sum + item.points, 0), [data])
  const you = isDark ? '#3b82f6' : '#1e22aa'
  const team = isDark ? '#6b7280' : '#808080'
  const grid = isDark ? '#2c3038' : '#e2e2e4'
  const dotFill = isDark ? '#1a1d24' : '#ffffff'
  const delta = studyWeek.minutes - studyWeek.goalMinutes

  return (
    <section id="tour-performance" className="flex flex-col rounded-2xl border border-line bg-elevated p-6 shadow-md sm:p-8">
      <div className="flex flex-col justify-between gap-3 border-b border-line/80 pb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl leading-7 font-semibold tracking-tight text-ink">
            Evolução do aprendizado
          </h2>
          <p className="text-xs text-muted">
            Pontos por período · {total} pts
          </p>
        </div>
        <PillTabs value={period} options={options} onChange={setPeriod} />
      </div>

      <div className="relative my-6 flex h-60 w-full flex-col justify-end overflow-hidden rounded-xl border border-line bg-surface/90 p-4">
        <div className="absolute top-3 right-4 z-10 flex items-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: you }} />
            <span>Você</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: team }} />
            <span>Equipe</span>
          </div>
        </div>
        <div className="h-full w-full pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="evolutionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={you} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={you} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: isDark ? '#94a3b8' : '#6b6f78', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: you, strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="average"
                stroke={team}
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                fill="transparent"
                dot={false}
                activeDot={{ r: 4, fill: team, stroke: dotFill, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="points"
                stroke={you}
                strokeWidth={3}
                fill="url(#evolutionFill)"
                dot={{ r: 4, fill: dotFill, stroke: you, strokeWidth: 2.5 }}
                activeDot={{ r: 6, fill: isDark ? '#60a5fa' : you, stroke: dotFill, strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-1 md:grid-cols-2">
        <InsetCard className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-medium text-ink">Dedicação semanal</span>
            <span className="font-display text-sm font-bold text-accent">{formatMinutes(studyWeek.minutes)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-fill">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, Math.round((studyWeek.minutes / studyWeek.goalMinutes) * 100))}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {delta >= 0
              ? `+${formatMinutes(delta)} acima da meta.`
              : `${formatMinutes(Math.abs(delta))} abaixo da meta.`}
          </p>
        </InsetCard>

        <InsetCard className="flex flex-col gap-3 p-4">
          <span className="font-display text-sm font-medium text-ink">Atividades recentes</span>
          <div className="flex flex-col gap-2">
            {recentActivities.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start gap-3 text-xs">
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityDot[item.type]}`} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-ink">{item.description}</span>
                  <span className="text-[12px] text-muted">{item.time.toLocaleLowerCase('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </InsetCard>
      </div>
    </section>
  )
}
