import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ExternalLink, Layers, ListOrdered, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AdminTrailsPanel } from '@/components/admin/AdminTrailsPanel'
import { CourseCover } from '@/components/content/CourseCover'
import { PillTabs } from '@/components/ui/PillTabs'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useCatalog } from '@/context/CatalogContext'
import { useFeedback } from '@/context/FeedbackContext'
import { courseAdminApi } from '@/lib/adminApi'
import { documentKindLabel } from '@/lib/documents'
import { formatDate, formatMinutes, formatNumber } from '@/lib/format'
import { videoProviderLabel } from '@/lib/videoEmbed'
import type { AdminCourse } from '@/types'

const NOT_ASSIGNED = '(Não atribuído)'

function audienceValues(course: AdminCourse) {
  const values = [
    ...course.audience.classes.map((item) => `Classe · ${item.name}`),
    ...course.audience.sectors.map((item) => `Setor · ${item.name}`),
    ...course.audience.users.map((item) => `Colaborador · ${item.name}`),
    ...course.trails.map((item) => `Trilha · ${item.title}`),
  ]
  return values.length > 0 ? values : [NOT_ASSIGNED]
}

function courseUnits(course: AdminCourse) {
  return course.stages.flatMap((stage) => (stage.children.length > 0 ? stage.children : [stage]))
}

function contentValues(course: AdminCourse) {
  const values = courseUnits(course).flatMap((unit) =>
    unit.kind === 'video'
      ? [unit.videoProvider ? videoProviderLabel[unit.videoProvider] : 'Vídeo']
      : unit.kind === 'exam'
        ? ['Prova']
        : unit.documents.map((doc) => documentKindLabel(doc.mime, doc.name)),
  )
  return values.length > 0 ? [...new Set(values)] : ['Sem conteúdo']
}

function stagesLabel(count: number) {
  return `${count} etapa${count === 1 ? '' : 's'}`
}

function hoursLabel(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : formatMinutes(Math.round(hours * 60))
}

export function AdminContentsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: 'cursos' | 'trilhas' = params.get('aba') === 'trilhas' ? 'trilhas' : 'cursos'
  const { showToast } = useFeedback()
  const { reload: reloadCatalog } = useCatalog()
  const [courses, setCourses] = useState<AdminCourse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<AdminCourse | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setCourses(await courseAdminApi.list())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar os cursos.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const removeCourse = async () => {
    if (!removing) return
    try {
      await courseAdminApi.remove(removing.id)
      setCourses((current) => current?.filter((item) => item.id !== removing.id) ?? current)
      reloadCatalog()
      showToast(`"${removing.title}" foi excluído.`)
      setRemoving(null)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível excluir o curso.')
    }
  }

  const columns = useMemo<DataTableColumn<AdminCourse>[]>(
    () => [
      {
        key: 'title',
        header: 'Curso',
        filterValues: (course) => [course.title],
        className: 'w-full max-w-0',
        render: (course) => (
          <div className="flex min-w-0 items-center gap-3">
            <CourseCover
              accent="navy"
              icon={course.coverImage ? 'book' : 'clipboard'}
              image={course.coverImage ?? undefined}
              title={course.title}
              compact
              className="h-11 w-20 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-ink">{course.title}</p>
              <p className="truncate text-[11px] text-muted">{course.category}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'stages',
        header: 'Etapas',
        filterValues: (course) => [stagesLabel(course.unitsCount)],
        sortValue: (course) => course.unitsCount,
        sortLabels: { asc: 'Menos etapas primeiro', desc: 'Mais etapas primeiro' },
        optionOrder: 'sort-asc',
        className: 'whitespace-nowrap',
        render: (course) => (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Layers size={15} className="text-accent" />
            {stagesLabel(course.unitsCount)}
          </span>
        ),
      },
      {
        key: 'content',
        header: 'Conteúdo',
        filterValues: contentValues,
        className: 'whitespace-nowrap text-muted',
        render: (course) => contentValues(course).join(', '),
      },
      {
        key: 'sequential',
        header: 'Sequência',
        filterValues: (course) => [course.sequential ? 'Obrigatória' : 'Livre'],
        className: 'whitespace-nowrap text-muted',
        render: (course) =>
          course.sequential ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <ListOrdered size={15} className="text-accent" /> Obrigatória
            </span>
          ) : (
            'Livre'
          ),
      },
      {
        key: 'audience',
        header: 'Destinado a',
        filterValues: audienceValues,
        emptyValues: [NOT_ASSIGNED],
        render: (course) => {
          const values = audienceValues(course)
          if (values[0] === NOT_ASSIGNED) {
            return (
              <span className="rounded-full border border-line bg-fill px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-muted">
                Não atribuído
              </span>
            )
          }
          return (
            <div className="flex max-w-[260px] flex-wrap gap-1">
              {values.slice(0, 3).map((value) => (
                <span key={value} className="rounded-full bg-fill px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-ink">
                  {value}
                </span>
              ))}
              {values.length > 3 ? (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent" title={values.slice(3).join('\n')}>
                  +{values.length - 3}
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        key: 'mandatory',
        header: 'Obrigatório',
        filterValues: (course) => [course.mandatory ? 'Sim' : 'Não'],
        className: 'whitespace-nowrap text-muted',
        render: (course) =>
          course.mandatory ? (
            <span className="font-semibold text-ink">
              Sim{course.dueDate ? <span className="font-normal text-muted"> · até {formatDate(course.dueDate)}</span> : null}
            </span>
          ) : (
            'Não'
          ),
      },
      {
        key: 'duration',
        header: 'Carga',
        filterValues: (course) => [hoursLabel(course.durationHours)],
        sortValue: (course) => course.durationHours,
        sortLabels: { asc: 'Menor carga primeiro', desc: 'Maior carga primeiro' },
        optionOrder: 'sort-asc',
        className: 'whitespace-nowrap text-muted',
        render: (course) => hoursLabel(course.durationHours),
      },
      {
        key: 'points',
        header: 'Pontos',
        filterValues: (course) => [`${formatNumber(course.points)} pts`],
        sortValue: (course) => course.points,
        sortLabels: { asc: 'Menos pontos primeiro', desc: 'Mais pontos primeiro' },
        optionOrder: 'sort-desc',
        className: 'whitespace-nowrap text-muted',
        render: (course) => `${formatNumber(course.points)} pts`,
      },
      {
        key: 'createdAt',
        header: 'Cadastrado em',
        filterValues: (course) => [formatDate(course.createdAt)],
        sortValue: (course) => new Date(course.createdAt).getTime(),
        sortLabels: { asc: 'Mais antigo primeiro', desc: 'Mais recente primeiro' },
        optionOrder: 'sort-desc',
        className: 'whitespace-nowrap text-muted',
        render: (course) => formatDate(course.createdAt),
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        render: (course) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Editar"
              aria-label={`Editar ${course.title}`}
              onClick={() => navigate(`/admin/conteudos/${course.id}/editar`)}
              className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              title="Abrir aula"
              aria-label={`Abrir aula de ${course.title}`}
              onClick={() => navigate(`/aula/${course.id}`)}
              className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink"
            >
              <ExternalLink size={16} />
            </button>
            <button
              type="button"
              title="Excluir"
              aria-label={`Excluir ${course.title}`}
              onClick={() => setRemoving(course)}
              className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col pb-12">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">Governança</p>
          <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">
            Gestão de conteúdos
          </h1>
          <p className="mt-1 text-sm text-muted">Cadastre os cursos e as trilhas e defina para quem cada um vai.</p>
        </div>
        {tab === 'trilhas' ? (
          <Button data-tour="admin-trails-new" icon={<Plus size={16} />} onClick={() => navigate('/admin/trilhas/nova')}>
            Nova trilha
          </Button>
        ) : (
          <Button data-tour="admin-courses-new" icon={<Plus size={16} />} onClick={() => navigate('/admin/conteudos/novo')}>
            Novo curso
          </Button>
        )}
      </div>

      <PillTabs
        value={tab}
        onChange={(value) => setParams(value === 'cursos' ? {} : { aba: value }, { replace: true })}
        options={[
          { value: 'cursos', label: 'Cursos', count: courses?.length },
          { value: 'trilhas', label: 'Trilhas' },
        ]}
        size="md"
        className="mb-6 self-start"
      />

      {tab === 'trilhas' ? (
        <AdminTrailsPanel />
      ) : error ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void load()}>
            Tentar novamente
          </Button>
        </Card>
      ) : !courses ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Plus size={26} />}
            title="Nenhum curso cadastrado ainda"
            description="Monte as etapas com vídeos (YouTube, Vimeo ou Loom) ou documentos PDF, Word e Excel."
            action={<Button onClick={() => navigate('/admin/conteudos/novo')}>Cadastrar curso</Button>}
          />
        </Card>
      ) : (
        <div data-tour="admin-courses-table">
          <DataTable
            rows={courses}
            columns={columns}
            rowKey={(course) => course.id}
            search={{ placeholder: 'Buscar curso ou categoria...', text: (course) => `${course.title} ${course.category}` }}
            initialSort={{ key: 'createdAt', direction: 'desc' }}
            itemLabel={{ singular: 'curso', plural: 'cursos' }}
            minWidth="1100px"
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir curso"
        confirmLabel="Excluir"
        confirmIcon={<Trash2 size={16} />}
        onCancel={() => setRemoving(null)}
        onConfirm={removeCourse}
      >
        <p>
          Tem certeza que deseja excluir <strong className="text-ink">{removing?.title}</strong>? O curso sai da lista de
          todos os colaboradores, junto com o progresso, as avaliações e os arquivos enviados.{' '}
          <strong className="text-ink">Esta ação não pode ser desfeita.</strong>
        </p>
      </ConfirmDialog>
    </div>
  )
}
