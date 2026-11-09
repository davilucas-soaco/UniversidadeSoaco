import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { useCatalog } from '@/context/CatalogContext'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Course, CourseStatus } from '@/types'

const statusLabel: Record<CourseStatus, string> = {
  em_andamento: 'Ativo',
  concluido: 'Concluído',
  pendente: 'Pendente',
}

const statusClass: Record<CourseStatus, string> = {
  em_andamento: 'bg-success/15 text-success',
  concluido: 'bg-accent-2/15 text-accent-2',
  pendente: 'bg-accent/15 text-accent',
}

const NOT_STARTED = 'Não iniciado'
const NO_DEADLINE = 'Sem prazo'

const dateTime = (iso?: string) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).getTime() : 0)

const columns: DataTableColumn<Course>[] = [
  {
    key: 'title',
    header: 'Curso',
    filterValues: (course) => [course.title],
    render: (course) => <p className="font-medium text-ink">{course.title}</p>,
  },
  {
    key: 'category',
    header: 'Categoria',
    filterValues: (course) => [course.category],
    className: 'text-muted',
    render: (course) => course.category,
  },
  {
    key: 'startedAt',
    header: 'Início',
    filterValues: (course) => [course.startedAt ? formatDate(course.startedAt) : NOT_STARTED],
    sortValue: (course) => dateTime(course.startedAt),
    sortLabels: { asc: 'Mais antigo primeiro', desc: 'Mais recente primeiro' },
    optionOrder: 'sort-desc',
    emptyValues: [NOT_STARTED],
    className: 'whitespace-nowrap text-muted',
    render: (course) => (course.startedAt ? formatDate(course.startedAt) : '—'),
  },
  {
    key: 'dueDate',
    header: 'Prazo',
    filterValues: (course) => [course.dueDate ? formatDate(course.dueDate) : NO_DEADLINE],
    sortValue: (course) => dateTime(course.dueDate),
    sortLabels: { asc: 'Prazo mais próximo primeiro', desc: 'Prazo mais distante primeiro' },
    optionOrder: 'sort-asc',
    emptyValues: [NO_DEADLINE],
    className: 'whitespace-nowrap text-muted',
    render: (course) => (course.dueDate ? formatDate(course.dueDate) : '—'),
  },
  {
    key: 'status',
    header: 'Status',
    filterValues: (course) => [statusLabel[course.status]],
    render: (course) => (
      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold', statusClass[course.status])}>
        {statusLabel[course.status]}
      </span>
    ),
  },
]

export function ProfileCoursesCard() {
  const navigate = useNavigate()
  const { courses } = useCatalog()

  return (
    <Card className="h-full">
      <CardContent className="p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Cursos</h2>
        <DataTable
          variant="plain"
          rows={courses}
          columns={columns}
          rowKey={(course) => course.id}
          search={{ placeholder: 'Buscar curso ou categoria...', text: (course) => `${course.title} ${course.category}` }}
          limit={8}
          onRowClick={(course) => navigate(`/aula/${course.id}`)}
          emptyMessage={courses.length === 0 ? 'Nenhum curso foi destinado a você ainda.' : 'Nenhum curso corresponde à busca e aos filtros.'}
          itemLabel={{ singular: 'curso', plural: 'cursos' }}
          minWidth="640px"
          actions={
            <button
              type="button"
              onClick={() => navigate('/conteudos')}
              className="rounded-lg border border-line px-3 py-2 text-xs font-semibold whitespace-nowrap text-ink transition hover:bg-fill"
            >
              Ver todos
            </button>
          }
        />
      </CardContent>
    </Card>
  )
}
