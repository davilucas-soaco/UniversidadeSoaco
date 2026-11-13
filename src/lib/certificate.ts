/** Desenho do certificado de conclusão sobre o modelo da Universidade (public/certificado). */

import type { Course } from '@/types'

export type CertificateData = {
  name: string
  course: string
  category: string
  hours: number
  /** ISO da emissão. */
  issuedAt: string
  code: string
}

const TEMPLATE_URL = '/certificado/modelo-certificado.jpg'
/** Medidas do modelo (1536 × 1024); o desenho sai no dobro para imprimir nítido. */
const BASE_W = 1536
const BASE_H = 1024
const SCALE = 2
const CENTER_X = 740
const CONTENT_W = 1060

const NAVY = '#0f2a4f'
const ORANGE = '#f39c12'
const TEXT = '#475569'
const MUTED = '#7c8ba1'
const FONT = 'Monda, "Segoe UI", Roboto, Arial, sans-serif'

let templatePromise: Promise<HTMLImageElement> | null = null

function loadTemplate() {
  templatePromise ??= new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => {
      templatePromise = null
      reject(new Error('Não foi possível carregar o modelo do certificado.'))
    }
    image.src = TEMPLATE_URL
  })
  return templatePromise
}

export function hoursLabel(hours: number) {
  const total = Math.round(hours * 60)
  const h = Math.floor(total / 60)
  const min = total % 60
  const parts = [h ? `${h} ${h === 1 ? 'hora' : 'horas'}` : '', min ? `${min} minutos` : ''].filter(Boolean)
  return parts.join(' e ') || '0 horas'
}

function longDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight: 400 | 700 = 400, spacing = 0) {
  ctx.font = `${weight} ${size}px ${FONT}`
  ctx.letterSpacing = `${spacing}px`
}

/** Maior tamanho (até `start`) em que o texto cabe na largura. */
function fitSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, min: number, weight: 400 | 700) {
  for (let size = start; size > min; size -= 2) {
    setFont(ctx, size, weight)
    if (ctx.measureText(text).width <= maxWidth) return size
  }
  return min
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
  kept[maxLines - 1] = `${last.trimEnd()}…`
  return kept
}

function centered(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

/** Bloco do rodapé: linha, valor em destaque e legenda. */
function footerBlock(ctx: CanvasRenderingContext2D, x: number, value: string, caption: string) {
  ctx.strokeStyle = '#c3cddb'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x - 150, 838)
  ctx.lineTo(x + 150, 838)
  ctx.stroke()
  ctx.fillStyle = NAVY
  setFont(ctx, fitSize(ctx, value, 300, 21, 14, 700), 700)
  centered(ctx, value, x, 868)
  ctx.fillStyle = MUTED
  setFont(ctx, 15, 400, 1)
  centered(ctx, caption.toUpperCase(), x, 893)
}

export async function renderCertificate(data: CertificateData) {
  await Promise.all([document.fonts.load(`700 40px Monda`), document.fonts.load(`400 20px Monda`)]).catch(() => undefined)
  const template = await loadTemplate()

  const canvas = document.createElement('canvas')
  canvas.width = BASE_W * SCALE
  canvas.height = BASE_H * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu gerar o certificado.')
  ctx.scale(SCALE, SCALE)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(template, 0, 0, BASE_W, BASE_H)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = NAVY
  setFont(ctx, 72, 700, 14)
  centered(ctx, 'CERTIFICADO', CENTER_X, 290)
  ctx.fillStyle = ORANGE
  setFont(ctx, 24, 700, 9)
  centered(ctx, 'DE CONCLUSÃO', CENTER_X, 336)

  ctx.fillStyle = TEXT
  setFont(ctx, 25)
  centered(ctx, 'Certificamos que', CENTER_X, 412)

  ctx.fillStyle = NAVY
  const nameSize = fitSize(ctx, data.name, CONTENT_W, 56, 30, 700)
  setFont(ctx, nameSize, 700)
  centered(ctx, data.name, CENTER_X, 486)
  const nameWidth = Math.min(CONTENT_W, ctx.measureText(data.name).width)
  ctx.fillStyle = ORANGE
  ctx.fillRect(CENTER_X - nameWidth / 2 - 20, 506, nameWidth + 40, 3)

  ctx.fillStyle = TEXT
  setFont(ctx, 25)
  centered(ctx, 'concluiu com êxito o curso', CENTER_X, 566)

  ctx.fillStyle = NAVY
  setFont(ctx, 38, 700)
  const courseLines = wrap(ctx, data.course, CONTENT_W, 2)
  courseLines.forEach((line, index) => centered(ctx, line, CENTER_X, 624 + index * 46))

  ctx.fillStyle = TEXT
  setFont(ctx, 21)
  const detailsTop = 624 + courseLines.length * 46 + 4
  const details = `na categoria ${data.category}, com carga horária de ${hoursLabel(data.hours)}, oferecido pela Universidade Corporativa Só Aço.`
  wrap(ctx, details, CONTENT_W, 2).forEach((line, index) => centered(ctx, line, CENTER_X, detailsTop + index * 30))

  footerBlock(ctx, CENTER_X - 400, longDate(data.issuedAt), 'Data de conclusão')
  footerBlock(ctx, CENTER_X, 'Universidade Corporativa Só Aço', 'Treinamento e Desenvolvimento')
  footerBlock(ctx, CENTER_X + 400, data.code, 'Código de verificação')

  return canvas
}

/** Dados do certificado de um curso concluído (null se o certificado ainda não foi emitido). */
export function certificateFor(course: Course, name: string): CertificateData | null {
  if (!course.certificate?.code || !course.certificate.issuedAt) return null
  return {
    name,
    course: course.title,
    category: course.category,
    hours: course.durationHours,
    issuedAt: course.certificate.issuedAt,
    code: course.certificate.code,
  }
}

export function certificateFileName(data: CertificateData) {
  const slug = `${data.course}-${data.name}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `certificado-${slug || data.code}.png`
}
