import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Award, BadgeCheck, CalendarClock, Clock3, Eye, FileText, FolderOpen, ListOrdered, RefreshCw, Trash2, Type } from 'lucide-react'
import { AudiencePicker } from '@/components/admin/AudiencePicker'
import { ExamEditorModal } from '@/components/admin/ExamEditorModal'
import { CertificateModal } from '@/components/certificates/CertificateModal'
import { audienceReach, type AudienceSelection } from '@/lib/audience'
import type { CertificateData } from '@/lib/certificate'
import { StageEditor } from '@/components/admin/StageEditor'
import { StagePipeline } from '@/components/admin/StagePipeline'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { useCatalog } from '@/context/CatalogContext'
import { useFeedback } from '@/context/FeedbackContext'
import { adminApi, courseAdminApi } from '@/lib/adminApi'
import {
  addChild,
  createStage,
  findStage,
  firstIssue,
  isGroup,
  moveStage,
  removeStage,
  stageFromAdmin,
  stageHasContent,
  stageNumber,
  stagesToInput,
  stageUnits,
  updateStage,
  type DraftStage,
  type StageDropTarget,
} from '@/lib/stageDraft'
import { cn } from '@/lib/cn'
import type { AdminCourse, CourseAudienceOptions, ExamSummary } from '@/types'

type FormState = {
  title: string
  category: string
  description: string
  durationHours: string
  points: string
  sequential: boolean
  certificate: boolean
  audience: AudienceSelection
  mandatory: boolean
  dueDate: string
}

const emptyForm: FormState = {
  title: '',
  category: '',
  description: '',
  durationHours: '1',
  points: '10',
  sequential: false,
  certificate: true,
  audience: { userIds: [], sectorIds: [], classIds: [] },
  mandatory: false,
  dueDate: '',
}

function formFromCourse(course: AdminCourse): FormState {
  return {
    title: course.title,
    category: course.category,
    description: course.description,
    durationHours: String(course.durationHours),
    points: String(course.points),
    sequential: course.sequential,
    certificate: course.certificate,
    audience: {
      userIds: course.audience.users.map((item) => item.id),
      sectorIds: course.audience.sectors.map((item) => item.id),
      classIds: course.audience.classes.map((item) => item.id),
    },
    mandatory: course.mandatory,
    dueDate: course.dueDate ?? '',
  }
}

/** Cadastro e edição de cursos (rota /admin/conteudos/novo e /admin/conteudos/:courseId/editar). */
export function CourseCreatePage() {
  const { courseId } = useParams()
  const editing = Boolean(courseId)
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { reload: reloadCatalog } = useCatalog()

  const [options, setOptions] = useState<CourseAudienceOptions | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [stages, setStages] = useState<DraftStage[]>(() => [createStage('Introdução')])
  const [selectedKey, setSelectedKey] = useState<string | null>(() => stages[0]?.key ?? null)
  const [pendingRemoval, setPendingRemoval] = useState<DraftStage | null>(null)
  const [certificatePreview, setCertificatePreview] = useState<CertificateData | null>(null)
  const [exams, setExams] = useState<ExamSummary[] | null>(null)
  // Prova aberta no editor: id (edição) ou null (nova), e a etapa que vai recebê-la.
  const [examEditor, setExamEditor] = useState<{ examId: string | null; stageKey: string } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([courseAdminApi.options(), courseId ? courseAdminApi.get(courseId) : Promise.resolve(null)])
      .then(([loadedOptions, course]) => {
        if (!active) return
        setOptions(loadedOptions)
        if (!course) {
          const first = loadedOptions.categories[0] ?? ''
          setForm((current) => (current.category ? current : { ...current, category: first }))
        }
        if (course) {
          setForm(formFromCourse(course))
          const loaded = course.stages.length > 0 ? course.stages.map((stage) => stageFromAdmin(stage)) : [createStage('Introdução')]
          setStages(loaded)
          setSelectedKey(loaded[0].key)
        }
      })
      .catch((caught: unknown) => {
        if (active) setLoadError(caught instanceof Error ? caught.message : 'Não foi possível carregar o curso.')
      })
    return () => {
      active = false
    }
  }, [courseId])

  const loadExams = useCallback(() => {
    adminApi
      .listExams()
      .then(setExams)
      .catch(() => setExams([]))
  }, [])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  const examTitles = useMemo(() => Object.fromEntries((exams ?? []).map((exam) => [exam.id, exam.title])), [exams])

  /** Certificado de exemplo com os dados do formulário (ainda não salvos). */
  const previewCertificate = (): CertificateData => {
    const hours = Number(form.durationHours.replace(',', '.'))
    return {
      name: 'Nome do Colaborador',
      course: form.title.trim() || 'Nome do curso',
      category: form.category || 'Categoria',
      hours: Number.isFinite(hours) && hours > 0 ? hours : 1,
      issuedAt: new Date().toISOString(),
      code: `USA-${new Date().getFullYear()}-EXEMPLO`,
    }
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const selected = useMemo(() => (selectedKey ? findStage(stages, selectedKey) : null), [stages, selectedKey])
  const unitsCount = stageUnits(stages).length
  const audienceCount = options ? audienceReach(options, form.audience) : 0

  const warnBecomesGroup = (host: DraftStage) => {
    if (isGroup(host) || !stageHasContent(host)) return
    showToast(`“${host.title.trim() || 'Etapa'}” virou um grupo: o conteúdo passa a ficar nas subetapas.`)
  }

  const handleMove = (dragKey: string, target: StageDropTarget) => {
    if (target.type === 'into') {
      const host = findStage(stages, target.key)
      if (host) warnBecomesGroup(host.stage)
    }
    setStages((current) => moveStage(current, dragKey, target))
  }

  const moveSelected = (direction: -1 | 1) => {
    if (!selected) return
    const list = selected.parent ? selected.parent.children : stages
    const beforeKey = direction === -1 ? list[selected.index - 1]?.key : (list[selected.index + 2]?.key ?? null)
    if (beforeKey === undefined) return
    handleMove(selected.stage.key, { type: 'gap', parentKey: selected.parent?.key ?? null, beforeKey })
  }

  const nestSelected = () => {
    const next = selected && !selected.parent ? stages[selected.topIndex + 1] : undefined
    if (selected && next) handleMove(selected.stage.key, { type: 'into', key: next.key })
  }

  const unnestSelected = () => {
    if (!selected?.parent) return
    const beforeKey = selected.index === 0 ? selected.parent.key : (stages[selected.topIndex + 1]?.key ?? null)
    handleMove(selected.stage.key, { type: 'gap', parentKey: null, beforeKey })
  }

  const addStage = () => {
    const stage = createStage()
    setStages((current) => [...current, stage])
    setSelectedKey(stage.key)
  }

  const addChildTo = (parentKey: string) => {
    const host = findStage(stages, parentKey)
    if (!host || host.parent) return
    warnBecomesGroup(host.stage)
    const child = createStage()
    setStages((current) => addChild(current, parentKey, child))
    setSelectedKey(child.key)
  }

  const removeNow = (key: string) => {
    const found = findStage(stages, key)
    if (!found) return
    const next = removeStage(stages, key)
    const siblings = found.parent ? (findStage(next, found.parent.key)?.stage.children ?? []) : next
    const neighbor = siblings[Math.min(found.index, siblings.length - 1)] ?? (found.parent ? found.parent : next[0])
    setStages(next)
    setSelectedKey(neighbor?.key ?? null)
  }

  const requestRemove = (stage: DraftStage) => {
    if (stage.id || isGroup(stage)) setPendingRemoval(stage)
    else removeNow(stage.key)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const durationHours = Number(form.durationHours.replace(',', '.'))
    const points = Number(form.points)
    if (form.title.trim().length < 2) return showToast('Informe o nome do curso.')
    if (!form.category) return showToast('Escolha a categoria (cadastre em Configurações).')
    const problem = firstIssue(stages)
    if (problem) {
      setSelectedKey(problem.stage.key)
      return showToast(`Etapa ${stageNumber(stages, problem.stage.key)}: ${problem.issue}`)
    }
    if (!Number.isFinite(durationHours) || durationHours < 0.25) return showToast('Informe a carga horária (mínimo 0,25 h).')
    if (!Number.isInteger(points) || points < 0) return showToast('Informe os pontos como um número inteiro.')
    if (form.mandatory && !form.dueDate) return showToast('Defina o prazo do curso obrigatório.')

    const input = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      durationHours,
      points,
      sequential: form.sequential,
      certificate: form.certificate,
      stages: stagesToInput(stages),
      audience: form.audience,
      mandatory: form.mandatory,
      dueDate: form.mandatory ? form.dueDate : null,
    }

    setSaving(true)
    let saved = false
    try {
      const { course, stageIds } = courseId ? await courseAdminApi.update(courseId, input) : await courseAdminApi.create(input)
      saved = true
      for (const unit of stageUnits(stages)) {
        const stageId = stageIds[unit.key]
        if (unit.kind !== 'document' || !stageId) continue
        if (unit.id) for (const documentId of unit.removedDocumentIds) await courseAdminApi.removeDocument(course.id, documentId)
        if (unit.files.length > 0) {
          await courseAdminApi.uploadStageDocuments(course.id, stageId, unit.files.map((item) => item.file))
        }
      }
      reloadCatalog()
      showToast(editing ? 'Curso atualizado.' : 'Curso cadastrado.')
      navigate('/admin/conteudos')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Não foi possível salvar o curso.'
      if (saved) {
        reloadCatalog()
        showToast(`O curso foi salvo, mas o envio de documentos falhou (${message}). Edite o curso para reenviar.`)
        navigate('/admin/conteudos')
      } else {
        showToast(message)
        setSaving(false)
      }
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted">{loadError}</p>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => navigate('/admin/conteudos')}>
          Voltar para a Gestão de conteúdos
        </Button>
      </div>
    )
  }

  if (!options) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const selectedList = selected ? (selected.parent ? selected.parent.children : stages) : []
  const nextTopStage = selected && !selected.parent ? stages[selected.topIndex + 1] : undefined

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col pb-12">
      <Link
        to="/admin/conteudos"
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Gestão de conteúdos
      </Link>

      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
          {editing ? 'Edição' : 'Cadastro'}
        </p>
        <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">
          {editing ? 'Editar curso' : 'Novo curso'}
        </h1>
        <p className="mt-1 text-sm text-muted">Preencha as informações, escolha para quem o curso vai e monte as etapas.</p>
      </div>

      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-6" noValidate>
        {/* 1 · Informações */}
        <Card data-tour="course-info">
          <div className="border-b border-line px-6 py-4">
            <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">1 · Informações</p>
          </div>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <Field label="Nome do curso" icon={<Type size={15} />} className="md:col-span-2">
              <input
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                className={profileFieldClass}
                placeholder="Ex.: Integração de novos colaboradores"
                autoFocus={!editing}
              />
            </Field>
            <Field label="Categoria" icon={<FolderOpen size={15} />}>
              <select value={form.category} onChange={(event) => update('category', event.target.value)} className={profileFieldClass}>
                {options.categories.length === 0 ? <option value="">Cadastre em Configurações</option> : null}
                {[...new Set([...options.categories, form.category].filter(Boolean))].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Carga horária (h)" icon={<Clock3 size={15} />}>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={form.durationHours}
                  onChange={(event) => update('durationHours', event.target.value)}
                  className={profileFieldClass}
                />
              </Field>
              <Field label="Pontos" icon={<Award size={15} />}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.points}
                  onChange={(event) => update('points', event.target.value)}
                  className={profileFieldClass}
                />
              </Field>
            </div>
            <Field label="Descrição" icon={<FileText size={15} />} className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Resumo exibido na aba Visão geral da aula"
                className={cn(profileFieldClass, 'h-auto resize-y py-2.5')}
              />
            </Field>
            <div
              data-tour="course-certificate"
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2"
            >
              <div className="flex items-center gap-3">
                <Switch checked={form.certificate} onChange={(value) => update('certificate', value)} label="Gera certificado" />
                <div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                    <BadgeCheck size={15} className="text-muted" /> Gera certificado?
                  </p>
                  <p className="text-xs text-muted">
                    {form.certificate
                      ? 'Ao concluir, o colaborador recebe o certificado com nome, curso, carga horária e código de verificação.'
                      : 'O curso não emite certificado ao ser concluído.'}
                  </p>
                </div>
              </div>
              {form.certificate ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Eye size={15} />}
                  onClick={() => setCertificatePreview(previewCertificate())}
                  className="shrink-0 self-start sm:self-center"
                >
                  Ver prévia
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        {/* 2 · Destinado a (vale para o curso inteiro) */}
        <Card data-tour="course-audience">
          <div className="flex flex-col gap-1 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">2 · Destinado a</p>
              <p className="mt-0.5 text-xs text-muted">Vale para o curso inteiro, com todas as etapas.</p>
            </div>
            <span className="text-xs text-muted">
              {audienceCount === 0
                ? 'Ninguém selecionado'
                : `${audienceCount} colaborador${audienceCount > 1 ? 'es recebem' : ' recebe'} o curso`}
            </span>
          </div>
          <div className="flex flex-col gap-6 p-6">
            <AudiencePicker options={options} value={form.audience} onChange={(value) => update('audience', value)} />

            <div
              data-tour="course-mandatory"
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Switch checked={form.mandatory} onChange={(value) => update('mandatory', value)} label="Curso obrigatório" />
                <div>
                  <p className="text-sm font-medium text-ink">Curso obrigatório</p>
                  <p className="text-xs text-muted">Aparece em Prazos e conta nos obrigatórios em aberto.</p>
                </div>
              </div>
              {form.mandatory ? (
                <label className="flex items-center gap-2">
                  <CalendarClock size={15} className="text-muted" />
                  <span className="text-xs font-semibold text-ink">Prazo</span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => update('dueDate', event.target.value)}
                    className={cn(profileFieldClass, 'w-44')}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </Card>

        {/* 3 · Etapas (pipeline) e conteúdo da etapa selecionada */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">3 · Etapas</p>
              <h2 className="mt-0.5 font-display text-lg font-semibold text-ink">Pipeline do curso</h2>
              <p className="text-xs text-muted">
                {stages.length} etapa{stages.length > 1 ? 's' : ''} · {unitsCount} para concluir
              </p>
            </div>
            <div data-tour="course-sequence" className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <Switch
                checked={form.sequential}
                onChange={(value) => update('sequential', value)}
                label="Sequência obrigatória"
              />
              <div>
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                  <ListOrdered size={15} className="text-muted" /> Sequência obrigatória
                </p>
                <p className="text-xs text-muted">
                  {form.sequential ? 'Cada etapa libera após concluir a anterior.' : 'O colaborador faz as etapas em qualquer ordem.'}
                </p>
              </div>
            </div>
          </div>

          <div data-tour="course-pipeline" className="bg-surface/60 pt-5">
            <StagePipeline
              stages={stages}
              selectedKey={selectedKey}
              sequential={form.sequential}
              onSelect={setSelectedKey}
              onMove={handleMove}
              onAdd={addStage}
              examTitles={examTitles}
            />
          </div>

          {selected ? (
            <div data-tour="course-stage-editor" className="border-t border-line">
              <StageEditor
                key={selected.stage.key}
                stage={selected.stage}
                number={stageNumber(stages, selected.stage.key)}
                isChild={Boolean(selected.parent)}
                canMoveBack={selected.index > 0}
                canMoveForward={selected.index < selectedList.length - 1}
                nextTitle={nextTopStage ? nextTopStage.title.trim() || `Etapa ${selected.topIndex + 2}` : null}
                canRemove={Boolean(selected.parent) || stages.length > 1}
                onChange={(patch) => setStages((current) => updateStage(current, selected.stage.key, patch))}
                onMove={moveSelected}
                onNest={nestSelected}
                onUnnest={unnestSelected}
                onAddChild={() => addChildTo(selected.parent?.key ?? selected.stage.key)}
                onRemove={() => requestRemove(selected.stage)}
                exams={exams}
                onCreateExam={() => setExamEditor({ examId: null, stageKey: selected.stage.key })}
                onEditExam={(examId) => setExamEditor({ examId, stageKey: selected.stage.key })}
              />
            </div>
          ) : null}
        </Card>

        <div
          data-tour="course-footer"
          className="flex flex-col-reverse gap-3 rounded-2xl border border-line bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-end"
        >
          <Button variant="ghost" type="button" onClick={() => navigate('/admin/conteudos')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} icon={saving ? <Spinner className="h-4 w-4" /> : undefined}>
            {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar curso'}
          </Button>
        </div>
      </form>

      <CertificateModal data={certificatePreview} onClose={() => setCertificatePreview(null)} preview />

      <ExamEditorModal
        open={examEditor !== null}
        examId={examEditor?.examId ?? null}
        onClose={() => setExamEditor(null)}
        onSaved={(exam) => {
          if (examEditor) setStages((current) => updateStage(current, examEditor.stageKey, { examId: exam.id }))
          setExamEditor(null)
          loadExams()
        }}
      />

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Excluir etapa?"
        confirmLabel="Excluir etapa"
        confirmIcon={<Trash2 size={16} />}
        tone="danger"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) removeNow(pendingRemoval.key)
          setPendingRemoval(null)
        }}
      >
        <p>
          <strong className="text-ink">{pendingRemoval?.title.trim() || 'Esta etapa'}</strong>
          {pendingRemoval && isGroup(pendingRemoval)
            ? ` e suas ${pendingRemoval.children.length} subetapa${pendingRemoval.children.length > 1 ? 's' : ''} serão removidas`
            : ' será removida'}{' '}
          ao salvar o curso. O progresso dos colaboradores nela é perdido.
        </p>
      </ConfirmDialog>
    </div>
  )
}

function Field({
  label,
  icon,
  className,
  children,
}: {
  label: string
  icon: ReactNode
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
    </label>
  )
}
