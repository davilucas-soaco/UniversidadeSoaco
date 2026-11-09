import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { FilterX, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ColumnFilter, type FilterOption, type SortDirection } from '@/components/ui/ColumnFilter'
import { cn } from '@/lib/cn'

/**
 * Tabela padrão do sistema: busca, filtro por valores e ordenação em cada coluna (estilo Excel).
 * Toda tabela nova deve usar este componente — ver .cursor/rules/tabelas-datatable.mdc.
 */
export type DataTableColumn<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Valores da célula para o filtro (vários = coluna multivalorada, ex.: classes). Ausente = sem filtro. */
  filterValues?: (row: T) => string[]
  /** Valor de ordenação. Padrão: os valores do filtro unidos. Ausente nos dois = coluna não ordena. */
  sortValue?: (row: T) => string | number
  sortLabels?: { asc: string; desc: string }
  /** Ordem da lista de valores no filtro: alfabética ou pela ordenação da coluna. */
  optionOrder?: 'alpha' | 'sort-asc' | 'sort-desc'
  /** Valores "vazios" (ex.: "(Sem setor)", "Nunca"), exibidos no fim da lista do filtro. */
  emptyValues?: string[]
  align?: 'left' | 'right'
  className?: string
}

type DataTableProps<T> = {
  rows: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  search?: { placeholder: string; text: (row: T) => string }
  initialSort?: { key: string; direction: SortDirection }
  /** Botões extras à direita da barra de busca. */
  actions?: ReactNode
  /** Mostra no máximo N linhas (ex.: resumos em cards). */
  limit?: number
  emptyMessage?: string
  rowClassName?: (row: T) => string | undefined
  onRowClick?: (row: T) => void
  minWidth?: string
  /** "card" = com borda própria; "plain" = para usar dentro de outro Card. */
  variant?: 'card' | 'plain'
  /** Espaçamento reduzido para colunas estreitas (ex.: cards laterais do dashboard). */
  dense?: boolean
  itemLabel?: { singular: string; plural: string }
}

type Filters = Record<string, Set<string>>

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'pt-BR', { numeric: true })
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  search,
  initialSort,
  actions,
  limit,
  emptyMessage = 'Nenhum registro corresponde à busca e aos filtros.',
  rowClassName,
  onRowClick,
  minWidth = '720px',
  variant = 'card',
  dense = false,
  itemLabel = { singular: 'registro', plural: 'registros' },
}: DataTableProps<T>) {
  const cellPadding = dense ? 'px-2 py-2' : 'px-4 py-3'
  const headPadding = dense ? 'px-2 py-2' : 'px-4 py-2.5'
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(initialSort ?? null)

  const columnByKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns])

  const sortValueOf = useCallback((column: DataTableColumn<T>, row: T) => {
    if (column.sortValue) return column.sortValue(row)
    return column.filterValues ? column.filterValues(row).join(', ') : ''
  }, [])

  const matches = useCallback(
    (row: T, except?: string) => {
      const term = normalize(query.trim())
      if (term && search && !normalize(search.text(row)).includes(term)) return false
      return Object.entries(filters).every(([key, selected]) => {
        if (key === except) return true
        const values = columnByKey.get(key)?.filterValues?.(row) ?? []
        return values.some((value) => selected.has(value))
      })
    },
    [columnByKey, filters, query, search],
  )

  const filtered = useMemo(() => {
    const result = rows.filter((row) => matches(row))
    const column = sort ? columnByKey.get(sort.key) : undefined
    if (sort && column) {
      result.sort((a, b) => {
        const order = compareValues(sortValueOf(column, a), sortValueOf(column, b))
        return sort.direction === 'asc' ? order : -order
      })
    }
    return result
  }, [columnByKey, matches, rows, sort, sortValueOf])

  /** Como no Excel: a lista de cada coluna considera os filtros das demais. */
  const optionsFor = (column: DataTableColumn<T>): FilterOption[] => {
    const entries = new Map<string, { count: number; sortValue: string | number }>()
    for (const row of rows) {
      if (!matches(row, column.key)) continue
      for (const value of column.filterValues?.(row) ?? []) {
        const entry = entries.get(value)
        entries.set(value, { count: (entry?.count ?? 0) + 1, sortValue: entry?.sortValue ?? sortValueOf(column, row) })
      }
    }
    const empty = new Set(column.emptyValues ?? [])
    const order = column.optionOrder ?? 'alpha'
    return [...entries.entries()]
      .sort(([a, ea], [b, eb]) => {
        if (empty.has(a) !== empty.has(b)) return empty.has(a) ? 1 : -1
        if (order === 'sort-asc') return compareValues(ea.sortValue, eb.sortValue)
        if (order === 'sort-desc') return compareValues(eb.sortValue, ea.sortValue)
        return compareValues(a, b)
      })
      .map(([value, entry]) => ({ value, count: entry.count }))
  }

  const setColumnFilter = (key: string, selected: Set<string> | null) =>
    setFilters((current) => {
      const next = { ...current }
      if (selected) next[key] = selected
      else delete next[key]
      return next
    })

  const activeFilters = Object.keys(filters).length
  const visible = limit ? filtered.slice(0, limit) : filtered
  const noun = (count: number) => (count === 1 ? itemLabel.singular : itemLabel.plural)
  const clearAll = () => {
    setFilters({})
    setQuery('')
  }

  return (
    <div className={cn(variant === 'card' && 'overflow-hidden rounded-2xl border border-line bg-elevated shadow-card')}>
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center',
          variant === 'card' ? 'border-b border-line p-4' : 'pb-4',
        )}
      >
        {search ? (
          <label className="flex flex-1 items-center rounded-xl border border-line bg-fill px-4 py-2 transition-colors focus-within:border-accent/60">
            <Search size={18} className="mr-2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={search.placeholder}
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
            />
            {query ? (
              <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')} className="text-muted hover:text-ink">
                <X size={16} />
              </button>
            ) : null}
          </label>
        ) : (
          <div className="flex-1" />
        )}
        <p className="text-xs whitespace-nowrap text-muted">
          {filtered.length} de {rows.length} {noun(rows.length)}
        </p>
        {activeFilters > 0 ? (
          <Button variant="secondary" size="sm" icon={<FilterX size={15} />} onClick={() => setFilters({})}>
            Limpar filtros ({activeFilters})
          </Button>
        ) : null}
        {actions}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead>
            <tr className="text-[11px] text-muted">
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue || column.filterValues)
                return (
                  <th
                    key={column.key}
                    className={cn(headPadding, 'font-semibold', column.align === 'right' && 'text-right')}
                  >
                    {column.filterValues ? (
                      <ColumnFilter
                        label={column.header}
                        options={optionsFor(column)}
                        selected={filters[column.key] ?? null}
                        onChange={(selected) => setColumnFilter(column.key, selected)}
                        sort={sort?.key === column.key ? sort.direction : null}
                        onSort={(direction) => setSort({ key: column.key, direction })}
                        sortLabels={column.sortLabels}
                        align={column.align}
                      />
                    ) : sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort({
                            key: column.key,
                            direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc',
                          })
                        }
                        className="font-semibold tracking-wider uppercase hover:text-ink"
                      >
                        {column.header}
                      </button>
                    ) : (
                      <span className="tracking-wider uppercase">{column.header}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr className="border-t border-line/80">
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">
                  {emptyMessage}{' '}
                  {activeFilters > 0 || query ? (
                    <button type="button" onClick={clearAll} className="font-semibold text-accent hover:underline">
                      Limpar busca e filtros
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : null}
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-t border-line/80',
                  onRowClick && 'cursor-pointer transition hover:bg-fill/60',
                  rowClassName?.(row),
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(cellPadding, column.align === 'right' && 'text-right', column.className)}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit && filtered.length > limit ? (
        <p className={cn('text-xs text-muted', variant === 'card' ? 'border-t border-line px-4 py-3' : 'pt-3')}>
          Mostrando os primeiros {limit} de {filtered.length} {noun(filtered.length)}.
        </p>
      ) : null}
    </div>
  )
}
