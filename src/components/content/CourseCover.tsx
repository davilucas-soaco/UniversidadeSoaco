import { cn } from '@/lib/cn'
import type { CoverAccent, CoverIcon as CoverIconName } from '@/types'
import { CoverIcon } from './CoverIcon'

const accents: Record<CoverAccent, string> = {
  navy: 'linear-gradient(135deg, #0b2348 0%, #163a6e 58%, #5b9bff 160%)',
  ocean: 'linear-gradient(135deg, #0b2348 0%, #2e6bff 46%, #a8c8ff 100%)',
  steel: 'linear-gradient(145deg, #163a6e 0%, #3b82f6 42%, #5b9bff 100%)',
  sand: 'linear-gradient(135deg, #0b2348 0%, #5b9bff 78%, #dbeafe 100%)',
  gold: 'linear-gradient(135deg, #0b2348 0%, #163a6e 42%, #2e6bff 100%)',
}

export function CourseCover({
  accent,
  icon,
  image,
  title,
  className,
  compact = false,
}: {
  accent: CoverAccent
  icon: CoverIconName
  image?: string
  title: string
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn('relative overflow-hidden bg-[#0b1320]', className)}
      style={image ? undefined : { backgroundImage: accents[accent], backgroundColor: '#111B2D' }}
    >
      {image ? (
        <img src={image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      ) : compact ? (
        <div className="relative flex h-full items-center justify-center text-ivory">
          <CoverIcon name={icon} />
        </div>
      ) : (
        <>
          <div className="steel-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="absolute -right-8 -bottom-10 h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute top-5 right-8 h-14 w-14 rounded-full border border-[#c1e8ff]/35" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#5b9bff]/80 to-transparent" />
          <div className="relative flex h-full items-end p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/20 text-ivory ring-1 ring-white/20 backdrop-blur-[2px]">
              <CoverIcon name={icon} />
            </div>
          </div>
        </>
      )}
      <p className="sr-only">{title}</p>
    </div>
  )
}
