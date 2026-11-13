import fs from 'node:fs'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { caminhoUpload } from '../config/uploads.js'
import { cursoDestinadoAoUsuario, obterCursoParaUsuario } from '../services/cursosUsuario.js'
import { carregarArvore, recalcularMatricula, unidadesDoCurso } from '../services/etapasCurso.js'
import { corrigirProva } from '../services/provas.js'
import { storyboardDoYoutube } from '../services/videoStoryboard.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const PAPEIS_GESTAO = ['administrador', 'gestor_conteudo']

async function ehGestao(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { papel: true } })
  return Boolean(usuario && PAPEIS_GESTAO.includes(usuario.papel))
}

/** Miniaturas da barra de progresso do player (vídeos do YouTube). */
router.get(
  '/videos/:videoId/storyboard',
  asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!/^[\w-]{6,20}$/.test(videoId)) return res.status(400).json({ error: 'Vídeo inválido.' })
    res.setHeader('Cache-Control', 'private, max-age=1800')
    res.json({ storyboard: await storyboardDoYoutube(videoId) })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const usuarioId = req.user!.sub
    const course = await obterCursoParaUsuario(req.params.id, usuarioId, await ehGestao(usuarioId))
    if (!course) {
      res.status(404).json({ error: 'Curso não encontrado ou não destinado a você.' })
      return
    }
    res.json({ course })
  }),
)

/**
 * Confere se o colaborador pode agir na etapa: curso destinado a ele, etapa concluível e,
 * com `avancar`, sequência obrigatória respeitada. Responde o erro e retorna null quando não pode.
 */
async function etapaDoColaborador(req: Request, res: Response, avancar: boolean) {
  const usuarioId = req.user!.sub
  const { id: cursoId, etapaId } = req.params
  if (!(await cursoDestinadoAoUsuario(cursoId, usuarioId))) {
    res.status(403).json({ error: 'Este curso não foi destinado a você.' })
    return null
  }

  const [curso, arvore] = await Promise.all([
    prisma.curso.findUnique({ where: { id: cursoId }, select: { sequenciaObrigatoria: true } }),
    carregarArvore(cursoId),
  ])
  const unidades = unidadesDoCurso(arvore)
  const posicao = unidades.findIndex((etapa) => etapa.id === etapaId)
  if (!curso || posicao < 0) {
    res.status(404).json({ error: 'Etapa não encontrada.' })
    return null
  }

  if (avancar && curso.sequenciaObrigatoria && posicao > 0) {
    const anteriores = unidades.slice(0, posicao).map((etapa) => etapa.id)
    const feitas = await prisma.etapaProgresso.count({ where: { usuarioId, etapaId: { in: anteriores } } })
    if (feitas < anteriores.length) {
      res.status(409).json({ error: 'Conclua as etapas anteriores primeiro: este curso segue uma sequência obrigatória.' })
      return null
    }
  }
  return { usuarioId, cursoId, etapaId, etapa: unidades[posicao] }
}

/** Marca (POST) ou desmarca (DELETE) a conclusão de uma etapa pelo colaborador. */
async function alterarConclusao(req: Request, res: Response, concluir: boolean) {
  const alvo = await etapaDoColaborador(req, res, concluir)
  if (!alvo) return
  const { usuarioId, cursoId, etapaId, etapa } = alvo
  if (etapa.tipoConteudo === 'exam') {
    res.status(400).json({ error: 'Etapa de prova é concluída automaticamente quando você é aprovado.' })
    return
  }

  if (concluir) {
    await prisma.etapaProgresso.upsert({
      where: { usuarioId_etapaId: { usuarioId, etapaId } },
      create: { usuarioId, etapaId },
      update: {},
    })
  } else {
    await prisma.etapaProgresso.deleteMany({ where: { usuarioId, etapaId } })
  }
  await recalcularMatricula(usuarioId, cursoId)
  res.json({ course: await obterCursoParaUsuario(cursoId, usuarioId, false) })
}

router.post(
  '/:id/etapas/:etapaId/conclusao',
  asyncHandler((req, res) => alterarConclusao(req, res, true)),
)

router.delete(
  '/:id/etapas/:etapaId/conclusao',
  asyncHandler((req, res) => alterarConclusao(req, res, false)),
)

const respostasSchema = z.object({
  answers: z.record(z.string().max(80), z.string().max(80)),
})

/** Envio da prova da etapa: corrige no servidor e, se aprovado, conclui a etapa. */
router.post(
  '/:id/etapas/:etapaId/prova',
  asyncHandler(async (req, res) => {
    const parsed = respostasSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Respostas inválidas.' })
    const alvo = await etapaDoColaborador(req, res, true)
    if (!alvo) return
    const { usuarioId, cursoId, etapaId, etapa } = alvo
    if (etapa.tipoConteudo !== 'exam' || !etapa.prova) {
      return res.status(400).json({ error: 'Esta etapa não tem prova.' })
    }

    const prova = etapa.prova
    const respondidas = prova.perguntas.filter((pergunta) => parsed.data.answers[pergunta.id])
    if (respondidas.length < prova.perguntas.length) {
      return res.status(400).json({ error: 'Responda todas as perguntas antes de enviar.' })
    }

    const resultado = corrigirProva(prova, parsed.data.answers)
    await prisma.provaTentativa.create({
      data: {
        usuarioId,
        provaId: prova.id,
        etapaId,
        acertos: resultado.acertos,
        total: resultado.total,
        nota: resultado.nota,
        aprovado: resultado.aprovado,
        respostas: JSON.stringify(parsed.data.answers),
      },
    })
    if (resultado.aprovado) {
      await prisma.etapaProgresso.upsert({
        where: { usuarioId_etapaId: { usuarioId, etapaId } },
        create: { usuarioId, etapaId },
        update: {},
      })
      await recalcularMatricula(usuarioId, cursoId)
    }

    res.json({
      result: {
        correct: resultado.acertos,
        total: resultado.total,
        score: resultado.nota,
        passingScore: prova.notaMinima,
        approved: resultado.aprovado,
        // O gabarito só aparece depois da aprovação; antes, só o que acertou ou errou.
        review: resultado.revisao.map((item) => ({
          questionId: item.questionId,
          selectedOptionId: item.selectedOptionId,
          correct: item.correct,
          correctOptionId: resultado.aprovado ? item.correctOptionId : undefined,
        })),
      },
      course: await obterCursoParaUsuario(cursoId, usuarioId, false),
    })
  }),
)

router.get(
  '/:id/documentos/:docId',
  asyncHandler(async (req, res) => {
    const usuarioId = req.user!.sub
    const documento = await prisma.cursoDocumento.findFirst({ where: { id: req.params.docId, cursoId: req.params.id } })
    const permitido =
      documento && ((await ehGestao(usuarioId)) || (await cursoDestinadoAoUsuario(documento.cursoId, usuarioId)))
    if (!documento || !permitido) {
      res.status(404).json({ error: 'Documento não encontrado.' })
      return
    }

    const caminho = caminhoUpload(documento.arquivo)
    if (!fs.existsSync(caminho)) {
      res.status(404).json({ error: 'Arquivo não encontrado no servidor.' })
      return
    }
    res.setHeader('Content-Type', documento.mime || 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `${req.query.download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(documento.nome)}`,
    )
    fs.createReadStream(caminho).pipe(res)
  }),
)

const avaliacaoSchema = z.object({
  rating: z.number().int().min(1, 'Escolha de 1 a 5 estrelas.').max(5, 'Escolha de 1 a 5 estrelas.'),
  comment: z.string().trim().max(1000, 'O comentário pode ter até 1.000 caracteres.').nullable().optional(),
})

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

async function resumoAvaliacoes(cursoId: string, usuarioId: string) {
  const avaliacoes = await prisma.cursoAvaliacao.findMany({
    where: { cursoId, usuario: { ativo: true } },
    orderBy: { atualizadoEm: 'desc' },
    include: { usuario: { select: { id: true, nome: true, cargo: true, setor: { select: { nome: true } } } } },
  })

  const total = avaliacoes.length
  const soma = avaliacoes.reduce((acc, item) => acc + item.nota, 0)
  const minha = avaliacoes.find((item) => item.usuarioId === usuarioId)

  return {
    average: total ? Math.round((soma / total) * 10) / 10 : null,
    count: total,
    /** Quantidade de avaliações por nota, de 5 a 1 estrela. */
    distribution: [5, 4, 3, 2, 1].map((nota) => ({
      stars: nota,
      count: avaliacoes.filter((item) => item.nota === nota).length,
    })),
    mine: minha ? { rating: minha.nota, comment: minha.comentario } : null,
    reviews: avaliacoes
      .filter((item) => item.comentario)
      .slice(0, 20)
      .map((item) => ({
        id: item.id,
        author: item.usuario.nome,
        initials: iniciais(item.usuario.nome),
        role: item.usuario.cargo || item.usuario.setor?.nome || 'Colaborador',
        rating: item.nota,
        comment: item.comentario!,
        createdAt: item.atualizadoEm.toISOString(),
        isMine: item.usuarioId === usuarioId,
      })),
  }
}

router.get(
  '/:id/avaliacoes',
  asyncHandler(async (req, res) => {
    const curso = await prisma.curso.findUnique({ where: { id: req.params.id }, select: { id: true } })
    if (!curso) {
      res.status(404).json({ error: 'Curso não encontrado no banco.' })
      return
    }
    res.json({ reviews: await resumoAvaliacoes(curso.id, req.user!.sub) })
  }),
)

router.put(
  '/:id/avaliacoes',
  asyncHandler(async (req, res) => {
    const parsed = avaliacaoSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
      return
    }

    const cursoId = req.params.id
    const usuarioId = req.user!.sub
    if (!(await cursoDestinadoAoUsuario(cursoId, usuarioId))) {
      res.status(403).json({ error: 'Você só pode avaliar cursos destinados a você.' })
      return
    }

    const comentario = parsed.data.comment || null
    await prisma.cursoAvaliacao.upsert({
      where: { usuarioId_cursoId: { usuarioId, cursoId } },
      create: { usuarioId, cursoId, nota: parsed.data.rating, comentario },
      update: { nota: parsed.data.rating, comentario },
    })
    res.json({ reviews: await resumoAvaliacoes(cursoId, usuarioId) })
  }),
)

export default router
