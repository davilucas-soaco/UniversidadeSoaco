import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, LayoutGrid, Search } from 'lucide-react'
import { useCatalog } from '@/context/CatalogContext'
import { pageMeta } from '@/data/navigation'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/cn'

const screens = Object.entries(pageMeta)
  .filter(([to]) => !to.includes(':'))
  .map(([to, meta]) => ({
    to,
    label: meta.title,
    subtitle: meta.subtitle,
  }))

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function HeaderSearch({ className }: { className?: string }) {
  const { courses } = useCatalog()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const typedQuery = query.trim()
  const showResults = typedQuery.length > 0

  const results = useMemo(() => {
    const value = normalize(typedQuery)
    if (!value) return { screens: [], courses: [] }
    return {
      screens: screens
        .filter(
          (screen) => normalize(screen.label).includes(value) || normalize(screen.subtitle).includes(value),
        )
        .slice(0, 4),
      courses: courses
        .filter(
          (course) => normalize(course.title).includes(value) || normalize(course.category).includes(value),
        )
        .slice(0, 5),
    }
  }, [courses, typedQuery])

  const close = () => {
    setQuery('')
    setFocused(false)
    inputRef.current?.blur()
  }

  useClickOutside(rootRef, close, showResults || focused)

  const empty = results.screens.length === 0 && results.courses.length === 0

  return (
    <div ref={rootRef} className={cn('relative w-full max-w-[420px]', className)}>
      <label className="flex h-11 w-full items-center rounded-lg bg-surface text-muted ring-1 ring-line transition focus-within:ring-[var(--soaco-accent)]">
        <Search size={18} strokeWidth={1.8} className="ml-3.5 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
            if (event.key === 'Enter') {
              const first = results.courses[0]
                ? `/aula/${results.courses[0].id}`
                : results.screens[0]?.to
              if (first) {
                navigate(first)
                close()
              }
            }
          }}
          placeholder="Buscar cursos..."
          aria-label="Buscar cursos"
          className="h-full min-w-0 flex-1 bg-transparent pr-3 pl-2.5 text-sm text-ink outline-none placeholder:text-muted/70"
        />
      </label>

      {showResults ? (
        <div className="absolute top-[calc(100%+0.6rem)] left-0 z-[80] w-full min-w-80 overflow-hidden rounded-xl border border-line bg-elevated shadow-float">
          {empty ? (
            <p className="px-4 py-4 text-sm text-muted">Nenhum resultado para “{query}”.</p>
          ) : null}

          {results.courses.length ? (
            <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
                Cursos
              </p>
              {results.courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-fill"
                  onClick={() => {
                    navigate(`/aula/${course.id}`)
                    close()
                  }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fill text-[var(--soaco-accent)]">
                    <BookOpen size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{course.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {course.category} · {course.progress}%
                    </span>
                  </span>
                </button>
              ))}
            </>
          ) : null}

          {results.screens.length ? (
            <>
              <p className="border-t border-line px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
                Telas
              </p>
              {results.screens.map((screen) => (
                <button
                  key={screen.to}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-fill"
                  onClick={() => {
                    navigate(screen.to)
                    close()
                  }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fill text-muted">
                    <LayoutGrid size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{screen.label}</span>
                    <span className="block truncate text-xs text-muted">{screen.subtitle}</span>
                  </span>
                </button>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
