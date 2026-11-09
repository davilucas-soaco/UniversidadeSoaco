import { useNavigate } from 'react-router-dom'
import { Compass, Play } from 'lucide-react'
import { continueLearningCourses } from '@/data/courses'
import { dashboardStats } from '@/data/dashboard'
import { useOnboarding } from '@/context/OnboardingContext'
import { useProfile } from '@/context/ProfileContext'
import { MascotViewport } from './MascotViewport'

export function HeroBanner() {
  const navigate = useNavigate()
  const { start } = useOnboarding()
  const { firstName } = useProfile()
  const nextCourse = continueLearningCourses[0]
  const percent = dashboardStats.quarterProgress

  return (
    <section
      id="tour-welcome"
      className="relative mb-8 w-full overflow-hidden rounded-2xl border border-line bg-elevated p-6 text-ink shadow-card sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -top-12 -right-8 h-[420px] w-[420px] text-accent/25 lg:h-[480px] lg:w-[480px]"
          fill="none"
          viewBox="0 0 400 400"
          aria-hidden
        >
          <polygon points="200,30 350,115 350,285 200,370 50,285 50,115" stroke="currentColor" strokeWidth="2.5" />
          <polygon
            points="200,70 310,135 310,265 200,330 90,265 90,135"
            stroke="currentColor"
            strokeDasharray="6 6"
            strokeWidth="1.5"
          />
          <line stroke="currentColor" strokeWidth="1.5" x1="200" x2="200" y1="30" y2="370" />
          <line stroke="currentColor" strokeWidth="1.5" x1="50" x2="350" y1="200" y2="200" />
        </svg>
        <div className="absolute top-0 left-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-10 bottom-0 h-64 w-64 rounded-full bg-accent-strong/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-col lg:max-w-lg lg:flex-1">
          <div className="hidden lg:block lg:flex-1" aria-hidden />
          <div className="flex flex-col">
            <div className="mb-3 inline-flex w-max items-center gap-2 rounded-full border border-accent/20 bg-fill px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="font-display text-[11px] font-semibold tracking-wider text-accent uppercase">
                Plano trimestral
              </span>
            </div>
            <h1 className="mb-2 font-display text-[26px] leading-[1.12] font-bold tracking-[-0.022em] text-ink sm:text-[32px]">
              Olá, {firstName}. Continue evoluindo.
            </h1>
            <p className="text-base leading-relaxed text-muted">
              Você completou <strong className="font-semibold text-accent">{percent}%</strong> da meta trimestral.
              Faltam {dashboardStats.quarterRemaining} cursos.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 lg:mt-0 lg:flex-1 lg:items-end">
            <button
              type="button"
              onClick={() => navigate(nextCourse ? `/aula/${nextCourse.id}` : '/conteudos')}
              className="soaco-press group flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-6 py-3 font-display text-sm font-semibold text-accent-ink shadow-lg shadow-accent/25 hover:bg-accent-strong hover:shadow-xl"
            >
              <Play size={18} fill="currentColor" className="transition-transform group-hover:scale-110" />
              <span>Continuar curso</span>
            </button>
            <button
              type="button"
              onClick={start}
              className="soaco-press flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-fill px-4 py-3 font-display text-sm font-semibold text-ink hover:border-accent/40 hover:bg-elevated"
            >
              <Compass size={18} className="text-accent" />
              <span>Tour guiado</span>
            </button>
          </div>
        </div>

        <MascotViewport className="self-end" />
      </div>
    </section>
  )
}
