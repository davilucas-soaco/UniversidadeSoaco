import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownAZ, ArrowDownZA, ArrowDown, ArrowUp, Check, ListFilter, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type SortDirection = 'asc' | 'desc'

export type FilterOption = { value: string; count: number }

type ColumnFilterProps = {
  label: string
  options: FilterOption[]
  /** null = todos os valores (sem filtro). */
  selected: Set<string> | null
  onChange: (selected: Set<string> | null) => void
  sort: SortDirection | null
  onSort: (direction: SortDirection) => void
  sortLabels?: { asc: string; desc: string }
  align?: 'left' | 'right'
}

const POPOVER_WIDTH = 272

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Cabeçalho de coluna com filtro por valores e ordenação, no estilo do Excel. */
export function ColumnFilter({
  label,
  options,
  selected,
  onChange,
  sort,
  onSort,
  sortLabels = { asc: 'Ordenar de A a Z', desc: 'Ordenar de Z a A' },
  align = 'left',
}: ColumnFilterProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Set<string>>(new Set())

  const active = selected !== null

  const openPopover = () => {
    setDraft(new Set(selected ?? options.map((option) => option.value)))
    setQuery('')
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const left = align === 'right' ? rect.right - POPOVER_WIDTH : rect.left
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8)),
    })
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const close = () => setOpen(false)
    const onScroll = (event: Event) => {
      if (popoverRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const visibleOptions = useMemo(() => {
    const term = normalize(query.trim())
    return term ? options.filter((option) => normalize(option.value).includes(term)) : options
  }, [options, query])

  const allVisibleChecked = visibleOptions.length > 0 && visibleOptions.every((option) => draft.has(option.value))

  const toggleAll = () =>
    setDraft((current) => {
      const next = new Set(current)
      for (const option of visibleOptions) {
        if (allVisibleChecked) next.delete(option.value)
        else next.add(option.value)
      }
      return next
    })

  const toggle = (value: string) =>
    setDraft((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  const apply = () => {
    const everything = options.every((option) => draft.has(option.value))
    onChange(everything ? null : new Set(draft))
    setOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`Filtrar ${label.toLocaleLowerCase('pt-BR')}`}
        className={cn(
          'group inline-flex items-center gap-1.5 rounded-md py-1 pr-1 pl-0 font-semibold tracking-wider uppercase transition hover:text-ink',
          (active || open) && 'text-accent hover:text-accent',
          align === 'right' && 'ml-auto',
        )}
      >
        {label}
        {sort === 'asc' ? <ArrowUp size={12} /> : sort === 'desc' ? <ArrowDown size={12} /> : null}
        <span
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded border transition',
            active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-fill text-muted group-hover:text-ink',
          )}
        >
          <ListFilter size={12} strokeWidth={2.2} />
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={`Filtro de ${label}`}
              className="soaco-popover fixed z-[90] flex flex-col overflow-hidden rounded-xl text-sm normal-case"
              style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
            >
              <div className="flex flex-col border-b border-line p-1.5">
                {(['asc', 'desc'] as const).map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    onClick={() => {
                      onSort(direction)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium tracking-normal hover:bg-fill',
                      sort === direction ? 'text-accent' : 'text-ink',
                    )}
                  >
                    {direction === 'asc' ? <ArrowDownAZ size={15} /> : <ArrowDownZA size={15} />}
                    {sortLabels[direction]}
                    {sort === direction ? <Check size={14} className="ml-auto" /> : null}
                  </button>
                ))}
                {active ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium tracking-normal text-danger hover:bg-fill"
                  >
                    <X size={15} />
                    Limpar filtro de “{label}”
                  </button>
                ) : null}
              </div>

              <div className="p-2.5">
                <label className="flex items-center gap-2 rounded-lg border border-line bg-fill px-2.5 py-1.5 focus-within:border-accent/60">
                  <Search size={14} className="text-muted" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Pesquisar"
                    className="w-full bg-transparent text-xs tracking-normal text-ink placeholder:text-muted/60 focus:outline-none"
                    autoFocus
                  />
                </label>
              </div>

              <div className="max-h-60 overflow-y-auto px-1.5 pb-1.5">
                {visibleOptions.length === 0 ? (
                  <p className="px-2.5 py-3 text-center text-xs tracking-normal text-muted">Nenhum valor encontrado.</p>
                ) : (
                  <>
                    <CheckRow checked={allVisibleChecked} onToggle={toggleAll} label="(Selecionar tudo)" />
                    {visibleOptions.map((option) => (
                      <CheckRow
                        key={option.value}
                        checked={draft.has(option.value)}
                        onToggle={() => toggle(option.value)}
                        label={option.value}
                        count={option.count}
                      />
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-line p-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold tracking-normal text-ink hover:bg-fill"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={apply}
                  disabled={draft.size === 0}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold tracking-normal text-accent-ink hover:bg-accent-strong disabled:opacity-40"
                >
                  OK
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function CheckRow({
  checked,
  onToggle,
  label,
  count,
}: {
  checked: boolean
  onToggle: () => void
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs tracking-normal text-ink hover:bg-fill"
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
          checked ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface',
        )}
      >
        {checked ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined ? <span className="text-[11px] text-muted">{count}</span> : null}
    </button>
  )
}
