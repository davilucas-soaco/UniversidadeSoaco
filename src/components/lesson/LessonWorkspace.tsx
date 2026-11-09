import { useState } from 'react'
import {
  Bookmark,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Paperclip,
  Star,
  Trash2,
} from 'lucide-react'
import { CourseReviewsPanel } from '@/components/lesson/CourseReviewsPanel'
import { Avatar } from '@/components/ui/Avatar'
import { useSessionUser } from '@/context/AuthContext'
import { useFeedback } from '@/context/FeedbackContext'
import { cn } from '@/lib/cn'
import type { Course, Instructor } from '@/types'

export type WorkspaceTab = 'overview' | 'reviews' | 'discussion' | 'notes'

export type LessonNote = { id: string; time: string; text: string }
export type DiscussionPost = { id: string; author: string; initials: string; role: string; text: string; when: string }

const tabs: { value: WorkspaceTab; label: string; Icon: typeof FileText }[] = [
  { value: 'overview', label: 'Visão geral', Icon: FileText },
  { value: 'reviews', label: 'Avaliações', Icon: Star },
  { value: 'discussion', label: 'Discussão', Icon: MessageSquare },
  { value: 'notes', label: 'Anotações', Icon: Bookmark },
]

type LessonWorkspaceProps = {
  course: Course
  instructor: Instructor
  tab: WorkspaceTab
  onTabChange: (tab: WorkspaceTab) => void
  notes: LessonNote[]
  onAddNote: (text: string) => void
  onDeleteNote: (id: string) => void
  posts: DiscussionPost[]
  onPublish: (text: string) => void
  currentClock: string
}

export function LessonWorkspace({
  course,
  instructor,
  tab,
  onTabChange,
  notes,
  onAddNote,
  onDeleteNote,
  posts,
  onPublish,
  currentClock,
}: LessonWorkspaceProps) {
  const { showComingSoon, showToast } = useFeedback()
  const user = useSessionUser()
  const [noteDraft, setNoteDraft] = useState('')
  const [postDraft, setPostDraft] = useState('')

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6 shadow-xl">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-line pb-1" role="tablist">
        {tabs.map(({ value, label, Icon }) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => onTabChange(value)}
            className={cn(
              'flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 font-display text-sm whitespace-nowrap transition-all',
              tab === value ? 'border-accent font-semibold text-accent' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
            {value === 'notes' && notes.length ? (
              <span className="rounded-full bg-fill px-1.5 text-[10px] text-muted">{notes.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Resumo</h2>
            <p className="text-base leading-relaxed text-muted">{course.description}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-elevated/70 p-4">
            <h3 className="font-display text-sm font-semibold text-ink">Objetivos</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {course.objectives.map((objective) => (
                <div key={objective} className="flex items-start gap-2.5">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-accent" />
                  <span className="text-sm text-ink/90">{objective}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-elevated p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Avatar name={instructor.name} initials={instructor.initials} size="lg" className="h-16 w-16 text-base ring-2 ring-accent/40" />
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-bold text-ink">{instructor.name}</span>
                  <span className="rounded-full border border-accent/40 bg-accent/20 px-2 py-0.5 font-display text-[10px] font-bold text-accent">
                    Instrutor(a)
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{instructor.bio}</p>
                <span className="mt-1 font-display text-xs font-medium text-accent">{instructor.stats}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => showComingSoon('Enviar dúvida ao instrutor', 'O envio direto de dúvidas será integrado ao e-mail corporativo na próxima fase.')}
              className="flex items-center justify-center gap-2 rounded-lg border border-line bg-fill px-4 py-2.5 font-display text-xs font-semibold whitespace-nowrap text-accent shadow transition-all hover:brightness-110"
            >
              <Mail size={18} />
              Enviar dúvida
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'reviews' ? <CourseReviewsPanel courseId={course.id} /> : null}

      {tab === 'discussion' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink">Discussão da turma</h3>
            <span className="rounded-full border border-line bg-fill px-2.5 py-0.5 font-display text-[11px] text-muted">
              Resposta em ~2h
            </span>
          </div>
          <div className="rounded-xl border border-line bg-elevated p-4">
            <textarea
              value={postDraft}
              onChange={(event) => setPostDraft(event.target.value)}
              placeholder="Tem alguma dúvida sobre esta aula? Compartilhe com a turma e com o instrutor..."
              rows={3}
              className="w-full resize-y rounded-lg border border-line bg-surface p-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => showComingSoon('Anexar arquivo', 'O envio de anexos será habilitado com o Storage privado na próxima fase.')}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-ink"
              >
                <Paperclip size={16} /> Anexar foto ou arquivo
              </button>
              <button
                type="button"
                disabled={!postDraft.trim()}
                onClick={() => {
                  onPublish(postDraft.trim())
                  setPostDraft('')
                }}
                className="rounded-lg bg-accent px-4 py-2 font-display text-xs font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-40"
              >
                Publicar dúvida
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <div key={post.id} className="flex gap-3 rounded-xl border border-line bg-elevated p-4">
                <Avatar name={post.author} initials={post.initials} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-ink">{post.author}</span>
                    <span className="text-xs text-muted">{post.role}</span>
                    <span className="ml-auto text-[11px] text-muted">{post.when}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink/90">{post.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'notes' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink">Minhas anotações</h3>
            <button
              type="button"
              onClick={() => {
                if (!notes.length) {
                  showToast('Você ainda não tem anotações nesta aula.')
                  return
                }
                const content = notes.map((note) => `[${note.time}] ${note.text}`).join('\n')
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `anotacoes-${course.id}.txt`
                link.click()
                URL.revokeObjectURL(url)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-fill px-3 py-1.5 font-display text-xs font-semibold text-ink hover:brightness-110"
            >
              <Download size={16} className="text-accent" /> Exportar
            </button>
          </div>
          <div className="rounded-xl border border-line bg-elevated p-4">
            <div className="mb-2 flex items-center gap-2 font-display text-[11px] font-semibold text-accent">
              <Bookmark size={14} /> Marcar em {currentClock}
            </div>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Registre um ponto importante desta aula..."
              rows={2}
              className="w-full resize-y rounded-lg border border-line bg-surface p-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={!noteDraft.trim()}
                onClick={() => {
                  onAddNote(noteDraft.trim())
                  setNoteDraft('')
                }}
                className="rounded-lg bg-accent px-4 py-2 font-display text-xs font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-40"
              >
                Salvar anotação
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {notes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                Nenhuma anotação ainda. As notas ficam salvas neste dispositivo.
              </p>
            ) : null}
            {notes.map((note) => (
              <div key={note.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-elevated p-4">
                <div className="flex min-w-0 gap-3">
                  <span className="shrink-0 rounded bg-accent/15 px-2 py-0.5 font-display text-[11px] font-bold text-accent">
                    {note.time}
                  </span>
                  <p className="text-sm leading-relaxed text-ink/90">{note.text}</p>
                </div>
                <button
                  type="button"
                  title="Excluir nota"
                  onClick={() => onDeleteNote(note.id)}
                  className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-fill hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="sr-only">Conectado como {user.name}</p>
    </div>
  )
}
