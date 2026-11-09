import { cn } from '@/lib/cn'

type Option<T extends string> = {
  value: T
  label: string
  count?: number
}

/** Seletor segmentado: fundo gelo, aba ativa em branco com azul. */
export function PillTabs<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'sm',
}: {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex max-w-full overflow-x-auto rounded-xl border border-line bg-surface p-1', className)}
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'soaco-press shrink-0 rounded-lg font-display font-semibold tracking-[0.02em] whitespace-nowrap',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              active ? 'bg-elevated text-accent shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span className={cn('ml-1.5 text-[11px]', active ? 'text-accent/80' : 'text-muted/70')}>
                ({option.count})
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
