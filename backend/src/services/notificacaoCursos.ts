import { appPublicUrl } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { emailCursoAtribuido } from './email/emailCursoAtribuido.js'
import { enviarEmailSistema } from './email/systemEmail.js'
import { etapaInclude, montarArvore } from './etapasCurso.js'

const CATEGORIA = 'curso-atribuido'
const PAUSA_ENTRE_ENVIOS_MS = 400

const chaveDisparo = (cursoId: string, usuarioId: string) => `${CATEGORIA}:${cursoId}:${usuarioId}`

/** Colaboradores ativos que recebem o curso (direto, pelo setor ou pela classe). */
export async function destinatariosDoCurso(cursoId: string) {
  const atribuicoes = await prisma.atribuicao.findMany({
    where: { cursoId },
    select: { usuarioId: true, setorId: true, classeId: true },
  })
  const usuarioIds = atribuicoes.flatMap((item) => (item.usuarioId ? [item.usuarioId] : []))
  const setorIds = atribuicoes.flatMap((item) => (item.setorId ? [item.setorId] : []))
  const classeIds = atribuicoes.flatMap((item) => (item.classeId ? [item.classeId] : []))
  if (usuarioIds.length + setorIds.length + classeIds.length === 0) return new Set<string>()

  const usuarios = await prisma.usuario.findMany({
    where: {
      ativo: true,
      OR: [
        { id: { in: usuarioIds } },
        { setorId: { in: setorIds } },
        { classes: { some: { classeId: { in: classeIds } } } },
      ],
    },
    select: { id: true },
  })
  return new Set(usuarios.map((usuario) => usuario.id))
}

/** Cursos que chegam ao colaborador (vazio se ele estiver inativo). */
export async function cursosDoUsuario(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { ativo: true, setorId: true, classes: { select: { classeId: true } } },
  })
  if (!usuario?.ativo) return new Set<string>()
  const atribuicoes = await prisma.atribuicao.findMany({
    where: {
      OR: [
        { usuarioId },
        ...(usuario.setorId ? [{ setorId: usuario.setorId }] : []),
        { classeId: { in: usuario.classes.map((item) => item.classeId) } },
      ],
    },
    select: { cursoId: true },
  })
  return new Set(atribuicoes.map((item) => item.cursoId))
}

/**
 * Capa do e-mail. A miniatura padrão do YouTube (hqdefault) é 4:3 com faixas pretas;
 * usa a versão 16:9 em alta (maxresdefault) quando o vídeo tem, senão a média (mqdefault).
 */
async function capaParaEmail(capa: string | null) {
  if (!capa?.startsWith('https://')) return null
  const youtube = capa.match(/^https:\/\/i\.ytimg\.com\/vi\/([\w-]+)\/hqdefault\.jpg$/)
  if (!youtube) return capa
  const alta = `https://i.ytimg.com/vi/${youtube[1]}/maxresdefault.jpg`
  try {
    const resposta = await fetch(alta, { method: 'HEAD', signal: AbortSignal.timeout(4000) })
    if (resposta.ok) return alta
  } catch {
    // Sem internet ou YouTube lento: segue com a média.
  }
  return `https://i.ytimg.com/vi/${youtube[1]}/mqdefault.jpg`
}

export function novos<T>(antes: Set<T>, depois: Set<T>) {
  return [...depois].filter((item) => !antes.has(item))
}

/** Dados do e-mail de um curso para um colaborador (obrigatoriedade e prazo vêm das atribuições que chegam a ele). */
export async function dadosEmailCurso(cursoId: string, usuarioId: string) {
  const [curso, usuario] = await Promise.all([
    prisma.curso.findUnique({
      where: { id: cursoId },
      include: { etapas: { include: etapaInclude }, atribuicoes: true },
    }),
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nome: true, email: true, setorId: true, classes: { select: { classeId: true } } },
    }),
  ])
  if (!curso || !usuario) return null

  const classes = new Set(usuario.classes.map((item) => item.classeId))
  const doUsuario = curso.atribuicoes.filter(
    (item) =>
      item.usuarioId === usuarioId ||
      (item.setorId !== null && item.setorId === usuario.setorId) ||
      (item.classeId !== null && classes.has(item.classeId)),
  )
  const obrigatorias = doUsuario.filter((item) => item.obrigatorio)
  const prazo = obrigatorias.map((item) => item.prazo).filter((valor): valor is string => Boolean(valor)).sort()[0] ?? null
  const arvore = montarArvore(curso.etapas)

  return {
    email: usuario.email,
    dados: {
      nome: usuario.nome,
      link: `${appPublicUrl}/aula/${curso.id}`,
      curso: {
        titulo: curso.titulo,
        categoria: curso.categoria,
        descricao: curso.descricao,
        cargaHoraria: curso.cargaHoraria,
        pontos: curso.pontos,
        capa: await capaParaEmail(curso.capaImagem),
        sequencial: curso.sequenciaObrigatoria,
        etapas: arvore.map((etapa) => ({ titulo: etapa.titulo, subetapas: etapa.filhas.length })),
        unidades: arvore.reduce((total, etapa) => total + Math.max(1, etapa.filhas.length), 0),
      },
      obrigatorio: obrigatorias.length > 0,
      prazo,
    },
  }
}

async function enviarAvisoCurso(cursoId: string, usuarioId: string) {
  const chave = chaveDisparo(cursoId, usuarioId)
  if (await prisma.emailDisparoLog.findUnique({ where: { chave } })) return
  const montado = await dadosEmailCurso(cursoId, usuarioId)
  if (!montado) return
  const { assunto, html } = emailCursoAtribuido(montado.dados)
  const enviado = await enviarEmailSistema({ to: montado.email, subject: assunto, html })
  if (enviado) {
    await prisma.emailDisparoLog.create({
      data: { categoria: CATEGORIA, chave, destinatarios: montado.email, assunto },
    })
  }
}

const pausa = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Avisa por e-mail os colaboradores que passaram a receber cursos. Roda em segundo plano
 * (não atrasa a resposta da API) e nunca envia o mesmo curso duas vezes para a mesma pessoa.
 */
export function avisarNovosDestinatarios(pares: { cursoId: string; usuarioId: string }[]) {
  if (pares.length === 0) return
  void (async () => {
    for (const [indice, par] of pares.entries()) {
      try {
        await enviarAvisoCurso(par.cursoId, par.usuarioId)
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : String(error)
        console.error(`[email] Aviso de curso não enviado (${par.cursoId} → ${par.usuarioId}): ${mensagem}`)
        // Sem credencial (ou credencial bloqueada) os próximos envios falhariam do mesmo jeito.
        if (/não configurad|bloqueada|ENCRYPTION_KEY/i.test(mensagem)) return
      }
      if (indice < pares.length - 1) await pausa(PAUSA_ENTRE_ENVIOS_MS)
    }
  })()
}
