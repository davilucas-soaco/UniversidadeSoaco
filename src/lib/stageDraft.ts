import type { PendingDocument } from '@/components/admin/DocumentDropzone'
import { parseVideoUrl } from '@/lib/videoEmbed'
import type { AdminCourseInput, AdminStage, AdminStageInput, AuthoredDocument, ContentKind } from '@/types'

/** Etapa em edição no formulário do curso. Etapa com `children` é um grupo (um nível só). */
export type DraftStage = {
  key: string
  id: string | null
  title: string
  description: string
  kind: ContentKind | null
  videoUrl: string
  /** Documentos já publicados que continuam na etapa. */
  documents: AuthoredDocument[]
  removedDocumentIds: string[]
  files: PendingDocument[]
  /** Prova escolhida (etapa do tipo "exam"). */
  examId: string | null
  children: DraftStage[]
}

/** Onde soltar uma etapa arrastada: num vão da lista (reordena) ou sobre uma etapa (vira subetapa dela). */
export type StageDropTarget =
  | { type: 'gap'; parentKey: string | null; beforeKey: string | null }
  | { type: 'into'; key: string }

type Located = { stage: DraftStage; parent: DraftStage | null; index: number; topIndex: number }

let sequence = 0

export function createStage(title = ''): DraftStage {
  sequence += 1
  return {
    key: `nova-${Date.now().toString(36)}-${sequence}`,
    id: null,
    title,
    description: '',
    kind: 'video',
    videoUrl: '',
    documents: [],
    removedDocumentIds: [],
    files: [],
    examId: null,
    children: [],
  }
}

export function stageFromAdmin(stage: AdminStage & { children?: AdminStage[] }): DraftStage {
  return {
    key: stage.id,
    id: stage.id,
    title: stage.title,
    description: stage.description,
    kind: stage.kind,
    videoUrl: stage.videoUrl ?? '',
    documents: stage.documents,
    removedDocumentIds: [],
    files: [],
    examId: stage.examId,
    children: (stage.children ?? []).map((child) => stageFromAdmin(child)),
  }
}

export const isGroup = (stage: DraftStage) => stage.children.length > 0

/** Etapas que o colaborador conclui: subetapas e etapas sem subetapas, na ordem do pipeline. */
export function stageUnits(stages: DraftStage[]) {
  return stages.flatMap((stage) => (isGroup(stage) ? stage.children : [stage]))
}

export function findStage(stages: DraftStage[], key: string): Located | null {
  for (const [topIndex, stage] of stages.entries()) {
    if (stage.key === key) return { stage, parent: null, index: topIndex, topIndex }
    const index = stage.children.findIndex((child) => child.key === key)
    if (index >= 0) return { stage: stage.children[index], parent: stage, index, topIndex }
  }
  return null
}

/** Numeração exibida: "2" para etapa, "2.1" para subetapa. */
export function stageNumber(stages: DraftStage[], key: string) {
  const found = findStage(stages, key)
  if (!found) return ''
  return found.parent ? `${found.topIndex + 1}.${found.index + 1}` : `${found.topIndex + 1}`
}

export function updateStage(stages: DraftStage[], key: string, patch: Partial<DraftStage>): DraftStage[] {
  return stages.map((stage) => {
    if (stage.key === key) return { ...stage, ...patch }
    if (!stage.children.some((child) => child.key === key)) return stage
    return { ...stage, children: stage.children.map((child) => (child.key === key ? { ...child, ...patch } : child)) }
  })
}

export function removeStage(stages: DraftStage[], key: string): DraftStage[] {
  return stages
    .filter((stage) => stage.key !== key)
    .map((stage) =>
      stage.children.some((child) => child.key === key)
        ? { ...stage, children: stage.children.filter((child) => child.key !== key) }
        : stage,
    )
}

export function addChild(stages: DraftStage[], parentKey: string, child: DraftStage): DraftStage[] {
  return stages.map((stage) => (stage.key === parentKey ? { ...stage, children: [...stage.children, child] } : stage))
}

export function isSameDropTarget(a: StageDropTarget | null, b: StageDropTarget) {
  if (!a || a.type !== b.type) return false
  if (a.type === 'into' && b.type === 'into') return a.key === b.key
  if (a.type === 'gap' && b.type === 'gap') return a.parentKey === b.parentKey && a.beforeKey === b.beforeKey
  return false
}

/** Indica se soltar `dragKey` em `target` muda alguma coisa e respeita o limite de um nível. */
export function canDrop(stages: DraftStage[], dragKey: string, target: StageDropTarget): boolean {
  const dragged = findStage(stages, dragKey)
  if (!dragged) return false

  if (target.type === 'into') {
    const host = findStage(stages, target.key)
    if (!host || host.parent || target.key === dragKey) return false
    if (isGroup(dragged.stage)) return false
    return dragged.parent?.key !== target.key
  }

  if (target.parentKey !== null) {
    if (isGroup(dragged.stage) || target.parentKey === dragKey) return false
  }
  if (target.beforeKey === dragKey) return false

  const siblings = target.parentKey === null ? stages : (findStage(stages, target.parentKey)?.stage.children ?? [])
  const sameList = (dragged.parent?.key ?? null) === target.parentKey
  if (sameList) {
    const nextKey = siblings[dragged.index + 1]?.key ?? null
    if (target.beforeKey === nextKey) return false
  }
  return true
}

export function moveStage(stages: DraftStage[], dragKey: string, target: StageDropTarget): DraftStage[] {
  if (!canDrop(stages, dragKey, target)) return stages
  const dragged = findStage(stages, dragKey)
  if (!dragged) return stages
  const rest = removeStage(stages, dragKey)

  if (target.type === 'into') {
    const hostIndex = stages.findIndex((stage) => stage.key === target.key)
    // Vindo de antes no pipeline, entra no começo do grupo; vindo de depois, no fim. Assim a ordem se mantém.
    const atStart = dragged.topIndex < hostIndex
    return rest.map((stage) =>
      stage.key === target.key
        ? { ...stage, children: atStart ? [dragged.stage, ...stage.children] : [...stage.children, dragged.stage] }
        : stage,
    )
  }

  const insert = (list: DraftStage[]) => {
    const index = target.beforeKey ? list.findIndex((stage) => stage.key === target.beforeKey) : -1
    const next = [...list]
    next.splice(index >= 0 ? index : next.length, 0, dragged.stage)
    return next
  }

  if (target.parentKey === null) return insert(rest)
  return rest.map((stage) => (stage.key === target.parentKey ? { ...stage, children: insert(stage.children) } : stage))
}

export function stageHasContent(stage: DraftStage) {
  return (
    Boolean(stage.videoUrl.trim()) || stage.documents.length > 0 || stage.files.length > 0 || Boolean(stage.examId)
  )
}

/** O que falta para a etapa ficar pronta (ou `null` se está pronta). */
export function stageIssue(stage: DraftStage): string | null {
  if (!stage.title.trim()) return 'Dê um nome à etapa.'
  if (isGroup(stage)) return null
  if (!stage.kind) return 'Escolha o conteúdo: vídeo ou documentos.'
  if (stage.kind === 'video') return parseVideoUrl(stage.videoUrl) ? null : 'Cole um link do YouTube, Vimeo ou Loom.'
  if (stage.kind === 'exam') return stage.examId ? null : 'Escolha a prova da etapa.'
  return stage.documents.length + stage.files.length > 0 ? null : 'Envie pelo menos um documento.'
}

/** Primeira etapa com pendência, já com o grupo verificado antes das subetapas. */
export function firstIssue(stages: DraftStage[]) {
  for (const stage of stages) {
    const issue = stageIssue(stage)
    if (issue) return { stage, issue }
    for (const child of stage.children) {
      const childIssue = stageIssue(child)
      if (childIssue) return { stage: child, issue: childIssue }
    }
  }
  return null
}

function toInput(stage: DraftStage): AdminStageInput {
  const group = isGroup(stage)
  return {
    key: stage.key,
    id: stage.id,
    title: stage.title.trim(),
    description: stage.description.trim(),
    kind: group ? null : stage.kind,
    videoUrl: !group && stage.kind === 'video' ? stage.videoUrl.trim() : null,
    examId: !group && stage.kind === 'exam' ? stage.examId : null,
  }
}

export function stagesToInput(stages: DraftStage[]): AdminCourseInput['stages'] {
  return stages.map((stage) => ({ ...toInput(stage), children: stage.children.map(toInput) }))
}
