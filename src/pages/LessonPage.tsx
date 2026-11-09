import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  CloudCheck,
  Download,
  GraduationCap,
  Medal,
  NotebookPen,
  Share2,
} from 'lucide-react'
import { CurriculumPanel } from '@/components/lesson/CurriculumPanel'
import { MediaHub, type MediaMode } from '@/components/lesson/MediaHub'
import {
  LessonWorkspace,
  type DiscussionPost,
  type LessonNote,
  type WorkspaceTab,
} from '@/components/lesson/LessonWorkspace'
import { useSessionUser } from '@/context/AuthContext'
import { useCatalog } from '@/context/CatalogContext'
import { useFeedback } from '@/context/FeedbackContext'
import { buildCurriculum, curriculumStats } from '@/data/curriculum'
import { instructorById } from '@/data/instructors'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Course, CourseModule, Lesson } from '@/types'

type LessonState = {
  doneIds: string[]
  currentLessonId: string | null
  notes: LessonNote[]
  posts: DiscussionPost[]
}

const seedPosts: DiscussionPost[] = [
  {
    id: 'post-seed-1',
    author: 'Camila Ferreira Santos',
    initials: 'CF',
    role: 'Analista de RH',
    text: 'O checklist apresentado nesta aula também vale para as áreas administrativas ou só para a produção?',
    when: 'há 3 horas',
  },
]

function applyState(base: CourseModule[], doneIds: string[]) {
  const doneSet = new Set(doneIds)
  return base.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({ ...lesson, done: lesson.done || doneSet.has(lesson.id) })),
  }))
}

function LessonView({ course }: { course: Course }) {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const user = useSessionUser()
  const instructor = instructorById[course.instructorId] ?? Object.values(instructorById)[0]
  const baseModules = useMemo(() => buildCurriculum(course), [course])

  const [state, setState] = useLocalStorageState<LessonState>(`universidade-soaco.lesson.${course.id}`, {
    doneIds: [],
    currentLessonId: null,
    notes: [],
    posts: seedPosts,
  })

  const modules = useMemo(() => applyState(baseModules, state.doneIds), [baseModules, state.doneIds])
  const stats = useMemo(() => curriculumStats(modules), [modules])
  const allLessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules])

  const currentLesson: Lesson | null =
    allLessons.find((lesson) => lesson.id === state.currentLessonId) ?? stats.currentLesson
  const currentModuleIndex = Math.max(
    0,
    modules.findIndex((module) => module.lessons.some((lesson) => lesson.id === currentLesson?.id)),
  )
  const currentModule = modules[currentModuleIndex]
  const pdfLesson = currentModule?.lessons.find((lesson) => lesson.kind === 'pdf') ?? null
  const lessonIndexInModule = currentModule
    ? currentModule.lessons.findIndex((lesson) => lesson.id === currentLesson?.id) + 1
    : 1

  const [mode, setMode] = useState<MediaMode>(
    course.contentKind === 'document' || currentLesson?.kind === 'pdf' ? 'pdf' : 'video',
  )
  const [tab, setTab] = useState<WorkspaceTab>('overview')
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)

  const selectLesson = useCallback(
    (lesson: Lesson) => {
      setState((value) => ({ ...value, currentLessonId: lesson.id }))
      setMode(lesson.kind === 'pdf' ? 'pdf' : 'video')
      setElapsed(0)
      setPlaying(false)
    },
    [setState],
  )

  const completeCurrent = useCallback(() => {
    if (!currentLesson) return
    const alreadyDone = currentLesson.done
    setState((value) => {
      const doneIds = alreadyDone
        ? value.doneIds.filter((id) => id !== currentLesson.id)
        : Array.from(new Set([...value.doneIds, currentLesson.id]))
      let nextId = value.currentLessonId
      if (!alreadyDone) {
        const index = allLessons.findIndex((lesson) => lesson.id === currentLesson.id)
        const next = allLessons.slice(index + 1).find((lesson) => !lesson.done)
        nextId = next?.id ?? currentLesson.id
      }
      return { ...value, doneIds, currentLessonId: nextId }
    })
    setElapsed(0)
    setPlaying(false)
    showToast(alreadyDone ? 'Conclusão desfeita.' : `Aula concluída! +${currentLesson.points ?? 25} pts`)
  }, [allLessons, currentLesson, setState, showToast])

  const onFinish = useCallback(() => {
    showToast('Vídeo finalizado. Marque a aula como concluída para avançar.')
  }, [showToast])

  const addNote = (text: string) => {
    setState((value) => ({
      ...value,
      notes: [{ id: `note-${Date.now()}`, time: formatClock(elapsed), text }, ...value.notes],
    }))
    showToast('Anotação salva.')
  }

  const deleteNote = (id: string) =>
    setState((value) => ({ ...value, notes: value.notes.filter((note) => note.id !== id) }))

  const publish = (text: string) => {
    setState((value) => ({
      ...value,
      posts: [
        {
          id: `post-${Date.now()}`,
          author: user.name,
          initials: user.initials,
          role: user.jobTitle,
          text,
          when: 'agora',
        },
        ...value.posts,
      ],
    }))
    showToast('Dúvida publicada para a turma.')
  }

  if (!currentLesson || !currentModule) return null

  const lessonPoints = currentLesson.points ?? 25

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col pb-12">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <nav className="flex flex-wrap items-center gap-2 font-display text-xs text-muted" aria-label="Navegação">
          <Link to="/conteudos" className="flex items-center gap-1 text-ink/80 transition-colors hover:text-accent">
            <GraduationCap size={16} className="text-accent" />
            <span>Meus Cursos</span>
          </Link>
          <span className="text-muted/60">/</span>
          <span className="max-w-[240px] truncate text-ink/80">{course.title}</span>
          <span className="text-muted/60">/</span>
          <span className="font-semibold text-ink">Módulo {currentModuleIndex + 1}</span>
        </nav>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 font-display text-[11px] font-semibold tracking-wide text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {course.category}
          </span>
          {course.mandatory ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1 font-display text-[11px] font-medium text-ink/80">
              <Award size={14} className="text-accent" />
              Obrigatório
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
            <MediaHub
              course={course}
              instructor={instructor}
              lesson={currentLesson}
              pdfLesson={pdfLesson}
              chapterLabel={`Aula ${lessonIndexInModule} de ${currentModule.lessons.length}`}
              mode={mode}
              onModeChange={setMode}
              elapsed={elapsed}
              onElapsedChange={setElapsed}
              playing={playing}
              onPlayingChange={setPlaying}
              onFinish={onFinish}
            />

            <div className="flex flex-col gap-4 border-t border-line bg-surface p-6">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div className="flex flex-col gap-1.5">
                  <h1 className="font-display text-2xl leading-snug font-bold tracking-tight text-ink lg:text-[28px]">
                    {currentLesson.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 font-display text-xs text-ink/80">
                    <span className="flex items-center gap-1">
                      <Clock3 size={16} className="text-accent" />
                      {currentLesson.kind === 'video'
                        ? `${currentLesson.durationMin} min`
                        : currentLesson.kind === 'pdf'
                          ? `${currentLesson.pages} páginas`
                          : `${currentLesson.questions} questões`}
                    </span>
                    <span className="text-muted/50">•</span>
                    <span className="flex items-center gap-1 font-semibold text-accent">
                      <Medal size={16} /> +{lessonPoints} pts
                    </span>
                    <span className="text-muted/50">•</span>
                    <span className="flex items-center gap-1">
                      <BadgeCheck size={16} className="text-accent" /> Certificação
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={completeCurrent}
                  className={cn(
                    'flex items-center gap-2 self-start rounded-xl px-4 py-3 font-display text-sm font-semibold shadow-lg transition-all active:scale-95 xl:self-center',
                    currentLesson.done
                      ? 'border border-emerald-500/40 bg-emerald-950 text-emerald-300'
                      : 'bg-accent text-accent-ink shadow-accent/20 hover:brightness-110',
                  )}
                >
                  <CheckCircle2 size={20} />
                  {currentLesson.done ? 'Aula concluída' : 'Concluir aula'}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Download do material iniciado.')}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-2 font-display text-xs text-ink/90 transition-colors hover:bg-fill"
                  >
                    <Download size={18} className="text-accent" /> Material (PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('notes')}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-2 font-display text-xs text-ink/90 transition-colors hover:bg-fill"
                  >
                    <NotebookPen size={18} className="text-accent" /> Notas
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href)
                        showToast('Link da aula copiado.')
                      } catch {
                        showToast('Não foi possível copiar o link.')
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-2 font-display text-xs text-ink/90 transition-colors hover:bg-fill"
                  >
                    <Share2 size={18} className="text-accent" /> Compartilhar
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <CloudCheck size={16} className="text-emerald-400" />
                  <span>Salvo automaticamente</span>
                </div>
              </div>
            </div>
          </div>

          <LessonWorkspace
            course={course}
            instructor={instructor}
            tab={tab}
            onTabChange={setTab}
            notes={state.notes}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            posts={state.posts}
            onPublish={publish}
            currentClock={formatClock(elapsed)}
          />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-4">
          <CurriculumPanel
            modules={modules}
            currentLessonId={currentLesson.id}
            playing={playing}
            onSelectLesson={selectLesson}
          />
          {stats.percent === 100 ? (
            <button
              type="button"
              onClick={() => navigate('/conteudos')}
              className="rounded-xl bg-accent px-4 py-3 font-display text-sm font-semibold text-accent-ink shadow-lg hover:bg-accent-strong"
            >
              Curso concluído · voltar aos meus cursos
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export function LessonPage() {
  const { courseId } = useParams()
  const { getCourse } = useCatalog()
  const course = courseId ? getCourse(courseId) : undefined
  if (!course) return <Navigate to="/conteudos" replace />
  return <LessonView key={course.id} course={course} />
}
