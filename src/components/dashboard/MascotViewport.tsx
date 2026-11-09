import { useCourseSummary } from '@/context/CatalogContext'
import { progressStatusLabel } from '@/lib/courseStats'
import { cn } from '@/lib/cn'

const MASCOT_URL = '/mascot/soaco-mascot.png?v=edges2'

export function MascotViewport({ className }: { className?: string }) {
  const percent = useCourseSummary().averageProgress

  return (
    <div
      className={cn(
        'relative z-10 -mb-6 w-max max-w-full shrink-0 sm:-mb-8 lg:-mr-2',
        className,
      )}
    >
      <img
        src={MASCOT_URL}
        alt="Mascote da Universidade Só Aço"
        className="block h-[300px] w-auto max-w-full object-contain object-bottom select-none sm:h-[340px] lg:h-[380px]"
        draggable={false}
      />
      <div className="pointer-events-none absolute right-2 bottom-8">
        <span className="rounded-full border border-line bg-elevated/85 px-3 py-1 font-display text-[11px] font-semibold text-ink shadow-sm backdrop-blur-md">
          {percent}% · {progressStatusLabel(percent)}
        </span>
      </div>
    </div>
  )
}
