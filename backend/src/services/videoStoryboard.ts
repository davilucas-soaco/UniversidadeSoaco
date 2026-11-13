/**
 * Miniaturas da barra de progresso (storyboard) dos vídeos do YouTube.
 * A API do player não as expõe; elas vêm da página do vídeo, lida aqui no servidor.
 */

export type Storyboard = {
  /** Tamanho de cada miniatura dentro da folha. */
  width: number
  height: number
  count: number
  cols: number
  rows: number
  /** Intervalo entre miniaturas; 0 = distribuídas pela duração do vídeo. */
  intervalMs: number
  /** Folhas (sprites) em ordem: cada uma tem cols × rows miniaturas. */
  pages: string[]
}

const CACHE_MS = 60 * 60 * 1000
const CACHE_FALHA_MS = 10 * 60 * 1000
const cache = new Map<string, { expira: number; valor: Storyboard | null }>()

function interpretar(spec: string): Storyboard | null {
  const [base, ...niveis] = spec.split('|')
  if (!base || niveis.length === 0) return null
  // O último nível é o de maior resolução.
  const indice = niveis.length - 1
  const [w, h, total, colunas, linhas, intervalo, nome, assinatura] = niveis[indice].split('#')
  const width = Number(w)
  const height = Number(h)
  const count = Number(total)
  const cols = Number(colunas)
  const rows = Number(linhas)
  if (![width, height, count, cols, rows].every((valor) => Number.isFinite(valor) && valor > 0) || !nome) return null
  const porFolha = cols * rows
  const folhas = Math.ceil(count / porFolha)
  const pages = Array.from({ length: folhas }, (_, pagina) => {
    const arquivo = nome.replace('$M', String(pagina))
    const url = base.replace('$L', String(indice)).replace('$N', arquivo)
    return assinatura ? `${url}${url.includes('?') ? '&' : '?'}sigh=${assinatura}` : url
  })
  return { width, height, count, cols, rows, intervalMs: Number(intervalo) || 0, pages }
}

export async function storyboardDoYoutube(videoId: string): Promise<Storyboard | null> {
  const guardado = cache.get(videoId)
  if (guardado && guardado.expira > Date.now()) return guardado.valor

  let valor: Storyboard | null = null
  try {
    const resposta = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=pt-BR`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        'accept-language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (resposta.ok) {
      const html = await resposta.text()
      const spec = html.match(/"playerStoryboardSpecRenderer":\{"spec":"([^"]+)"/)?.[1]
      if (spec) valor = interpretar(spec.replace(/\\u0026/g, '&'))
    }
  } catch {
    // Sem acesso ao YouTube: a barra mostra só o tempo.
  }
  cache.set(videoId, { expira: Date.now() + (valor ? CACHE_MS : CACHE_FALHA_MS), valor })
  return valor
}
