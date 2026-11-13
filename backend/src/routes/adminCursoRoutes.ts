import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { Router, type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { caminhoUpload, pastaDocumentosCurso, uploadsRoot } from '../config/uploads.js'
import { capaDosVideos } from '../services/capaCurso.js'
import { etapaInclude, montarArvore, unidadesDoCurso, type EtapaArvore } from '../services/etapasCurso.js'
import { avisarNovosDestinatarios, destinatariosDoCurso, novos } from '../services/notificacaoCursos.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { lerVideo } from '../utils/video.js'

const router = Router()

const EXTENSOES_DOCUMENTO = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
const TAMANHO_MAXIMO_MB = 25

const conteudoEtapa = {
  key: z.string().min(1).max(80),
  id: z.string().nullable().optional(),
  title: z.string().trim().min(1, 'Toda etapa precisa de um nome.').max(160),
  description: z.string().trim().max(1000).default(''),
  kind: z.enum(['video', 'document', 'exam']).nullable().default(null),
  videoUrl: z.string().trim().max(500).nullable().optional(),
  examId: z.string().max(80).nullable().optional(),
}

const subetapaSchema = z.object(conteudoEtapa)
const etapaSchema = z.object({ ...conteudoEtapa, children: z.array(subetapaSchema).max(50).default([]) })

const cursoSchema = z
  .object({
    title: z.string().trim().min(2, 'Informe o nome do curso.').max(160),
    category: z.string().trim().min(2, 'Informe a categoria.').max(80),
    description: z.string().trim().max(2000).default(''),
    durationHours: z.number().min(0.25, 'A carga horária mínima é de 15 minutos.').max(500),
    points: z.number().int().min(0).max(1000),
    sequential: z.boolean().default(false),
    certificate: z.boolean().default(true),
    stages: z.array(etapaSchema).min(1, 'Cadastre pelo menos uma etapa.').max(50),
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
      ctx.addIssue({ code: 'custom', path: ['audience'], message: 'Destine o curso a setores ou a classes, não aos dois.' })
    }
    const unidades = valor.stages.flatMap((etapa) => (etapa.children.length > 0 ? etapa.children : [etapa]))
    for (const etapa of unidades) {
      if (!etapa.kind) {
        ctx.addIssue({ code: 'custom', path: ['stages'], message: `Escolha o conteúdo da etapa "${etapa.title}".` })
      } else if (etapa.kind === 'video' && !lerVideo(etapa.videoUrl ?? '')) {
        ctx.addIssue({
          code: 'custom',
          path: ['stages'],
          message: `Cole um link válido do YouTube, Vimeo ou Loom na etapa "${etapa.title}".`,
        })
      } else if (etapa.kind === 'exam' && !etapa.examId) {
        ctx.addIssue({ code: 'custom', path: ['stages'], message: `Escolha a prova da etapa "${etapa.title}".` })
      }
    }
  })

type CursoInput = z.infer<typeof cursoSchema>
type EtapaInput = z.infer<typeof etapaSchema>
type SubetapaInput = z.infer<typeof subetapaSchema>

const cursoInclude = {
  etapas: { include: etapaInclude },
  atribuicoes: {
    include: {
      usuario: { select: { id: true, nome: true } },
      setor: { select: { id: true, nome: true } },
      classe: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.CursoInclude

type CursoAdmin = Prisma.CursoGetPayload<{ include: typeof cursoInclude }>

function toEtapaAdmin(etapa: EtapaArvore | EtapaArvore['filhas'][number]) {
  return {
    id: etapa.id,
    title: etapa.titulo,
    description: etapa.descricao ?? '',
    kind: (etapa.tipoConteudo ?? null) as 'video' | 'document' | 'exam' | null,
    videoUrl: etapa.videoUrl,
    videoProvider: etapa.videoProvedor,
    documents: etapa.documentos.map((doc) => ({ id: doc.id, name: doc.nome, mime: doc.mime, size: doc.tamanho })),
    examId: etapa.provaId,
    examTitle: etapa.prova?.titulo ?? null,
  }
}

function toCursoAdmin(curso: CursoAdmin) {
  const atribuicoes = curso.atribuicoes
  const prazos = atribuicoes.map((item) => item.prazo).filter((prazo): prazo is string => Boolean(prazo)).sort()
  const arvore = montarArvore(curso.etapas)
  return {
    id: curso.id,
    title: curso.titulo,
    category: curso.categoria,
    description: curso.descricao,
    durationHours: curso.cargaHoraria,
    points: curso.pontos,
    sequential: curso.sequenciaObrigatoria,
    certificate: curso.geraCertificado,
    coverImage: curso.capaImagem,
    stages: arvore.map((etapa) => ({ ...toEtapaAdmin(etapa), children: etapa.filhas.map(toEtapaAdmin) })),
    unitsCount: unidadesDoCurso(arvore).length,
    audience: {
      users: atribuicoes.flatMap((item) => (item.usuario ? [{ id: item.usuario.id, name: item.usuario.nome }] : [])),
      sectors: atribuicoes.flatMap((item) => (item.setor ? [{ id: item.setor.id, name: item.setor.nome }] : [])),
      classes: atribuicoes.flatMap((item) => (item.classe ? [{ id: item.classe.id, name: item.classe.nome }] : [])),
    },
    mandatory: atribuicoes.some((item) => item.obrigatorio),
    dueDate: prazos[0] ?? null,
    createdAt: curso.criadoEm.toISOString(),
    updatedAt: curso.atualizadoEm.toISOString(),
  }
}

function urlsDosVideos(input: CursoInput) {
  return input.stages
    .flatMap((etapa) => [etapa, ...etapa.children])
    .flatMap((etapa) => (etapa.kind === 'video' && etapa.videoUrl ? [etapa.videoUrl] : []))
}

function dadosCurso(input: CursoInput, capa: string | null) {
  return {
    titulo: input.title,
    categoria: input.category,
    descricao: input.description,
    cargaHoraria: input.durationHours,
    pontos: input.points,
    sequenciaObrigatoria: input.sequential,
    geraCertificado: input.certificate,
    tipoConteudo: 'etapas',
    videoUrl: null,
    videoProvedor: null,
    embedUrl: null,
    capaImagem: capa,
    capaIcone: urlsDosVideos(input).some((url) => lerVideo(url)) ? 'book' : 'clipboard',
  }
}

function dadosEtapa(etapa: EtapaInput | SubetapaInput, grupo: boolean) {
  const video = !grupo && etapa.kind === 'video' ? lerVideo(etapa.videoUrl ?? '') : null
  return {
    titulo: etapa.title,
    descricao: etapa.description || null,
    tipoConteudo: grupo ? null : etapa.kind,
    videoUrl: video?.watchUrl ?? null,
    videoProvedor: video?.provedor ?? null,
    embedUrl: video?.embedUrl ?? null,
    provaId: !grupo && etapa.kind === 'exam' ? (etapa.examId ?? null) : null,
  }
}

/**
 * Sincroniza o pipeline de etapas: atualiza as existentes (pelo id), cria as novas e apaga as removidas.
 * Retorna o id gravado de cada etapa (pela key do formulário) e os arquivos que devem sair do disco.
 */
async function salvarEtapas(tx: Prisma.TransactionClient, cursoId: string, input: CursoInput) {
  const existentes = await tx.cursoEtapa.findMany({ where: { cursoId }, include: { documentos: true } })
  const idsExistentes = new Set(existentes.map((etapa) => etapa.id))
  const mantidos = new Set(
    input.stages
      .flatMap((etapa) => [etapa, ...etapa.children])
      .map((etapa) => etapa.id)
      .filter((id): id is string => Boolean(id && idsExistentes.has(id))),
  )

  const arquivosRemovidos: string[] = []
  const removidas = existentes.filter((etapa) => !mantidos.has(etapa.id))
  for (const etapa of removidas) arquivosRemovidos.push(...etapa.documentos.map((doc) => doc.arquivo))
  // Subetapas primeiro: as que continuam podem estar penduradas numa etapa removida.
  await tx.cursoEtapa.updateMany({ where: { cursoId, id: { in: [...mantidos] } }, data: { paiId: null } })
  await tx.cursoEtapa.deleteMany({ where: { cursoId, id: { in: removidas.map((etapa) => etapa.id) } } })

  const ids: Record<string, string> = {}
  const gravar = async (etapa: EtapaInput | SubetapaInput, ordem: number, paiId: string | null, grupo: boolean) => {
    const dados = { ...dadosEtapa(etapa, grupo), ordem, paiId }
    const id = etapa.id && mantidos.has(etapa.id) ? etapa.id : null
    const salva = id
      ? await tx.cursoEtapa.update({ where: { id }, data: dados })
      : await tx.cursoEtapa.create({ data: { ...dados, cursoId } })
    ids[etapa.key] = salva.id
    // Etapa em vídeo ou que virou grupo não guarda documentos.
    if (id && (grupo || etapa.kind !== 'document')) {
      const documentos = existentes.find((item) => item.id === id)?.documentos ?? []
      arquivosRemovidos.push(...documentos.map((doc) => doc.arquivo))
      await tx.cursoDocumento.deleteMany({ where: { etapaId: id } })
    }
    return salva.id
  }

  let ordem = 0
  for (const etapa of input.stages) {
    const grupo = etapa.children.length > 0
    const paiId = await gravar(etapa, ordem++, null, grupo)
    for (const filha of etapa.children) await gravar(filha, ordem++, paiId, false)
  }

  return { ids, arquivosRemovidos }
}

/** Substitui as atribuições do curso pelas escolhidas no formulário. */
async function salvarAtribuicoes(tx: Prisma.TransactionClient, cursoId: string, input: CursoInput, autorId: string) {
  await tx.atribuicao.deleteMany({ where: { cursoId } })
  const comum = {
    cursoId,
    obrigatorio: input.mandatory,
    prazo: input.dueDate ?? null,
    atribuidoPorId: autorId,
  }
  await tx.atribuicao.createMany({
    data: [
      ...[...new Set(input.audience.userIds)].map((usuarioId) => ({ ...comum, alvo: 'usuario', usuarioId })),
      ...[...new Set(input.audience.sectorIds)].map((setorId) => ({ ...comum, alvo: 'setor', setorId })),
      ...[...new Set(input.audience.classIds)].map((classeId) => ({ ...comum, alvo: 'classe', classeId })),
    ],
  })
}

function removerArquivos(relativos: string[]) {
  for (const relativo of relativos) fs.rmSync(caminhoUpload(relativo), { force: true })
}

function removerPastaDoCurso(cursoId: string) {
  fs.rmSync(path.join(uploadsRoot, 'cursos', cursoId), { recursive: true, force: true })
}

function naoEncontrado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2003')
}

function validar(res: Response, body: unknown) {
  const parsed = cursoSchema.safeParse(body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
    return null
  }
  return parsed.data
}

// ─── Opções do formulário ────────────────────────────────────────────────────

router.get(
  '/opcoes',
  asyncHandler(async (_req, res) => {
    const [usuarios, setores, classes, categorias] = await Promise.all([
      prisma.usuario.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          email: true,
          setorId: true,
          setor: { select: { nome: true } },
          classes: { select: { classeId: true } },
        },
      }),
      prisma.setor.findMany({ orderBy: { nome: 'asc' }, include: { _count: { select: { usuarios: true } } } }),
      prisma.classe.findMany({ orderBy: { nome: 'asc' }, include: { _count: { select: { membros: true } } } }),
      prisma.categoria.findMany({ orderBy: { nome: 'asc' }, select: { nome: true } }),
    ])
    res.json({
      categories: categorias.map((item) => item.nome),
      users: usuarios.map((item) => ({
        id: item.id,
        name: item.nome,
        email: item.email,
        sectorId: item.setorId,
        sectorName: item.setor?.nome ?? null,
        classIds: item.classes.map((membro) => membro.classeId),
      })),
      sectors: setores.map((item) => ({ id: item.id, name: item.nome, usersCount: item._count.usuarios })),
      classes: classes.map((item) => ({ id: item.id, name: item.nome, description: item.descricao, membersCount: item._count.membros })),
    })
  }),
)

// ─── Cursos ──────────────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const cursos = await prisma.curso.findMany({ include: cursoInclude, orderBy: { criadoEm: 'desc' } })
    res.json({ courses: cursos.map(toCursoAdmin) })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const curso = await prisma.curso.findUnique({ where: { id: req.params.id }, include: cursoInclude })
    if (!curso) {
      res.status(404).json({ error: 'Curso não encontrado.' })
      return
    }
    res.json({ course: toCursoAdmin(curso) })
  }),
)

async function salvarCurso(req: Request, res: Response, cursoId: string | null) {
  const input = validar(res, req.body)
  if (!input) return
  if (!(await prisma.categoria.findUnique({ where: { nome: input.category } }))) {
    res.status(400).json({ error: 'Escolha uma categoria cadastrada em Configurações.' })
    return
  }
  const provaIds = [
    ...new Set(
      input.stages
        .flatMap((etapa) => (etapa.children.length > 0 ? etapa.children : [etapa]))
        .flatMap((etapa) => (etapa.kind === 'exam' && etapa.examId ? [etapa.examId] : [])),
    ),
  ]
  if (provaIds.length > 0 && (await prisma.prova.count({ where: { id: { in: provaIds } } })) !== provaIds.length) {
    res.status(400).json({ error: 'Uma das provas escolhidas não existe mais. Escolha outra prova.' })
    return
  }
  const antes = cursoId ? await destinatariosDoCurso(cursoId) : new Set<string>()
  const capa = await capaDosVideos(urlsDosVideos(input))
  try {
    const { curso, ids, arquivosRemovidos } = await prisma.$transaction(async (tx) => {
      const id = cursoId
        ? (await tx.curso.update({ where: { id: cursoId }, data: dadosCurso(input, capa) })).id
        : (await tx.curso.create({ data: dadosCurso(input, capa) })).id
      const etapas = await salvarEtapas(tx, id, input)
      await salvarAtribuicoes(tx, id, input, req.user!.sub)
      const salvo = await tx.curso.findUniqueOrThrow({ where: { id }, include: cursoInclude })
      return { curso: salvo, ...etapas }
    })
    removerArquivos(arquivosRemovidos)
    res.status(cursoId ? 200 : 201).json({ course: toCursoAdmin(curso), stageIds: ids })
    const depois = await destinatariosDoCurso(curso.id)
    avisarNovosDestinatarios(novos(antes, depois).map((usuarioId) => ({ cursoId: curso.id, usuarioId })))
  } catch (error) {
    if (naoEncontrado(error)) {
      res.status(cursoId ? 404 : 400).json({ error: 'Curso, colaborador, setor ou classe não encontrado.' })
      return
    }
    throw error
  }
}

router.post(
  '/',
  asyncHandler((req, res) => salvarCurso(req, res, null)),
)

router.put(
  '/:id',
  asyncHandler((req, res) => salvarCurso(req, res, req.params.id)),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      await prisma.curso.delete({ where: { id: req.params.id } })
      removerPastaDoCurso(req.params.id)
      res.json({ ok: true })
    } catch (error) {
      if (naoEncontrado(error)) {
        res.status(404).json({ error: 'Curso não encontrado.' })
        return
      }
      throw error
    }
  }),
)

// ─── Documentos das etapas ───────────────────────────────────────────────────

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => cb(null, pastaDocumentosCurso(req.params.id)),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: TAMANHO_MAXIMO_MB * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    cb(null, EXTENSOES_DOCUMENTO.includes(path.extname(file.originalname).toLowerCase()))
  },
})

async function exigirEtapa(req: Request, res: Response, next: NextFunction) {
  const etapa = await prisma.cursoEtapa.findFirst({
    where: { id: req.params.etapaId, cursoId: req.params.id },
    select: { id: true },
  })
  if (!etapa) {
    res.status(404).json({ error: 'Etapa não encontrada.' })
    return
  }
  next()
}

router.post(
  '/:id/etapas/:etapaId/documentos',
  asyncHandler(exigirEtapa),
  (req, res, next) => {
    upload.array('files', 20)(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        res.status(400).json({
          error: error.code === 'LIMIT_FILE_SIZE' ? `Cada arquivo pode ter até ${TAMANHO_MAXIMO_MB} MB.` : 'Falha no envio dos arquivos.',
        })
        return
      }
      if (error) return next(error)
      next()
    })
  },
  asyncHandler(async (req, res) => {
    const arquivos = (req.files as Express.Multer.File[] | undefined) ?? []
    if (arquivos.length === 0) {
      res.status(400).json({ error: 'Envie arquivos PDF, Word ou Excel.' })
      return
    }
    const { id: cursoId, etapaId } = req.params
    const ultimo = await prisma.cursoDocumento.aggregate({ where: { etapaId }, _max: { ordem: true } })
    let ordem = (ultimo._max.ordem ?? -1) + 1
    await prisma.cursoDocumento.createMany({
      data: arquivos.map((arquivo) => ({
        cursoId,
        etapaId,
        // multer entrega o nome original em latin1
        nome: Buffer.from(arquivo.originalname, 'latin1').toString('utf8'),
        mime: arquivo.mimetype,
        tamanho: arquivo.size,
        arquivo: path.posix.join('cursos', cursoId, arquivo.filename),
        ordem: ordem++,
      })),
    })
    const curso = await prisma.curso.findUniqueOrThrow({ where: { id: cursoId }, include: cursoInclude })
    res.status(201).json({ course: toCursoAdmin(curso) })
  }),
)

router.delete(
  '/:id/documentos/:docId',
  asyncHandler(async (req, res) => {
    const documento = await prisma.cursoDocumento.findFirst({ where: { id: req.params.docId, cursoId: req.params.id } })
    if (!documento) {
      res.status(404).json({ error: 'Documento não encontrado.' })
      return
    }
    await prisma.cursoDocumento.delete({ where: { id: documento.id } })
    removerArquivos([documento.arquivo])
    const curso = await prisma.curso.findUniqueOrThrow({ where: { id: req.params.id }, include: cursoInclude })
    res.json({ course: toCursoAdmin(curso) })
  }),
)

export default router
