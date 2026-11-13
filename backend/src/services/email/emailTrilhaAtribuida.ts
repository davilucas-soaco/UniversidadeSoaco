import { cargaLegivel, dataLegivel, primeiroNome, resumo } from './emailCursoAtribuido.js'
import { botaoEmail, CORES, escapar, layoutEmailUniversidade } from './layoutEmail.js'

export type DadosEmailTrilhaAtribuida = {
  nome: string
  link: string
  trilha: {
    titulo: string
    descricao: string
    sequencial: boolean
    certificado: boolean
    cursos: { titulo: string; cargaHoraria: number }[]
  }
  obrigatorio: boolean
  /** yyyy-mm-dd */
  prazo: string | null
}

const MAX_CURSOS_LISTADOS = 8

/** E-mail enviado quando uma trilha passa a ser destinada ao colaborador. */
export function emailTrilhaAtribuida({ nome, link, trilha, obrigatorio, prazo }: DadosEmailTrilhaAtribuida) {
  const assunto = obrigatorio
    ? `Nova trilha obrigatória para você: ${trilha.titulo}`
    : `Nova trilha para você na Universidade Só Aço: ${trilha.titulo}`
  const carga = cargaLegivel(trilha.cursos.reduce((total, curso) => total + curso.cargaHoraria, 0))

  const descricaoHtml = trilha.descricao.trim()
    ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${CORES.suave};">${escapar(resumo(trilha.descricao))}</p>`
    : ''

  const prazoHtml = obrigatorio
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;background:${CORES.laranjaSuave};border:1px solid rgba(243,156,18,0.45);border-radius:12px;">
      <tr>
        <td style="padding:14px 16px;font-size:14px;line-height:1.5;color:${CORES.texto};">
          <strong style="color:${CORES.laranjaEscuro};">Trilha obrigatória.</strong>
          ${prazo ? `Conclua todos os cursos até <strong>${escapar(dataLegivel(prazo))}</strong>.` : 'Conclua todos os cursos para ficar em dia.'}
        </td>
      </tr>
    </table>`
    : ''

  const listados = trilha.cursos.slice(0, MAX_CURSOS_LISTADOS)
  const restantes = trilha.cursos.length - listados.length
  const cursosHtml = `
    <p style="margin:28px 0 12px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${CORES.marinho};">Cursos da trilha</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${listados
        .map(
          (curso, indice) => `
      <tr>
        <td width="34" valign="top" style="padding:0 0 10px;">
          <span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:999px;background:${CORES.laranjaSuave};border:1px solid rgba(243,156,18,0.55);color:${CORES.laranjaEscuro};font-size:12px;font-weight:700;text-align:center;">${indice + 1}</span>
        </td>
        <td valign="top" style="padding:2px 0 10px;font-size:14px;line-height:1.45;color:${CORES.texto};">
          ${escapar(curso.titulo)} <span style="color:${CORES.suave};font-size:12px;">· ${escapar(cargaLegivel(curso.cargaHoraria))}</span>
        </td>
      </tr>`,
        )
        .join('')}
      ${restantes > 0 ? `<tr><td></td><td style="padding:0 0 6px;font-size:13px;color:${CORES.suave};">e mais ${restantes} ${restantes === 1 ? 'curso' : 'cursos'}…</td></tr>` : ''}
    </table>
    ${trilha.sequencial ? `<p style="margin:4px 0 0;font-size:12px;color:${CORES.suave};">Os cursos são liberados em sequência: cada um abre quando você conclui o anterior.</p>` : ''}`

  const corpo = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CORES.painel};border-left:4px solid ${CORES.laranja};border-radius:0 12px 12px 0;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${CORES.laranjaEscuro};">Recado do Amigaço</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${CORES.texto};">
            Oi, <strong>${escapar(primeiroNome(nome))}</strong>! Montaram uma trilha de cursos pensada para você na
            Universidade Corporativa Só Aço. É só seguir o caminho, um curso de cada vez.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;border:1px solid ${CORES.borda};border-radius:14px;border-collapse:separate;">
      <tr>
        <td style="padding:20px 20px 16px;">
          <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${CORES.painel};border:1px solid ${CORES.borda};color:${CORES.suave};font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Trilha de cursos</span>
          <h2 style="margin:12px 0 0;font-size:21px;line-height:1.3;font-weight:800;color:${CORES.marinho};">${escapar(trilha.titulo)}</h2>
          ${descricaoHtml}
          <p style="margin:14px 0 0;font-size:13px;color:${CORES.suave};">
            <strong style="color:${CORES.texto};">${trilha.cursos.length} ${trilha.cursos.length === 1 ? 'curso' : 'cursos'}</strong> ·
            <strong style="color:${CORES.texto};">${escapar(carga)}</strong> no total${trilha.certificado ? ' · certificado ao concluir' : ''}
          </p>
        </td>
      </tr>
    </table>

    ${prazoHtml}
    ${cursosHtml}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:30px 0 0;">
      <tr><td align="center">${botaoEmail('Ver a trilha', link)}</td></tr>
      <tr>
        <td align="center" style="padding:14px 0 0;font-size:12px;line-height:1.5;color:${CORES.suave};">
          Se o botão não abrir, copie e cole no navegador:<br />
          <a href="${escapar(link)}" style="color:${CORES.marinhoClaro};word-break:break-all;">${escapar(link)}</a>
        </td>
      </tr>
    </table>`

  const html = layoutEmailUniversidade({
    preheader: `${trilha.titulo} · ${trilha.cursos.length} cursos · ${carga}`,
    selo: obrigatorio ? 'Nova trilha obrigatória' : 'Nova trilha para você',
    titulo: `${primeiroNome(nome)}, você tem uma nova trilha!`,
    subtitulo: 'Uma sequência de cursos para o seu desenvolvimento.',
    corpo,
    rodape: 'Você recebeu este e-mail porque uma trilha foi destinada a você. Esta é uma mensagem automática, por favor não responda.',
  })

  return { assunto, html }
}
