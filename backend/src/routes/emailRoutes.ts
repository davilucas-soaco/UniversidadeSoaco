import { Router } from 'express'
import { z } from 'zod'
import { appPublicUrl } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { emailCursoAtribuido, type DadosEmailCursoAtribuido } from '../services/email/emailCursoAtribuido.js'
import { embutirImagens } from '../services/email/imagensEmail.js'
import {
  buscarCredencialEmail,
  credencialSemSegredos,
  criptografarSegredo,
  enviarEmailSistema,
  registrarSucessoCredencial,
} from '../services/email/systemEmail.js'
import { dadosEmailCurso } from '../services/notificacaoCursos.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const email = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.'))
const segredo = z.string().trim().max(4000)

const credencialSchema = z.object({
  fromEmail: email,
  fromName: z.string().trim().min(2, 'Informe o nome do remetente.').max(120),
  clientId: z.string().trim().min(10, 'Informe o Client ID do Google Cloud.').max(400),
  /** Vazio mantém o segredo já salvo. */
  clientSecret: segredo.optional(),
  refreshToken: segredo.optional(),
})

const testeSchema = z.object({ to: email.optional() })

const exemplo: DadosEmailCursoAtribuido['curso'] = {
  titulo: 'Integração de novos colaboradores',
  categoria: 'Institucional',
  descricao:
    'Conheça a história da Só Aço, nossos valores, as normas de segurança e tudo o que você precisa para começar bem na empresa.',
  cargaHoraria: 2.5,
  pontos: 50,
  capa: null,
  sequencial: true,
  etapas: [
    { titulo: 'Boas-vindas e nossa história', subetapas: 0 },
    { titulo: 'Segurança no dia a dia', subetapas: 3 },
    { titulo: 'Ferramentas e sistemas', subetapas: 2 },
  ],
  unidades: 6,
}

/** Dados de exemplo: o curso informado (ou o mais recente) com o usuário logado como destinatário. */
async function dadosDaPrevia(usuarioId: string, cursoId?: string): Promise<DadosEmailCursoAtribuido> {
  const curso = cursoId
    ? await prisma.curso.findUnique({ where: { id: cursoId }, select: { id: true } })
    : await prisma.curso.findFirst({ orderBy: { criadoEm: 'desc' }, select: { id: true } })
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId }, select: { nome: true } })

  if (curso) {
    const montado = await dadosEmailCurso(curso.id, usuarioId)
    if (montado) {
      // Quem gera a prévia normalmente não está entre os alunos: usa as regras do próprio curso.
      const atribuicoes = await prisma.atribuicao.findMany({ where: { cursoId: curso.id, obrigatorio: true } })
      const prazo = atribuicoes.map((item) => item.prazo).filter((valor): valor is string => Boolean(valor)).sort()[0]
      return {
        ...montado.dados,
        obrigatorio: montado.dados.obrigatorio || atribuicoes.length > 0,
        prazo: montado.dados.prazo ?? prazo ?? null,
      }
    }
  }
  const emUmaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return { nome: usuario.nome, link: `${appPublicUrl}/conteudos`, curso: exemplo, obrigatorio: true, prazo: emUmaSemana }
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ settings: credencialSemSegredos(await buscarCredencialEmail()), publicUrl: appPublicUrl })
  }),
)

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = credencialSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
    const { fromEmail, fromName, clientId, clientSecret, refreshToken } = parsed.data
    const atual = await buscarCredencialEmail()
    if (!atual && (!clientSecret || !refreshToken)) {
      return res.status(400).json({ error: 'Informe o Client Secret e o Refresh Token para configurar o envio.' })
    }

    let segredos: { clientSecretEncrypted?: string; refreshTokenEncrypted?: string }
    try {
      segredos = {
        ...(clientSecret ? { clientSecretEncrypted: criptografarSegredo(clientSecret) } : {}),
        ...(refreshToken ? { refreshTokenEncrypted: criptografarSegredo(refreshToken) } : {}),
      }
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Não foi possível proteger os segredos.' })
    }

    // Credencial nova ou alterada volta a ser testada do zero.
    const limpar = { lastError: null, credentialBlockedAt: null, credentialBlockCode: null, credentialBlockSummary: null }
    const salvo = atual
      ? await prisma.emailProviderSettings.update({
          where: { id: atual.id },
          data: { fromEmail, fromName, clientId, ...segredos, ...limpar },
        })
      : await prisma.emailProviderSettings.create({
          data: {
            fromEmail,
            fromName,
            clientId,
            clientSecretEncrypted: segredos.clientSecretEncrypted!,
            refreshTokenEncrypted: segredos.refreshTokenEncrypted!,
          },
        })
    res.json({ settings: credencialSemSegredos(salvo) })
  }),
)

router.post(
  '/teste',
  asyncHandler(async (req, res) => {
    const parsed = testeSchema.safeParse(req.body ?? {})
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' })
    const settings = await buscarCredencialEmail()
    if (!settings) return res.status(400).json({ error: 'Salve a credencial antes de enviar o teste.' })

    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: req.user!.sub }, select: { email: true } })
    const destino = parsed.data.to ?? usuario.email
    const { assunto, html } = emailCursoAtribuido(await dadosDaPrevia(req.user!.sub))
    try {
      // Teste manual do administrador: envia mesmo com a trava de produção desligada.
      await enviarEmailSistema({ to: destino, subject: `[Teste] ${assunto}`, html }, { ignorarTrava: true })
      await registrarSucessoCredencial(settings.id)
      res.json({ ok: true, sentTo: destino, settings: credencialSemSegredos(await buscarCredencialEmail()) })
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Não foi possível enviar o e-mail de teste.',
        settings: credencialSemSegredos(await buscarCredencialEmail()),
      })
    }
  }),
)

router.get(
  '/previa',
  asyncHandler(async (req, res) => {
    const cursoId = typeof req.query.curso === 'string' ? req.query.curso : undefined
    const { html } = emailCursoAtribuido(await dadosDaPrevia(req.user!.sub, cursoId))
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'")
    res.type('html').send(embutirImagens(html))
  }),
)

export default router
