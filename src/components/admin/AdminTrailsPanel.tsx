import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, ListOrdered, Pencil, Plus, RefreshCw, Route, Trash2 } from 'lucide-react'
import { CourseCover } from '@/components/content/CourseCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useCatalog } from '@/context/CatalogContext'
import { useFeedback } from '@/context/FeedbackContext'
import { trailAdminApi } from '@/lib/adminApi'
import { formatDate, formatMinutes } from '@/lib/format'
import type { AdminTrail } from '@/types'

const NOT_ASSIGNED = '(Não atribuído)'

function audienceValues(trail: AdminTrail) {
  const values = [
    ...trail.audience.classes.map((item) => `Classe · ${item.name}`),
    ...trail.audience.sectors.map((item) => `Setor · ${item.name}`),
    ...trail.audience.users.map((item) => `Colaborador · ${item.name}`),
  ]
  return values.length > 0 ? values : [NOT_ASSIGNED]
}

function hoursLabel(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : formatMinutes(Math.round(hours * 60))
}

function coursesLabel(count: number) {
  return `${count} curso${count === 1 ? '' : 's'}`
}

/** Aba "Trilhas" da Gestão de conteúdos. */
export function AdminTrailsPanel() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { reload: reloadCatalog } = useCatalog()
  const [trails, setTrails] = useState<AdminTrail[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<AdminTrail | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setTrails(await trailAdminApi.list())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar as trilhas.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const removeTrail = async () => {
    if (!removing) return
    try {
      await trailAdminApi.remove(removing.id)
      setTrails((current) => current?.filter((item) => item.id !== removing.id) ?? current)
      reloadCatalog()
      showToast(`"${removing.title}" foi excluída.`)
      setRemoving(null)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível excluir a trilha.')
    }
  }

  const columns = useMemo<DataTableColumn<AdminTrail>[]>(
    () => [
      {
        key: 'title',
        header: 'Trilha',
        filterValues: (trail) => [trail.title],
        className: 'w-full max-w-0',
        render: (trail) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-20 shrink-0 -space-x-6">
              {trail.courses.slice(0, 3).map((course) => (
                <CourseCover
                  key={course.id}
                  accent="navy"
                  icon="book"
                  image={course.coverImage ?? undefined}
                  title={course.title}
                  compact
                  className="h-11 w-11 rounded-lg ring-2 ring-elevated"
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-ink">{trail.title}</p>
              <p className="truncate text-[11px] text-muted">{trail.courses.map((course) => course.title).join(' → ')}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'courses',
        header: 'Cursos',
        filterValues: (trail) => [coursesLabel(trail.courses.length)],
        sortValue: (trail) => trail.courses.length,
        sortLabels: { asc: 'Menos cursos primeiro', desc: 'Mais cursos primeiro' },
        optionOrder: 'sort-asc',
        className: 'whitespace-nowrap',
        render: (trail) => (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Route size={15} className="text-accent" />
            {coursesLabel(trail.courses.length)}
          </span>
        ),
      },
      {
        key: 'sequential',
        header: 'Sequência',
        filterValues: (trail) => [trail.sequential ? 'Obrigatória' : 'Livre'],
        className: 'whitespace-nowrap text-muted',
        render: (trail) =>
          trail.sequential ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <ListOrdered size={15} className="text-accent" /> Obrigatória
            </span>
          ) : (
            'Livre'
          ),
      },
      {
        key: 'certificate',
        header: 'Certificado',
        filterValues: (trail) => [trail.certificate ? 'Sim' : 'Não'],
        className: 'whitespace-nowrap text-muted',
        render: (trail) =>
          trail.certificate ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <BadgeCheck size={15} className="text-accent" /> Sim
            </span>
          ) : (
            'Não'
          ),
      },
      {
        key: 'audience',
        header: 'Destinado a',
        filterValues: audienceValues,
        emptyValues: [NOT_ASSIGNED],
        render: (trail) => {
          const values = audienceValues(trail)
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
        key: 'duration',
        header: 'Carga',
        filterValues: (trail) => [hoursLabel(trail.durationHours)],
        sortValue: (trail) => trail.durationHours,
        sortLabels: { asc: 'Menor carga primeiro', desc: 'Maior carga primeiro' },
        optionOrder: 'sort-asc',
        className: 'whitespace-nowrap text-muted',
        render: (trail) => hoursLabel(trail.durationHours),
      },
      {
        key: 'createdAt',
        header: 'Cadastrada em',
        filterValues: (trail) => [formatDate(trail.createdAt)],
        sortValue: (trail) => new Date(trail.createdAt).getTime(),
        sortLabels: { asc: 'Mais antiga primeiro', desc: 'Mais recente primeiro' },
        optionOrder: 'sort-desc',
        className: 'whitespace-nowrap text-muted',
        render: (trail) => formatDate(trail.createdAt),
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        render: (trail) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Editar"
              aria-label={`Editar ${trail.title}`}
              onClick={() => navigate(`/admin/trilhas/${trail.id}/editar`)}
              className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              title="Excluir"
              aria-label={`Excluir ${trail.title}`}
              onClick={() => setRemoving(trail)}
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
    <>
      {error ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void load()}>
            Tentar novamente
          </Button>
        </Card>
      ) : !trails ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : trails.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Route size={26} />}
            title="Nenhuma trilha cadastrada ainda"
            description="Agrupe cursos em uma sequência, defina se a ordem é obrigatória e se a trilha gera certificado."
            action={
              <Button icon={<Plus size={16} />} onClick={() => navigate('/admin/trilhas/nova')}>
                Cadastrar trilha
              </Button>
            }
          />
        </Card>
      ) : (
        <div data-tour="admin-trails-table">
          <DataTable
            rows={trails}
            columns={columns}
            rowKey={(trail) => trail.id}
            search={{
              placeholder: 'Buscar trilha ou curso...',
              text: (trail) => `${trail.title} ${trail.courses.map((course) => course.title).join(' ')}`,
            }}
            initialSort={{ key: 'createdAt', direction: 'desc' }}
            itemLabel={{ singular: 'trilha', plural: 'trilhas' }}
            minWidth="1000px"
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir trilha"
        confirmLabel="Excluir"
        confirmIcon={<Trash2 size={16} />}
        onCancel={() => setRemoving(null)}
        onConfirm={removeTrail}
      >
        <p>
          Tem certeza que deseja excluir <strong className="text-ink">{removing?.title}</strong>? Os cursos continuam
          cadastrados, mas deixam de chegar aos colaboradores pela trilha.{' '}
          <strong className="text-ink">Esta ação não pode ser desfeita.</strong>
        </p>
      </ConfirmDialog>
    </>
  )
}
