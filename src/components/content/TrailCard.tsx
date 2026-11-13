import { BadgeCheck, ListOrdered, Route } from 'lucide-react'
import { CourseCover } from '@/components/content/CourseCover'
import { cn } from '@/lib/cn'
import { dueLabel, formatMinutes } from '@/lib/format'
import type { LearnerTrail } from '@/types'

function hoursLabel(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : formatMinutes(Math.round(hours * 60))
}

/** Card de trilha em Meus Cursos: capas dos cursos, andamento e o que a trilha oferece. */
export function TrailCard({ trail, onOpen }: { trail: LearnerTrail; onOpen: () => void }) {
  const done = trail.status === 'concluido'
  return (
    <button
      type="button"
      onClick={onOpen}
      className="soaco-press group flex w-full flex-col gap-4 rounded-2xl border border-line bg-elevated p-4 text-left shadow-lg transition-colors hover:border-accent/40"
    >
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 -space-x-5">
          {trail.courses.slice(0, 3).map((course) => (
            <CourseCover
              key={course.id}
              accent={course.cover.accent}
              icon={course.cover.icon}
              image={course.cover.image}
              title={course.title}
              compact
              className="h-12 w-12 rounded-xl ring-2 ring-elevated"
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-display text-[11px] font-semibold tracking-wider text-accent uppercase">
            <Route size={13} /> Trilha
          </p>
          <h3 className="truncate font-display text-base font-semibold text-ink">{trail.title}</h3>
          <p className="truncate text-xs text-muted">
            {trail.courses.length} cursos · {hoursLabel(trail.durationHours)}
            {trail.mandatory && trail.dueDate && !done ? ` · ${dueLabel(trail.dueDate)}` : ''}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted">
            {trail.completedCount} de {trail.courses.length} concluídos
          </span>
          <span className={cn('font-display font-semibold', done ? 'text-accent-2' : 'text-ink')}>{trail.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className={cn('h-full rounded-full transition-[width] duration-500', done ? 'bg-accent-2' : 'bg-accent')}
            style={{ width: `${trail.progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {trail.sequential ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-[11px] font-medium text-muted">
            <ListOrdered size={12} /> Em sequência
          </span>
        ) : null}
        {trail.certificate.enabled ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              trail.certificate.code ? 'bg-accent-2/15 text-accent-2' : 'bg-fill text-muted',
            )}
          >
            <BadgeCheck size={12} /> {trail.certificate.code ? 'Certificado emitido' : 'Certificado ao concluir'}
          </span>
        ) : null}
      </div>
    </button>
  )
}
