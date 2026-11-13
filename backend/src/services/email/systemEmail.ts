import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { EmailProviderSettings } from '@prisma/client'
import { envioNotificacoesHabilitado, logEnvioSuprimido } from '../../config/envioNotificacoes.js'
import { prisma } from '../../config/prisma.js'
import { imagensInlineUsadas } from './imagensEmail.js'

export type EmailAttachment = {
  filename: string
  mimeType: string
  contentBase64: string
  /** Content-ID usado por imagens inline: <img src="cid:...">. */
  contentId?: string
  disposition?: 'attachment' | 'inline'
}

export type SendSystemEmailInput = {
  to: string | string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

// ─── Criptografia dos segredos da credencial ────────────────────────────────

function chaveCriptografia() {
  const segredo = process.env.EMAIL_SETTINGS_ENCRYPTION_KEY?.trim()
  if (!segredo) throw new Error('EMAIL_SETTINGS_ENCRYPTION_KEY não configurado no backend/.env.')
  return createHash('sha256').update(segredo).digest()
}

export function criptografarSegredo(valor: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', chaveCriptografia(), iv)
  const cifrado = Buffer.concat([cipher.update(valor, 'utf8'), cipher.final()])
  const payload = Buffer.concat([cifrado, cipher.getAuthTag()])
  return `v1:${iv.toString('base64url')}:${payload.toString('base64url')}`
}

function descriptografarSegredo(payload: string) {
  const [versao, ivRaw, cifradoRaw] = payload.split(':')
  if (versao !== 'v1' || !ivRaw || !cifradoRaw) throw new Error('Segredo criptografado inválido.')
  const dados = Buffer.from(cifradoRaw, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', chaveCriptografia(), Buffer.from(ivRaw, 'base64url'))
  decipher.setAuthTag(dados.subarray(dados.length - 16))
  return Buffer.concat([decipher.update(dados.subarray(0, dados.length - 16)), decipher.final()]).toString('utf8')
}

// ─── Credencial ──────────────────────────────────────────────────────────────

export function buscarCredencialEmail() {
  return prisma.emailProviderSettings.findFirst({ orderBy: { updatedAt: 'desc' } })
}

export function credencialSemSegredos(settings: EmailProviderSettings | null) {
  return {
    configured: Boolean(settings),
    provider: 'gmail_api',
    fromEmail: settings?.fromEmail ?? '',
    fromName: settings?.fromName ?? '',
    clientId: settings?.clientId ?? '',
    hasClientSecret: Boolean(settings?.clientSecretEncrypted),
    hasRefreshToken: Boolean(settings?.refreshTokenEncrypted),
    lastTestedAt: settings?.lastTestedAt?.toISOString() ?? null,
    lastError: settings?.lastError ?? null,
    credentialBlockedAt: settings?.credentialBlockedAt?.toISOString() ?? null,
    credentialBlockSummary: settings?.credentialBlockSummary ?? null,
    updatedAt: settings?.updatedAt?.toISOString() ?? null,
    sendingEnabled: envioNotificacoesHabilitado(),
  }
}

function dicaErroOAuth(erro: string | undefined) {
  switch (erro) {
    case 'invalid_client':
      return 'Client ID ou Client Secret incorretos. Gere nova chave no Google Cloud e novo refresh token no OAuth Playground.'
    case 'unauthorized_client':
      return 'Tipo OAuth incorreto ou redirect ausente. Use "Aplicativo da Web" com redirect https://developers.google.com/oauthplayground'
    case 'invalid_grant':
      return 'Refresh token revogado ou de outro Client ID. Gere um novo no OAuth Playground com as mesmas credenciais.'
    default:
      return 'Verifique as credenciais do Gmail e o escopo https://mail.google.com/'
  }
}

export async function registrarErroCredencial(settingsId: string, error: unknown) {
  const mensagem = error instanceof Error ? error.message : String(error)
  const codigo = mensagem.match(/\b(invalid_client|unauthorized_client|invalid_grant)\b/)?.[1]
  await prisma.emailProviderSettings.update({
    where: { id: settingsId },
    data: {
      lastError: mensagem.slice(0, 2000),
      credentialBlockedAt: codigo ? new Date() : undefined,
      credentialBlockCode: codigo ?? null,
      credentialBlockSummary: codigo ? dicaErroOAuth(codigo) : null,
    },
  })
}

export async function registrarSucessoCredencial(settingsId: string) {
  await prisma.emailProviderSettings.update({
    where: { id: settingsId },
    data: { lastTestedAt: new Date(), lastError: null, credentialBlockedAt: null, credentialBlockCode: null, credentialBlockSummary: null },
  })
}

// ─── Montagem e envio pela Gmail API ─────────────────────────────────────────

function normalizarDestinatarios(valor: string | string[]) {
  const lista = Array.isArray(valor) ? valor : [valor]
  return [...new Set(lista.map((email) => email.trim().toLowerCase()).filter(Boolean))]
}

function cabecalhoUtf8(valor: string) {
  if (/^[\x20-\x7E]*$/.test(valor)) return valor
  return `=?UTF-8?B?${Buffer.from(valor, 'utf8').toString('base64')}?=`
}

function base64Url(texto: string) {
  return Buffer.from(texto, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

/** Quebra o base64 em linhas de 76 caracteres (RFC 2045). */
function base64EmLinhas(base64: string) {
  return base64.match(/.{1,76}/g)?.join('\r\n') ?? ''
}

function montarMime(input: {
  fromEmail: string
  fromName: string
  to: string[]
  subject: string
  html: string
  attachments: EmailAttachment[]
}) {
  const limiteRelated = `related_${randomBytes(8).toString('hex')}`
  const linhas = [
    `From: "${cabecalhoUtf8(input.fromName)}" <${input.fromEmail}>`,
    `To: ${input.to.join(', ')}`,
    `Subject: ${cabecalhoUtf8(input.subject)}`,
    'MIME-Version: 1.0',
  ]
  const htmlParte = ['Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', base64EmLinhas(Buffer.from(input.html, 'utf8').toString('base64'))]

  if (input.attachments.length === 0) return [...linhas, ...htmlParte].join('\r\n')

  // multipart/related mantém as imagens inline (cid:) ligadas ao HTML em Gmail e Outlook.
  linhas.push(`Content-Type: multipart/related; boundary="${limiteRelated}"`, '', `--${limiteRelated}`, ...htmlParte)
  for (const anexo of input.attachments) {
    const disposicao = anexo.disposition ?? (anexo.contentId ? 'inline' : 'attachment')
    linhas.push(
      `--${limiteRelated}`,
      `Content-Type: ${anexo.mimeType}; name="${anexo.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: ${disposicao}; filename="${anexo.filename}"`,
      ...(anexo.contentId ? [`Content-ID: <${anexo.contentId}>`, `X-Attachment-Id: ${anexo.contentId}`] : []),
      '',
      base64EmLinhas(anexo.contentBase64),
    )
  }
  linhas.push(`--${limiteRelated}--`)
  return linhas.join('\r\n')
}

async function renovarTokenGmail(settings: EmailProviderSettings) {
  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: descriptografarSegredo(settings.clientSecretEncrypted),
      refresh_token: descriptografarSegredo(settings.refreshTokenEncrypted),
      grant_type: 'refresh_token',
    }).toString(),
  })
  const json = (await resposta.json()) as { access_token?: string; error?: string; error_description?: string }
  if (!resposta.ok || !json.access_token) {
    throw new Error(
      `Falha ao renovar o token do Gmail: ${resposta.status} — ${json.error ?? 'erro'} — ${json.error_description ?? dicaErroOAuth(json.error)}`,
    )
  }
  return json.access_token
}

async function enviarPelaGmailApi(settings: EmailProviderSettings, input: SendSystemEmailInput) {
  const to = normalizarDestinatarios(input.to)
  if (to.length === 0) throw new Error('Nenhum destinatário informado.')
  const raw = montarMime({
    fromEmail: settings.fromEmail,
    fromName: settings.fromName,
    to,
    subject: input.subject,
    html: input.html,
    attachments: [...(input.attachments ?? []), ...imagensInlineUsadas(input.html)],
  })
  const token = await renovarTokenGmail(settings)
  const resposta = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64Url(raw) }),
  })
  if (!resposta.ok) {
    throw new Error(`A Gmail API recusou o envio (${resposta.status}): ${(await resposta.text()).slice(0, 500)}`)
  }
}

/**
 * Envia um e-mail do sistema. Com `ignorarTrava` (só para o teste disparado pelo administrador),
 * envia mesmo com NOTIFICACOES_ENVIO_HABILITADO desligado. Retorna false quando o envio foi suprimido.
 */
export async function enviarEmailSistema(input: SendSystemEmailInput, opcoes: { ignorarTrava?: boolean } = {}) {
  if (!opcoes.ignorarTrava && !envioNotificacoesHabilitado()) {
    logEnvioSuprimido(normalizarDestinatarios(input.to).join(', '), input.subject)
    return false
  }
  const settings = await buscarCredencialEmail()
  if (!settings) throw new Error('Credencial de e-mail não configurada. Acesse Configurações → E-mail.')
  if (settings.credentialBlockedAt) {
    throw new Error(settings.credentialBlockSummary ?? settings.lastError ?? 'Credencial de e-mail bloqueada. Reconfigure em Configurações.')
  }
  try {
    await enviarPelaGmailApi(settings, input)
    return true
  } catch (error) {
    console.error('[email] Falha no envio:', error instanceof Error ? error.message : error)
    await registrarErroCredencial(settings.id, error).catch(() => undefined)
    throw error
  }
}
