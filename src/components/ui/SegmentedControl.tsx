import { cn } from '@/lib/cn'

type Option<T extends string> = {
  value: T
  label: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-full bg-fill p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            value === option.value
              ? 'bg-elevated text-ink shadow-sm'
              : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
