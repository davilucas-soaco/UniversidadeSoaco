import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CalendarClock, Eye, FileText, ListOrdered, RefreshCw, Type } from 'lucide-react'
import { AudiencePicker } from '@/components/admin/AudiencePicker'
import { TrailCoursesEditor } from '@/components/admin/TrailCoursesEditor'
import { CertificateModal } from '@/components/certificates/CertificateModal'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { useCatalog } from '@/context/CatalogContext'
import { useFeedback } from '@/context/FeedbackContext'
import { courseAdminApi, trailAdminApi } from '@/lib/adminApi'
import { audienceReach, type AudienceSelection } from '@/lib/audience'
import type { CertificateData } from '@/lib/certificate'
import { cn } from '@/lib/cn'
import type { AdminCourse, AdminTrail, CourseAudienceOptions } from '@/types'

type FormState = {
  title: string
  description: string
  sequential: boolean
  certificate: boolean
  courseIds: string[]
  audience: AudienceSelection
  mandatory: boolean
  dueDate: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  sequential: true,
  certificate: true,
  courseIds: [],
  audience: { userIds: [], sectorIds: [], classIds: [] },
  mandatory: false,
  dueDate: '',
}

function formFromTrail(trail: AdminTrail): FormState {
  return {
    title: trail.title,
    description: trail.description,
    sequential: trail.sequential,
    certificate: trail.certificate,
    courseIds: trail.courses.map((course) => course.id),
    audience: {
      userIds: trail.audience.users.map((item) => item.id),
      sectorIds: trail.audience.sectors.map((item) => item.id),
      classIds: trail.audience.classes.map((item) => item.id),
    },
    mandatory: trail.mandatory,
    dueDate: trail.dueDate ?? '',
  }
}

/** Cadastro e edição de trilhas (rota /admin/trilhas/nova e /admin/trilhas/:trailId/editar). */
export function TrailFormPage() {
  const { trailId } = useParams()
  const editing = Boolean(trailId)
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { reload: reloadCatalog } = useCatalog()

  const [options, setOptions] = useState<CourseAudienceOptions | null>(null)
  const [courses, setCourses] = useState<AdminCourse[] | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [certificatePreview, setCertificatePreview] = useState<CertificateData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([courseAdminApi.options(), courseAdminApi.list(), trailId ? trailAdminApi.get(trailId) : Promise.resolve(null)])
      .then(([loadedOptions, loadedCourses, trail]) => {
        if (!active) return
        setOptions(loadedOptions)
        setCourses(loadedCourses)
        if (trail) setForm(formFromTrail(trail))
      })
      .catch((caught: unknown) => {
        if (active) setLoadError(caught instanceof Error ? caught.message : 'Não foi possível carregar a trilha.')
      })
    return () => {
      active = false
    }
  }, [trailId])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const audienceCount = options ? audienceReach(options, form.audience) : 0
  const totalHours = (courses ?? [])
    .filter((course) => form.courseIds.includes(course.id))
    .reduce((total, course) => total + course.durationHours, 0)

  const previewCertificate = (): CertificateData => ({
    name: 'Nome do Colaborador',
    course: form.title.trim() || 'Nome da trilha',
    category: 'Trilha',
    hours: totalHours > 0 ? totalHours : 1,
    issuedAt: new Date().toISOString(),
    code: `USA-${new Date().getFullYear()}-EXEMPLO`,
    trail: { coursesCount: Math.max(form.courseIds.length, 2) },
  })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.title.trim().length < 2) return showToast('Informe o nome da trilha.')
    if (form.courseIds.length < 2) return showToast('Vincule pelo menos dois cursos à trilha.')
    if (form.mandatory && !form.dueDate) return showToast('Defina o prazo da trilha obrigatória.')

    const input = {
      title: form.title.trim(),
      description: form.description.trim(),
      sequential: form.sequential,
      certificate: form.certificate,
      courseIds: form.courseIds,
      audience: form.audience,
      mandatory: form.mandatory,
      dueDate: form.mandatory ? form.dueDate : null,
    }

    setSaving(true)
    try {
      if (trailId) await trailAdminApi.update(trailId, input)
      else await trailAdminApi.create(input)
      reloadCatalog()
      showToast(editing ? 'Trilha atualizada.' : 'Trilha cadastrada.')
      navigate('/admin/conteudos?aba=trilhas')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível salvar a trilha.')
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted">{loadError}</p>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => navigate('/admin/conteudos?aba=trilhas')}>
          Voltar para a Gestão de conteúdos
        </Button>
      </div>
    )
  }

  if (!options || !courses) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col pb-12">
      <Link
        to="/admin/conteudos?aba=trilhas"
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Gestão de conteúdos
      </Link>

      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
          {editing ? 'Edição' : 'Cadastro'}
        </p>
        <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">
          {editing ? 'Editar trilha' : 'Nova trilha'}
        </h1>
        <p className="mt-1 text-sm text-muted">Dê um nome, escolha para quem a trilha vai e coloque os cursos na ordem.</p>
      </div>

      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-6" noValidate>
        {/* 1 · Informações */}
        <Card data-tour="trail-info">
          <div className="border-b border-line px-6 py-4">
            <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">1 · Informações</p>
          </div>
          <div className="flex flex-col gap-5 p-6">
            <Field label="Nome da trilha" icon={<Type size={15} />}>
              <input
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                className={profileFieldClass}
                placeholder="Ex.: Formação em Compras"
                autoFocus={!editing}
              />
            </Field>
            <Field label="Descrição" icon={<FileText size={15} />}>
              <textarea
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="O que o colaborador aprende ao concluir a trilha"
                className={cn(profileFieldClass, 'h-auto resize-y py-2.5')}
              />
            </Field>
            <div
              data-tour="trail-certificate"
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Switch checked={form.certificate} onChange={(value) => update('certificate', value)} label="Gera certificado" />
                <div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                    <BadgeCheck size={15} className="text-muted" /> Gera certificado?
                  </p>
                  <p className="text-xs text-muted">
                    {form.certificate
                      ? 'Ao concluir todos os cursos, o colaborador recebe o certificado da trilha com a carga horária total.'
                      : 'A trilha não emite certificado próprio (os cursos seguem com o certificado deles).'}
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

        {/* 2 · Destinado a */}
        <Card data-tour="trail-audience">
          <div className="flex flex-col gap-1 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">2 · Destinado a</p>
              <p className="mt-0.5 text-xs text-muted">Quem recebe a trilha passa a ter todos os cursos dela.</p>
            </div>
            <span className="text-xs text-muted">
              {audienceCount === 0
                ? 'Ninguém selecionado'
                : `${audienceCount} colaborador${audienceCount > 1 ? 'es recebem' : ' recebe'} a trilha`}
            </span>
          </div>
          <div className="flex flex-col gap-6 p-6">
            <AudiencePicker options={options} value={form.audience} onChange={(value) => update('audience', value)} />

            <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Switch checked={form.mandatory} onChange={(value) => update('mandatory', value)} label="Trilha obrigatória" />
                <div>
                  <p className="text-sm font-medium text-ink">Trilha obrigatória</p>
                  <p className="text-xs text-muted">Os cursos da trilha entram nos obrigatórios e em Prazos.</p>
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

        {/* 3 · Cursos */}
        <Card data-tour="trail-courses">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">3 · Cursos</p>
              <p className="mt-0.5 text-xs text-muted">Adicione os cursos e arraste para definir a ordem.</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <Switch checked={form.sequential} onChange={(value) => update('sequential', value)} label="Sequência obrigatória" />
              <div>
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                  <ListOrdered size={15} className="text-muted" /> Sequência obrigatória
                </p>
                <p className="text-xs text-muted">
                  {form.sequential ? 'Cada curso libera ao concluir o anterior.' : 'Os cursos podem ser feitos em qualquer ordem.'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <TrailCoursesEditor
              courses={courses}
              value={form.courseIds}
              sequential={form.sequential}
              onChange={(value) => update('courseIds', value)}
            />
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 rounded-2xl border border-line bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" type="button" onClick={() => navigate('/admin/conteudos?aba=trilhas')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} icon={saving ? <Spinner className="h-4 w-4" /> : undefined}>
            {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar trilha'}
          </Button>
        </div>
      </form>

      <CertificateModal data={certificatePreview} onClose={() => setCertificatePreview(null)} preview />
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold tracking-wide text-ink">
        <span className="text-muted">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  )
}
