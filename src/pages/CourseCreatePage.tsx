import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileStack, PlayCircle } from 'lucide-react'
import { DocumentDropzone, type PendingDocument } from '@/components/admin/DocumentDropzone'
import { VideoEmbed } from '@/components/lesson/VideoEmbed'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useCatalog } from '@/context/CatalogContext'
import { useFeedback } from '@/context/FeedbackContext'
import { parseVideoUrl, videoProviderLabel } from '@/lib/videoEmbed'
import { cn } from '@/lib/cn'
import { profileFieldClass } from '@/components/profile/fields'
import type { ContentKind } from '@/types'

export function CourseCreatePage() {
  const navigate = useNavigate()
  const { createCourse } = useCatalog()
  const { showToast } = useFeedback()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<ContentKind>('video')
  const [videoUrl, setVideoUrl] = useState('')
  const [files, setFiles] = useState<PendingDocument[]>([])
  const [saving, setSaving] = useState(false)

  const embed = useMemo(() => parseVideoUrl(videoUrl), [videoUrl])
  const videoTyped = videoUrl.trim().length > 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const name = title.trim()
    if (!name) {
      showToast('Informe o nome do curso.')
      return
    }
    if (kind === 'video') {
      if (!embed) {
        showToast('Cole um link válido do YouTube, Vimeo ou Loom.')
        return
      }
    } else if (!files.length) {
      showToast('Anexe pelo menos um PDF, Word ou Excel.')
      return
    }

    setSaving(true)
    const course = createCourse({
      title: name,
      kind,
      videoUrl: embed?.watchUrl,
      videoProvider: embed?.provider,
      embedUrl: embed?.embedUrl,
      files: files.map((item) => item.file),
    })
    showToast('Curso cadastrado.')
    navigate(`/aula/${course.id}`)
    setSaving(false)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col pb-12">
      <Link
        to="/admin/conteudos"
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Gestão de conteúdos
      </Link>

      <div className="mb-8 text-center">
        <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
          Cadastro
        </p>
        <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">
          Novo curso
        </h1>
        <p className="mx-auto mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Defina o nome e o tipo de conteúdo. Vídeos do YouTube, Vimeo ou Loom entram no player da
          plataforma; documentos PDF, Word e Excel ficam como material de apoio.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <Card>
          <CardContent className="flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="font-display text-xs font-semibold tracking-wide text-ink">Nome do curso</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={profileFieldClass}
                placeholder="Ex.: Integração de novos colaboradores"
                autoFocus
              />
            </label>

            <fieldset>
              <legend className="mb-2 font-display text-xs font-semibold tracking-wide text-ink">
                Tipo de conteúdo
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <TypeCard
                  active={kind === 'video'}
                  icon={<PlayCircle size={22} />}
                  title="Vídeo"
                  hint="YouTube, Vimeo ou Loom"
                  onClick={() => setKind('video')}
                />
                <TypeCard
                  active={kind === 'document'}
                  icon={<FileStack size={22} />}
                  title="Documentos"
                  hint="PDF, Word e Excel"
                  onClick={() => setKind('document')}
                />
              </div>
            </fieldset>

            {kind === 'video' ? (
              <label className="flex flex-col gap-2">
                <span className="font-display text-xs font-semibold tracking-wide text-ink">Link do vídeo</span>
                <input
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  className={profileFieldClass}
                  placeholder="https://www.youtube.com/watch?v=… ou Vimeo / Loom"
                  inputMode="url"
                  autoComplete="off"
                />
                {videoTyped && !embed ? (
                  <p className="text-xs text-[var(--soaco-danger)]">
                    Não reconhecemos esse link. Use YouTube, Vimeo ou Loom.
                  </p>
                ) : embed ? (
                  <p className="text-xs text-muted">
                    Pronto para exibir no player · {videoProviderLabel[embed.provider]}
                  </p>
                ) : (
                  <p className="text-xs text-muted">Cole o link compartilhado do vídeo.</p>
                )}
              </label>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="font-display text-xs font-semibold tracking-wide text-ink">Arquivos</span>
                <DocumentDropzone files={files} onChange={setFiles} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => navigate('/admin/conteudos')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando…' : 'Cadastrar curso'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-4">
            <div className="text-center">
              <p className="font-display text-xs font-semibold tracking-wide text-muted uppercase">
                Prévia do player
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold text-ink">
                {title.trim() || 'Sem título'}
              </h2>
            </div>
            {kind === 'video' ? (
              <VideoEmbed info={embed} title={title.trim() || 'Prévia do curso'} />
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-10 text-center">
                <FileStack size={32} className="text-accent" />
                <p className="mt-3 font-display text-sm font-semibold text-ink">
                  {files.length
                    ? `${files.length} arquivo${files.length > 1 ? 's' : ''} pronto${files.length > 1 ? 's' : ''} para o curso`
                    : 'Os documentos aparecerão na aula após o cadastro'}
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                  PDF abre no leitor da plataforma. Word e Excel ficam disponíveis para download.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

function TypeCard({
  active,
  icon,
  title,
  hint,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'soaco-press flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition',
        active
          ? 'border-accent bg-accent/8 ring-4 ring-accent/10'
          : 'border-line bg-surface hover:border-accent/30 hover:bg-fill',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          active ? 'bg-accent text-accent-ink' : 'bg-fill text-muted',
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block font-display text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
    </button>
  )
}
