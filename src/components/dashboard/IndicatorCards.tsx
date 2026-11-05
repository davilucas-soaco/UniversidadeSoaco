import { Award, BookCheck, CircleDashed, PlayCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Sparkline } from '@/components/ui/Sparkline'
import { indicatorMetrics } from '@/data/dashboard'

const icons = {
  points: Award,
  completed: BookCheck,
  progress: PlayCircle,
  pending: CircleDashed,
}

const tones = {
  points: 'bg-golden text-midnight',
  completed: 'bg-ocean text-ivory',
  progress: 'bg-warm-sand text-midnight',
  pending: 'bg-fill text-golden',
}

const sparkColors = {
  points: '#dad775',
  completed: '#7aa2ff',
  progress: '#c49a73',
  pending: '#9aa3b8',
}

export function IndicatorCards() {
  return (
    <section id="tour-indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {indicatorMetrics.map((item) => {
        const Icon = icons[item.key]
        const up = item.trend >= 0

        return (
          <Card key={item.key} className="min-w-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tones[item.key]}`}>
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <Sparkline values={[...item.sparkline]} color={sparkColors[item.key]} />
            </div>
            <p className="mt-4 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{item.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="flex flex-wrap items-end gap-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-ink">{item.value}</span>
                <span className="mb-1 text-sm text-muted">{item.suffix}</span>
              </p>
              <span className={`mb-1 inline-flex items-center gap-1 text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {up ? '+' : ''}
                {item.trend}%
              </span>
            </div>
          </Card>
        )
      })}
    </section>
  )
}
