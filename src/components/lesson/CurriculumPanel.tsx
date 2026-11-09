import { useState } from 'react'
import {
  BookOpenText,
  Check,
  ChevronDown,
  CircleDashed,
  Download,
  Headset,
  ListChecks,
  Lock,
  PlayCircle,
  Route,
  Volume2,
} from 'lucide-react'
import { useFeedback } from '@/context/FeedbackContext'
import { classMonitor } from '@/data/instructors'
import { curriculumStats, isModuleLocked, moduleMinutes } from '@/data/curriculum'
import { formatMinutes } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CourseModule, Lesson } from '@/types'

type CurriculumPanelProps = {
  modules: CourseModule[]
  currentLessonId: string | null
  playing: boolean
  onSelectLesson: (lesson: Lesson, moduleIndex: number) => void
}

function lessonMeta(lesson: Lesson) {
  if (lesson.kind === 'pdf') return `PDF · ${lesson.pages} páginas`
  if (lesson.kind === 'quiz') return `${lesson.questions} questões`
  return `${lesson.durationMin} min`
}

export function CurriculumPanel({ modules, currentLessonId, playing, onSelectLesson }: CurriculumPanelProps) {
  const { showComingSoon, showToast } = useFeedback()
  const stats = curriculumStats(modules)
  // Sem entrada explícita, o módulo atual começa expandido; os demais, recolhidos.
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const isExpanded = (moduleId: string, moduleIndex: number) =>
    open[moduleId] ?? moduleIndex === stats.currentModuleIndex

  const toggle = (id: string, moduleIndex: number) =>
    setOpen((value) => ({ ...value, [id]: !isExpanded(id, moduleIndex) }))

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
      <div className="flex flex-col gap-2 border-b border-line bg-elevated p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route size={22} className="text-accent" />
            <span className="font-display text-base font-bold text-ink">Conteúdo</span>
          </div>
          <span className="rounded-full border border-accent/30 bg-fill px-2.5 py-0.5 font-display text-[11px] font-semibold text-accent">
            {modules.length} módulos
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-display text-xs">
            <span className="font-medium text-muted">Progresso</span>
            <span className="font-bold text-accent">
              {stats.done}/{stats.total} aulas
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
            <span className="flex items-center gap-1 font-semibold text-accent">
              {stats.percent === 100 ? <Check size={13} /> : <Lock size={13} />}
              {stats.percent === 100 ? 'Certificado liberado' : 'Certificado em 100%'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex max-h-[calc(100vh-320px)] flex-col divide-y divide-line overflow-y-auto">
        {modules.map((module, moduleIndex) => {
          const done = module.lessons.every((lesson) => lesson.done)
          const locked = isModuleLocked(modules, moduleIndex)
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
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-fill/50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
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
                      {videoCount} aulas · {formatMinutes(minutes)}
                    </span>
                  </div>
                </div>
                <ChevronDown size={20} className={cn('transition-transform', expanded && 'rotate-180', current ? 'text-accent' : 'text-muted')} />
              </button>

              {expanded ? (
                locked ? (
                  <div className="px-4 pb-4 pl-11 text-xs text-muted">
                    Liberação automática após concluir o módulo anterior.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 px-4 pb-4">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const active = lesson.id === currentLessonId
                      const last = lessonIndex === module.lessons.length - 1
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => onSelectLesson(lesson, moduleIndex)}
                          className={cn(
                            'group relative flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors',
                            active ? 'my-1 border border-accent/50 bg-elevated p-2.5 shadow-md' : 'hover:bg-elevated/60',
                          )}
                        >
                          {!last ? (
                            <div className={cn('absolute top-7 bottom-0 left-5 w-0.5', lesson.done ? 'bg-emerald-500/40' : 'bg-line')} />
                          ) : null}
                          <div
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
                                  {playing ? 'Reproduzindo agora' : 'Aula atual'}
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

      <div className="flex flex-col gap-2 border-t border-line bg-elevated p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headset size={20} className="text-accent" />
            <span className="font-display text-xs font-semibold text-ink">Monitor da turma</span>
          </div>
          <span
            className={cn('h-2.5 w-2.5 rounded-full', classMonitor.online ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-muted')}
            title={classMonitor.online ? 'Monitor online' : 'Monitor offline'}
          />
        </div>
        <p className="text-xs text-muted">
          Dúvidas sobre a plataforma ou avaliações? Fale com {classMonitor.name}.
        </p>
        <div className="flex items-center gap-2 pt-1.5">
          <button
            type="button"
            onClick={() => showComingSoon('Falar com o monitor', 'O chat com o monitor da turma será integrado na próxima fase.')}
            className="flex-1 rounded-lg border border-line bg-fill py-2 text-center font-display text-xs font-semibold text-ink transition-colors hover:brightness-110"
          >
            Falar com monitor
          </button>
          <button
            type="button"
            title="Baixar plano de ensino"
            onClick={() => showToast('Plano de ensino enviado para o seu e-mail.')}
            className="rounded-lg border border-line bg-fill p-2 text-accent transition-colors hover:brightness-110"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
