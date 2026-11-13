import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  BookOpenText,
  Check,
  ChevronDown,
  CircleDashed,
  ListChecks,
  Lock,
  PlayCircle,
  Route,
  Volume2,
} from 'lucide-react'
import { curriculumStats, isLessonLocked, isModuleLocked, moduleMinutes } from '@/data/curriculum'
import { formatMinutes } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CourseModule, Lesson } from '@/types'

type CurriculumPanelProps = {
  modules: CourseModule[]
  currentLessonId: string | null
  playing: boolean
  onSelectLesson: (lesson: Lesson, moduleIndex: number) => void
  /** Curso montado por etapas; `sequential` bloqueia o que vem depois de uma etapa pendente. */
  stages?: { sequential: boolean }
  /** false = o curso não emite certificado. */
  certificate?: boolean
}

function lessonMeta(lesson: Lesson) {
  if (lesson.stageId) {
    if (lesson.kind === 'video') return 'Vídeo'
    if (lesson.kind === 'quiz') return `Prova · ${lesson.questions ?? 0} ${lesson.questions === 1 ? 'pergunta' : 'perguntas'}`
    const count = lesson.documents?.length ?? 0
    return `${count} documento${count === 1 ? '' : 's'}`
  }
  if (lesson.kind === 'pdf') return `PDF · ${lesson.pages} páginas`
  if (lesson.kind === 'quiz') return `${lesson.questions} questões`
  return `${lesson.durationMin} min`
}

export function CurriculumPanel({
  modules,
  currentLessonId,
  playing,
  onSelectLesson,
  stages,
  certificate = true,
}: CurriculumPanelProps) {
  const stats = curriculumStats(modules)
  const sequential = stages?.sequential ?? false
  const lessonLocked = (lesson: Lesson) => sequential && isLessonLocked(modules, lesson.id)
  const moduleLocked = (moduleIndex: number) => {
    if (!stages) return isModuleLocked(modules, moduleIndex)
    const first = modules[moduleIndex].lessons[0]
    return Boolean(first) && lessonLocked(first)
  }
  // Sem entrada explícita, o módulo atual começa expandido; os demais, recolhidos.
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const isExpanded = (moduleId: string, moduleIndex: number) =>
    open[moduleId] ?? moduleIndex === stats.currentModuleIndex

  const toggle = (id: string, moduleIndex: number) =>
    setOpen((value) => ({ ...value, [id]: !isExpanded(id, moduleIndex) }))

  // Trilha de progresso: linha que liga os círculos e se preenche até onde o colaborador está.
  const trackRef = useRef<HTMLDivElement>(null)
  const moduleCircles = useRef(new Map<string, HTMLDivElement>())
  const lessonCircles = useRef(new Map<string, HTMLDivElement>())
  const [rail, setRail] = useState<{ x: number; top: number; height: number; fill: number } | null>(null)
  const [shownFill, setShownFill] = useState(0)
  const complete = stats.total > 0 && stats.done === stats.total
  const currentModuleId = modules[stats.currentModuleIndex]?.id
  const progressLessonId = complete ? null : (stats.currentLesson?.id ?? null)
  const lastModule = modules[modules.length - 1]

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track || modules.length === 0) return
    const origin = track.getBoundingClientRect()
    const center = (element: HTMLElement | undefined) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top + rect.height / 2 }
    }
    const start = center(moduleCircles.current.get(modules[0].id))
    // A trilha termina no último círculo visível (a última subetapa, se a última etapa estiver aberta).
    const endCandidates = [
      center(moduleCircles.current.get(lastModule.id)),
      ...lastModule.lessons.map((lesson) => center(lessonCircles.current.get(lesson.id))),
    ].filter((point): point is { x: number; y: number } => point !== null)
    const end = endCandidates.reduce<{ x: number; y: number } | null>((lowest, point) => (!lowest || point.y > lowest.y ? point : lowest), null)
    if (!start || !end || end.y - start.y < 1) {
      setRail(null)
      return
    }
    const target = complete
      ? end
      : ((progressLessonId ? center(lessonCircles.current.get(progressLessonId)) : null) ??
        (currentModuleId ? center(moduleCircles.current.get(currentModuleId)) : null) ??
        start)
    setRail({ x: start.x, top: start.y, height: end.y - start.y, fill: Math.min(end.y, Math.max(start.y, target.y)) - start.y })
  }, [complete, currentModuleId, lastModule, modules, progressLessonId])

  useLayoutEffect(() => {
    measure()
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(track)
    return () => observer.disconnect()
  }, [measure, open])

  // Começa vazia e anima até o progresso (também ao concluir uma etapa).
  const targetFill = rail?.fill ?? 0
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setShownFill(targetFill))
    return () => window.cancelAnimationFrame(frame)
  }, [targetFill])

  const circleRef = (kind: 'module' | 'lesson', id: string) => (element: HTMLDivElement | null) => {
    const map = (kind === 'module' ? moduleCircles : lessonCircles).current
    if (element) map.set(id, element)
    else map.delete(id)
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
      <div className="flex flex-col gap-2 border-b border-line bg-elevated p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route size={22} className="text-accent" />
            <span className="font-display text-base font-bold text-ink">Conteúdo</span>
          </div>
          <span className="rounded-full border border-accent/30 bg-fill px-2.5 py-0.5 font-display text-[11px] font-semibold text-accent">
            {modules.length} {stages ? (modules.length === 1 ? 'etapa' : 'etapas') : 'módulos'}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-display text-xs">
            <span className="font-medium text-muted">Progresso</span>
            <span className="font-bold text-accent">
              {stats.done}/{stats.total} {stages ? 'concluídas' : 'aulas'}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-line/60 bg-fill">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong shadow-[0_0_8px_var(--soaco-accent)] transition-all duration-500"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="mt-0.5 flex items-center justify-between font-display text-[11px] text-muted">
            <span>{stats.remaining} restantes</span>
            {certificate ? (
              <span className="flex items-center gap-1 font-semibold text-accent">
                {stats.percent === 100 ? <Check size={13} /> : <Lock size={13} />}
                {stats.percent === 100 ? 'Certificado liberado' : 'Certificado em 100%'}
              </span>
            ) : (
              <span className="font-semibold">{stats.percent === 100 ? 'Curso concluído' : 'Sem certificado'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
        <div ref={trackRef} className="relative">
          {rail ? (
            <div
              aria-hidden
              className="pointer-events-none absolute z-[1] w-0.5 -translate-x-1/2 rounded-full bg-line"
              style={{ left: rail.x, top: rail.top, height: rail.height }}
            >
              <div
                className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-emerald-400 to-accent shadow-[0_0_10px_var(--soaco-accent)] transition-[height] duration-700 ease-out motion-reduce:transition-none"
                style={{ height: shownFill }}
              />
              {!complete ? (
                <span
                  className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_var(--soaco-accent)] transition-[top] duration-700 ease-out motion-safe:animate-pulse motion-reduce:transition-none"
                  style={{ top: shownFill }}
                />
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col divide-y divide-line">
            {modules.map((module, moduleIndex) => {
              const done = module.lessons.every((lesson) => lesson.done)
              const locked = moduleLocked(moduleIndex)
              const current = moduleIndex === stats.currentModuleIndex && !done
              const expanded = isExpanded(module.id, moduleIndex)
              const minutes = moduleMinutes(module)
              const videoCount = module.lessons.filter((lesson) => lesson.kind === 'video').length

              return (
                <div key={module.id} className={cn(current ? 'bg-fill/40' : 'bg-surface/60')}>
                  <button
                    type="button"
                    onClick={() => toggle(module.id, moduleIndex)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between py-4 pr-4 pl-[21px] text-left transition-colors hover:bg-fill/50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        ref={circleRef('module', module.id)}
                        className={cn(
                          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                          done
                            ? 'border-emerald-500/40 bg-emerald-950 text-emerald-400'
                            : current
                              ? 'border-accent/40 bg-accent/20 text-accent'
                              : 'border-line bg-fill text-muted',
                        )}
                      >
                        {done ? <Check size={15} strokeWidth={3} /> : locked ? <Lock size={13} /> : <CircleDashed size={15} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn('font-display text-sm font-semibold', current ? 'font-bold text-accent' : 'text-ink')}>
                          {module.title}
                        </span>
                        <span className={cn('font-display text-[11px]', done ? 'font-semibold text-emerald-400' : 'text-muted')}>
                          {stages
                            ? module.lessons.length > 1
                              ? `${module.lessons.length} subetapas`
                              : lessonMeta(module.lessons[0])
                            : `${videoCount} aulas · ${formatMinutes(minutes)}`}
                        </span>
                      </div>
                    </div>
                    <ChevronDown size={20} className={cn('transition-transform', expanded && 'rotate-180', current ? 'text-accent' : 'text-muted')} />
                  </button>

                  {expanded ? (
                    locked ? (
                      <div className="px-4 pb-4 pl-11 text-xs text-muted">
                        {stages
                          ? 'Liberada após concluir a etapa anterior.'
                          : 'Liberação automática após concluir o módulo anterior.'}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 pr-4 pb-4 pl-3">
                        {module.lessons.map((lesson) => {
                          const active = lesson.id === currentLessonId
                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => onSelectLesson(lesson, moduleIndex)}
                              className={cn(
                                'group relative flex w-full items-start gap-3 rounded-lg border p-2 text-left transition-colors',
                                active ? 'my-1 border-accent/50 bg-elevated shadow-md' : 'border-transparent hover:bg-elevated/60',
                              )}
                            >
                              <div
                                ref={circleRef('lesson', lesson.id)}
                                className={cn(
                                  'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                                  active
                                    ? 'border-transparent bg-accent text-accent-ink ring-4 ring-accent/20'
                                    : lesson.done
                                      ? 'border-emerald-500/50 bg-emerald-950 text-emerald-400'
                                      : 'border-line bg-fill text-muted',
                                )}
                              >
                                {active ? (
                                  <Volume2 size={14} className={cn(playing && 'animate-pulse')} />
                                ) : lesson.done ? (
                                  <Check size={13} strokeWidth={3} />
                                ) : lessonLocked(lesson) ? (
                                  <Lock size={12} />
                                ) : lesson.kind === 'pdf' ? (
                                  <BookOpenText size={13} />
                                ) : lesson.kind === 'quiz' ? (
                                  <ListChecks size={13} />
                                ) : (
                                  <PlayCircle size={13} />
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span
                                  className={cn(
                                    'truncate font-display text-xs transition-colors',
                                    active ? 'font-bold text-ink' : lesson.done ? 'text-ink' : 'text-muted group-hover:text-accent',
                                  )}
                                >
                                  {lesson.title}
                                </span>
                                <div className="mt-0.5 flex items-center gap-2 font-display text-[11px] text-muted">
                                  {active ? (
                                    <span className="flex items-center gap-1 font-semibold text-accent">
                                      <span className={cn('h-1.5 w-1.5 rounded-full bg-accent', playing && 'animate-ping')} />
                                      {playing ? 'Reproduzindo agora' : stages ? 'Etapa atual' : 'Aula atual'}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      {lesson.kind === 'video' ? <PlayCircle size={12} className="text-accent" /> : null}
                                      {lessonMeta(lesson)}
                                    </span>
                                  )}
                                  <span>·</span>
                                  {lesson.done ? (
                                    <span className="font-semibold text-emerald-400">Concluído</span>
                                  ) : lessonLocked(lesson) ? (
                                    <span>Bloqueada</span>
                                  ) : lesson.kind === 'quiz' && lesson.stageId ? (
                                    <span className="font-semibold text-accent">
                                      {lesson.examResult ? `Melhor nota ${lesson.examResult.bestScore}%` : `Aprovação ${lesson.exam?.passingScore ?? 70}%`}
                                    </span>
                                  ) : lesson.kind === 'quiz' ? (
                                    <span className="font-semibold text-accent">+{lesson.points} pts</span>
                                  ) : lesson.mandatory ? (
                                    <span>Obrigatória</span>
                                  ) : active ? (
                                    <span>{lessonMeta(lesson)}</span>
                                  ) : (
                                    <span>Pendente</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
