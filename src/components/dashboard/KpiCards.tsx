import { Award, BadgeCheck, BookOpenText, Medal, RefreshCw, TrendingUp } from 'lucide-react'
import { indicatorMetrics, type IndicatorMetric } from '@/data/dashboard'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'

const icons: Record<IndicatorMetric['key'], typeof Award> = {
  points: Medal,
  completed: Award,
  progress: BookOpenText,
  score: BadgeCheck,
}

const tone: Record<IndicatorMetric['key'], 'gold' | 'cyan' | 'neutral'> = {
  points: 'gold',
  completed: 'neutral',
  progress: 'cyan',
  score: 'gold',
}

const iconBox = {
  gold: 'bg-accent/15 border-accent/30 text-accent',
  cyan: 'bg-accent-2/15 border-accent-2/30 text-accent-2',
  neutral: 'bg-fill border-line text-accent',
}

function formatValue(value: number) {
  return Number.isInteger(value) ? formatNumber(value) : value.toFixed(1).replace('.', ',')
}

export function KpiCards() {
  return (
    <section id="tour-indicators" className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {indicatorMetrics.map((metric) => {
        const Icon = icons[metric.key]
        const kind = tone[metric.key]
        return (
          <div
            key={metric.key}
            className={cn(
              'flex flex-col justify-between rounded-2xl border border-line bg-elevated p-6 shadow-md transition-all',
              kind === 'gold' ? 'hover:border-accent/40' : 'hover:border-accent-2/30',
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-xs font-semibold tracking-[0.04em] text-muted">{metric.label}</span>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', iconBox[kind])}>
                <Icon size={21} strokeWidth={1.8} />
              </div>
            </div>
            <div>
              <div className="font-display text-[32px] leading-10 font-bold tracking-tight text-ink">
                {formatValue(metric.value)}
                {metric.unit === '%' ? (
                  <span className="text-base font-semibold text-accent">%</span>
                ) : (
                  <span
                    className={cn(
                      'ml-1.5 text-base',
                      kind === 'gold' ? 'font-semibold text-accent' : 'font-normal text-muted',
                    )}
                  >
                    {metric.unit}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 font-display text-xs font-semibold">
                {metric.trend === 'up' ? (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <TrendingUp size={15} />
                    {metric.detail}
                  </span>
                ) : metric.trend === 'sync' ? (
                  <span className="inline-flex items-center gap-1 text-accent-2">
                    <RefreshCw size={14} />
                    {metric.detail}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px]',
                      kind === 'gold'
                        ? 'border-accent/30 bg-accent/20 text-accent'
                        : 'border-line bg-fill font-medium text-muted',
                    )}
                  >
                    {metric.detail}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
