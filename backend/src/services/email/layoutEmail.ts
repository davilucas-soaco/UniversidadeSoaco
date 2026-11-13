import { srcImagem } from './imagensEmail.js'

/** Paleta dos e-mails: azul-marinho da marca com o laranja do logo. */
export const CORES = {
  fundo: '#eef1f6',
  card: '#ffffff',
  marinho: '#0f1b33',
  marinhoClaro: '#1c2f55',
  laranja: '#f39c12',
  laranjaEscuro: '#d9850a',
  laranjaSuave: '#fff5e6',
  texto: '#1e293b',
  suave: '#64748b',
  borda: '#e2e8f0',
  painel: '#f8fafc',
}

export const FONTE = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function escapar(valor: string) {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type LayoutEmail = {
  /** Texto curto exibido na lista da caixa de entrada, ao lado do assunto. */
  preheader: string
  selo: string
  titulo: string
  subtitulo?: string
  /** HTML do corpo (já escapado). */
  corpo: string
  rodape: string
}

/**
 * Layout padrão dos e-mails da Universidade Corporativa Só Aço (estrutura do Gestão Smart:
 * tabelas e estilos inline, que funcionam em Gmail, Outlook e celular).
 */
export function layoutEmailUniversidade({ preheader, selo, titulo, subtitulo, corpo, rodape }: LayoutEmail) {
  const subtituloHtml = subtitulo
    ? `<p style="margin:10px 0 0;font-size:15px;line-height:1.55;color:rgba(255,255,255,0.82);">${escapar(subtitulo)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapar(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:${CORES.fundo};font-family:${FONTE};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapar(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CORES.fundo};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;">
          <tr>
            <td style="border-radius:18px 18px 0 0;background:${CORES.marinho};background-image:linear-gradient(135deg, ${CORES.marinhoClaro} 0%, ${CORES.marinho} 70%);padding:26px 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td colspan="2" style="padding-bottom:6px;">
                    <span style="display:inline-block;background:#ffffff;border-radius:12px;padding:8px 14px;">
                      <img src="${srcImagem('logo')}" alt="Universidade Só Aço" width="150" style="display:block;border:0;outline:none;width:150px;height:auto;" />
                    </span>
                  </td>
                </tr>
                <tr>
                  <td valign="middle" style="padding:18px 0 28px;">
                    <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(243,156,18,0.16);border:1px solid rgba(243,156,18,0.55);color:${CORES.laranja};font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;">
                      ${escapar(selo)}
                    </span>
                    <h1 style="margin:14px 0 0;font-size:26px;line-height:1.22;font-weight:800;color:#ffffff;">${escapar(titulo)}</h1>
                    ${subtituloHtml}
                  </td>
                  <td valign="bottom" width="150" style="width:150px;padding-left:12px;">
                    <img src="${srcImagem('amigaco')}" alt="Amigaço, mascote da Universidade Só Aço" width="150" style="display:block;border:0;outline:none;width:150px;height:auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:${CORES.laranja};">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:${CORES.card};padding:30px 28px 32px;border-radius:0 0 18px 18px;box-shadow:0 14px 36px rgba(15,27,51,0.10);">
              ${corpo}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 12px 6px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${CORES.marinho};">Universidade Corporativa Só Aço</p>
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${CORES.laranjaEscuro};">Capacitando com excelência</p>
              <p style="margin:0;font-size:12px;line-height:1.55;color:${CORES.suave};">${escapar(rodape)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Botão "à prova de Outlook" (tabela com fundo sólido). */
export function botaoEmail(rotulo: string, href: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="border-radius:12px;background:${CORES.laranja};box-shadow:0 8px 18px rgba(243,156,18,0.35);">
          <a href="${escapar(href)}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${FONTE};font-size:16px;font-weight:700;color:${CORES.marinho};text-decoration:none;border-radius:12px;">
            ${escapar(rotulo)}
          </a>
        </td>
      </tr>
    </table>`
}
