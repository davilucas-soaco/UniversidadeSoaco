import { Prisma } from '@prisma/client'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { avisarNovosDestinatariosTrilha, destinatariosDaTrilha, novos } from '../services/notificacaoCursos.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const trilhaSchema = z
  .object({
    title: z.string().trim().min(2, 'Informe o nome da trilha.').max(160),
    description: z.string().trim().max(2000).default(''),
    sequential: z.boolean().default(false),
    certificate: z.boolean().default(true),
    courseIds: z.array(z.string().min(1)).min(2, 'Vincule pelo menos dois cursos à trilha.').max(50),
    audience: z.object({
      userIds: z.array(z.string()).max(2000).default([]),
      sectorIds: z.array(z.number().int().positive()).max(200).default([]),
      classIds: z.array(z.number().int().positive()).max(200).default([]),
    }),
    mandatory: z.boolean().default(false),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Prazo inválido.')
      .nullable()
      .optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.audience.sectorIds.length > 0 && valor.audience.classIds.length > 0) {
      ctx.addIssue({ code: 'custom', path: ['audience'], message: 'Destine a trilha a setores ou a classes, não aos dois.' })
    }
    if (new Set(valor.courseIds).size !== valor.courseIds.length) {
      ctx.addIssue({ code: 'custom', path: ['courseIds'], message: 'Um curso aparece duas vezes na trilha.' })
    }
  })

type TrilhaInput = z.infer<typeof trilhaSchema>

const trilhaInclude = {
  cursos: {
    orderBy: { ordem: 'asc' },
    include: { curso: { select: { id: true, titulo: true, categoria: true, cargaHoraria: true, capaImagem: true } } },
  },
  alvos: {
    include: {
      usuario: { select: { id: true, nome: true } },
      setor: { select: { id: true, nome: true } },
      classe: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.TrilhaInclude

type TrilhaAdmin = Prisma.TrilhaGetPayload<{ include: typeof trilhaInclude }>

function toTrilhaAdmin(trilha: TrilhaAdmin) {
  const cursos = trilha.cursos.map(({ curso }) => ({
    id: curso.id,
    title: curso.titulo,
    category: curso.categoria,
    durationHours: curso.cargaHoraria,
    coverImage: curso.capaImagem,
  }))
  return {
    id: trilha.id,
    title: trilha.titulo,
    description: trilha.descricao,
    sequential: trilha.sequenciaObrigatoria,
    certificate: trilha.geraCertificado,
    courses: cursos,
    durationHours: cursos.reduce((total, curso) => total + curso.durationHours, 0),
    audience: {
      users: trilha.alvos.flatMap((item) => (item.usuario ? [{ id: item.usuario.id, name: item.usuario.nome }] : [])),
      sectors: trilha.alvos.flatMap((item) => (item.setor ? [{ id: item.setor.id, name: item.setor.nome }] : [])),
      classes: trilha.alvos.flatMap((item) => (item.classe ? [{ id: item.classe.id, name: item.classe.nome }] : [])),
    },
    mandatory: trilha.obrigatorio,
    dueDate: trilha.prazo,
    createdAt: trilha.criadoEm.toISOString(),
    updatedAt: trilha.atualizadoEm.toISOString(),
  }
}

function alvosDoInput(input: TrilhaInput) {
  return [
    ...[...new Set(input.audience.userIds)].map((usuarioId) => ({ alvo: 'usuario', usuarioId })),
    ...[...new Set(input.audience.sectorIds)].map((setorId) => ({ alvo: 'setor', setorId })),
    ...[...new Set(input.audience.classIds)].map((classeId) => ({ alvo: 'classe', classeId })),
  ]
}

/** Grava cursos, público e as atribuições derivadas (cada curso × cada alvo) da trilha. */
async function sincronizarTrilha(tx: Prisma.TransactionClient, trilhaId: string, input: TrilhaInput, autorId: string) {
  const alvos = alvosDoInput(input)
  await Promise.all([
    tx.trilhaCurso.deleteMany({ where: { trilhaId } }),
    tx.trilhaAlvo.deleteMany({ where: { trilhaId } }),
    tx.atribuicao.deleteMany({ where: { trilhaId } }),
  ])
  await tx.trilhaCurso.createMany({ data: input.courseIds.map((cursoId, ordem) => ({ trilhaId, cursoId, ordem })) })
  await tx.trilhaAlvo.createMany({ data: alvos.map((alvo) => ({ ...alvo, trilhaId })) })
  await tx.atribuicao.createMany({
    data: input.courseIds.flatMap((cursoId) =>
      alvos.map((alvo) => ({
        ...alvo,
        cursoId,
        trilhaId,
        obrigatorio: input.mandatory,
        prazo: input.mandatory ? (input.dueDate ?? null) : null,
        atribuidoPorId: autorId,
      })),
    ),
  })
}

function naoEncontrado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2003')
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const trilhas = await prisma.trilha.findMany({ include: trilhaInclude, orderBy: { criadoEm: 'desc' } })
    res.json({ trails: trilhas.map(toTrilhaAdmin) })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const trilha = await prisma.trilha.findUnique({ where: { id: req.params.id }, include: trilhaInclude })
    if (!trilha) {
      res.status(404).json({ error: 'Trilha não encontrada.' })
      return
    }
    res.json({ trail: toTrilhaAdmin(trilha) })
  }),
)

async function salvarTrilha(req: Request, res: Response, trilhaId: string | null) {
  const parsed = trilhaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
    return
  }
  const input = parsed.data
  if ((await prisma.curso.count({ where: { id: { in: input.courseIds } } })) !== input.courseIds.length) {
    res.status(400).json({ error: 'Um dos cursos escolhidos não existe mais. Revise a lista da trilha.' })
    return
  }

  const dados = {
    titulo: input.title,
    descricao: input.description,
    sequenciaObrigatoria: input.sequential,
    geraCertificado: input.certificate,
    obrigatorio: input.mandatory,
    prazo: input.mandatory ? (input.dueDate ?? null) : null,
  }
  const antes = trilhaId ? await destinatariosDaTrilha(trilhaId) : new Set<string>()
  try {
    const trilha = await prisma.$transaction(async (tx) => {
      const id = trilhaId
        ? (await tx.trilha.update({ where: { id: trilhaId }, data: dados })).id
        : (await tx.trilha.create({ data: dados })).id
      await sincronizarTrilha(tx, id, input, req.user!.sub)
      return tx.trilha.findUniqueOrThrow({ where: { id }, include: trilhaInclude })
    })
    res.status(trilhaId ? 200 : 201).json({ trail: toTrilhaAdmin(trilha) })
    avisarNovosDestinatariosTrilha(trilha.id, novos(antes, await destinatariosDaTrilha(trilha.id)))
  } catch (error) {
    if (naoEncontrado(error)) {
      res.status(trilhaId ? 404 : 400).json({ error: 'Trilha, curso, colaborador, setor ou classe não encontrado.' })
      return
    }
    throw error
  }
}

router.post(
  '/',
  asyncHandler((req, res) => salvarTrilha(req, res, null)),
)

router.put(
  '/:id',
  asyncHandler((req, res) => salvarTrilha(req, res, req.params.id)),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      await prisma.trilha.delete({ where: { id: req.params.id } })
      res.json({ ok: true })
    } catch (error) {
      if (naoEncontrado(error)) {
        res.status(404).json({ error: 'Trilha não encontrada.' })
        return
      }
      throw error
    }
  }),
)

export default router
