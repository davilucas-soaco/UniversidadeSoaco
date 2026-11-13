import { useEffect, useState } from 'react'
import { videoThumbnailUrl, vimeoThumbnail, type VideoEmbedInfo } from '@/lib/videoEmbed'

/** Miniatura do vídeo; no Vimeo chega depois da consulta ao oEmbed (null enquanto isso). */
export function useVideoThumbnail(info: VideoEmbedInfo | null) {
  const direct = info ? videoThumbnailUrl(info) : null
  const vimeoId = info?.provider === 'vimeo' ? info.id : null
  const [resolved, setResolved] = useState<{ id: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!vimeoId) return
    let active = true
    void vimeoThumbnail(vimeoId).then((url) => {
      if (active) setResolved({ id: vimeoId, url })
    })
    return () => {
      active = false
    }
  }, [vimeoId])

  if (direct) return direct
  return resolved && resolved.id === vimeoId ? resolved.url : null
}
