import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { pageMeta } from '@/data/navigation'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/cn'

const screens = Object.entries(pageMeta).map(([to, meta]) => ({
  to,
  label: meta.title,
  subtitle: meta.subtitle,
}))

export function HeaderSearch({ className }: { className?: string }) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const typedQuery = query.trim()
  const showResults = typedQuery.length > 0

  const results = useMemo(() => {
    const value = typedQuery.toLowerCase()
    if (!value) return []
    return screens
      .filter(
        (screen) =>
          screen.label.toLowerCase().includes(value) || screen.subtitle.toLowerCase().includes(value),
      )
      .slice(0, 6)
  }, [typedQuery])

  const close = () => {
    setQuery('')
    setFocused(false)
    inputRef.current?.blur()
  }

  useClickOutside(rootRef, close, showResults || focused)

  return (
    <div ref={rootRef} className={cn('relative w-full max-w-[420px]', className)}>
      <label className="soaco-glass flex h-10 w-full items-center rounded-full text-muted">
        <Search size={16} strokeWidth={1.8} className="ml-3.5 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
          }}
          placeholder="Pesquisar telas..."
          aria-label="Pesquisar telas"
          className="h-full min-w-0 flex-1 bg-transparent pr-3 pl-2 text-sm text-ink outline-none placeholder:text-muted/70"
        />
      </label>

      {showResults ? (
        <div className="absolute top-[calc(100%+0.7rem)] left-0 z-[80] w-full min-w-72 overflow-hidden rounded-3xl border border-line bg-elevated shadow-float backdrop-blur-xl">
          <p className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">Telas</p>
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">Nenhuma tela encontrada para “{query}”.</p>
          ) : (
            results.map((screen) => (
              <button
                key={screen.to}
                type="button"
                className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-fill"
                onClick={() => {
                  navigate(screen.to)
                  close()
                }}
              >
                <span className="text-sm font-semibold text-ink">{screen.label}</span>
                <span className="text-xs text-muted">{screen.subtitle}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
