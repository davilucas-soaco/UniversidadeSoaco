import { Award, BookCheck, CircleDashed, PlayCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import { indicatorMetrics } from '@/data/dashboard'

const icons = {
  points: Award,
  completed: BookCheck,
  progress: PlayCircle,
  pending: CircleDashed,
}

// Paleta rebalanceada: azul elétrico + roxo/violeta
const iconStyles = {
  points: {
    background: 'linear-gradient(135deg, #4f7ef7 0%, #7c5cfc 100%)',
    shadow: '0 8px 24px -8px rgba(79,126,247,0.55)',
    color: '#fff',
  },
  completed: {
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    shadow: '0 8px 24px -8px rgba(59,130,246,0.5)',
    color: '#fff',
  },
  progress: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    shadow: '0 8px 24px -8px rgba(139,92,246,0.5)',
    color: '#fff',
  },
  pending: {
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    shadow: '0 8px 24px -8px rgba(100,116,139,0.4)',
    color: '#fff',
  },
}

const sparkColors = {
  points: '#4f7ef7',
  completed: '#06b6d4',
  progress: '#8b5cf6',
  pending: '#9aa3b8',
}

export function IndicatorCards() {
  return (
    <section id="tour-indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {indicatorMetrics.map((item) => {
        const Icon = icons[item.key]
        const up = item.trend >= 0
        const style = iconStyles[item.key]

        return (
          <div
            key={item.key}
            className="group relative min-w-0 overflow-hidden rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'var(--soaco-elevated)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 4px 24px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Glow de fundo sutil no hover */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[24px]"
              style={{ background: `radial-gradient(circle at 20% 20%, ${sparkColors[item.key]}18, transparent 60%)` }}
            />

            <div className="relative flex items-start justify-between gap-3">
              {/* Ícone quadrado arredondado */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: style.background, boxShadow: style.shadow, color: style.color }}
              >
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <Sparkline values={[...item.sparkline]} color={sparkColors[item.key]} />
            </div>

            <p className="relative mt-5 text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: 'var(--soaco-muted)' }}>{item.label}</p>
            <div className="relative mt-2 flex items-end justify-between gap-3">
              <p className="flex flex-wrap items-end gap-x-2">
                <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--soaco-ink)' }}>{item.value}</span>
                <span className="mb-1 text-sm" style={{ color: 'var(--soaco-muted)' }}>{item.suffix}</span>
              </p>
              <span
                className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                style={
                  up
                    ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
                    : { background: 'rgba(248,113,113,0.15)', color: '#f87171' }
                }
              >
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {up ? '+' : ''}{item.trend}%
              </span>
            </div>
          </div>
        )
      })}
    </section>
  )
}
