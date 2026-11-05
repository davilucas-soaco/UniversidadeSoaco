import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const daysWithEvents = [5, 12, 18, 23, 28]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function MiniCalendar() {
  const today = new Date()
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const { year, month } = current
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prev = () => {
    setCurrent(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    )
  }
  const next = () => {
    setCurrent(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    )
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const hasEvent = (day: number) => daysWithEvents.includes(day)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      className="rounded-[24px] p-5"
      style={{
        background: 'var(--soaco-elevated)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Header do mês */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'var(--soaco-ink)' }}>
          {MESES_PT[month]} <span style={{ color: 'var(--soaco-muted)' }}>{year}</span>
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prev}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10"
            style={{ color: 'var(--soaco-muted)' }}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={next}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10"
            style={{ color: 'var(--soaco-muted)' }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="mb-2 grid grid-cols-7">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold tracking-wide uppercase" style={{ color: 'var(--soaco-muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`blank-${idx}`} />

          return (
            <div key={day} className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                className="relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150 hover:scale-110"
                style={
                  isToday(day)
                    ? {
                        background: 'linear-gradient(135deg, #4f7ef7 0%, #7c5cfc 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(79,126,247,0.5)',
                        fontWeight: 800,
                      }
                    : {
                        color: 'var(--soaco-ink)',
                        opacity: 0.85,
                      }
                }
              >
                {day}
              </button>
              {/* Ponto de evento */}
              {hasEvent(day) && !isToday(day) && (
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #4f7ef7, #7c5cfc)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="mb-2 text-[11px] font-bold tracking-wide uppercase" style={{ color: 'var(--soaco-muted)' }}>Próximos eventos</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--soaco-muted)' }}>
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#4f7ef7' }} />
            <span style={{ color: 'var(--soaco-ink)' }} className="font-medium">Gestão de Processos</span>
            <span className="ml-auto">12 nov</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--soaco-muted)' }}>
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#8b5cf6' }} />
            <span style={{ color: 'var(--soaco-ink)' }} className="font-medium">Proteção de Dados</span>
            <span className="ml-auto">20 nov</span>
          </div>
        </div>
      </div>
    </div>
  )
}
