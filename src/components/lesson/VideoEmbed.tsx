import { PlayCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { VideoEmbedInfo } from '@/lib/videoEmbed'

export function VideoEmbed({
  info,
  title,
  className,
}: {
  info: VideoEmbedInfo | null
  title: string
  className?: string
}) {
  if (!info) {
    return (
      <div
        className={cn(
          'flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-black text-center text-white/70',
          className,
        )}
      >
        <PlayCircle size={40} className="text-white/40" />
        <p className="max-w-sm px-6 text-sm">
          Cole um link do YouTube, Vimeo ou Loom para exibir o vídeo no player da plataforma.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative aspect-video w-full overflow-hidden rounded-xl bg-black', className)}>
      <iframe
        title={title}
        src={info.embedUrl}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  )
}
