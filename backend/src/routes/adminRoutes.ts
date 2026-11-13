import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { Router, type Response } from 'express'
import { z } from 'zod'
import { masterEmail } from '../config/ensureMaster.js'
import { prisma } from '../config/prisma.js'
import { avisarNovosDestinatarios, cursosDoUsuario, novos } from '../services/notificacaoCursos.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const nome = z.string().trim().min(2, 'Informe um nome com pelo menos 2 caracteres.').max(120)
const email = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.'))
const senha = z.string().min(8, 'A senha inicial precisa ter pelo menos 8 caracteres.').max(200)
const id = z.coerce.number().int().positive()

const usuarioCriarSchema = z.object({
  name: nome,
  email,
  password: senha,
  sectorId: id.nullable().optional(),
  classIds: z.array(id).max(50).default([]),
})

const usuarioEditarSchema = z.object({
  name: nome.optional(),
  email: email.optional(),
  password: senha.optional(),
  sectorId: id.nullable().optional(),
  classIds: z.array(id).max(50).optional(),
  active: z.boolean().optional(),
})

const setorSchema = z.object({ name: nome })
const categoriaSchema = z.object({ name: nome })
const classeSchema = z.object({
  name: nome,
  description: z.string().trim().max(300).nullable().optional(),
})

function responderErroValidacao(res: Response, error: z.ZodError) {
  res.status(400).json({ error: error.issues[0]?.message ?? 'Dados inválidos.' })
}

async function ehMaster(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { email: true } })
  return usuario?.email === masterEmail()
}

function nomeDuplicado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function naoEncontrado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

const usuarioInclude = {
  setor: true,
  classes: { include: { classe: true }, orderBy: { classe: { nome: 'asc' } } },
} satisfies Prisma.UsuarioInclude

type UsuarioComRelacoes = Prisma.UsuarioGetPayload<{ include: typeof usuarioInclude }>

function toUsuarioAdmin(usuario: UsuarioComRelacoes) {
  return {
    id: usuario.id,
    name: usuario.nome,
    email: usuario.email,
    role: usuario.papel,
    sectorId: usuario.setorId,
    sectorName: usuario.setor?.nome ?? null,
    classIds: usuario.classes.map((item) => item.classeId),
    classNames: usuario.classes.map((item) => item.classe.nome),
    active: usuario.ativo,
    isMaster: usuario.email === masterEmail(),
    mustChangePassword: usuario.trocarSenha,
    lastLoginAt: usuario.ultimoLoginEm?.toISOString() ?? null,
    createdAt: usuario.criadoEm.toISOString(),
  }
}

// ─── Colaboradores ───────────────────────────────────────────────────────────

router.get(
  '/usuarios',
  asyncHandler(async (_req, res) => {
    const usuarios = await prisma.usuario.findMany({ include: usuarioInclude, orderBy: { nome: 'asc' } })
    res.json({ users: usuarios.map(toUsuarioAdmin) })
  }),
)

router.post(
  '/usuarios',
  asyncHandler(async (req, res) => {
    const parsed = usuarioCriarSchema.safeParse(req.body)
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    const { name, email: login, password, sectorId, classIds } = parsed.data

    try {
      const usuario = await prisma.usuario.create({
        data: {
          nome: name,
          email: login,
          senhaHash: await bcrypt.hash(password, 10),
          trocarSenha: true,
          setorId: sectorId ?? null,
          classes: { create: [...new Set(classIds)].map((classeId) => ({ classeId })) },
        },
        include: usuarioInclude,
      })
      res.status(201).json({ user: toUsuarioAdmin(usuario) })
      const cursos = await cursosDoUsuario(usuario.id)
      avisarNovosDestinatarios([...cursos].map((cursoId) => ({ cursoId, usuarioId: usuario.id })))
    } catch (error) {
      if (nomeDuplicado(error)) {
        res.status(409).json({ error: 'Já existe um usuário com este e-mail.' })
        return
      }
      throw error
    }
  }),
)

router.patch(
  '/usuarios/:id',
  asyncHandler(async (req, res) => {
    const parsed = usuarioEditarSchema.safeParse(req.body)
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    const { name, email: login, password, sectorId, classIds, active } = parsed.data
    const usuarioId = req.params.id

    if (usuarioId === req.user!.sub && active === false) {
      res.status(400).json({ error: 'Você não pode desativar o seu próprio acesso.' })
      return
    }

    if (await ehMaster(usuarioId)) {
      if (active === false || password || (login && login !== masterEmail())) {
        res.status(400).json({
          error: 'O usuário master não pode ser desativado nem ter e-mail ou senha alterados por aqui (ficam no backend/.env).',
        })
        return
      }
    }

    const cursosAntes = await cursosDoUsuario(usuarioId)
    try {
      const usuario = await prisma.$transaction(async (tx) => {
        if (classIds) {
          await tx.classeMembro.deleteMany({ where: { usuarioId } })
          await tx.classeMembro.createMany({
            data: [...new Set(classIds)].map((classeId) => ({ classeId, usuarioId })),
          })
        }
        return tx.usuario.update({
          where: { id: usuarioId },
          data: {
            nome: name,
            email: login,
            setorId: sectorId === undefined ? undefined : sectorId,
            ativo: active,
            ...(password ? { senhaHash: await bcrypt.hash(password, 10), trocarSenha: true } : {}),
          },
          include: usuarioInclude,
        })
      })
      res.json({ user: toUsuarioAdmin(usuario) })
      // Mudou de setor/classe (ou foi reativado): avisa só dos cursos que passaram a chegar até ele.
      const cursosDepois = await cursosDoUsuario(usuarioId)
      avisarNovosDestinatarios(novos(cursosAntes, cursosDepois).map((cursoId) => ({ cursoId, usuarioId })))
    } catch (error) {
      if (nomeDuplicado(error)) {
        res.status(409).json({ error: 'Já existe um usuário com este e-mail.' })
        return
      }
      if (naoEncontrado(error)) {
        res.status(404).json({ error: 'Usuário não encontrado.' })
        return
      }
      throw error
    }
  }),
)

router.delete(
  '/usuarios/:id',
  asyncHandler(async (req, res) => {
    const usuarioId = req.params.id
    if (usuarioId === req.user!.sub) {
      res.status(400).json({ error: 'Você não pode excluir o seu próprio usuário.' })
      return
    }
    if (await ehMaster(usuarioId)) {
      res.status(400).json({ error: 'O usuário master não pode ser excluído.' })
      return
    }
    try {
      // Matrículas, progresso, certificados e pontos do usuário são removidos junto (onDelete: Cascade).
      await prisma.usuario.delete({ where: { id: usuarioId } })
      res.json({ ok: true })
    } catch (error) {
      if (naoEncontrado(error)) {
        res.status(404).json({ error: 'Usuário não encontrado.' })
        return
      }
      throw error
    }
  }),
)

// ─── Setores ─────────────────────────────────────────────────────────────────

router.get(
  '/setores',
  asyncHandler(async (_req, res) => {
    const setores = await prisma.setor.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { usuarios: true } } },
    })
    res.json({
      sectors: setores.map((setor) => ({ id: setor.id, name: setor.nome, usersCount: setor._count.usuarios })),
    })
  }),
)

router.post(
  '/setores',
  asyncHandler(async (req, res) => {
    const parsed = setorSchema.safeParse(req.body)
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    try {
      const setor = await prisma.setor.create({ data: { nome: parsed.data.name } })
      res.status(201).json({ sector: { id: setor.id, name: setor.nome, usersCount: 0 } })
    } catch (error) {
      if (nomeDuplicado(error)) {
        res.status(409).json({ error: 'Já existe um setor com este nome.' })
        return
      }
      throw error
    }
  }),
)

router.patch(
  '/setores/:id',
  asyncHandler(async (req, res) => {
    const parsedId = id.safeParse(req.params.id)
    const parsed = setorSchema.safeParse(req.body)
    if (!parsedId.success) return res.status(404).json({ error: 'Setor não encontrado.' })
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    try {
      const setor = await prisma.setor.update({
        where: { id: parsedId.data },
        data: { nome: parsed.data.name },
        include: { _count: { select: { usuarios: true } } },
      })
      res.json({ sector: { id: setor.id, name: setor.nome, usersCount: setor._count.usuarios } })
    } catch (error) {
      if (nomeDuplicado(error)) return res.status(409).json({ error: 'Já existe um setor com este nome.' })
      if (naoEncontrado(error)) return res.status(404).json({ error: 'Setor não encontrado.' })
      throw error
    }
  }),
)

router.delete(
  '/setores/:id',
  asyncHandler(async (req, res) => {
    const parsedId = id.safeParse(req.params.id)
    if (!parsedId.success) return res.status(404).json({ error: 'Setor não encontrado.' })
    try {
      // Colaboradores do setor ficam sem setor; atribuições feitas ao setor são removidas.
      await prisma.$transaction([
        prisma.usuario.updateMany({ where: { setorId: parsedId.data }, data: { setorId: null } }),
        prisma.atribuicao.deleteMany({ where: { setorId: parsedId.data } }),
        prisma.setor.delete({ where: { id: parsedId.data } }),
      ])
      res.json({ ok: true })
    } catch (error) {
      if (naoEncontrado(error)) return res.status(404).json({ error: 'Setor não encontrado.' })
      throw error
    }
  }),
)

// ─── Categorias de curso ─────────────────────────────────────────────────────

async function contarCursosPorCategoria() {
  const grupos = await prisma.curso.groupBy({ by: ['categoria'], _count: { _all: true } })
  return new Map(grupos.map((grupo) => [grupo.categoria, grupo._count._all]))
}

router.get(
  '/categorias',
  asyncHandler(async (_req, res) => {
    const [categorias, contagem] = await Promise.all([
      prisma.categoria.findMany({ orderBy: { nome: 'asc' } }),
      contarCursosPorCategoria(),
    ])
    res.json({
      categories: categorias.map((item) => ({ id: item.id, name: item.nome, coursesCount: contagem.get(item.nome) ?? 0 })),
    })
  }),
)

router.post(
  '/categorias',
  asyncHandler(async (req, res) => {
    const parsed = categoriaSchema.safeParse(req.body)
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    try {
      const categoria = await prisma.categoria.create({ data: { nome: parsed.data.name } })
      res.status(201).json({ category: { id: categoria.id, name: categoria.nome, coursesCount: 0 } })
    } catch (error) {
      if (nomeDuplicado(error)) return res.status(409).json({ error: 'Já existe uma categoria com este nome.' })
      throw error
    }
  }),
)

router.patch(
  '/categorias/:id',
  asyncHandler(async (req, res) => {
    const parsedId = id.safeParse(req.params.id)
    const parsed = categoriaSchema.safeParse(req.body)
    if (!parsedId.success) return res.status(404).json({ error: 'Categoria não encontrada.' })
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    const atual = await prisma.categoria.findUnique({ where: { id: parsedId.data } })
    if (!atual) return res.status(404).json({ error: 'Categoria não encontrada.' })
    try {
      // Os cursos guardam o nome da categoria: renomear atualiza todos eles.
      const [categoria, cursos] = await prisma.$transaction([
        prisma.categoria.update({ where: { id: atual.id }, data: { nome: parsed.data.name } }),
        prisma.curso.updateMany({ where: { categoria: atual.nome }, data: { categoria: parsed.data.name } }),
      ])
      res.json({ category: { id: categoria.id, name: categoria.nome, coursesCount: cursos.count } })
    } catch (error) {
      if (nomeDuplicado(error)) return res.status(409).json({ error: 'Já existe uma categoria com este nome.' })
      throw error
    }
  }),
)

router.delete(
  '/categorias/:id',
  asyncHandler(async (req, res) => {
    const parsedId = id.safeParse(req.params.id)
    if (!parsedId.success) return res.status(404).json({ error: 'Categoria não encontrada.' })
    const categoria = await prisma.categoria.findUnique({ where: { id: parsedId.data } })
    if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada.' })
    const emUso = await prisma.curso.count({ where: { categoria: categoria.nome } })
    if (emUso > 0) {
      return res.status(409).json({
        error: `${emUso === 1 ? '1 curso usa' : `${emUso} cursos usam`} esta categoria. Mude a categoria ${emUso === 1 ? 'dele' : 'deles'} antes de excluir.`,
      })
    }
    await prisma.categoria.delete({ where: { id: categoria.id } })
    res.json({ ok: true })
  }),
)

// ─── Classes ─────────────────────────────────────────────────────────────────

function toClasse(classe: { id: number; nome: string; descricao: string | null; _count: { membros: number } }) {
  return { id: classe.id, name: classe.nome, description: classe.descricao, membersCount: classe._count.membros }
}

router.get(
  '/classes',
  asyncHandler(async (_req, res) => {
    const classes = await prisma.classe.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { membros: true } } },
    })
    res.json({ classes: classes.map(toClasse) })
  }),
)

router.post(
  '/classes',
  asyncHandler(async (req, res) => {
    const parsed = classeSchema.safeParse(req.body)
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    try {
      const classe = await prisma.classe.create({
        data: { nome: parsed.data.name, descricao: parsed.data.description || null },
        include: { _count: { select: { membros: true } } },
      })
      res.status(201).json({ class: toClasse(classe) })
    } catch (error) {
      if (nomeDuplicado(error)) return res.status(409).json({ error: 'Já existe uma classe com este nome.' })
      throw error
    }
  }),
)

router.patch(
  '/classes/:id',
  asyncHandler(async (req, res) => {
    const parsedId = id.safeParse(req.params.id)
    const parsed = classeSchema.safeParse(req.body)
    if (!parsedId.success) return res.status(404).json({ error: 'Classe não encontrada.' })
    if (!parsed.success) return responderErroValidacao(res, parsed.error)
    try {
      const classe = await prisma.classe.update({
        where: { id: parsedId.data },
        data: { nome: parsed.data.name, descricao: parsed.data.description || null },
        include: { _count: { select: { membros: true } } },
      })
      res.json({ class: toClasse(classe) })
    } catch (error) {
      if (nomeDuplicado(error)) return res.status(409).json({ error: 'Já existe uma classe com este nome.' })
      if (naoEncontrado(error)) return res.status(404).json({ error: 'Classe não encontrada.' })
      throw error
    }
  }),
)

router.delete(
  '/classes/:id',
  asyncHandler(async (req, res) => {
    const parsedId = id.safeParse(req.params.id)
    if (!parsedId.success) return res.status(404).json({ error: 'Classe não encontrada.' })
    try {
      await prisma.$transaction([
        prisma.classeMembro.deleteMany({ where: { classeId: parsedId.data } }),
        prisma.atribuicao.deleteMany({ where: { classeId: parsedId.data } }),
        prisma.classe.delete({ where: { id: parsedId.data } }),
      ])
      res.json({ ok: true })
    } catch (error) {
      if (naoEncontrado(error)) return res.status(404).json({ error: 'Classe não encontrada.' })
      throw error
    }
  }),
)

export default router
