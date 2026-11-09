import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CircleAlert, FileStack, Link2, PlayCircle, Type } from 'lucide-react'
import { DocumentDropzone, type PendingDocument } from '@/components/admin/DocumentDropzone'
import { VideoEmbed } from '@/components/lesson/VideoEmbed'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useCatalog } from '@/context/CatalogContext'
import { useFeedback } from '@/context/FeedbackContext'
import { parseVideoUrl, videoProviderLabel } from '@/lib/videoEmbed'
import { cn } from '@/lib/cn'
import type { ContentKind } from '@/types'

const kinds: { value: ContentKind; label: string; hint: string; icon: ReactNode }[] = [
  { value: 'video', label: 'Vídeo', hint: 'YouTube, Vimeo ou Loom', icon: <PlayCircle size={16} /> },
  { value: 'document', label: 'Documentos', hint: 'PDF, Word e Excel', icon: <FileStack size={16} /> },
]

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
  const contentReady = kind === 'video' ? Boolean(embed) : files.length > 0

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
    <div className="mx-auto flex w-full max-w-4xl flex-col pb-12">
      <Link
        to="/admin/conteudos"
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Gestão de conteúdos
      </Link>

      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">Cadastro</p>
        <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">Novo curso</h1>
        <p className="mt-1 text-sm text-muted">Adicione um vídeo ou documentos e dê um nome ao curso.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        {/* Conteúdo em destaque */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">
                1 · Conteúdo do curso
              </p>
              <h2 className="mt-0.5 font-display text-lg font-semibold text-ink">
                {title.trim() || 'Prévia do curso'}
              </h2>
            </div>
            <div role="radiogroup" aria-label="Tipo de conteúdo" className="inline-flex rounded-xl border border-line bg-fill p-1">
              {kinds.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === item.value}
                  title={item.hint}
                  onClick={() => setKind(item.value)}
                  className={cn(
                    'soaco-press inline-flex items-center gap-2 rounded-lg px-4 py-2 font-display text-xs font-semibold transition',
                    kind === item.value ? 'bg-accent text-accent-ink shadow-sm' : 'text-muted hover:text-ink',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface/60 p-6">
            {kind === 'video' ? (
              <VideoEmbed info={embed} title={title.trim() || 'Prévia do curso'} className="shadow-card" />
            ) : (
              <DocumentDropzone files={files} onChange={setFiles} />
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-line px-6 py-3 text-xs">
            {contentReady ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <CheckCircle2 size={15} />
                {kind === 'video' && embed
                  ? `Vídeo pronto para o player · ${videoProviderLabel[embed.provider]}`
                  : `${files.length} arquivo${files.length > 1 ? 's' : ''} pronto${files.length > 1 ? 's' : ''}`}
              </span>
            ) : kind === 'video' && videoTyped ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-danger">
                <CircleAlert size={15} /> Link não reconhecido. Use YouTube, Vimeo ou Loom.
              </span>
            ) : (
              <span className="text-muted">
                {kind === 'video' ? 'Cole o link abaixo para ver a prévia.' : 'Envie ao menos um documento.'}
              </span>
            )}
          </div>
        </Card>

        {/* Campos do formulário */}
        <Card>
          <div className="border-b border-line px-6 py-4">
            <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">
              2 · Informações do curso
            </p>
          </div>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <Field label="Nome do curso" icon={<Type size={15} />} className={kind === 'document' ? 'md:col-span-2' : undefined}>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={profileFieldClass}
                placeholder="Ex.: Integração de novos colaboradores"
                autoFocus
              />
            </Field>
            {kind === 'video' ? (
              <Field label="Link do vídeo" icon={<Link2 size={15} />} hint="YouTube, Vimeo ou Loom.">
                <input
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  className={cn(profileFieldClass, videoTyped && !embed && 'border-danger/60')}
                  placeholder="https://www.youtube.com/watch?v=…"
                  inputMode="url"
                  autoComplete="off"
                />
              </Field>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" type="button" onClick={() => navigate('/admin/conteudos')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} icon={saving ? <Spinner className="h-4 w-4" /> : undefined}>
              {saving ? 'Salvando…' : 'Cadastrar curso'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

function Field({
  label,
  icon,
  hint,
  className,
  children,
}: {
  label: string
  icon: ReactNode
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold tracking-wide text-ink">
        <span className="text-muted">{icon}</span>
        {label}
      </span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  )
}
