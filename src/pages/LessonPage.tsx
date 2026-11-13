import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { CertificateModal } from '@/components/certificates/CertificateModal'
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
import { buildCurriculum, curriculumStats, isLessonLocked } from '@/data/curriculum'
import { instructorById } from '@/data/instructors'
import { Spinner } from '@/components/ui/Spinner'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { api } from '@/lib/api'
import { certificateFor } from '@/lib/certificate'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Course, CourseModule, ExamSubmitResult, Lesson } from '@/types'

type LessonState = {
  doneIds: string[]
  currentLessonId: string | null
  notes: LessonNote[]
  posts: DiscussionPost[]
}

/** Comentários de exemplo das versões antigas ficaram gravados no navegador; não são mostrados. */
const isSamplePost = (post: DiscussionPost) => post.id.startsWith('post-seed')

function applyState(base: CourseModule[], doneIds: string[]) {
  const doneSet = new Set(doneIds)
  return base.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({ ...lesson, done: lesson.done || doneSet.has(lesson.id) })),
  }))
}

function LessonView({ course: initialCourse }: { course: Course }) {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { reload: reloadCatalog } = useCatalog()
  const user = useSessionUser()
  // Depois de concluir uma etapa, a API devolve o curso atualizado (progresso e etapas concluídas).
  const [updatedCourse, setUpdatedCourse] = useState<Course | null>(null)
  const course = updatedCourse ?? initialCourse
  const staged = Boolean(course.stages?.length)
  const sequential = staged && Boolean(course.sequential)
  const instructor = instructorById[course.instructorId] ?? Object.values(instructorById)[0]
  const baseModules = useMemo(() => buildCurriculum(course), [course])
  const [completing, setCompleting] = useState(false)
  const [certificateOpen, setCertificateOpen] = useState(false)
  const certificate = certificateFor(course, user.name)

  const [state, setState] = useLocalStorageState<LessonState>(`universidade-soaco.lesson.${course.id}`, {
    doneIds: [],
    currentLessonId: null,
    notes: [],
    posts: [],
  })
  const posts = useMemo(() => state.posts.filter((post) => !isSamplePost(post)), [state.posts])

  const modules = useMemo(
    () => (staged ? baseModules : applyState(baseModules, state.doneIds)),
    [baseModules, staged, state.doneIds],
  )
  const stats = useMemo(() => curriculumStats(modules), [modules])
  const allLessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules])
  const locked = useCallback((lesson: Lesson) => sequential && isLessonLocked(modules, lesson.id), [modules, sequential])

  const remembered = allLessons.find((lesson) => lesson.id === state.currentLessonId)
  const currentLesson: Lesson | null = remembered && !locked(remembered) ? remembered : stats.currentLesson
  const currentModuleIndex = Math.max(
    0,
    modules.findIndex((module) => module.lessons.some((lesson) => lesson.id === currentLesson?.id)),
  )
  const currentModule = modules[currentModuleIndex]
  const pdfLesson = currentModule?.lessons.find((lesson) => lesson.kind === 'pdf') ?? null
  const lessonIndexInModule = currentModule
    ? currentModule.lessons.findIndex((lesson) => lesson.id === currentLesson?.id) + 1
    : 1

  const [chosenMode, setMode] = useState<MediaMode>(
    course.contentKind === 'document' || currentLesson?.kind === 'pdf' ? 'pdf' : 'video',
  )
  // Etapa tem um tipo só de conteúdo: o modo acompanha a etapa atual.
  const mode: MediaMode = staged && currentLesson ? (currentLesson.kind === 'pdf' ? 'pdf' : 'video') : chosenMode
  const [tab, setTab] = useState<WorkspaceTab>('overview')
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)

  const selectLesson = useCallback(
    (lesson: Lesson) => {
      if (locked(lesson)) {
        showToast('Conclua as etapas anteriores para liberar esta.')
        return
      }
      setState((value) => ({ ...value, currentLessonId: lesson.id }))
      setMode(lesson.kind === 'pdf' ? 'pdf' : 'video')
      setElapsed(0)
      setPlaying(false)
    },
    [locked, setState, showToast],
  )

  const completeStage = useCallback(
    async (lesson: Lesson) => {
      if (!lesson.stageId || completing) return
      const alreadyDone = lesson.done
      setCompleting(true)
      try {
        const data = await api<{ course: Course }>(
          `/cursos/${encodeURIComponent(course.id)}/etapas/${encodeURIComponent(lesson.stageId)}/conclusao`,
          { method: alreadyDone ? 'DELETE' : 'POST' },
        )
        setUpdatedCourse(data.course)
        reloadCatalog()
        if (!alreadyDone) {
          const lessons = buildCurriculum(data.course).flatMap((module) => module.lessons)
          const index = lessons.findIndex((item) => item.id === lesson.id)
          const next = lessons.slice(index + 1).find((item) => !item.done) ?? lessons.find((item) => !item.done)
          setState((value) => ({ ...value, currentLessonId: next?.id ?? lesson.id }))
        }
        setElapsed(0)
        setPlaying(false)
        showToast(
          alreadyDone
            ? 'Conclusão desfeita.'
            : data.course.status === 'concluido'
              ? 'Curso concluído! Pontos e certificado garantidos.'
              : 'Etapa concluída!',
        )
      } catch (caught) {
        showToast(caught instanceof Error ? caught.message : 'Não foi possível registrar a conclusão.')
      } finally {
        setCompleting(false)
      }
    },
    [completing, course.id, reloadCatalog, setState, showToast],
  )

  const onExamSubmitted = useCallback(
    (updated: Course, result: ExamSubmitResult) => {
      setUpdatedCourse(updated)
      reloadCatalog()
      if (!result.approved) return
      showToast(updated.status === 'concluido' ? 'Curso concluído! Pontos e certificado garantidos.' : 'Aprovado! Etapa concluída.')
    },
    [reloadCatalog, showToast],
  )

  const completeCurrent = useCallback(() => {
    if (!currentLesson) return
    if (currentLesson.stageId) {
      void completeStage(currentLesson)
      return
    }
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
  }, [allLessons, completeStage, currentLesson, setState, showToast])

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
          ...value.posts.filter((post) => !isSamplePost(post)),
      ],
    }))
    showToast('Dúvida publicada para a turma.')
  }

  if (!currentLesson || !currentModule) return null

  const lessonPoints = currentLesson.points ?? 25
  const stageLabel =
    currentModule.lessons.length > 1 ? `${currentModuleIndex + 1}.${lessonIndexInModule}` : `${currentModuleIndex + 1}`
  const examStage = staged && currentLesson.kind === 'quiz' && Boolean(currentLesson.exam)
  const lessonDetail = staged
    ? currentLesson.kind === 'video'
      ? 'Vídeo'
      : examStage
        ? `Prova · ${currentLesson.questions ?? 0} ${currentLesson.questions === 1 ? 'pergunta' : 'perguntas'} · aprovação com ${currentLesson.exam?.passingScore ?? 70}%`
        : `${currentLesson.documents?.length ?? 0} documento${currentLesson.documents?.length === 1 ? '' : 's'}`
    : currentLesson.kind === 'video'
      ? `${currentLesson.durationMin} min`
      : currentLesson.kind === 'pdf'
        ? `${currentLesson.pages} páginas`
        : `${currentLesson.questions} questões`

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col pb-12">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <nav data-tour="lesson-breadcrumb" className="flex flex-wrap items-center gap-2 font-display text-xs text-muted" aria-label="Navegação">
          <Link to="/conteudos" className="flex items-center gap-1 text-ink/80 transition-colors hover:text-accent">
            <GraduationCap size={16} className="text-accent" />
            <span>Meus Cursos</span>
          </Link>
          <span className="text-muted/60">/</span>
          <span className="max-w-[240px] truncate text-ink/80">{course.title}</span>
          <span className="text-muted/60">/</span>
          <span className="font-semibold text-ink">
            {staged ? `Etapa ${stageLabel}` : `Módulo ${currentModuleIndex + 1}`}
          </span>
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
            <div data-tour="lesson-media">
              <MediaHub
                key={staged ? currentLesson.id : undefined}
                course={course}
                instructor={instructor}
                lesson={currentLesson}
                pdfLesson={pdfLesson}
                chapterLabel={
                  staged
                    ? `Etapa ${stageLabel} de ${modules.length}`
                    : `Aula ${lessonIndexInModule} de ${currentModule.lessons.length}`
                }
                mode={mode}
                onModeChange={setMode}
                elapsed={elapsed}
                onElapsedChange={setElapsed}
                playing={playing}
                onPlayingChange={setPlaying}
                onFinish={onFinish}
                onExamSubmitted={onExamSubmitted}
              />
            </div>

            <div className="flex flex-col gap-4 border-t border-line bg-surface p-6">
              <div data-tour="lesson-info" className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div className="flex flex-col gap-1.5">
                  <h1 className="font-display text-2xl leading-snug font-bold tracking-tight text-ink lg:text-[28px]">
                    {currentLesson.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 font-display text-xs text-ink/80">
                    <span className="flex items-center gap-1">
                      <Clock3 size={16} className="text-accent" />
                      {lessonDetail}
                    </span>
                    <span className="text-muted/50">•</span>
                    <span className="flex items-center gap-1 font-semibold text-accent">
                      <Medal size={16} /> {staged ? `+${course.points} pts ao concluir o curso` : `+${lessonPoints} pts`}
                    </span>
                    {course.certificate?.enabled !== false ? (
                      <>
                        <span className="text-muted/50">•</span>
                        <span className="flex items-center gap-1">
                          <BadgeCheck size={16} className="text-accent" /> Certificação
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                {examStage ? (
                  <span
                    className={cn(
                      'flex items-center gap-2 self-start rounded-xl px-4 py-3 font-display text-sm font-semibold xl:self-center',
                      currentLesson.done
                        ? 'border border-emerald-500/40 bg-emerald-950 text-emerald-300'
                        : 'border border-line bg-elevated text-muted',
                    )}
                  >
                    <CheckCircle2 size={20} />
                    {currentLesson.done ? 'Aprovado · etapa concluída' : 'Seja aprovado na prova para concluir'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={completeCurrent}
                    disabled={completing}
                    title={currentLesson.done ? 'Clique para desfazer a conclusão' : undefined}
                    className={cn(
                      'flex items-center gap-2 self-start rounded-xl px-4 py-3 font-display text-sm font-semibold shadow-lg transition-all active:scale-95 disabled:opacity-60 xl:self-center',
                      currentLesson.done
                        ? 'border border-emerald-500/40 bg-emerald-950 text-emerald-300'
                        : 'bg-accent text-accent-ink shadow-accent/20 hover:brightness-110',
                    )}
                  >
                    {completing ? <Spinner className="h-5 w-5" /> : <CheckCircle2 size={20} />}
                    {staged
                      ? currentLesson.done
                        ? 'Etapa concluída'
                        : 'Concluir etapa'
                      : currentLesson.done
                        ? 'Aula concluída'
                        : 'Concluir aula'}
                  </button>
                )}
              </div>

              <div data-tour="lesson-tools" className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {!staged ? (
                    <button
                      type="button"
                      onClick={() => showToast('Download do material iniciado.')}
                      className="flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-2 font-display text-xs text-ink/90 transition-colors hover:bg-fill"
                    >
                      <Download size={18} className="text-accent" /> Material (PDF)
                    </button>
                  ) : null}
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

          <div data-tour="lesson-workspace">
            <LessonWorkspace
              course={course}
              tab={tab}
              onTabChange={setTab}
              notes={state.notes}
              onAddNote={addNote}
              onDeleteNote={deleteNote}
              posts={posts}
              onPublish={publish}
              currentClock={formatClock(elapsed)}
            />
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-4">
          <div data-tour="lesson-curriculum">
            <CurriculumPanel
              modules={modules}
              currentLessonId={currentLesson.id}
              playing={playing}
              onSelectLesson={selectLesson}
              stages={staged ? { sequential } : undefined}
              certificate={course.certificate?.enabled !== false}
            />
          </div>
          {certificate ? (
            <button
              type="button"
              onClick={() => setCertificateOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-accent-2/40 bg-accent-2/15 px-4 py-3 font-display text-sm font-semibold text-accent-2 shadow-lg transition hover:bg-accent-2/25"
            >
              <BadgeCheck size={18} /> Ver certificado
            </button>
          ) : null}
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

      <CertificateModal data={certificateOpen ? certificate : null} onClose={() => setCertificateOpen(false)} />
    </div>
  )
}

export function LessonPage() {
  const { courseId } = useParams()
  const { getCourse } = useCatalog()
  const assigned = courseId ? getCourse(courseId) : undefined
  // Fora da lista do colaborador (ex.: pré-visualização pela gestão), busca o curso direto na API.
  const [remote, setRemote] = useState<{ id: string; course: Course | null } | null>(null)

  useEffect(() => {
    if (!courseId || assigned) return
    const controller = new AbortController()
    api<{ course: Course }>(`/cursos/${encodeURIComponent(courseId)}`, { signal: controller.signal })
      .then((data) => setRemote({ id: courseId, course: data.course }))
      .catch(() => {
        if (!controller.signal.aborted) setRemote({ id: courseId, course: null })
      })
    return () => controller.abort()
  }, [assigned, courseId])

  const course = assigned ?? (remote && remote.id === courseId ? remote.course : undefined)
  if (!courseId || course === null) return <Navigate to="/conteudos" replace />
  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  return <LessonView key={course.id} course={course} />
}
