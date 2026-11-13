import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { perguntasParaCriar, provaInclude, provaParaGestao, provaSchema } from '../services/provas.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

/** Onde cada prova está sendo usada (curso e etapa). */
async function usosDasProvas(provaIds?: string[]) {
  const etapas = await prisma.cursoEtapa.findMany({
    where: { provaId: provaIds ? { in: provaIds } : { not: null }, tipoConteudo: 'exam' },
    select: { provaId: true, titulo: true, curso: { select: { id: true, titulo: true } } },
    orderBy: { curso: { titulo: 'asc' } },
  })
  const usos = new Map<string, { courseId: string; courseTitle: string; stageTitle: string }[]>()
  for (const etapa of etapas) {
    if (!etapa.provaId) continue
    const lista = usos.get(etapa.provaId) ?? []
    lista.push({ courseId: etapa.curso.id, courseTitle: etapa.curso.titulo, stageTitle: etapa.titulo })
    usos.set(etapa.provaId, lista)
  }
  return usos
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [provas, usos] = await Promise.all([
      prisma.prova.findMany({ orderBy: { titulo: 'asc' }, include: { _count: { select: { perguntas: true } } } }),
      usosDasProvas(),
    ])
    res.json({
      exams: provas.map((prova) => ({
        id: prova.id,
        title: prova.titulo,
        description: prova.descricao ?? '',
        passingScore: prova.notaMinima,
        questionsCount: prova._count.perguntas,
        usedIn: usos.get(prova.id) ?? [],
        updatedAt: prova.atualizadoEm.toISOString(),
      })),
    })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const prova = await prisma.prova.findUnique({ where: { id: req.params.id }, include: provaInclude })
    if (!prova) return res.status(404).json({ error: 'Prova não encontrada.' })
    res.json({ exam: provaParaGestao(prova) })
  }),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = provaSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
    const prova = await prisma.prova.create({
      data: {
        titulo: parsed.data.title,
        descricao: parsed.data.description || null,
        notaMinima: parsed.data.passingScore,
        perguntas: { create: perguntasParaCriar(parsed.data) },
      },
      include: provaInclude,
    })
    res.status(201).json({ exam: provaParaGestao(prova) })
  }),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = provaSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
    const existe = await prisma.prova.findUnique({ where: { id: req.params.id }, select: { id: true } })
    if (!existe) return res.status(404).json({ error: 'Prova não encontrada.' })
    // As tentativas já feitas guardam só a nota; as perguntas podem ser recriadas.
    const prova = await prisma.$transaction(async (tx) => {
      await tx.provaPergunta.deleteMany({ where: { provaId: existe.id } })
      return tx.prova.update({
        where: { id: existe.id },
        data: {
          titulo: parsed.data.title,
          descricao: parsed.data.description || null,
          notaMinima: parsed.data.passingScore,
          perguntas: { create: perguntasParaCriar(parsed.data) },
        },
        include: provaInclude,
      })
    })
    res.json({ exam: provaParaGestao(prova) })
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const usos = (await usosDasProvas([req.params.id])).get(req.params.id) ?? []
    if (usos.length > 0) {
      const cursos = [...new Set(usos.map((uso) => uso.courseTitle))]
      return res.status(409).json({
        error: `Esta prova está em uso em ${cursos.length === 1 ? 'um curso' : `${cursos.length} cursos`} (${cursos.slice(0, 3).join(', ')}${cursos.length > 3 ? '…' : ''}). Troque a prova dessas etapas antes de excluir.`,
      })
    }
    const removida = await prisma.prova.deleteMany({ where: { id: req.params.id } })
    if (removida.count === 0) return res.status(404).json({ error: 'Prova não encontrada.' })
    res.json({ ok: true })
  }),
)

export default router
