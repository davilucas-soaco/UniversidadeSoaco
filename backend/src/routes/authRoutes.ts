import bcrypt from 'bcryptjs'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { clearSessionCookie, createToken, requireAuth, setSessionCookie } from '../middleware/auth.js'
import { carregarUsuarioSessao } from '../services/sessaoUsuario.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' },
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  senha: z.string().min(1).max(200),
})

const senhaSchema = z.object({
  senhaAtual: z.string().min(1).max(200),
  novaSenha: z.string().min(8, 'A nova senha precisa ter pelo menos 8 caracteres.').max(200),
})

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Informe e-mail e senha válidos.' })
      return
    }

    const usuario = await prisma.usuario.findUnique({ where: { email: parsed.data.email } })
    const senhaOk = usuario ? await bcrypt.compare(parsed.data.senha, usuario.senhaHash) : false
    if (!usuario || !usuario.ativo || !senhaOk) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' })
      return
    }

    await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLoginEm: new Date() } })
    setSessionCookie(res, createToken({ sub: usuario.id, papel: usuario.papel }))
    res.json({ user: await carregarUsuarioSessao(usuario.id) })
  }),
)

router.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await carregarUsuarioSessao(req.user!.sub)
    if (!user) {
      clearSessionCookie(res)
      res.status(401).json({ error: 'Usuário inativo ou removido.' })
      return
    }
    res.json({ user })
  }),
)

router.post(
  '/senha',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = senhaSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
      return
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.sub } })
    if (!usuario || !(await bcrypt.compare(parsed.data.senhaAtual, usuario.senhaHash))) {
      res.status(400).json({ error: 'A senha atual não confere.' })
      return
    }

    if (parsed.data.novaSenha === parsed.data.senhaAtual) {
      res.status(400).json({ error: 'A nova senha precisa ser diferente da atual.' })
      return
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senhaHash: await bcrypt.hash(parsed.data.novaSenha, 10), trocarSenha: false },
    })
    res.json({ user: await carregarUsuarioSessao(usuario.id) })
  }),
)

export default router
