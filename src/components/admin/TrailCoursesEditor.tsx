import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Plus, Search, X } from 'lucide-react'
import { CourseCover } from '@/components/content/CourseCover'
import { cn } from '@/lib/cn'
import { formatMinutes } from '@/lib/format'
import type { AdminCourse } from '@/types'

const MAX_SUGGESTIONS = 8

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hoursLabel(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : formatMinutes(Math.round(hours * 60))
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** Cursos da trilha: busca para incluir e lista na ordem (arrastar ou setas para reordenar). */
export function TrailCoursesEditor({
  courses,
  value,
  sequential,
  onChange,
}: {
  courses: AdminCourse[]
  value: string[]
  sequential: boolean
  onChange: (value: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const byId = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  const selected = value.map((id) => byId.get(id)).filter((course): course is AdminCourse => Boolean(course))

  const suggestions = useMemo(() => {
    const term = normalize(query.trim())
    return courses
      .filter((course) => !value.includes(course.id))
      .filter((course) => !term || normalize(`${course.title} ${course.category}`).includes(term))
      .slice(0, MAX_SUGGESTIONS)
  }, [courses, query, value])

  const add = (id: string) => {
    onChange([...value, id])
    setQuery('')
    setHighlight(0)
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlight((current) => Math.min(current + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const course = suggestions[highlight]
      if (course) add(course.id)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const finishDrag = () => {
    if (dragIndex !== null && dropIndex !== null && dropIndex !== dragIndex) {
      onChange(move(value, dragIndex, dropIndex > dragIndex ? dropIndex - 1 : dropIndex))
    }
    setDragIndex(null)
    setDropIndex(null)
  }

  const totalHours = selected.reduce((total, course) => total + course.durationHours, 0)
  const available = courses.length - value.length

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-fill px-3 py-2.5 transition-colors focus-within:border-accent/60">
          <Search size={16} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
              setHighlight(0)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder={available > 0 ? 'Buscar curso para adicionar à trilha...' : 'Todos os cursos já estão na trilha'}
            disabled={available === 0}
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none disabled:cursor-not-allowed"
          />
          {query ? (
            <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')} className="text-muted hover:text-ink">
              <X size={15} />
            </button>
          ) : null}
        </label>

        {open && available > 0 ? (
          <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-line bg-elevated shadow-float">
            {suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">Nenhum curso encontrado para "{query}".</p>
            ) : (
              suggestions.map((course, index) => (
                <button
                  key={course.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => add(course.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                    index === highlight ? 'bg-fill' : 'hover:bg-fill/60',
                  )}
                >
                  <CourseCover
                    accent="navy"
                    icon="book"
                    image={course.coverImage ?? undefined}
                    title={course.title}
                    compact
                    className="h-9 w-16 shrink-0 rounded-md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{course.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {course.category} · {hoursLabel(course.durationHours)}
                    </span>
                  </span>
                  <Plus size={16} className="shrink-0 text-accent" />
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum curso na trilha ainda</p>
          <p className="mt-1 text-xs text-muted">Busque acima e adicione os cursos na ordem em que devem ser feitos.</p>
        </div>
      ) : (
        <ol
          className="flex flex-col gap-2"
          onDragOver={(event) => {
            if (dragIndex !== null) event.preventDefault()
          }}
          onDrop={(event) => {
            event.preventDefault()
            finishDrag()
          }}
        >
          {selected.map((course, index) => (
            <li
              key={course.id}
              draggable
              onDragStart={(event) => {
                setDragIndex(index)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', course.id)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setDropIndex(null)
              }}
              onDragOver={(event) => {
                if (dragIndex === null) return
                event.preventDefault()
                const rect = event.currentTarget.getBoundingClientRect()
                setDropIndex(event.clientY < rect.top + rect.height / 2 ? index : index + 1)
              }}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 pr-3 transition',
                dragIndex === index && 'opacity-40',
                dropIndex === index && dragIndex !== null && 'before:absolute before:inset-x-3 before:-top-[5px] before:h-0.5 before:rounded-full before:bg-accent',
                dropIndex === index + 1 &&
                  index === selected.length - 1 &&
                  dragIndex !== null &&
                  'after:absolute after:inset-x-3 after:-bottom-[5px] after:h-0.5 after:rounded-full after:bg-accent',
              )}
            >
              <GripVertical size={16} className="shrink-0 cursor-grab text-muted/60 active:cursor-grabbing" aria-hidden />
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold',
                  sequential ? 'bg-accent text-accent-ink' : 'bg-fill text-ink',
                )}
              >
                {index + 1}
              </span>
              <CourseCover
                accent="navy"
                icon="book"
                image={course.coverImage ?? undefined}
                title={course.title}
                compact
                className="hidden h-10 w-[72px] shrink-0 rounded-lg sm:block"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{course.title}</p>
                <p className="truncate text-xs text-muted">
                  {course.category} · {hoursLabel(course.durationHours)}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  title="Subir"
                  aria-label={`Subir ${course.title}`}
                  disabled={index === 0}
                  onClick={() => onChange(move(value, index, index - 1))}
                  className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  title="Descer"
                  aria-label={`Descer ${course.title}`}
                  disabled={index === selected.length - 1}
                  onClick={() => onChange(move(value, index, index + 1))}
                  className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  title="Remover da trilha"
                  aria-label={`Remover ${course.title} da trilha`}
                  onClick={() => onChange(value.filter((id) => id !== course.id))}
                  className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-danger"
                >
                  <X size={15} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {selected.length > 0 ? (
        <p className="text-xs text-muted">
          {selected.length} {selected.length === 1 ? 'curso' : 'cursos'} · {hoursLabel(totalHours)} no total
          {sequential ? ' · cada curso libera ao concluir o anterior' : ' · o colaborador faz os cursos em qualquer ordem'}
        </p>
      ) : null}
    </div>
  )
}
