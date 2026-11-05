import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Tooltip({
  label,
  children,
  side = 'right',
}: {
  label: string
  children: ReactNode
  side?: 'right' | 'top'
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-lg bg-elevated px-2.5 py-1 text-[11px] font-medium text-ink shadow-panel ring-1 ring-line group-hover:block',
          side === 'right' && 'top-1/2 left-[calc(100%+0.6rem)] -translate-y-1/2',
          side === 'top' && 'bottom-[calc(100%+0.45rem)] left-1/2 -translate-x-1/2',
        )}
      >
        {label}
      </span>
    </span>
  )
}
