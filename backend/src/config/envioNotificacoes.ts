/**
 * Trava do envio real de e-mails automáticos (mesmo padrão do Gestão Smart).
 *
 * Por padrão o envio fica DESLIGADO: só a máquina de produção define
 * `NOTIFICACOES_ENVIO_HABILITADO=true` no backend/.env. Máquinas de desenvolvimento
 * costumam usar uma cópia do banco de produção e a mesma credencial do Gmail; sem esta
 * trava, um teste local mandaria e-mails reais para os colaboradores.
 */

let statusLogado = false

export function envioNotificacoesHabilitado() {
  return process.env.NOTIFICACOES_ENVIO_HABILITADO?.trim().toLowerCase() === 'true'
}

export function logEnvioSuprimido(destino: string, assunto: string) {
  console.warn(
    `[envio-desabilitado] E-MAIL NÃO enviado (dry-run): ${destino} — ${assunto}. ` +
      'Defina NOTIFICACOES_ENVIO_HABILITADO=true no backend/.env para habilitar (apenas em produção).',
  )
}

export function logStatusEnvioNotificacoes() {
  if (statusLogado) return
  statusLogado = true
  if (envioNotificacoesHabilitado()) {
    console.log('[envio-notificacoes] Envio real de e-mails HABILITADO (NOTIFICACOES_ENVIO_HABILITADO=true).')
  } else {
    console.warn(
      '[envio-notificacoes] Envio real de e-mails DESABILITADO (dry-run). ' +
        'Em produção, defina NOTIFICACOES_ENVIO_HABILITADO=true no backend/.env.',
    )
  }
}
