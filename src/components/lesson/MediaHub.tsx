import { useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  BookOpenText,
  Captions,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Maximize,
  Pause,
  Play,
  PlayCircle,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Settings,
  Volume2,
  ZoomIn,
} from 'lucide-react'
import { CourseCover } from '@/components/content/CourseCover'
import { VideoEmbed } from '@/components/lesson/VideoEmbed'
import { Avatar } from '@/components/ui/Avatar'
import { useFeedback } from '@/context/FeedbackContext'
import { documentObjectUrl, isPdf } from '@/lib/documents'
import { formatClock } from '@/lib/format'
import { parseVideoUrl } from '@/lib/videoEmbed'
import { cn } from '@/lib/cn'
import type { Course, Instructor, Lesson } from '@/types'

export type MediaMode = 'video' | 'pdf'

const speeds = [1, 1.25, 1.5, 2]

type MediaHubProps = {
  course: Course
  instructor: Instructor
  lesson: Lesson
  pdfLesson: Lesson | null
  chapterLabel: string
  mode: MediaMode
  onModeChange: (mode: MediaMode) => void
  elapsed: number
  onElapsedChange: (seconds: number) => void
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  onFinish: () => void
}

export function MediaHub({
  course,
  instructor,
  lesson,
  pdfLesson,
  chapterLabel,
  mode,
  onModeChange,
  elapsed,
  onElapsedChange,
  playing,
  onPlayingChange,
  onFinish,
}: MediaHubProps) {
  const { showToast } = useFeedback()
  const [speedIndex, setSpeedIndex] = useState(1)
  const [page, setPage] = useState(1)
  const [cinema, setCinema] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const embed = course.embedUrl ? parseVideoUrl(course.videoUrl ?? course.embedUrl) : null
  const currentDocument = course.documents?.find((doc) => doc.id === lesson.id) ?? course.documents?.[0]
  const documentUrl = currentDocument ? documentObjectUrl(currentDocument.id) : null
  const duration = (lesson.durationMin ?? 20) * 60
  const speed = speeds[speedIndex]
  const percent = Math.min(100, (elapsed / duration) * 100)
  const buffered = Math.min(100, percent + 28)
  const pages = pdfLesson?.pages ?? 12

  useEffect(() => {
    if (!playing || mode !== 'video') return
    const id = window.setInterval(() => {
      const next = elapsed + speed
      if (next >= duration) {
        onElapsedChange(duration)
        onPlayingChange(false)
        onFinish()
        return
      }
      onElapsedChange(next)
    }, 1000)
    return () => window.clearInterval(id)
  }, [playing, mode, elapsed, speed, duration, onElapsedChange, onPlayingChange, onFinish])

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    onElapsedChange(Math.round(ratio * duration))
  }

  const skip = (delta: number) => onElapsedChange(Math.min(duration, Math.max(0, elapsed + delta)))

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-elevated/90 px-4 py-2.5 text-ink">
        <div className="flex items-center gap-2">
          {course.contentKind !== 'document' ? (
            <button
              type="button"
              onClick={() => onModeChange('video')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-all',
                mode === 'video' ? 'bg-accent text-accent-ink shadow' : 'text-muted hover:bg-fill hover:text-ink',
              )}
            >
              {lesson.kind === 'quiz' ? <ListChecks size={16} /> : <PlayCircle size={16} />}
              <span>{lesson.kind === 'quiz' ? 'Quiz' : 'Vídeo'}</span>
            </button>
          ) : null}
          {course.contentKind !== 'video' ? (
            <button
              type="button"
              onClick={() => onModeChange('pdf')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-all',
                mode === 'pdf' ? 'bg-accent text-accent-ink shadow' : 'text-muted hover:bg-fill hover:text-ink',
              )}
            >
              <BookOpenText size={16} />
              <span>{course.authored ? 'Documento' : 'Apostila'}</span>
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3 font-display text-xs text-muted">
          {embed ? (
            <span className="hidden font-display text-xs text-muted sm:inline">Player da plataforma</span>
          ) : (
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              1080p · {speed}x
            </span>
          )}
          <button
            type="button"
            title="Modo cinema"
            onClick={() => setCinema((value) => !value)}
            className={cn('p-1 transition-colors hover:text-accent', cinema && 'text-accent')}
          >
            <RectangleHorizontal size={18} />
          </button>
        </div>
      </div>

      {mode === 'video' && embed ? (
        <VideoEmbed info={embed} title={lesson.title} className="rounded-none" />
      ) : mode === 'video' && lesson.kind === 'quiz' ? (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden bg-black text-center">
          <div className="absolute inset-0 opacity-60">
            <CourseCover accent={course.cover.accent} icon={course.cover.icon} image={course.cover.image} title={course.title} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/70" />
          </div>
          <div className="relative z-10 flex max-w-md flex-col items-center gap-3 px-6">
            <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 font-display text-[11px] font-semibold tracking-wider text-accent uppercase">
              {chapterLabel}
            </span>
            <h2 className="font-display text-2xl font-bold text-white">{lesson.title}</h2>
            <p className="text-sm text-slate-300">
              {lesson.questions} questões · +{lesson.points} pts · aprovação a partir de 70%
            </p>
            <button
              type="button"
              onClick={() => showToast('As avaliações interativas serão liberadas com o backend.')}
              className="mt-2 rounded-xl bg-accent px-6 py-3 font-display text-sm font-semibold text-accent-ink shadow-xl ring-4 ring-accent/30 transition-transform hover:scale-105 active:scale-95"
            >
              Iniciar quiz
            </button>
          </div>
        </div>
      ) : mode === 'video' ? (
        <div
          className={cn(
            'group relative flex w-full flex-col justify-between overflow-hidden bg-black select-none ring-1 ring-white/5',
            cinema ? 'aspect-[21/9]' : 'aspect-video',
          )}
        >
          <div className="absolute inset-0 opacity-80">
            <CourseCover accent={course.cover.accent} icon={course.cover.icon} image={course.cover.image} title={course.title} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/80" />
          </div>

          <div className="relative z-10 flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-3">
              <Avatar name={instructor.name} initials={instructor.initials} size="md" className="ring-2 ring-accent/50" />
              <div className="flex flex-col">
                <span className="font-display text-sm leading-none font-bold text-white drop-shadow">{lesson.title}</span>
                <span className="mt-1 font-display text-xs font-medium text-accent">{instructor.name}</span>
              </div>
            </div>
            <span className="rounded border border-line bg-surface/80 px-3 py-1 font-display text-[11px] font-semibold tracking-wider text-slate-200 uppercase backdrop-blur-md">
              {chapterLabel}
            </span>
          </div>

          <div className="relative z-10 my-auto flex items-center justify-center">
            <button
              type="button"
              onClick={() => onPlayingChange(!playing)}
              aria-label={playing ? 'Pausar' : 'Reproduzir'}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-ink shadow-xl ring-4 ring-accent/30 transition-transform hover:scale-105 active:scale-95"
            >
              {playing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
          </div>

          <div className="relative z-10 flex flex-col gap-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4">
            <div
              ref={barRef}
              onClick={seek}
              role="slider"
              aria-label="Posição do vídeo"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={Math.round(elapsed)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') skip(10)
                if (event.key === 'ArrowLeft') skip(-10)
              }}
              className="group/bar relative flex h-2.5 w-full cursor-pointer items-center rounded-full bg-white/20"
            >
              <div className="pointer-events-none absolute top-0 bottom-0 left-0 rounded-full bg-white/30" style={{ width: `${buffered}%` }} />
              <div
                className="pointer-events-none absolute top-0 bottom-0 left-0 rounded-full bg-accent shadow-[0_0_10px_var(--soaco-accent)]"
                style={{ width: `${percent}%` }}
              />
              <div
                className="pointer-events-none absolute -ml-2 h-4 w-4 rounded-full border-2 border-accent bg-white shadow-lg transition-transform group-hover/bar:scale-125"
                style={{ left: `${percent}%` }}
              />
              {[25, 50, 75].map((marker) => (
                <div key={marker} className="absolute top-0 bottom-0 w-0.5 bg-black/80" style={{ left: `${marker}%` }} />
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 text-white">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => onPlayingChange(!playing)} className="transition-colors hover:text-accent" aria-label={playing ? 'Pausar' : 'Reproduzir'}>
                  {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                </button>
                <button type="button" title="Voltar 10 segundos" onClick={() => skip(-10)} className="text-slate-300 transition-colors hover:text-accent">
                  <RotateCcw size={19} />
                </button>
                <button type="button" title="Avançar 10 segundos" onClick={() => skip(10)} className="text-slate-300 transition-colors hover:text-accent">
                  <RotateCw size={19} />
                </button>
                <div className="ml-1 flex items-center gap-1.5">
                  <Volume2 size={19} className="text-slate-300" />
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-3/4 bg-accent" />
                  </div>
                </div>
                <span className="ml-2 font-display text-xs font-medium tracking-tight">
                  <span className="font-semibold text-accent">{formatClock(elapsed)}</span> / {formatClock(duration)}
                </span>
              </div>
              <div className="flex items-center gap-3 font-display text-xs">
                <button
                  type="button"
                  onClick={() => setSpeedIndex((index) => (index + 1) % speeds.length)}
                  className="rounded bg-white/10 px-2 py-0.5 font-semibold text-accent transition-all hover:bg-white/20"
                >
                  {speed}x
                </button>
                <button type="button" title="Legendas" onClick={() => showToast('Legendas em português ativadas.')} className="text-slate-300 transition-colors hover:text-accent">
                  <Captions size={20} />
                </button>
                <button type="button" title="Qualidade" onClick={() => showToast('Qualidade automática (1080p).')} className="text-slate-300 transition-colors hover:text-accent">
                  <Settings size={19} />
                </button>
                <button type="button" title="Tela cheia" onClick={() => setCinema((value) => !value)} className="text-slate-300 transition-colors hover:text-accent">
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video w-full flex-col bg-canvas p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2 text-ink">
              <FileText size={18} className="text-accent" />
              <span className="font-display text-sm font-semibold">
                {pdfLesson?.title ?? `Apostila: ${course.moduleTitles[0]}`}
              </span>
            </div>
            <span className="font-display text-xs text-muted">
              Página {page} de {pages}
            </span>
          </div>
          <div className="my-4 flex-1 overflow-hidden rounded-lg border border-line bg-elevated">
            {currentDocument && documentUrl && isPdf(currentDocument.mime, currentDocument.name) ? (
              <iframe title={currentDocument.name} src={documentUrl} className="h-full min-h-[280px] w-full border-0 bg-white" />
            ) : currentDocument && documentUrl ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
                <FileText size={28} className="text-accent" />
                <p className="font-display text-sm font-semibold text-ink">{currentDocument.name}</p>
                <p className="text-xs text-muted">Word e Excel abrem no aplicativo do seu computador.</p>
                <a
                  href={documentUrl}
                  download={currentDocument.name}
                  className="soaco-press rounded-lg bg-accent px-4 py-2 font-display text-xs font-semibold text-accent-ink"
                >
                  Baixar arquivo
                </a>
              </div>
            ) : (
              <div className="p-5">
                <p className="font-display text-sm font-semibold text-ink">
                  {page}. {course.moduleTitles[(page - 1) % course.moduleTitles.length]}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{course.description}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {course.objectives[(page - 1) % course.objectives.length]}
                </p>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-line bg-surface px-3 py-2">
                  <span className="text-xs text-muted">Figura {page}.1 · Material de apoio</span>
                  <button type="button" onClick={() => showToast('Visualização ampliada em breve.')} className="inline-flex items-center gap-1 font-display text-xs font-semibold text-accent">
                    <ZoomIn size={14} /> Ampliar
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-fill px-3 py-1.5 font-display text-xs font-semibold text-ink disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-[11px] text-muted">Validado pela equipe de treinamento</span>
            <button
              type="button"
              disabled={page === pages}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-fill px-3 py-1.5 font-display text-xs font-semibold text-ink disabled:opacity-40"
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
