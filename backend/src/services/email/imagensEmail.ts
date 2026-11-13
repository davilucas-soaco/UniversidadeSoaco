import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { EmailAttachment } from './systemEmail.js'

const pastaImagens = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'assets', 'email')

/** Imagens anexadas inline (cid:) — funcionam sem URL pública, inclusive na rede interna. */
export const IMAGENS_EMAIL = {
  logo: { cid: 'universidade-logo', arquivo: 'logo-universidade.png' },
  amigaco: { cid: 'universidade-amigaco', arquivo: 'amigaco.png' },
} as const

const cache = new Map<string, string>()

function base64Da(arquivo: string) {
  let valor = cache.get(arquivo)
  if (!valor) {
    valor = readFileSync(path.join(pastaImagens, arquivo)).toString('base64')
    cache.set(arquivo, valor)
  }
  return valor
}

export function srcImagem(nome: keyof typeof IMAGENS_EMAIL) {
  return `cid:${IMAGENS_EMAIL[nome].cid}`
}

/** Anexos inline das imagens que o HTML realmente usa. */
export function imagensInlineUsadas(html: string): EmailAttachment[] {
  return Object.values(IMAGENS_EMAIL)
    .filter((imagem) => html.includes(`cid:${imagem.cid}`))
    .map((imagem) => ({
      filename: imagem.arquivo,
      mimeType: 'image/png',
      contentBase64: base64Da(imagem.arquivo),
      contentId: imagem.cid,
      disposition: 'inline' as const,
    }))
}

/** Para a prévia no navegador: troca cid: por data URI. */
export function embutirImagens(html: string) {
  return Object.values(IMAGENS_EMAIL).reduce(
    (resultado, imagem) => resultado.replaceAll(`cid:${imagem.cid}`, `data:image/png;base64,${base64Da(imagem.arquivo)}`),
    html,
  )
}
