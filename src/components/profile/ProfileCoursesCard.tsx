import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { courses } from '@/data/courses'
import { courseStartedAt } from '@/data/profile'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CourseStatus } from '@/types'

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

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function ProfileCoursesCard() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const term = normalize(query)
    return courses
      .filter((course) => !term || normalize(course.title).includes(term) || normalize(course.category).includes(term))
      .slice(0, 8)
  }, [query])

  return (
    <Card className="h-full">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Cursos</h2>
          <div className="flex items-center gap-2">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5">
              <Search size={14} className="text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar..."
                className="w-32 bg-transparent text-xs text-ink outline-none placeholder:text-muted/70 sm:w-40"
              />
            </label>
            <button
              type="button"
              onClick={() => navigate('/conteudos')}
              className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition hover:bg-fill"
            >
              Ver todos
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                <th className="pb-3 font-semibold">Curso</th>
                <th className="pb-3 font-semibold">Início</th>
                <th className="pb-3 font-semibold">Prazo</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((course) => (
                <tr
                  key={course.id}
                  className="cursor-pointer border-t border-line/80 transition hover:bg-fill/60"
                  onClick={() => navigate(`/aula/${course.id}`)}
                >
                  <td className="py-3 pr-3">
                    <p className="font-medium text-ink">{course.title}</p>
                    <p className="text-[11px] text-muted">{course.category}</p>
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-muted">
                    {courseStartedAt[course.id] ? formatDate(courseStartedAt[course.id]) : '—'}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-muted">
                    {course.dueDate ? formatDate(course.dueDate) : '—'}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        statusClass[course.status],
                      )}
                    >
                      {statusLabel[course.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
