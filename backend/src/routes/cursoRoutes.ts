import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { listarCursosDoUsuario } from '../services/cursosUsuario.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

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
    const destinados = await listarCursosDoUsuario(usuarioId)
    if (!destinados.some((curso) => curso.id === cursoId)) {
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
