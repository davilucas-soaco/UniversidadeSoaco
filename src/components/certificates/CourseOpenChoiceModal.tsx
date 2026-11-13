import type { ReactNode } from 'react'
import { BadgeCheck, ChevronRight, PlayCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'

function Choice({
  icon,
  title,
  description,
  onClick,
  tone,
}: {
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
  tone: 'certificate' | 'content'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="soaco-press group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-accent/50 hover:bg-fill"
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          tone === 'certificate' ? 'bg-accent-2/15 text-accent-2' : 'bg-accent/15 text-accent',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

/** Curso concluído: escolher entre ver o certificado ou ir para o conteúdo. */
export function CourseOpenChoiceModal({
  open,
  courseTitle,
  issuedAt,
  onCertificate,
  onContent,
  onClose,
}: {
  open: boolean
  courseTitle: string
  issuedAt: string | null
  onCertificate: () => void
  onContent: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} title={courseTitle} onClose={onClose} width="max-w-md">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Você concluiu este curso. O que deseja fazer?</p>
        <Choice
          tone="certificate"
          icon={<BadgeCheck size={22} />}
          title="Ver certificado"
          description={issuedAt ? `Concluído em ${formatDate(issuedAt)} · baixar ou imprimir` : 'Baixar ou imprimir'}
          onClick={onCertificate}
        />
        <Choice
          tone="content"
          icon={<PlayCircle size={22} />}
          title="Ir para o conteúdo"
          description="Revisar as etapas, vídeos e materiais do curso"
          onClick={onContent}
        />
      </div>
    </Modal>
  )
}
