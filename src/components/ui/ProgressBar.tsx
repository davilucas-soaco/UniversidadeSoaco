import { cn } from '@/lib/cn'

type ProgressBarProps = {
  value: number
  className?: string
  trackClassName?: string
}

export function ProgressBar({ value, className, trackClassName }: ProgressBarProps) {
  const width = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-fill', className)}>
      <div
        className={cn('h-full rounded-full bg-golden transition-[width] duration-500', trackClassName)}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
