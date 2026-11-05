import { cn } from '@/lib/cn'

const palettes = [
  'bg-midnight text-ivory',
  'bg-ocean text-ivory',
  'bg-navy-ink text-golden',
  'bg-steel text-ivory',
  'bg-warm-sand text-midnight',
]

function paletteFor(name: string) {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
  return palettes[sum % palettes.length]
}

type AvatarProps = {
  name: string
  initials: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  highlighted?: boolean
}

const sizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
}

export function Avatar({ name, initials, size = 'md', className, highlighted }: AvatarProps) {
  return (
    <div
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide',
        paletteFor(name),
        sizes[size],
        highlighted && 'ring-2 ring-golden ring-offset-2 ring-offset-elevated',
        className,
      )}
    >
      {initials}
    </div>
  )
}
