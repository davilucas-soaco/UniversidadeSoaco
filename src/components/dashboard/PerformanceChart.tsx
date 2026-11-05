import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useTheme } from '@/context/ThemeContext'
import { performanceByPeriod, periodLabels } from '@/data/performance'
import type { PeriodKey } from '@/types'

const options: { value: PeriodKey; label: string }[] = [
  { value: '30d', label: '30 dias' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
]

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
    <div className="rounded-2xl border border-line bg-elevated px-3 py-2 shadow-panel">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="mt-1 text-sm font-bold text-ink">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.dataKey === 'average' ? 'Média' : 'Você'}: {entry.value} pts
        </p>
      ))}
    </div>
  )
}

export function PerformanceChart() {
  const [period, setPeriod] = useState<PeriodKey>('6m')
  const { isDark } = useTheme()
  const data = performanceByPeriod[period]
  const total = useMemo(() => data.reduce((sum, item) => sum + item.points, 0), [data])
  const you = isDark ? '#dad775' : '#111B2D'
  const team = isDark ? '#7aa2ff' : '#52677F'

  return (
    <Card id="tour-performance" className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Meu desempenho</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {periodLabels[period]} · {total} pontos registrados
          </p>
          <div className="mt-3 flex gap-4 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: you }} />
              Seus pontos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: team }} />
              Média da equipe
            </span>
          </div>
        </div>
        <SegmentedControl value={period} options={options} onChange={setPeriod} />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={you} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={you} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="averageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={team} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={team} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E4E7F2'} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: isDark ? '#9aa3b8' : '#6B7390', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: isDark ? '#9aa3b8' : '#6B7390', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#c49a73', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="average" stroke={team} strokeWidth={2} fill="url(#averageFill)" />
              <Area
                type="monotone"
                dataKey="points"
                stroke={you}
                strokeWidth={2.4}
                fill="url(#pointsFill)"
                activeDot={{ r: 5, fill: you, stroke: isDark ? '#f3f1eb' : '#111B2D', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
