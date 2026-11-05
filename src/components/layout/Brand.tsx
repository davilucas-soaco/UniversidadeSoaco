import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import logoOnLight from '@/assets/brand/logo-soaco-on-light.png'
import logoOnDark from '@/assets/brand/logo-soaco.png'
import logoMark from '@/assets/brand/logo-soaco-mark.png'

export function BrandMark({
  className,
  onDark = false,
  compact = false,
}: {
  className?: string
  onDark?: boolean
  compact?: boolean
}) {
  const src = compact ? logoMark : onDark ? logoOnDark : logoOnLight

  return (
    <Link to="/" className={cn('flex shrink-0 items-center justify-center', className)} aria-label="Universidade Só Aço">
      <img
        src={src}
        alt="Universidade Só Aço"
        className={cn(
          'object-contain object-center',
          compact ? 'h-9 w-9' : 'h-11 w-auto max-w-[168px]',
        )}
      />
    </Link>
  )
}
