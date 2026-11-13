import { Play } from 'lucide-react'
import { CourseCover } from '@/components/content/CourseCover'
import { daysUntil, dueLabel, formatMinutes } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Course } from '@/types'

function ctaFor(course: Course) {
  if (course.status === 'concluido') return course.certificate?.code ? 'Certificado ou revisar' : 'Revisar'
  if (course.status === 'pendente') return 'Assistir'
  return 'Continuar'
}

function durationLabel(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : formatMinutes(Math.round(hours * 60))
}

function CoverBadge({ course }: { course: Course }) {
  const urgent = Boolean(
    course.mandatory && course.dueDate && course.status !== 'concluido' && daysUntil(course.dueDate) <= 7,
  )

  if (urgent && course.dueDate) {
    return (
      <span className="rounded bg-[#93000a] px-2 py-0.5 font-display text-[10px] font-bold tracking-wide text-[#ffdad6] uppercase">
        {dueLabel(course.dueDate)}
      </span>
    )
  }

  if (course.isNew && course.status !== 'concluido') {
    return (
      <span className="rounded bg-accent px-2 py-0.5 font-display text-[10px] font-bold tracking-wide text-accent-ink uppercase">
        Novo
      </span>
    )
  }

  return null
}

export function CourseCard({
  course,
  view = 'grid',
  onOpen,
}: {
  course: Course
  view?: 'grid' | 'list'
  onOpen: () => void
}) {
  const meta = `${durationLabel(course.durationHours)} · ${ctaFor(course)}`
  const barClass = course.status === 'concluido' ? 'bg-accent-2' : 'bg-accent'

  if (view === 'list') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="soaco-press group flex w-full items-center gap-4 rounded-xl p-1.5 text-left hover:bg-fill/70"
      >
        <div className="relative h-[74px] w-[132px] shrink-0 overflow-hidden rounded-lg">
          <CourseCover
            accent={course.cover.accent}
            icon={course.cover.icon}
            image={course.cover.image}
            title={course.title}
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow">
              <Play size={14} fill="currentColor" className="ml-px" />
            </span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-sm font-semibold text-ink">{course.title}</h3>
            <CoverBadge course={course} />
          </div>
          <p className="mt-0.5 text-xs text-muted">{meta}</p>
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line">
            <div className={cn('h-full rounded-full', barClass)} style={{ width: `${course.progress}%` }} />
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-xl text-left outline-none transition duration-300 hover:z-10 hover:scale-[1.04] hover:shadow-[0_20px_44px_-18px_rgba(0,0,0,0.72)] focus-visible:ring-2 focus-visible:ring-accent active:scale-[1.01] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-fill">
        <CourseCover
          accent={course.cover.accent}
          icon={course.cover.icon}
          image={course.cover.image}
          title={course.title}
          className="h-full w-full transition duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />

        <div className="absolute top-2.5 left-2.5">
          <CoverBadge course={course} />
        </div>

        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg">
            <Play size={22} fill="currentColor" className="ml-0.5" />
          </span>
        </span>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-2 font-display text-sm leading-snug font-semibold text-white drop-shadow">
            {course.title}
          </h3>
          <p className="mt-1 h-0 overflow-hidden text-[11px] text-white/75 opacity-0 transition-all duration-300 group-hover:h-4 group-hover:opacity-100">
            {meta}
          </p>
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/20">
            <div className={cn('h-full rounded-full', barClass)} style={{ width: `${course.progress}%` }} />
          </div>
        </div>
      </div>
    </button>
  )
}
