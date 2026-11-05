import { cn } from '@/lib/cn'
import type { CoverAccent, CoverIcon as CoverIconName } from '@/types'
import { CoverIcon } from './CoverIcon'

const accents: Record<CoverAccent, string> = {
  navy: 'linear-gradient(135deg, #111B2D 0%, #1a2f4d 58%, #C49A73 160%)',
  ocean: 'linear-gradient(135deg, #172A43 0%, #263F60 46%, #52677F 100%)',
  steel: 'linear-gradient(145deg, #263F60 0%, #52677F 42%, #C49A73 100%)',
  sand: 'linear-gradient(135deg, #172A43 0%, #8a6d52 78%, #DAD775 100%)',
  gold: 'linear-gradient(135deg, #111B2D 0%, #263F60 42%, #C49A73 100%)',
}

export function CourseCover({
  accent,
  icon,
  title,
  className,
  compact = false,
}: {
  accent: CoverAccent
  icon: CoverIconName
  title: string
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ backgroundImage: accents[accent], backgroundColor: '#111B2D' }}
    >
      {compact ? null : (
        <>
          <div className="steel-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="absolute -right-8 -bottom-10 h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute top-5 right-8 h-14 w-14 rounded-full border border-[#DAD775]/35" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#DAD775]/80 to-transparent" />
        </>
      )}
      <div className={cn('relative flex h-full items-end p-4', compact && 'items-center justify-center p-0')}>
        <div
          className={cn(
            'flex items-center justify-center rounded-xl bg-black/20 text-ivory ring-1 ring-white/20 backdrop-blur-[2px]',
            compact ? 'h-full w-full rounded-2xl' : 'h-11 w-11',
          )}
        >
          <CoverIcon name={icon} />
        </div>
        <p className="sr-only">{title}</p>
      </div>
    </div>
  )
}
