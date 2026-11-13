/** Mesmas regras de src/lib/videoEmbed.ts (frontend): YouTube, Vimeo e Loom. */
export type VideoProvedor = 'youtube' | 'vimeo' | 'loom'

export type VideoInfo = {
  provedor: VideoProvedor
  id: string
  embedUrl: string
  watchUrl: string
  /** Null no Vimeo: a miniatura vem do oEmbed (services/capaCurso.ts). */
  miniatura: string | null
}

function youtube(id: string): VideoInfo {
  const limpo = id.replace(/[^a-zA-Z0-9_-]/g, '')
  return {
    provedor: 'youtube',
    id: limpo,
    embedUrl: `https://www.youtube.com/embed/${limpo}`,
    watchUrl: `https://www.youtube.com/watch?v=${limpo}`,
    miniatura: `https://i.ytimg.com/vi/${limpo}/hqdefault.jpg`,
  }
}

export function lerVideo(raw: string): VideoInfo | null {
  const texto = raw.trim()
  if (!texto) return null

  let url: URL
  try {
    url = new URL(texto.includes('://') ? texto : `https://${texto}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  const partes = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') return partes[0] ? youtube(partes[0]) : null

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v')
    if (v) return youtube(v)
    if (['embed', 'shorts', 'live'].includes(partes[0] ?? '') && partes[1]) return youtube(partes[1])
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = partes[0] === 'video' ? partes[1] : partes.find((parte) => /^\d+$/.test(parte))
    if (id && /^\d+$/.test(id)) {
      return {
        provedor: 'vimeo',
        id,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        watchUrl: `https://vimeo.com/${id}`,
        miniatura: null,
      }
    }
  }

  if (host === 'loom.com' || host.endsWith('.loom.com')) {
    const id = partes[0] === 'share' || partes[0] === 'embed' ? partes[1] : partes[0]
    if (id) {
      return {
        provedor: 'loom',
        id,
        embedUrl: `https://www.loom.com/embed/${id}`,
        watchUrl: `https://www.loom.com/share/${id}`,
        miniatura: `https://cdn.loom.com/sessions/thumbnails/${id}-00001.jpg`,
      }
    }
  }

  return null
}
