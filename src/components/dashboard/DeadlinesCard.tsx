import { useNavigate } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { InsetCard } from '@/components/ui/Card'
import { useCourseSummary } from '@/context/CatalogContext'
import { daysUntil, shortDate } from '@/lib/format'
import { cn } from '@/lib/cn'

function urgencyLabel(days: number) {
  if (days < 0) return 'Vencido'
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  return `Em ${days} dias`
}

export function DeadlinesCard() {
  const navigate = useNavigate()
  const { deadlines } = useCourseSummary()
  const hasUrgent = deadlines.some((course) => daysUntil(course.dueDate!) <= 7)

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-elevated p-6 shadow-md">
      <div className="flex items-center justify-between border-b border-line/80 pb-2">
        <div className="flex items-center gap-2">
          <CalendarClock size={22} className="text-accent" />
          <h2 className="font-display text-base font-semibold text-ink">Prazos</h2>
        </div>
        {hasUrgent ? (
          <span className="rounded-full border border-danger/30 bg-[#93000a]/40 px-2 py-0.5 font-display text-[10px] font-semibold tracking-wider text-danger uppercase">
            Urgentes
          </span>
        ) : (
          <span className="rounded-full border border-line bg-fill px-2 py-0.5 font-display text-[10px] font-semibold tracking-wider text-muted uppercase">
            Em dia
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted">Nenhum prazo obrigatório em aberto.</p>
        ) : null}
        {deadlines.slice(0, 3).map((course) => {
          const days = daysUntil(course.dueDate!)
          const urgent = days <= 7
          return (
            <InsetCard
              key={course.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/aula/${course.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') navigate(`/aula/${course.id}`)
              }}
              className="flex cursor-pointer flex-col gap-1 p-3 transition hover:border-accent/40"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 font-display text-[10px] font-semibold',
                    urgent
                      ? 'border-danger/30 bg-[#93000a]/50 text-danger'
                      : 'border-[#00a6e0]/30 bg-[#00a6e0]/20 text-accent-2',
                  )}
                >
                  {urgencyLabel(days)}
                </span>
                <span className="text-xs text-muted">{shortDate(course.dueDate!)}</span>
              </div>
              <h4 className="font-display text-sm font-semibold text-ink">{course.title}</h4>
              <p className="text-xs text-muted">
                {course.status === 'pendente' ? 'Treinamento obrigatório' : `Obrigatório · ${course.progress}% concluído`}
              </p>
            </InsetCard>
          )
        })}
      </div>
    </section>
  )
}
