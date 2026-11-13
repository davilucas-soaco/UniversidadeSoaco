import { Fragment, useState, type DragEvent } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileStack,
  GripVertical,
  Layers,
  PlayCircle,
  Plus,
} from 'lucide-react'
import {
  canDrop,
  isGroup,
  isSameDropTarget,
  stageIssue,
  type DraftStage,
  type StageDropTarget,
} from '@/lib/stageDraft'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { parseVideoUrl, videoProviderLabel } from '@/lib/videoEmbed'
import { cn } from '@/lib/cn'

type StagePipelineProps = {
  stages: DraftStage[]
  selectedKey: string | null
  sequential: boolean
  onSelect: (key: string) => void
  onMove: (dragKey: string, target: StageDropTarget) => void
  onAdd: () => void
  /** Nome de cada prova do banco, pelo id (rótulo das etapas de prova). */
  examTitles: Record<string, string>
}

function contentLabel(stage: DraftStage, examTitles: Record<string, string>) {
  if (isGroup(stage)) return `${stage.children.length} subetapa${stage.children.length > 1 ? 's' : ''}`
  if (stage.kind === 'exam') {
    const title = stage.examId ? examTitles[stage.examId] : undefined
    return title ? `Prova · ${title}` : 'Prova'
  }
  if (stage.kind === 'video') {
    const embed = parseVideoUrl(stage.videoUrl)
    return embed ? `Vídeo · ${videoProviderLabel[embed.provider]}` : 'Vídeo'
  }
  if (stage.kind === 'document') {
    const count = stage.documents.length + stage.files.length
    return count > 0 ? `${count} documento${count > 1 ? 's' : ''}` : 'Documentos'
  }
  return 'Sem conteúdo'
}

/** Pendências de um grupo contam as das subetapas. */
function groupReady(stage: DraftStage) {
  return !stageIssue(stage) && stage.children.every((child) => !stageIssue(child))
}

function StatusBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="inline-flex items-center gap-1 font-display text-[10px] font-semibold text-success">
      <CheckCircle2 size={12} /> Pronta
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 font-display text-[10px] font-semibold text-amber-500">
      <CircleAlert size={12} /> Pendente
    </span>
  )
}

function StageGlyph({ stage, size = 'md' }: { stage: DraftStage; size?: 'sm' | 'md' }) {
  const embed = !isGroup(stage) && stage.kind === 'video' ? parseVideoUrl(stage.videoUrl) : null
  const thumbnail = useVideoThumbnail(embed)
  const box = size === 'md' ? 'h-10 w-14 rounded-lg' : 'h-7 w-7 rounded-md'
  if (thumbnail) {
    return <img src={thumbnail} alt="" className={cn(box, 'shrink-0 bg-fill object-cover')} />
  }
  const Icon = isGroup(stage)
    ? Layers
    : stage.kind === 'document'
      ? FileStack
      : stage.kind === 'exam'
        ? ClipboardCheck
        : PlayCircle
  return (
    <span className={cn(box, 'flex shrink-0 items-center justify-center bg-fill text-accent')}>
      <Icon size={size === 'md' ? 18 : 14} />
    </span>
  )
}

/**
 * Pipeline das etapas do curso. Arrastar uma etapa sobre outra a torna subetapa dela;
 * soltar nos vãos entre as etapas muda a ordem (ou tira a subetapa do grupo).
 */
export function StagePipeline({ stages, selectedKey, sequential, onSelect, onMove, onAdd, examTitles }: StagePipelineProps) {
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [over, setOver] = useState<StageDropTarget | null>(null)

  const endDrag = () => {
    setDragKey(null)
    setOver(null)
  }

  const dragProps = (key: string) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.stopPropagation()
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', key)
      setDragKey(key)
    },
    onDragEnd: endDrag,
  })

  const dropProps = (target: StageDropTarget) => ({
    onDragOver: (event: DragEvent) => {
      if (!dragKey || !canDrop(stages, dragKey, target)) return
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'move'
      if (!isSameDropTarget(over, target)) setOver(target)
    },
    onDragLeave: (event: DragEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
      setOver((current) => (isSameDropTarget(current, target) ? null : current))
    },
    onDrop: (event: DragEvent) => {
      if (!dragKey || !canDrop(stages, dragKey, target)) return
      event.preventDefault()
      event.stopPropagation()
      onMove(dragKey, target)
      endDrag()
    },
  })

  const isOver = (target: StageDropTarget) => isSameDropTarget(over, target)
  const canReceive = (target: StageDropTarget) => Boolean(dragKey && canDrop(stages, dragKey, target))

  const connector = (beforeKey: string | null, index: number) => {
    const target: StageDropTarget = { type: 'gap', parentKey: null, beforeKey }
    const active = isOver(target)
    const edge = index === 0 || beforeKey === null
    return (
      <div
        {...dropProps(target)}
        aria-hidden
        className={cn(
          'relative flex shrink-0 justify-center self-stretch pt-9',
          edge ? (dragKey ? 'w-6' : 'w-2') : 'w-10',
        )}
      >
        {active ? (
          <span className="absolute inset-y-1 w-1 rounded-full bg-accent shadow-[0_0_10px_var(--soaco-accent)]" />
        ) : !edge ? (
          <ArrowRight size={18} className={cn(sequential ? 'text-accent' : 'text-muted/60')} />
        ) : canReceive(target) ? (
          <span className="absolute inset-y-3 w-0.5 rounded-full bg-line" />
        ) : null}
      </div>
    )
  }

  const childGap = (parentKey: string, beforeKey: string | null) => {
    const target: StageDropTarget = { type: 'gap', parentKey, beforeKey }
    const receivable = canReceive(target)
    return (
      <li
        {...dropProps(target)}
        aria-hidden
        className={cn('flex items-center px-1 transition-all', receivable ? 'h-4' : 'h-1')}
      >
        {isOver(target) ? <span className="h-1 w-full rounded-full bg-accent" /> : null}
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start overflow-x-auto px-4 pt-1 pb-3">
        {stages.map((stage, index) => {
          const group = isGroup(stage)
          const into: StageDropTarget = { type: 'into', key: stage.key }
          const intoActive = isOver(into)
          const selected = selectedKey === stage.key

          return (
            <Fragment key={stage.key}>
              {connector(stage.key, index)}
              <div
                {...dragProps(stage.key)}
                {...dropProps(into)}
                className={cn(
                  'relative w-60 shrink-0 cursor-grab rounded-2xl border bg-elevated shadow-sm transition active:cursor-grabbing',
                  selected ? 'border-accent ring-2 ring-accent/30' : 'border-line hover:border-accent/40',
                  dragKey === stage.key && 'opacity-40',
                  intoActive && 'border-dashed border-accent ring-4 ring-accent/20',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(stage.key)}
                  aria-pressed={selected}
                  className="flex w-full flex-col gap-2.5 rounded-2xl p-3 text-left focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 font-display text-[10px] font-semibold tracking-widest text-muted uppercase">
                      <GripVertical size={13} className="text-muted/70" />
                      Etapa {index + 1}
                    </span>
                    <StatusBadge ready={group ? groupReady(stage) : !stageIssue(stage)} />
                  </span>
                  <span className="flex items-center gap-2.5">
                    <StageGlyph stage={stage} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate font-display text-sm font-semibold', stage.title.trim() ? 'text-ink' : 'text-muted italic')}>
                        {stage.title.trim() || 'Etapa sem nome'}
                      </span>
                      <span className="block truncate text-[11px] text-muted">{contentLabel(stage, examTitles)}</span>
                    </span>
                  </span>
                </button>

                {group ? (
                  <ul className="flex flex-col border-t border-line px-2 py-1.5">
                    {stage.children.map((child, childIndex) => (
                      <Fragment key={child.key}>
                        {childGap(stage.key, child.key)}
                        <li
                          {...dragProps(child.key)}
                          className={cn('cursor-grab active:cursor-grabbing', dragKey === child.key && 'opacity-40')}
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(child.key)}
                            aria-pressed={selectedKey === child.key}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition',
                              selectedKey === child.key
                                ? 'border-accent/60 bg-accent/10'
                                : 'border-transparent hover:bg-fill',
                            )}
                          >
                            <StageGlyph stage={child} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-display text-xs font-semibold text-ink">
                                <span className="text-muted">
                                  {index + 1}.{childIndex + 1}
                                </span>{' '}
                                {child.title.trim() || <span className="font-normal text-muted italic">Sem nome</span>}
                              </span>
                              <span className="block truncate text-[10px] text-muted">{contentLabel(child, examTitles)}</span>
                            </span>
                            {stageIssue(child) ? <CircleAlert size={13} className="shrink-0 text-amber-500" /> : null}
                          </button>
                        </li>
                      </Fragment>
                    ))}
                    {childGap(stage.key, null)}
                  </ul>
                ) : null}

                {intoActive ? (
                  <span className="pointer-events-none absolute inset-x-3 -bottom-3 rounded-full bg-accent px-2 py-0.5 text-center font-display text-[10px] font-semibold text-accent-ink shadow">
                    Soltar como subetapa
                  </span>
                ) : null}
              </div>
            </Fragment>
          )
        })}

        {connector(null, stages.length)}
        <button
          type="button"
          onClick={onAdd}
          className="soaco-press flex h-[94px] w-40 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line text-muted transition hover:border-accent/60 hover:text-accent"
        >
          <Plus size={18} />
          <span className="font-display text-xs font-semibold">Nova etapa</span>
        </button>
      </div>

      <p className="px-6 text-[11px] text-muted">
        Arraste uma etapa sobre outra para torná-la subetapa. Solte entre as etapas para mudar a ordem.
      </p>
    </div>
  )
}
