import type { VideoProvider } from '@/types'

export type VideoEmbedInfo = {
  provider: VideoProvider
  id: string
  embedUrl: string
  watchUrl: string
}

// Parâmetros que reduzem ao mínimo os links para fora da plataforma (o logo do YouTube não pode ser removido).
const youtubeParams = 'rel=0&iv_load_policy=3&modestbranding=1&playsinline=1'
const vimeoParams = 'title=0&byline=0&portrait=0&dnt=1'
const loomParams = 'hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true'

function youtube(id: string): VideoEmbedInfo {
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, '')
  return {
    provider: 'youtube',
    id: clean,
    embedUrl: `https://www.youtube-nocookie.com/embed/${clean}?${youtubeParams}`,
    watchUrl: `https://www.youtube.com/watch?v=${clean}`,
  }
}

export function parseVideoUrl(raw: string): VideoEmbedInfo | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id ? youtube(id) : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v')
    if (v) return youtube(v)
    const parts = url.pathname.split('/').filter(Boolean)
    if ((parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') && parts[1]) {
      return youtube(parts[1])
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[0] === 'video' ? parts[1] : parts.find((part) => /^\d+$/.test(part))
    if (id && /^\d+$/.test(id)) {
      return {
        provider: 'vimeo',
        id,
        embedUrl: `https://player.vimeo.com/video/${id}?${vimeoParams}`,
        watchUrl: `https://vimeo.com/${id}`,
      }
    }
  }

  if (host === 'loom.com' || host.endsWith('.loom.com')) {
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[0] === 'share' || parts[0] === 'embed' ? parts[1] : parts[0]
    if (id) {
      return {
        provider: 'loom',
        id,
        embedUrl: `https://www.loom.com/embed/${id}?${loomParams}`,
        watchUrl: `https://www.loom.com/share/${id}`,
      }
    }
  }

  return null
}

/** Miniatura pública do vídeo. Null no Vimeo, que não tem URL fixa: use `vimeoThumbnail`. */
export function videoThumbnailUrl(info: VideoEmbedInfo) {
  if (info.provider === 'youtube') return `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`
  if (info.provider === 'vimeo') return null
  return `https://cdn.loom.com/sessions/thumbnails/${info.id}-00001.jpg`
}

const vimeoThumbnails = new Map<string, Promise<string | null>>()

/** Miniatura do Vimeo pelo oEmbed público (aceita chamadas do navegador e vídeos não listados). */
export function vimeoThumbnail(id: string) {
  let pending = vimeoThumbnails.get(id)
  if (!pending) {
    const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}&width=1280`
    pending = fetch(url)
      .then((response) => (response.ok ? (response.json() as Promise<{ thumbnail_url?: string }>) : null))
      .then((data) => data?.thumbnail_url ?? null)
      .catch(() => null)
    vimeoThumbnails.set(id, pending)
  }
  return pending
}

export const videoProviderLabel: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  loom: 'Loom',
}
