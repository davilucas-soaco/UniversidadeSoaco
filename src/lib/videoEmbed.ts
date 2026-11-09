import type { VideoProvider } from '@/types'

export type VideoEmbedInfo = {
  provider: VideoProvider
  id: string
  embedUrl: string
  watchUrl: string
}

function youtube(id: string): VideoEmbedInfo {
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, '')
  return {
    provider: 'youtube',
    id: clean,
    embedUrl: `https://www.youtube.com/embed/${clean}`,
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
        embedUrl: `https://player.vimeo.com/video/${id}`,
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
        embedUrl: `https://www.loom.com/embed/${id}`,
        watchUrl: `https://www.loom.com/share/${id}`,
      }
    }
  }

  return null
}

export const videoProviderLabel: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  loom: 'Loom',
}
