import { cn } from '@/lib/cn'

export function Sparkline({
  values,
  className,
  color = '#dad775',
}: {
  values: number[]
  className?: string
  color?: string
}) {
  const width = 88
  const height = 36
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width
      const y = height - ((value - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-9 w-[88px]', className)} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}
