import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CourseCard } from '@/components/content/CourseCard'
import { PillTabs } from '@/components/ui/PillTabs'
import { courses } from '@/data/courses'
import { featuredCourses } from '@/data/dashboard'
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

  const visible = useMemo(() => {
    if (filter === 'todos') return featuredCourses
    return courses.filter((course) => course.status === filter).slice(0, 3)
  }, [filter])

  return (
    <section id="tour-courses" className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl leading-7 font-semibold tracking-tight text-ink">Meus cursos</h2>
          <p className="text-xs text-muted">Continue de onde parou</p>
        </div>
        <PillTabs value={filter} options={filters} onChange={setFilter} />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Nenhum curso nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-visible px-1 sm:grid-cols-2 md:grid-cols-3">
          {visible.map((course) => (
            <CourseCard key={course.id} course={course} onOpen={() => navigate(`/aula/${course.id}`)} />
          ))}
        </div>
      )}
    </section>
  )
}
