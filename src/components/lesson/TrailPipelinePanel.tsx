import type { ReactNode } from 'react'
import { ArrowRight, Check, ChevronRight, Lock, Milestone, Printer } from 'lucide-react'
import type { CertificateData } from '@/lib/certificate'
import { cn } from '@/lib/cn'
import type { CourseStatus, LearnerTrail } from '@/types'

type TrailCourse = LearnerTrail['courses'][number]

function statusText(status: CourseStatus, progress: number, locked: boolean) {
  if (status === 'concluido') return 'Concluído'
  if (locked) return 'Bloqueado'
  if (status === 'em_andamento') return `${progress}% concluído`
  return 'Disponível'
}

/**
 * Pipeline da trilha na aula: cada curso é uma etapa da trilha; o curso aberto se expande com
 * as etapas dele (`children`). Cursos concluídos com certificado liberado mostram "Imprimir certificado".
 */
export function TrailPipelinePanel({
  trail,
  current,
  next,
  children,
  certificateOf,
  onOpenCourse,
  onNext,
  onOpenTrail,
  onCertificate,
}: {
  trail: LearnerTrail
  /** Estado ao vivo do curso aberto (a lista da trilha pode estar um passo atrás). */
  current: { id: string; status: CourseStatus; progress: number; summary: string }
  next: { id: string; title: string } | null
  children: ReactNode
  certificateOf: (course: TrailCourse) => CertificateData | null
  onOpenCourse: (course: TrailCourse) => void
  onNext: (courseId: string) => void
  onOpenTrail: () => void
  onCertificate: (data: CertificateData) => void
}) {
  const courses = trail.courses.map((course) =>
    course.id === current.id ? { ...course, status: current.status, progress: current.progress } : course,
  )
  const completed = courses.filter((course) => course.status === 'concluido').length
  const percent = courses.length
    ? Math.round(courses.reduce((total, course) => total + (course.status === 'concluido' ? 100 : course.progress), 0) / courses.length)
    : 0
  const position = courses.findIndex((course) => course.id === current.id) + 1

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
      <div className="flex flex-col gap-2 border-b border-line bg-elevated p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Milestone size={20} className="shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="font-display text-[11px] font-semibold tracking-wider text-muted uppercase">Trilha</p>
              <p className="truncate font-display text-sm font-bold text-ink">{trail.title}</p>
            </div>
          </div>
          {position > 0 ? (
            <span className="shrink-0 rounded-full border border-accent/30 bg-fill px-2.5 py-0.5 font-display text-[11px] font-semibold text-accent">
              Curso {position} de {courses.length}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-display text-xs">
            <span className="font-medium text-muted">
              {completed}/{courses.length} cursos concluídos
            </span>
            <span className="font-bold text-accent">{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-line/60 bg-fill">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <ol className="flex max-h-[calc(100vh-260px)] flex-col overflow-y-auto p-2">
        {courses.map((course, index) => {
          const isCurrent = course.id === current.id
          const done = course.status === 'concluido'
          const locked = Boolean(course.lockedBy) && !done
          const last = index === courses.length - 1
          const certificate = done ? certificateOf(course) : null
          return (
            <li key={course.id} className="relative">
              {!last ? (
                <span
                  aria-hidden
                  className={cn('absolute top-10 bottom-0 left-[22px] w-0.5 rounded-full', done ? 'bg-emerald-400' : 'bg-line')}
                />
              ) : null}

              <button
                type="button"
                onClick={() => onOpenCourse(course)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors',
                  isCurrent ? 'bg-accent/10' : locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-fill',
                )}
              >
                <span
                  className={cn(
                    'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-display text-[11px] font-bold',
                    done
                      ? 'border-emerald-400 bg-emerald-400 text-emerald-950'
                      : isCurrent
                        ? 'border-accent bg-accent text-accent-ink'
                        : locked
                          ? 'border-line bg-surface text-muted'
                          : 'border-accent/60 bg-surface text-accent',
                  )}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : locked ? <Lock size={12} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', isCurrent ? 'font-bold text-ink' : 'font-medium text-ink/90')}>
                    {course.title}
                  </span>
                  <span
                    className={cn(
                      'block text-[11px]',
                      isCurrent ? 'font-semibold text-accent' : done ? 'text-emerald-400' : 'text-muted',
                    )}
                  >
                    {isCurrent ? `Você está aqui · ${current.summary}` : statusText(course.status, course.progress, locked)}
                  </span>
                </span>
                {!isCurrent && !locked ? <ChevronRight size={15} className="shrink-0 text-muted" /> : null}
              </button>

              {isCurrent || certificate ? (
                <div className="flex flex-col gap-2 pb-2 pl-10">
                  {isCurrent ? <div data-tour="lesson-curriculum">{children}</div> : null}
                  {certificate ? (
                    <button
                      type="button"
                      onClick={() => onCertificate(certificate)}
                      className="soaco-press inline-flex w-fit items-center gap-1.5 rounded-lg border border-accent-2/40 bg-accent-2/10 px-3 py-1.5 font-display text-xs font-semibold text-accent-2 transition hover:bg-accent-2/20"
                    >
                      <Printer size={14} /> Imprimir certificado
                    </button>
                  ) : null}
                  {isCurrent && done && next ? (
                    <button
                      type="button"
                      onClick={() => onNext(next.id)}
                      className="soaco-press mr-2 flex items-center gap-3 rounded-xl bg-accent px-3 py-2.5 text-left text-accent-ink shadow-lg shadow-accent/20 transition hover:bg-accent-strong"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-xs font-semibold">Continuar para o próximo curso</span>
                        <span className="block truncate text-[11px] opacity-85">{next.title}</span>
                      </span>
                      <ArrowRight size={16} className="shrink-0" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={onOpenTrail}
        className="border-t border-line px-4 py-2.5 text-center font-display text-xs font-semibold text-accent transition-colors hover:bg-fill"
      >
        Ver a trilha completa
      </button>
    </div>
  )
}
