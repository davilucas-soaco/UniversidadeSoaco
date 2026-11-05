import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'navy' | 'sand' | 'steel' | 'gold' | 'ivory'

const tones: Record<Tone, string> = {
  navy: 'bg-midnight text-ivory',
  sand: 'bg-fill text-ink',
  steel: 'bg-ocean/20 text-golden',
  gold: 'bg-golden/20 text-golden',
  ivory: 'bg-fill text-muted',
}

export function Badge({
  className,
  tone = 'sand',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
