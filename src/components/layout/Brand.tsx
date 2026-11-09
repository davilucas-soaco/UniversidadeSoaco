import { Link } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/cn'
import logoStackedLight from '@/assets/brand/logo-soaco-stacked-on-light.png'
import logoStackedNavy from '@/assets/brand/logo-soaco-stacked-on-dark.png'
import logoStackedCharcoal from '@/assets/brand/logo-soaco-stacked-on-charcoal.png'
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
  const { isDark } = useTheme()
  const stacked = onDark ? (isDark ? logoStackedCharcoal : logoStackedNavy) : logoStackedLight
  const src = compact ? logoMark : stacked

  return (
    <Link to="/" className={cn('flex shrink-0 items-center justify-center', className)} aria-label="Universidade Só Aço">
      <img
        src={src}
        alt="Universidade Só Aço"
        className={cn(
          'object-contain object-center',
          compact ? 'h-9 w-9' : 'h-[4.75rem] w-auto max-w-[158px]',
        )}
      />
    </Link>
  )
}
