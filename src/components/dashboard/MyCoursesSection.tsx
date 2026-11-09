import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CourseCard } from '@/components/content/CourseCard'
import { PillTabs } from '@/components/ui/PillTabs'
import { useCatalog, useCourseSummary } from '@/context/CatalogContext'
import type { CourseStatus } from '@/types'

type Filter = 'todos' | CourseStatus

const filters: { value: Filter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluídos' },
  { value: 'pendente', label: 'Pendentes' },
]

export function MyCoursesSection() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('todos')
  const { courses } = useCatalog()
  const { featured } = useCourseSummary()

  const visible = useMemo(() => {
    if (filter === 'todos') return featured.length > 0 ? featured : courses.slice(0, 3)
    return courses.filter((course) => course.status === filter).slice(0, 3)
  }, [courses, featured, filter])

  return (
    <section
      id="tour-courses"
      className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-elevated p-6 shadow-md"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-line/80 pb-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl leading-7 font-semibold tracking-tight text-ink">Meus cursos</h2>
          <p className="text-xs text-muted">Continue de onde parou</p>
        </div>
        <PillTabs value={filter} options={filters} onChange={setFilter} />
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          {courses.length === 0 ? 'Nenhum curso foi destinado a você ainda.' : 'Nenhum curso nesta categoria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 md:grid-cols-3">
          {visible.map((course) => (
            <CourseCard key={course.id} course={course} onOpen={() => navigate(`/aula/${course.id}`)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/conteudos')}
        className="mt-auto inline-flex items-center gap-1.5 self-end font-display text-xs font-semibold text-accent hover:underline"
      >
        Ver todos os cursos <ArrowRight size={14} />
      </button>
    </section>
  )
}
