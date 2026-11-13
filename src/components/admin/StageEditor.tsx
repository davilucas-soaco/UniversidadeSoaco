import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  CornerDownRight,
  CornerUpLeft,
  FileStack,
  FileText,
  Layers,
  Link2,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { DocumentDropzone } from '@/components/admin/DocumentDropzone'
import { VideoEmbed } from '@/components/lesson/VideoEmbed'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { documentKindLabel, formatBytes } from '@/lib/documents'
import { isGroup, stageIssue, type DraftStage } from '@/lib/stageDraft'
import { parseVideoUrl, videoProviderLabel } from '@/lib/videoEmbed'
import { cn } from '@/lib/cn'
import type { ContentKind, ExamSummary } from '@/types'

const kinds: { value: ContentKind; label: string; hint: string; icon: ReactNode }[] = [
  { value: 'video', label: 'Vídeo', hint: 'YouTube, Vimeo ou Loom', icon: <PlayCircle size={16} /> },
  { value: 'document', label: 'Documentos', hint: 'PDF, Word e Excel', icon: <FileStack size={16} /> },
  { value: 'exam', label: 'Prova', hint: 'Perguntas com uma resposta correta', icon: <ClipboardCheck size={16} /> },
]

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Escolha da prova da etapa no banco de provas. */
function ExamPicker({
  exams,
  value,
  onChange,
  onCreate,
  onEdit,
}: {
  exams: ExamSummary[] | null
  value: string | null
  onChange: (examId: string) => void
  onCreate: () => void
  onEdit: (examId: string) => void
}) {
  const [query, setQuery] = useState('')
  const selected = exams?.find((exam) => exam.id === value) ?? null
  const term = normalize(query.trim())
  const visible = (exams ?? []).filter((exam) => !term || normalize(`${exam.title} ${exam.description}`).includes(term))

  if (!exams) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {selected ? (
        <div className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink">
              <ClipboardCheck size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-ink">{selected.title}</p>
              <p className="text-[11px] text-muted">
                {selected.questionsCount} {selected.questionsCount === 1 ? 'pergunta' : 'perguntas'} · aprovação com{' '}
                {selected.passingScore}%
                {selected.usedIn.length > 1 ? ` · usada em ${selected.usedIn.length} etapas` : ''}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => onEdit(selected.id)}>
            Editar prova
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="flex items-center gap-2 border-b border-line bg-fill px-3 py-2">
          <Search size={15} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault()
            }}
            placeholder={selected ? 'Trocar por outra prova…' : 'Pesquisar prova…'}
            aria-label="Pesquisar prova"
            className="w-full bg-transparent py-0.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
            autoComplete="off"
          />
          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={onCreate} className="h-8 shrink-0">
            Nova prova
          </Button>
        </div>
        <div role="radiogroup" aria-label="Provas cadastradas" className="max-h-56 overflow-y-auto">
          {exams.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-muted">
              Nenhuma prova cadastrada. Clique em “Nova prova” para criar a primeira.
            </p>
          ) : visible.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-muted">Nenhuma prova encontrada.</p>
          ) : (
            visible.map((exam) => {
              const checked = exam.id === value
              return (
                <button
                  key={exam.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onChange(exam.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-line/60 px-4 py-2.5 text-left transition last:border-0',
                    checked ? 'bg-accent/10' : 'hover:bg-fill',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      checked ? 'border-accent bg-accent' : 'border-line bg-surface',
                    )}
                  >
                    {checked ? <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm text-ink', checked && 'font-semibold')}>{exam.title}</span>
                    {exam.description ? <span className="block truncate text-[11px] text-muted">{exam.description}</span> : null}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">
                    {exam.questionsCount} {exam.questionsCount === 1 ? 'pergunta' : 'perguntas'} · {exam.passingScore}%
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted">
        As provas ficam em Configurações e podem ser usadas em vários cursos. Editar uma prova muda ela em todas as etapas que a usam.
      </p>
    </div>
  )
}

type StageEditorProps = {
  stage: DraftStage
  number: string
  isChild: boolean
  canMoveBack: boolean
  canMoveForward: boolean
  /** Etapa seguinte que pode receber esta como subetapa. */
  nextTitle: string | null
  canRemove: boolean
  onChange: (patch: Partial<DraftStage>) => void
  onMove: (direction: -1 | 1) => void
  onNest: () => void
  onUnnest: () => void
  onAddChild: () => void
  onRemove: () => void
  /** Banco de provas (null enquanto carrega). */
  exams: ExamSummary[] | null
  onCreateExam: () => void
  onEditExam: (examId: string) => void
}

function ActionButton({ label, icon, onClick, disabled, danger }: {
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'soaco-press flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-elevated text-muted transition disabled:pointer-events-none disabled:opacity-35',
        danger ? 'hover:border-danger/40 hover:text-danger' : 'hover:border-accent/40 hover:text-ink',
      )}
    >
      {icon}
    </button>
  )
}

/** Edição da etapa selecionada no pipeline: nome, descrição e conteúdo próprio. */
export function StageEditor({
  stage,
  number,
  isChild,
  canMoveBack,
  canMoveForward,
  nextTitle,
  canRemove,
  onChange,
  onMove,
  onNest,
  onUnnest,
  onAddChild,
  onRemove,
  exams,
  onCreateExam,
  onEditExam,
}: StageEditorProps) {
  const group = isGroup(stage)
  const embed = parseVideoUrl(stage.videoUrl)
  const videoTyped = stage.videoUrl.trim().length > 0
  const issue = stageIssue(stage)
  const documentCount = stage.documents.length + stage.files.length

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
            {isChild ? 'Subetapa' : 'Etapa'} {number}
          </span>
          <input
            value={stage.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className={cn(profileFieldClass, 'font-display text-base font-semibold')}
            placeholder={isChild ? 'Nome da subetapa' : 'Nome da etapa'}
            maxLength={160}
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <ActionButton
            label={isChild ? 'Mover para cima' : 'Mover para a esquerda'}
            icon={<ArrowLeft size={16} className={cn(isChild && 'rotate-90')} />}
            onClick={() => onMove(-1)}
            disabled={!canMoveBack}
          />
          <ActionButton
            label={isChild ? 'Mover para baixo' : 'Mover para a direita'}
            icon={<ArrowRight size={16} className={cn(isChild && 'rotate-90')} />}
            onClick={() => onMove(1)}
            disabled={!canMoveForward}
          />
          {isChild ? (
            <ActionButton label="Tirar do grupo" icon={<CornerUpLeft size={16} />} onClick={onUnnest} />
          ) : (
            <ActionButton
              label={nextTitle ? `Virar subetapa de “${nextTitle}”` : 'Virar subetapa da etapa seguinte'}
              icon={<CornerDownRight size={16} />}
              onClick={onNest}
              disabled={group || nextTitle === null}
            />
          )}
          <ActionButton label="Excluir etapa" icon={<Trash2 size={16} />} onClick={onRemove} disabled={!canRemove} danger />
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-display text-xs font-semibold tracking-wide text-ink">Descrição</span>
        <textarea
          value={stage.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={2}
          maxLength={1000}
          placeholder="O que o colaborador aprende nesta etapa (opcional)"
          className={cn(profileFieldClass, 'h-auto resize-y py-2.5')}
        />
      </label>

      {group ? (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fill text-accent">
              <Layers size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                Grupo com {stage.children.length} subetapa{stage.children.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted">O conteúdo fica em cada subetapa. Selecione uma no pipeline para editar.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={onAddChild}>
            Subetapa
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="radiogroup" aria-label="Conteúdo da etapa" className="inline-flex w-fit rounded-xl border border-line bg-fill p-1">
              {kinds.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={stage.kind === item.value}
                  title={item.hint}
                  onClick={() => onChange({ kind: item.value })}
                  className={cn(
                    'soaco-press inline-flex items-center gap-2 rounded-lg px-4 py-2 font-display text-xs font-semibold transition',
                    stage.kind === item.value ? 'bg-accent text-accent-ink shadow-sm' : 'text-muted hover:text-ink',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
            {!isChild ? (
              <Button variant="ghost" size="sm" icon={<Plus size={15} />} onClick={onAddChild}>
                Adicionar subetapa
              </Button>
            ) : null}
          </div>

          {stage.kind === 'video' ? (
            <div className="flex flex-col gap-4">
              <VideoEmbed info={embed} title={stage.title.trim() || 'Prévia da etapa'} className="shadow-card" />
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold tracking-wide text-ink">
                  <Link2 size={15} className="text-muted" /> Link do vídeo
                </span>
                <input
                  value={stage.videoUrl}
                  onChange={(event) => onChange({ videoUrl: event.target.value })}
                  className={cn(profileFieldClass, videoTyped && !embed && 'border-danger/60')}
                  placeholder="https://www.youtube.com/watch?v=…"
                  inputMode="url"
                  autoComplete="off"
                />
                <span className="text-[11px] text-muted">YouTube, Vimeo ou Loom.</span>
              </label>
            </div>
          ) : stage.kind === 'document' ? (
            <div className="flex flex-col gap-3">
              {stage.documents.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {stage.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-line bg-elevated px-3 py-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fill text-accent">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-semibold text-ink">{doc.name}</p>
                        <p className="text-[11px] text-muted">
                          {documentKindLabel(doc.mime, doc.name)} · {formatBytes(doc.size)} · já publicado
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remover ${doc.name}`}
                        onClick={() =>
                          onChange({
                            documents: stage.documents.filter((item) => item.id !== doc.id),
                            removedDocumentIds: [...stage.removedDocumentIds, doc.id],
                          })
                        }
                        className="soaco-press rounded-lg p-2 text-muted hover:bg-fill hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <DocumentDropzone files={stage.files} onChange={(files) => onChange({ files })} />
            </div>
          ) : stage.kind === 'exam' ? (
            <ExamPicker
              exams={exams}
              value={stage.examId}
              onChange={(examId) => onChange({ examId })}
              onCreate={onCreateExam}
              onEdit={onEditExam}
            />
          ) : null}
        </>
      )}

      <div className="flex items-center gap-2 text-xs">
        {issue ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-amber-500">
            <CircleAlert size={15} /> {issue}
          </span>
        ) : group ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 size={15} /> Grupo pronto
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 size={15} />
            {stage.kind === 'video' && embed
              ? `Vídeo pronto · ${videoProviderLabel[embed.provider]}`
              : stage.kind === 'exam'
                ? 'Prova escolhida'
                : `${documentCount} arquivo${documentCount > 1 ? 's' : ''} na etapa`}
          </span>
        )}
      </div>
    </div>
  )
}
