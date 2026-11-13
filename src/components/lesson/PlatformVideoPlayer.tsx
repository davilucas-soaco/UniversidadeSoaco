import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import {
  Captions,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import type { VideoEmbedInfo } from '@/lib/videoEmbed'

/* ─── APIs dos players (carregadas sob demanda) ─────────────────────────────── */

type YouTubeCaptionTrack = { languageCode: string; displayName?: string; languageName?: string; kind?: string }

type YouTubePlayer = {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getVideoLoadedFraction(): number
  getPlaybackQuality(): string
  getAvailableQualityLevels(): string[]
  getAvailablePlaybackRates(): number[]
  setVolume(volume: number): void
  mute(): void
  unMute(): void
  setPlaybackRate(rate: number): void
  loadVideoById(options: { videoId: string; startSeconds: number }): void
  loadModule(name: string): void
  getOption(module: string, option: string): unknown
  setOption(module: string, option: string, value: unknown): void
  destroy(): void
}

type VimeoTextTrack = { language: string; kind: string; label: string }

type VimeoPlayer = {
  play(): Promise<void>
  pause(): Promise<void>
  setCurrentTime(seconds: number): Promise<number>
  getDuration(): Promise<number>
  setVolume(volume: number): Promise<number>
  setPlaybackRate(rate: number): Promise<number>
  getTextTracks(): Promise<VimeoTextTrack[]>
  enableTextTrack(language: string, kind?: string): Promise<unknown>
  disableTextTrack(): Promise<void>
  on(event: string, callback: (data: { seconds?: number; duration?: number; percent?: number }) => void): void
  destroy(): Promise<void>
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string
          width: string
          height: string
          host: string
          playerVars: Record<string, string | number>
          events: {
            onReady?: () => void
            onStateChange?: (event: { data: number }) => void
            onApiChange?: () => void
          }
        },
      ) => YouTubePlayer
    }
    onYouTubeIframeAPIReady?: () => void
    Vimeo?: { Player: new (element: HTMLIFrameElement) => VimeoPlayer }
  }
}

const scripts = new Map<string, Promise<void>>()

function loadScript(src: string, ready?: (resolve: () => void) => void) {
  let promise = scripts.get(src)
  if (!promise) {
    promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`))
      if (ready) ready(resolve)
      else script.onload = () => resolve()
      document.head.appendChild(script)
    })
    scripts.set(src, promise)
  }
  return promise
}

const loadYouTube = () =>
  window.YT?.Player
    ? Promise.resolve()
    : loadScript('https://www.youtube.com/iframe_api', (resolve) => {
        const previous = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          previous?.()
          resolve()
        }
      })

const loadVimeo = () => (window.Vimeo?.Player ? Promise.resolve() : loadScript('https://player.vimeo.com/api/player.js'))

/* ─── Contrato comum aos dois players ───────────────────────────────────────── */

type CaptionTrack = { id: string; label: string }

type Controls = {
  play(): void
  pause(): void
  seek(seconds: number): void
  setVolume(volume: number): void
  setMuted(muted: boolean): void
  setRate(rate: number): void
  setTrack(id: string | null): void
  /** Recarrega no mesmo ponto: o player só reduz a qualidade de um vídeo já carregado assim. */
  reload(): void
  destroy(): void
}

type PlayerState = {
  ready: boolean
  playing: boolean
  ended: boolean
  current: number
  duration: number
  /** 0–1 já carregado. */
  buffered: number
  rates: number[]
  tracks: CaptionTrack[]
  /** Qualidades disponíveis no vídeo (chaves de QUALITY_LEVELS, da maior para a menor). */
  levels: string[]
  /** Qualidade que o player está transmitindo agora (chave de QUALITY_LEVELS). */
  streaming: string | null
}

/**
 * Qualidades do YouTube. Escolher uma renderiza o player na largura daquela resolução
 * (e ajusta na tela): o YouTube transmite de acordo com o tamanho do player.
 */
const QUALITY_LEVELS: Record<string, { label: string; badge?: string; height: number; width: number }> = {
  highres: { label: '4320p', badge: '8K', height: 4320, width: 7680 },
  hd2160: { label: '2160p', badge: '4K', height: 2160, width: 3840 },
  hd1440: { label: '1440p', badge: 'HD', height: 1440, width: 2560 },
  hd1080: { label: '1080p', badge: 'HD', height: 1080, width: 1920 },
  hd720: { label: '720p', height: 720, width: 1280 },
  large: { label: '480p', height: 480, width: 854 },
  medium: { label: '360p', height: 360, width: 640 },
  small: { label: '240p', height: 240, width: 426 },
  tiny: { label: '144p', height: 144, width: 256 },
}

/** Players incorporados nunca transmitem abaixo de 480p: as opções menores não teriam efeito. */
const MIN_QUALITY_HEIGHT = 480

/** Quando o player não informa as qualidades do vídeo (Vimeo), oferece as mais comuns. */
const FALLBACK_LEVELS = ['hd1080', 'hd720', 'large']

function sortLevels(levels: string[]) {
  return levels
    .filter((level) => level in QUALITY_LEVELS && QUALITY_LEVELS[level].height >= MIN_QUALITY_HEIGHT)
    .sort((a, b) => QUALITY_LEVELS[b].height - QUALITY_LEVELS[a].height)
}

const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const YT_PLAYING = 1
const YT_ENDED = 0
/** Faixas (em px) recortadas acima e abaixo do vídeo: título e marca do player ficam nelas. */
const CROP = 72

type Menu = 'main' | 'speed' | 'captions' | 'quality'

/** Folhas de miniaturas da barra de progresso (ver /api/cursos/videos/:id/storyboard). */
type Storyboard = {
  width: number
  height: number
  count: number
  cols: number
  rows: number
  intervalMs: number
  pages: string[]
}

const PREVIEW_WIDTH = 192

function rateLabel(rate: number) {
  return rate === 1 ? 'Normal' : String(rate).replace('.', ',')
}

/**
 * Player da plataforma para vídeos do YouTube e do Vimeo, com as funções do player original
 * (velocidade, legendas, qualidade, volume, tela cheia e atalhos). O iframe fica maior que a área
 * visível e uma camada por cima impede cliques nele: nada leva o colaborador para fora do sistema.
 */
export function PlatformVideoPlayer({
  info,
  title,
  className,
  onEnded,
}: {
  info: VideoEmbedInfo
  title: string
  className?: string
  onEnded?: () => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<Controls | null>(null)
  const onEndedRef = useRef(onEnded)
  const [state, setState] = useState<PlayerState>({
    ready: false,
    playing: false,
    ended: false,
    current: 0,
    duration: 0,
    buffered: 0,
    rates: DEFAULT_RATES,
    tracks: [],
    levels: info.provider === 'youtube' ? [] : FALLBACK_LEVELS,
    streaming: null,
  })
  const [failed, setFailed] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolumeState] = useState(100)
  const [rate, setRate] = useState(1)
  const [track, setTrack] = useState<string | null>(null)
  /** 'auto' ou uma chave de QUALITY_LEVELS. */
  const [quality, setQuality] = useState('auto')
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [menu, setMenu] = useState<Menu | null>(null)
  const [hover, setHover] = useState<{ x: number; time: number; width: number } | null>(null)
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)
  // A legenda pode ligar sozinha (preferência da conta do YouTube); só respeitamos isso
  // enquanto o colaborador não escolher pelo nosso menu.
  const captionsChosenRef = useRef(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [started, setStarted] = useState(false)
  const thumbnail = useVideoThumbnail(info)
  const [hdPosterFailed, setHdPosterFailed] = useState(false)
  const poster =
    info.provider === 'youtube' && !hdPosterFailed ? `https://i.ytimg.com/vi/${info.id}/maxresdefault.jpg` : thumbnail

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    if (info.provider !== 'youtube') return
    const controller = new AbortController()
    api<{ storyboard: Storyboard | null }>(`/cursos/videos/${encodeURIComponent(info.id)}/storyboard`, {
      signal: controller.signal,
    })
      .then((data) => setStoryboard(data.storyboard))
      .catch(() => undefined)
    return () => controller.abort()
  }, [info.id, info.provider])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) =>
      setFrameSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const life = { disposed: false }
    let timer: number | undefined
    const mount = document.createElement('div')
    mount.className = 'h-full w-full'
    host.appendChild(mount)

    const update = (patch: Partial<PlayerState>) => {
      if (!life.disposed) setState((current) => ({ ...current, ...patch }))
    }

    if (info.provider === 'youtube') {
      loadYouTube()
        .then(() => {
          if (life.disposed || !window.YT) return
          const desired = { rate: 1, volume: 100, muted: false, track: null as string | null }
          let reapply = false
          const readTracks = () => {
            const active = player.getOption('captions', 'track') as { languageCode?: string } | undefined
            if (active?.languageCode && desired.track === null && !captionsChosenRef.current) {
              desired.track = active.languageCode
              setTrack(active.languageCode)
            }
            const list = player.getOption('captions', 'tracklist')
            if (!Array.isArray(list)) return
            update({
              tracks: (list as YouTubeCaptionTrack[]).map((item) => ({
                id: item.languageCode,
                label: `${item.displayName ?? item.languageName ?? item.languageCode}${item.kind === 'asr' ? ' (automática)' : ''}`,
              })),
            })
          }
          const sample = () => {
            const current = player.getPlaybackQuality()
            const levels = sortLevels(player.getAvailableQualityLevels?.() ?? [])
            update({
              current: player.getCurrentTime() || 0,
              buffered: player.getVideoLoadedFraction() || 0,
              streaming: current in QUALITY_LEVELS ? current : null,
              ...(levels.length ? { levels } : {}),
            })
          }
          const player = new window.YT.Player(mount, {
            videoId: info.id,
            width: '100%',
            height: '100%',
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              cc_load_policy: 0,
              cc_lang_pref: 'pt',
              hl: 'pt-BR',
              enablejsapi: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                const rates = player.getAvailablePlaybackRates()
                update({ ready: true, duration: player.getDuration() || 0, rates: rates.length ? rates : DEFAULT_RATES })
              },
              onApiChange: readTracks,
              onStateChange: (event) => {
                window.clearInterval(timer)
                const playing = event.data === YT_PLAYING
                update({ playing, duration: player.getDuration() || 0, ...(playing ? { ended: false } : {}) })
                sample()
                if (playing && reapply) {
                  // Depois de recarregar, o player volta ao padrão: reaplica as escolhas do colaborador.
                  reapply = false
                  player.setPlaybackRate(desired.rate)
                  player.setVolume(desired.volume)
                  if (desired.muted) player.mute()
                  else player.unMute()
                  if (desired.track) {
                    player.loadModule('captions')
                    player.setOption('captions', 'track', { languageCode: desired.track })
                  }
                }
                if (playing) {
                  // As faixas de legenda só aparecem depois que o vídeo começa.
                  player.loadModule('captions')
                  readTracks()
                  for (const delay of [1500, 4000]) window.setTimeout(() => !life.disposed && readTracks(), delay)
                  timer = window.setInterval(sample, 250)
                }
                if (event.data === YT_ENDED) {
                  update({ ended: true, playing: false })
                  onEndedRef.current?.()
                }
              },
            },
          })
          controlsRef.current = {
            play: () => player.playVideo(),
            pause: () => player.pauseVideo(),
            seek: (seconds) => player.seekTo(seconds, true),
            setVolume: (value) => {
              desired.volume = value
              player.setVolume(value)
            },
            setMuted: (value) => {
              desired.muted = value
              if (value) player.mute()
              else player.unMute()
            },
            setRate: (value) => {
              desired.rate = value
              player.setPlaybackRate(value)
            },
            setTrack: (id) => {
              desired.track = id
              player.loadModule('captions')
              player.setOption('captions', 'track', id ? { languageCode: id } : {})
            },
            reload: () => {
              reapply = true
              player.loadVideoById({ videoId: info.id, startSeconds: player.getCurrentTime() || 0 })
            },
            destroy: () => player.destroy(),
          }
        })
        .catch(() => !life.disposed && setFailed(true))
    } else if (info.provider === 'vimeo') {
      const iframe = document.createElement('iframe')
      const separator = info.embedUrl.includes('?') ? '&' : '?'
      iframe.src = `${info.embedUrl}${separator}controls=0&keyboard=0&pip=0`
      iframe.title = title
      iframe.allow = 'autoplay; fullscreen; picture-in-picture'
      iframe.className = 'h-full w-full border-0'
      mount.appendChild(iframe)
      loadVimeo()
        .then(() => {
          if (life.disposed || !window.Vimeo) return
          const player = new window.Vimeo.Player(iframe)
          player.getDuration().then((duration) => update({ ready: true, duration }))
          player
            .getTextTracks()
            .then((list) =>
              update({ tracks: list.map((item) => ({ id: `${item.language}|${item.kind}`, label: item.label || item.language })) }),
            )
            .catch(() => undefined)
          player.on('play', () => update({ playing: true, ended: false }))
          player.on('pause', () => update({ playing: false }))
          player.on('ended', () => {
            update({ playing: false, ended: true })
            onEndedRef.current?.()
          })
          player.on('timeupdate', (data) => update({ current: data.seconds ?? 0, duration: data.duration ?? 0 }))
          player.on('progress', (data) => update({ buffered: data.percent ?? 0 }))
          controlsRef.current = {
            play: () => void player.play(),
            pause: () => void player.pause(),
            seek: (seconds) => void player.setCurrentTime(seconds),
            setVolume: (value) => void player.setVolume(value / 100),
            setMuted: (value) => void player.setVolume(value ? 0 : 1),
            // Velocidade no Vimeo exige plano pago; sem ele o comando é ignorado.
            setRate: (value) => void player.setPlaybackRate(value).catch(() => undefined),
            setTrack: (id) => {
              if (!id) return void player.disableTextTrack()
              const [language, kind] = id.split('|')
              void player.enableTextTrack(language, kind).catch(() => undefined)
            },
            // O Vimeo troca de qualidade pelo tamanho do player sem precisar recarregar.
            reload: () => undefined,
            destroy: () => void player.destroy(),
          }
        })
        .catch(() => !life.disposed && setFailed(true))
    }

    return () => {
      life.disposed = true
      window.clearInterval(timer)
      controlsRef.current?.destroy()
      controlsRef.current = null
      host.replaceChildren()
    }
  }, [info.embedUrl, info.id, info.provider, title])

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(() => {
    const controls = controlsRef.current
    if (!controls || !state.ready) return
    setMenu(null)
    if (state.playing) controls.pause()
    else {
      controls.play()
      setStarted(true)
    }
  }, [state.playing, state.ready])

  const seekTo = (seconds: number) => {
    const target = Math.min(Math.max(0, seconds), state.duration || seconds)
    controlsRef.current?.seek(target)
    setState((current) => ({ ...current, current: target }))
  }

  const changeVolume = (value: number) => {
    controlsRef.current?.setVolume(value)
    controlsRef.current?.setMuted(value === 0)
    setVolumeState(value)
    setMuted(value === 0)
  }

  const toggleMute = () => {
    const next = !muted
    controlsRef.current?.setMuted(next)
    if (!next && volume === 0) changeVolume(50)
    setMuted(next)
  }

  const chooseRate = (value: number) => {
    controlsRef.current?.setRate(value)
    setRate(value)
    setMenu('main')
  }

  const chooseTrack = (id: string | null) => {
    captionsChosenRef.current = true
    controlsRef.current?.setTrack(id)
    setTrack(id)
    setMenu(null)
  }

  const chooseQuality = (level: string) => {
    setQuality(level)
    setMenu(null)
    // O novo tamanho do player precisa estar na tela antes de recarregar no mesmo ponto.
    if (state.playing) window.setTimeout(() => controlsRef.current?.reload(), 200)
  }

  const toggleCaptions = () => {
    if (state.tracks.length === 0) return
    const preferred = state.tracks.find((item) => item.id.startsWith('pt')) ?? state.tracks[0]
    chooseTrack(track ? null : preferred.id)
  }

  const stepRate = (direction: 1 | -1) => {
    const index = state.rates.indexOf(rate)
    const next = state.rates[Math.min(state.rates.length - 1, Math.max(0, (index < 0 ? state.rates.indexOf(1) : index) + direction))]
    if (next !== undefined) chooseRate(next)
    setMenu(null)
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void frameRef.current?.requestFullscreen()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).tagName === 'INPUT') return
    const key = event.key.toLowerCase()
    if (key === ' ' || key === 'k') {
      event.preventDefault()
      toggle()
    } else if (key === 'arrowright') seekTo(state.current + 5)
    else if (key === 'arrowleft') seekTo(state.current - 5)
    else if (key === 'l') seekTo(state.current + 10)
    else if (key === 'j') seekTo(state.current - 10)
    else if (key === 'arrowup') {
      event.preventDefault()
      changeVolume(Math.min(100, volume + 5))
    } else if (key === 'arrowdown') {
      event.preventDefault()
      changeVolume(Math.max(0, volume - 5))
    } else if (key === 'm') toggleMute()
    else if (key === 'f') toggleFullscreen()
    else if (key === 'c') toggleCaptions()
    else if (event.key === '>') stepRate(1)
    else if (event.key === '<') stepRate(-1)
    else if (/^[0-9]$/.test(key) && state.duration > 0) seekTo((Number(key) / 10) * state.duration)
    else if (key === 'escape') setMenu(null)
  }

  const timeAt = (event: MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current
    if (!bar || state.duration <= 0) return null
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    return { x: ratio * rect.width, time: ratio * state.duration, width: rect.width }
  }

  /** Miniatura do trecho sob o mouse (recorte da folha do storyboard). */
  const previewAt = (time: number) => {
    if (!storyboard || state.duration <= 0) return null
    const raw = storyboard.intervalMs > 0 ? (time * 1000) / storyboard.intervalMs : (time / state.duration) * storyboard.count
    const index = Math.min(storyboard.count - 1, Math.max(0, Math.floor(raw)))
    const perPage = storyboard.cols * storyboard.rows
    const page = storyboard.pages[Math.floor(index / perPage)]
    if (!page) return null
    const position = index % perPage
    const displayH = (PREVIEW_WIDTH * storyboard.height) / storyboard.width
    return {
      height: displayH,
      style: {
        backgroundImage: `url("${page}")`,
        backgroundSize: `${storyboard.cols * PREVIEW_WIDTH}px ${storyboard.rows * displayH}px`,
        backgroundPosition: `-${(position % storyboard.cols) * PREVIEW_WIDTH}px -${Math.floor(position / storyboard.cols) * displayH}px`,
      },
    }
  }

  const percent = state.duration > 0 ? (state.current / state.duration) * 100 : 0
  const chosenLevel = quality === 'auto' ? null : QUALITY_LEVELS[quality]
  const streamingLabel = state.streaming ? QUALITY_LEVELS[state.streaming].label : null
  const qualitySummary = chosenLevel ? chosenLevel.label : streamingLabel ? `Automático (${streamingLabel})` : 'Automático'
  const isHd = (state.streaming ? QUALITY_LEVELS[state.streaming].height : (chosenLevel?.height ?? 0)) >= 720
  const trackLabel = state.tracks.find((item) => item.id === track)?.label ?? 'Desativadas'
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2

  // ─── Geometria: onde o vídeo aparece e como o iframe é posicionado ─────────────
  // Sem legenda, o vídeo (16:9) ocupa toda a área disponível. Com legenda ligada ele encolhe um
  // pouco e uma faixa abaixo dele fica visível: o player desenha a legenda colada na base do iframe.
  const { width: frameW, height: frameH } = frameSize
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  // Renderizar o player na largura da resolução (em pixels físicos) faz o YouTube transmitir nela.
  const fitWidth = Math.min(frameW, (frameH * 16) / 9)
  const scale = chosenLevel && fitWidth > 0 ? Math.min(4, Math.max(0.3, chosenLevel.width / dpr / fitWidth)) : 1
  const band = CROP / scale
  const captionsOn = Boolean(track)
  const videoH = captionsOn ? Math.min(frameH - band, (frameW * 9) / 16) : Math.min(frameH, (frameW * 9) / 16)
  const videoW = (videoH * 16) / 9
  const videoLeft = (frameW - videoW) / 2
  const videoTop = captionsOn ? (frameH - videoH - band) / 2 : (frameH - videoH) / 2
  const videoBox = { left: videoLeft, top: videoTop, width: videoW, height: videoH }

  return (
    <div
      ref={frameRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={`Player de vídeo: ${title}`}
      className={cn(
        'group/player relative aspect-video w-full overflow-hidden bg-black select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        fullscreen && 'aspect-auto h-full',
        className,
      )}
    >
      {/* Iframe mais alto que o vídeo: título e marca do player ficam em faixas fora da área visível. */}
      <div
        ref={hostRef}
        aria-hidden
        className="pointer-events-none absolute origin-top-left"
        style={{
          left: videoBox.left,
          top: videoBox.top - band,
          width: videoBox.width * scale,
          height: (videoBox.height + band * 2) * scale,
          transform: scale === 1 ? undefined : `scale(${1 / scale})`,
          visibility: frameW > 0 ? undefined : 'hidden',
        }}
      />

      {/* Fora do vídeo tudo fica preto: cobre o que o player desenha nas faixas (logo, link, "Mais vídeos"). */}
      {frameW > 0 ? (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[4] bg-black" style={{ height: Math.max(0, videoBox.top) }} />
          {captionsOn ? (
            <>
              {/* Na faixa da legenda, só os cantos (logo e link do player) ficam tapados. */}
              <div
                aria-hidden
                className="pointer-events-none absolute z-[4] bg-black"
                style={{ left: 0, width: videoBox.left + 72, top: videoBox.top + videoBox.height, height: band + 2 }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute z-[4] bg-black"
                style={{ right: 0, width: videoBox.left + 150, top: videoBox.top + videoBox.height, height: band + 2 }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-black"
                style={{ top: videoBox.top + videoBox.height + band }}
              />
            </>
          ) : (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-black" style={{ top: videoBox.top + videoBox.height }} />
          )}
          <div aria-hidden className="pointer-events-none absolute left-0 z-[4] bg-black" style={{ top: 0, bottom: 0, width: Math.max(0, videoBox.left) }} />
          <div aria-hidden className="pointer-events-none absolute right-0 z-[4] bg-black" style={{ top: 0, bottom: 0, width: Math.max(0, videoBox.left) }} />
        </>
      ) : null}

      {/* Capa própria até o primeiro play (a do player ocuparia também as faixas recortadas). */}
      {!started && poster ? (
        <img
          src={poster}
          alt=""
          onError={() => setHdPosterFailed(true)}
          onLoad={(event) => {
            // Sem versão HD o YouTube devolve uma imagem cinza de 120×90 (com status 200).
            if (event.currentTarget.naturalWidth <= 120) setHdPosterFailed(true)
          }}
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full object-cover"
        />
      ) : null}

      {/* Camada que recebe os cliques no lugar do player original. */}
      <button
        type="button"
        aria-label={state.playing ? 'Pausar' : 'Reproduzir'}
        onClick={toggle}
        onDoubleClick={toggleFullscreen}
        onContextMenu={(event) => event.preventDefault()}
        className="absolute inset-0 z-10 cursor-pointer bg-transparent"
      />

      {failed ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-white/80">
          Não foi possível carregar o vídeo. Verifique a conexão com a internet.
        </div>
      ) : !state.ready ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black">
          <Spinner className="h-8 w-8" />
        </div>
      ) : state.ended ? (
        // Fim do vídeo: cobre a tela final do player (recomendações de outros vídeos).
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black">
          {poster ? (
            <img src={poster} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />
          ) : null}
          <p className="relative font-display text-lg font-semibold text-white">Vídeo finalizado</p>
          <button
            type="button"
            onClick={() => {
              seekTo(0)
              controlsRef.current?.play()
            }}
            className="soaco-press relative inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-display text-sm font-semibold text-accent-ink shadow-lg"
          >
            <RotateCcw size={16} /> Assistir novamente
          </button>
        </div>
      ) : !state.playing ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/35">
          {started ? (
            // Na pausa o player mostra "Mais vídeos" na parte de baixo: fica coberto.
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/95 to-transparent" />
          ) : null}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-ink shadow-xl ring-4 ring-accent/30 transition-transform group-hover/player:scale-105">
            <Play size={30} fill="currentColor" className="ml-1" />
          </span>
          {!started ? (
            <span className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-5 pt-4 pb-10 font-display text-sm font-semibold text-white">
              {title}
            </span>
          ) : null}
        </div>
      ) : null}

      {menu ? (
        <div
          role="menu"
          aria-label="Configurações do vídeo"
          className="absolute right-3 bottom-16 z-40 w-72 overflow-hidden rounded-xl border border-white/10 bg-black/90 py-1.5 text-sm text-white shadow-2xl backdrop-blur-md"
        >
          {menu === 'main' ? (
            <>
              <MenuRow
                icon={<Captions size={16} />}
                label="Legendas"
                value={state.tracks.length ? trackLabel : 'Indisponíveis'}
                onClick={() => setMenu('captions')}
                disabled={state.tracks.length === 0}
              />
              <MenuRow icon={<Gauge size={16} />} label="Velocidade da reprodução" value={rateLabel(rate)} onClick={() => setMenu('speed')} />
              <MenuRow
                icon={<Sparkles size={16} />}
                label="Qualidade"
                value={qualitySummary}
                onClick={() => setMenu('quality')}
                disabled={state.levels.length === 0}
              />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMenu('main')}
                className="flex w-full items-center gap-2 border-b border-white/10 px-3 pt-1.5 pb-2.5 text-left font-semibold hover:bg-white/10"
              >
                <ChevronLeft size={16} />
                {menu === 'speed' ? 'Velocidade da reprodução' : menu === 'captions' ? 'Legendas' : 'Qualidade'}
              </button>
              <div className="max-h-56 overflow-y-auto py-1">
                {menu === 'speed'
                  ? state.rates.map((value) => (
                      <OptionRow key={value} label={rateLabel(value)} selected={value === rate} onClick={() => chooseRate(value)} />
                    ))
                  : menu === 'captions'
                    ? [
                        <OptionRow key="off" label="Desativadas" selected={track === null} onClick={() => chooseTrack(null)} />,
                        ...state.tracks.map((item) => (
                          <OptionRow key={item.id} label={item.label} selected={item.id === track} onClick={() => chooseTrack(item.id)} />
                        )),
                      ]
                    : [
                        ...state.levels.map((level) => (
                          <OptionRow
                            key={level}
                            label={QUALITY_LEVELS[level].label}
                            badge={QUALITY_LEVELS[level].badge}
                            selected={level === quality}
                            onClick={() => chooseQuality(level)}
                          />
                        )),
                        <OptionRow
                          key="auto"
                          label={streamingLabel && quality === 'auto' ? `Automático (${streamingLabel})` : 'Automático'}
                          selected={quality === 'auto'}
                          onClick={() => chooseQuality('auto')}
                        />,
                      ]}
              </div>
              {menu === 'quality' && quality !== 'auto' && streamingLabel ? (
                <p className="border-t border-white/10 px-3 pt-2 pb-1 text-[11px] leading-snug text-white/60">
                  Recebendo agora em {streamingLabel}. O YouTube ajusta conforme a internet.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-30 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-8 pb-3 text-white transition-opacity duration-200',
          state.playing && !menu ? 'opacity-0 group-hover/player:opacity-100 group-focus-within/player:opacity-100' : 'opacity-100',
          !state.ready && 'pointer-events-none opacity-0',
        )}
      >
        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label="Posição do vídeo"
          aria-valuemin={0}
          aria-valuemax={Math.floor(state.duration)}
          aria-valuenow={Math.floor(state.current)}
          aria-valuetext={`${formatClock(state.current)} de ${formatClock(state.duration)}`}
          onClick={(event) => {
            const point = timeAt(event)
            if (point) seekTo(point.time)
          }}
          onMouseMove={(event) => setHover(timeAt(event))}
          onMouseLeave={() => setHover(null)}
          className="group/bar relative flex h-4 cursor-pointer items-center"
        >
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20 transition-all group-hover/bar:h-1.5">
            <div className="absolute inset-y-0 left-0 bg-white/35" style={{ width: `${state.buffered * 100}%` }} />
            <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${percent}%` }} />
          </div>
          <span
            className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 scale-0 rounded-full bg-accent shadow transition-transform group-hover/bar:scale-100"
            style={{ left: `${percent}%` }}
          />
          {hover
            ? (() => {
                const preview = previewAt(hover.time)
                // Mantém a miniatura inteira dentro da barra nas pontas.
                const half = preview ? PREVIEW_WIDTH / 2 : 24
                const left = Math.min(Math.max(hover.x, half), Math.max(half, hover.width - half))
                return (
                  <span
                    className="pointer-events-none absolute bottom-5 flex -translate-x-1/2 flex-col items-center gap-1"
                    style={{ left }}
                  >
                    {preview ? (
                      <span
                        className="block rounded-lg border-2 border-white/90 bg-black bg-no-repeat shadow-2xl"
                        style={{ width: PREVIEW_WIDTH, height: preview.height, ...preview.style }}
                      />
                    ) : null}
                    <span className="rounded bg-black/90 px-2 py-0.5 font-display text-[11px] font-semibold tabular-nums">
                      {formatClock(hover.time)}
                    </span>
                  </span>
                )
              })()
            : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={toggle} aria-label={state.playing ? 'Pausar (k)' : 'Reproduzir (k)'} title={state.playing ? 'Pausar (k)' : 'Reproduzir (k)'} className="transition-colors hover:text-accent">
              {state.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button type="button" title="Voltar 10 segundos (j)" aria-label="Voltar 10 segundos" onClick={() => seekTo(state.current - 10)} className="text-white/80 transition-colors hover:text-accent">
              <RotateCcw size={18} />
            </button>
            <button type="button" title="Avançar 10 segundos (l)" aria-label="Avançar 10 segundos" onClick={() => seekTo(state.current + 10)} className="text-white/80 transition-colors hover:text-accent">
              <RotateCw size={18} />
            </button>
            <div className="group/volume flex items-center gap-2">
              <button type="button" onClick={toggleMute} title={muted ? 'Ativar som (m)' : 'Silenciar (m)'} aria-label={muted ? 'Ativar som' : 'Silenciar'} className="text-white/80 transition-colors hover:text-accent">
                <VolumeIcon size={18} />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={muted ? 0 : volume}
                onChange={(event) => changeVolume(Number(event.target.value))}
                aria-label="Volume"
                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/25 opacity-0 transition-all duration-200 group-hover/volume:w-20 group-hover/volume:opacity-100 focus:w-20 focus:opacity-100"
                style={{ background: `linear-gradient(to right, #fff ${muted ? 0 : volume}%, rgb(255 255 255 / 0.25) ${muted ? 0 : volume}%)` }}
              />
            </div>
            <span className="font-display text-xs tabular-nums">
              <span className="font-semibold text-accent">{formatClock(state.current)}</span> / {formatClock(state.duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {state.tracks.length > 0 ? (
              <button
                type="button"
                onClick={toggleCaptions}
                title="Legendas (c)"
                aria-label={track ? 'Desativar legendas' : 'Ativar legendas'}
                aria-pressed={Boolean(track)}
                className={cn('relative transition-colors hover:text-accent', track ? 'text-white' : 'text-white/70')}
              >
                <Captions size={19} />
                {track ? <span className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent" /> : null}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setMenu(menu ? null : 'main')}
              title="Configurações"
              aria-label="Configurações"
              aria-expanded={Boolean(menu)}
              className="relative text-white/80 transition-colors hover:text-accent"
            >
              <Settings size={18} className={cn('transition-transform duration-300', menu && 'rotate-45')} />
              {isHd ? (
                <span className="absolute -top-1.5 -right-2 rounded bg-accent px-0.5 text-[8px] leading-tight font-bold text-accent-ink">HD</span>
              ) : null}
            </button>
            <button type="button" onClick={toggleFullscreen} title={fullscreen ? 'Sair da tela cheia (f)' : 'Tela cheia (f)'} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'} className="text-white/80 transition-colors hover:text-accent">
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuRow({
  icon,
  label,
  value,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  value: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="text-white/80">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="max-w-[130px] truncate text-xs text-white/60">{value}</span>
      <ChevronRight size={15} className="text-white/50" />
    </button>
  )
}

function OptionRow({
  label,
  badge,
  selected,
  onClick,
}: {
  label: string
  badge?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={cn('flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/10', selected && 'font-semibold')}
    >
      <span className="flex w-4 justify-center text-accent">{selected ? <Check size={15} /> : null}</span>
      <span className="truncate">
        {label}
        {badge ? <sup className="ml-0.5 text-[9px] font-bold text-accent">{badge}</sup> : null}
      </span>
    </button>
  )
}
