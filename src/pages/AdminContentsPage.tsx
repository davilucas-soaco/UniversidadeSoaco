import { Link, useNavigate } from 'react-router-dom'
import { FileStack, PlayCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCatalog } from '@/context/CatalogContext'
import { videoProviderLabel } from '@/lib/videoEmbed'
import { documentKindLabel, formatBytes } from '@/lib/documents'

export function AdminContentsPage() {
  const navigate = useNavigate()
  const { authored } = useCatalog()

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col pb-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
            Governança
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">
            Gestão de conteúdos
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            Cadastre cursos em vídeo ou com documentos e publique na Universidade Corporativa.
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => navigate('/admin/conteudos/novo')}>
          Novo curso
        </Button>
      </div>

      {authored.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Plus size={26} />}
            title="Nenhum curso cadastrado ainda"
            description="Comece pelo nome do curso e escolha se o conteúdo é um vídeo (YouTube, Vimeo ou Loom) ou um documento PDF, Word ou Excel."
            action={<Button onClick={() => navigate('/admin/conteudos/novo')}>Cadastrar curso</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {authored.map((course) => (
            <Link
              key={course.id}
              to={`/aula/${course.id}`}
              className="soaco-press flex items-center gap-4 rounded-2xl border border-line bg-elevated p-4 shadow-card transition hover:border-accent/30"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fill text-accent">
                {course.kind === 'video' ? <PlayCircle size={22} /> : <FileStack size={22} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-ink">{course.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {course.kind === 'video'
                    ? course.videoProvider
                      ? `Vídeo · ${videoProviderLabel[course.videoProvider]}`
                      : 'Vídeo'
                    : course.documents
                        .map((doc) => `${documentKindLabel(doc.mime, doc.name)} · ${formatBytes(doc.size)}`)
                        .join(' · ') || 'Documentos'}
                </p>
              </div>
              <span className="hidden font-display text-xs font-semibold text-accent sm:inline">Abrir aula</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
