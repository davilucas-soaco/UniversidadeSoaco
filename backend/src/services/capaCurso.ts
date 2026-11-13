import { prisma } from '../config/prisma.js'
import { lerVideo, type VideoInfo } from '../utils/video.js'
import { carregarArvore } from './etapasCurso.js'

/**
 * Miniaturas abaixo deste tamanho são quadros lisos (vídeo que começa em tela preta) ou a imagem
 * genérica de "sem miniatura"; nesses casos a capa vem do próximo vídeo do curso.
 */
const MINIATURA_MINIMA_BYTES = 8000
const MAX_VIDEOS_TESTADOS = 6

const miniaturasVimeo = new Map<string, string | null>()

/** O Vimeo não tem URL fixa de miniatura: ela vem do oEmbed público (funciona para vídeos públicos e não listados). */
async function miniaturaVimeo(id: string) {
  if (miniaturasVimeo.has(id)) return miniaturasVimeo.get(id) ?? null
  try {
    const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}&width=1280`
    const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const miniatura = resposta.ok ? (((await resposta.json()) as { thumbnail_url?: string }).thumbnail_url ?? null) : null
    miniaturasVimeo.set(id, miniatura)
    return miniatura
  } catch {
    return null
  }
}

function miniaturaDoVideo(video: VideoInfo) {
  return video.miniatura ? Promise.resolve(video.miniatura) : miniaturaVimeo(video.id)
}

/** Tamanho da imagem em bytes; -1 quando não deu para baixar (sem internet). */
async function tamanhoImagem(url: string) {
  try {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return resposta.ok ? (await resposta.arrayBuffer()).byteLength : 0
  } catch {
    return -1
  }
}

/** Capa do curso: miniatura do primeiro vídeo (na ordem das etapas) que tenha uma imagem de verdade. */
export async function capaDosVideos(urls: (string | null | undefined)[]) {
  const videos = urls
    .map((url) => lerVideo(url ?? ''))
    .filter((video): video is VideoInfo => Boolean(video))
    .slice(0, MAX_VIDEOS_TESTADOS)

  let primeira: string | null = null
  for (const video of videos) {
    const miniatura = await miniaturaDoVideo(video)
    if (!miniatura) continue
    primeira ??= miniatura
    const tamanho = await tamanhoImagem(miniatura)
    if (tamanho < 0) return primeira
    if (tamanho >= MINIATURA_MINIMA_BYTES) return miniatura
  }
  return primeira
}

/** Refaz as capas gravadas com o serviço antigo de miniaturas do Vimeo (vumbnail), que não acha vídeos não listados. */
export async function corrigirCapasVimeoAntigas() {
  const cursos = await prisma.curso.findMany({
    where: { capaImagem: { contains: 'vumbnail.com' } },
    select: { id: true, titulo: true },
  })
  for (const curso of cursos) {
    const arvore = await carregarArvore(curso.id)
    const urls = arvore.flatMap((etapa) => [etapa, ...etapa.filhas]).map((etapa) => etapa.videoUrl)
    const capa = await capaDosVideos(urls)
    if (!capa) continue
    await prisma.curso.update({ where: { id: curso.id }, data: { capaImagem: capa } })
    console.log(`[capas] Capa do curso "${curso.titulo}" atualizada.`)
  }
}
