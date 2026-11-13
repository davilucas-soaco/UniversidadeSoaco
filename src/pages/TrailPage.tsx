import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, CheckCircle2, ChevronRight, Clock3, GraduationCap, ListOrdered, Lock, PlayCircle, Route } from 'lucide-react'
import { CertificateModal } from '@/components/certificates/CertificateModal'
import { CourseCover } from '@/components/content/CourseCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useSessionUser } from '@/context/AuthContext'
import { useFeedback } from '@/context/FeedbackContext'
import { useTrails } from '@/hooks/useTrails'
import { trailCertificateFor, type CertificateData } from '@/lib/certificate'
import { cn } from '@/lib/cn'
import { dueLabel, formatDate, formatMinutes } from '@/lib/format'
import type { LearnerTrail } from '@/types'

type TrailCourse = LearnerTrail['courses'][number]

function hoursLabel(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : formatMinutes(Math.round(hours * 60))
}

function actionLabel(course: TrailCourse) {
  if (course.lockedBy) return 'Bloqueado'
  if (course.status === 'concluido') return 'Revisar'
  if (course.status === 'em_andamento') return 'Continuar'
  return 'Começar'
}

function StatusLine({ course }: { course: TrailCourse }) {
  if (course.lockedBy) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Lock size={13} /> Libera ao concluir "{course.lockedBy.courseTitle}"
      </span>
    )
  }
  if (course.status === 'concluido') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-2">
        <CheckCircle2 size={13} /> Concluído
      </span>
    )
  }
  if (course.status === 'em_andamento') {
    return <span className="text-xs font-semibold text-accent">{course.progress}% concluído</span>
  }
  return <span className="text-xs text-muted">Disponível</span>
}

/** Trilha do colaborador (rota /trilha/:trailId): cursos em ordem, andamento e certificado. */
export function TrailPage() {
  const { trailId } = useParams()
  const navigate = useNavigate()
  const user = useSessionUser()
  const { showToast } = useFeedback()
  const { trails, ready } = useTrails()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const trail = trails.find((item) => item.id === trailId)

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!trail) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted">Esta trilha não foi encontrada ou não está destinada a você.</p>
        <Button variant="secondary" onClick={() => navigate('/conteudos')}>
          Voltar para Meus Cursos
        </Button>
      </div>
    )
  }

  const done = trail.status === 'concluido'
  const issued = trailCertificateFor(trail, user.name)
  const next = trail.courses.find((course) => course.status !== 'concluido' && !course.lockedBy)

  const openCourse = (course: TrailCourse) => {
    if (course.lockedBy) {
      showToast(`Conclua antes "${course.lockedBy.courseTitle}" para liberar este curso.`)
      return
    }
    navigate(`/aula/${course.id}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col pb-12">
      <nav className="mb-4 flex flex-wrap items-center gap-2 font-display text-xs text-muted" aria-label="Navegação">
        <Link to="/conteudos" className="flex items-center gap-1 text-ink/80 transition-colors hover:text-accent">
          <GraduationCap size={16} className="text-accent" />
          <span>Meus Cursos</span>
        </Link>
        <span className="text-muted/60">/</span>
        <span className="max-w-[320px] truncate font-semibold text-ink">{trail.title}</span>
      </nav>

      <Card data-tour="trail-hero" className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="flex items-center gap-1.5 font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
              <Route size={14} /> Trilha de cursos
            </p>
            <h1 className="mt-2 font-display text-[28px] leading-tight font-bold tracking-tight text-ink sm:text-[32px]">
              {trail.title}
            </h1>
            {trail.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{trail.description}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink/80">
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle size={15} className="text-accent" /> {trail.courses.length} cursos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={15} className="text-accent" /> {hoursLabel(trail.durationHours)} no total
              </span>
              {trail.sequential ? (
                <span className="inline-flex items-center gap-1.5">
                  <ListOrdered size={15} className="text-accent" /> Em sequência
                </span>
              ) : null}
              {trail.mandatory ? (
                <span className="font-semibold text-[#ff6b6b]">
                  Obrigatória{trail.dueDate && !done ? ` · ${dueLabel(trail.dueDate)}` : ''}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted">
                  {trail.completedCount} de {trail.courses.length} concluídos
                </span>
                <span className={cn('font-display font-semibold', done ? 'text-accent-2' : 'text-ink')}>{trail.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500', done ? 'bg-accent-2' : 'bg-accent')}
                  style={{ width: `${trail.progress}%` }}
                />
              </div>
            </div>
            {issued ? (
              <Button icon={<BadgeCheck size={16} />} onClick={() => setCertificate(issued)}>
                Ver certificado da trilha
              </Button>
            ) : next ? (
              <Button icon={<PlayCircle size={16} />} onClick={() => navigate(`/aula/${next.id}`)}>
                {next.status === 'em_andamento' ? 'Continuar trilha' : 'Começar próximo curso'}
              </Button>
            ) : null}
            {trail.certificate.enabled && !issued ? (
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <BadgeCheck size={13} /> Certificado ao concluir todos os cursos
              </p>
            ) : issued ? (
              <p className="text-center text-xs text-muted">Concluída em {formatDate(issued.issuedAt)}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <ol data-tour="trail-courses-list" className="flex flex-col">
        {trail.courses.map((course, index) => {
          const last = index === trail.courses.length - 1
          const concluded = course.status === 'concluido'
          return (
            <li key={course.id} className="relative flex gap-4 pb-4 last:pb-0">
              {!last ? (
                <span
                  aria-hidden
                  className={cn('absolute top-10 bottom-0 left-[19px] w-0.5', concluded ? 'bg-accent-2' : 'bg-line')}
                />
              ) : null}
              <span
                className={cn(
                  'relative z-10 mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold',
                  concluded
                    ? 'border-accent-2 bg-accent-2 text-white'
                    : course.lockedBy
                      ? 'border-line bg-surface text-muted'
                      : 'border-accent bg-elevated text-accent',
                )}
              >
                {concluded ? <CheckCircle2 size={18} /> : course.lockedBy ? <Lock size={16} /> : index + 1}
              </span>

              <button
                type="button"
                onClick={() => openCourse(course)}
                className={cn(
                  'soaco-press group flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-line bg-elevated p-3 pr-4 text-left shadow-card transition-colors',
                  course.lockedBy ? 'cursor-not-allowed opacity-70' : 'hover:border-accent/40',
                )}
              >
                <CourseCover
                  accent={course.cover.accent}
                  icon={course.cover.icon}
                  image={course.cover.image}
                  title={course.title}
                  compact
                  className={cn('h-16 w-28 shrink-0 rounded-xl', course.lockedBy && 'grayscale')}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                    Curso {index + 1} · {course.category}
                  </p>
                  <p className="truncate font-display text-sm font-semibold text-ink sm:text-base">{course.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-muted">{hoursLabel(course.durationHours)}</span>
                    <StatusLine course={course} />
                  </div>
                  {course.status === 'em_andamento' ? (
                    <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${course.progress}%` }} />
                    </div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'hidden shrink-0 items-center gap-1 font-display text-xs font-semibold sm:inline-flex',
                    course.lockedBy ? 'text-muted' : 'text-accent',
                  )}
                >
                  {actionLabel(course)}
                  {course.lockedBy ? null : <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <CertificateModal data={certificate} onClose={() => setCertificate(null)} />
    </div>
  )
}
