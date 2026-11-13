import { botaoEmail, CORES, escapar, layoutEmailUniversidade } from './layoutEmail.js'

export type DadosEmailCursoAtribuido = {
  nome: string
  link: string
  curso: {
    titulo: string
    categoria: string
    descricao: string
    cargaHoraria: number
    pontos: number
    /** URL pública da capa (miniatura do vídeo da primeira etapa), se houver. */
    capa: string | null
    sequencial: boolean
    etapas: { titulo: string; subetapas: number }[]
    unidades: number
  }
  obrigatorio: boolean
  /** yyyy-mm-dd */
  prazo: string | null
}

const MAX_ETAPAS_LISTADAS = 6

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] || nome
}

function cargaLegivel(horas: number) {
  const total = Math.round(horas * 60)
  const h = Math.floor(total / 60)
  const min = total % 60
  if (h === 0) return `${min} min`
  return min ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`
}

function dataLegivel(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function resumo(texto: string, limite = 260) {
  const limpo = texto.trim().replace(/\s+/g, ' ')
  return limpo.length > limite ? `${limpo.slice(0, limite - 1).trimEnd()}…` : limpo
}

function estatistica(rotulo: string, valor: string, borda: boolean) {
  return `
    <td align="center" width="33%" style="padding:14px 8px;${borda ? `border-left:1px solid ${CORES.borda};` : ''}">
      <p style="margin:0;font-size:20px;line-height:1.2;font-weight:800;color:${CORES.marinho};">${escapar(valor)}</p>
      <p style="margin:4px 0 0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${CORES.suave};">${escapar(rotulo)}</p>
    </td>`
}

function passo(numero: number, titulo: string, texto: string) {
  return `
    <td valign="top" width="33%" style="padding:0 6px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CORES.painel};border:1px solid ${CORES.borda};border-radius:12px;">
        <tr>
          <td style="padding:14px 14px 16px;">
            <span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:999px;background:${CORES.marinho};color:#ffffff;font-size:13px;font-weight:700;text-align:center;">${numero}</span>
            <p style="margin:10px 0 4px;font-size:13px;font-weight:700;color:${CORES.texto};">${escapar(titulo)}</p>
            <p style="margin:0;font-size:12px;line-height:1.5;color:${CORES.suave};">${escapar(texto)}</p>
          </td>
        </tr>
      </table>
    </td>`
}

/** E-mail enviado quando um curso passa a ser destinado ao colaborador. */
export function emailCursoAtribuido({ nome, link, curso, obrigatorio, prazo }: DadosEmailCursoAtribuido) {
  const assunto = obrigatorio
    ? `Novo curso obrigatório para você: ${curso.titulo}`
    : `Novo curso para você na Universidade Só Aço: ${curso.titulo}`

  const capaHtml = curso.capa
    ? `<tr><td style="padding:0;"><img src="${escapar(curso.capa)}" alt="" width="584" style="display:block;width:100%;max-width:584px;height:auto;border:0;border-radius:14px 14px 0 0;" /></td></tr>`
    : ''

  const descricaoHtml = curso.descricao.trim()
    ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${CORES.suave};">${escapar(resumo(curso.descricao))}</p>`
    : ''

  const prazoHtml =
    obrigatorio && prazo
      ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;background:${CORES.laranjaSuave};border:1px solid rgba(243,156,18,0.45);border-radius:12px;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0;font-size:14px;line-height:1.5;color:${CORES.texto};">
            <strong style="color:${CORES.laranjaEscuro};">Curso obrigatório.</strong>
            Conclua até <strong>${escapar(dataLegivel(prazo))}</strong> para ficar em dia com a sua trilha.
          </p>
        </td>
      </tr>
    </table>`
      : obrigatorio
        ? `<p style="margin:20px 0 0;font-size:14px;color:${CORES.laranjaEscuro};font-weight:700;">Este curso é obrigatório para você.</p>`
        : ''

  const etapasListadas = curso.etapas.slice(0, MAX_ETAPAS_LISTADAS)
  const restantes = curso.etapas.length - etapasListadas.length
  const etapasHtml = etapasListadas.length
    ? `
    <p style="margin:28px 0 12px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${CORES.marinho};">O que você vai ver</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${etapasListadas
        .map(
          (etapa, indice) => `
      <tr>
        <td width="34" valign="top" style="padding:0 0 10px;">
          <span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:999px;background:${CORES.laranjaSuave};border:1px solid rgba(243,156,18,0.55);color:${CORES.laranjaEscuro};font-size:12px;font-weight:700;text-align:center;">${indice + 1}</span>
        </td>
        <td valign="top" style="padding:2px 0 10px;font-size:14px;line-height:1.45;color:${CORES.texto};">
          ${escapar(etapa.titulo)}${etapa.subetapas > 0 ? ` <span style="color:${CORES.suave};font-size:12px;">· ${etapa.subetapas} ${etapa.subetapas === 1 ? 'parte' : 'partes'}</span>` : ''}
        </td>
      </tr>`,
        )
        .join('')}
      ${restantes > 0 ? `<tr><td></td><td style="padding:0 0 6px;font-size:13px;color:${CORES.suave};">e mais ${restantes} ${restantes === 1 ? 'etapa' : 'etapas'}…</td></tr>` : ''}
    </table>
    ${curso.sequencial ? `<p style="margin:4px 0 0;font-size:12px;color:${CORES.suave};">As etapas são liberadas em sequência: cada uma abre quando você conclui a anterior.</p>` : ''}`
    : ''

  const corpo = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CORES.painel};border-left:4px solid ${CORES.laranja};border-radius:0 12px 12px 0;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${CORES.laranjaEscuro};">Recado do Amigaço</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${CORES.texto};">
            Oi, <strong>${escapar(primeiroNome(nome))}</strong>! Passei para avisar que tem curso novo esperando por você na
            Universidade Corporativa Só Aço. Bora aprender junto?
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;border:1px solid ${CORES.borda};border-radius:14px;border-collapse:separate;">
      ${capaHtml}
      <tr>
        <td style="padding:20px 20px 6px;">
          <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${CORES.painel};border:1px solid ${CORES.borda};color:${CORES.suave};font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">${escapar(curso.categoria)}</span>
          <h2 style="margin:12px 0 0;font-size:21px;line-height:1.3;font-weight:800;color:${CORES.marinho};">${escapar(curso.titulo)}</h2>
          ${descricaoHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:14px 12px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CORES.painel};border-radius:12px;">
            <tr>
              ${estatistica('Carga horária', cargaLegivel(curso.cargaHoraria), false)}
              ${estatistica(curso.unidades === 1 ? 'Etapa' : 'Etapas', String(curso.unidades), true)}
              ${estatistica('Pontos', curso.pontos > 0 ? `+${curso.pontos}` : '—', true)}
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>
    </table>

    ${prazoHtml}
    ${etapasHtml}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:30px 0 0;">
      <tr><td align="center">${botaoEmail('Começar o curso agora', link)}</td></tr>
      <tr>
        <td align="center" style="padding:14px 0 0;font-size:12px;line-height:1.5;color:${CORES.suave};">
          Se o botão não abrir, copie e cole no navegador:<br />
          <a href="${escapar(link)}" style="color:${CORES.marinhoClaro};word-break:break-all;">${escapar(link)}</a>
        </td>
      </tr>
    </table>

    <p style="margin:32px 0 12px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${CORES.marinho};">Como funciona</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        ${passo(1, 'Acesse', 'Entre com seu e-mail corporativo e abra o curso em Meus Cursos.')}
        ${passo(2, 'Conclua as etapas', 'Assista aos vídeos e leia os materiais de cada etapa.')}
        ${passo(3, 'Ganhe pontos', 'Ao concluir, você soma pontos no ranking e recebe o certificado.')}
      </tr>
    </table>`

  const html = layoutEmailUniversidade({
    preheader: `${curso.titulo} · ${cargaLegivel(curso.cargaHoraria)}${obrigatorio && prazo ? ` · prazo ${dataLegivel(prazo)}` : ''}`,
    selo: obrigatorio ? 'Novo curso obrigatório' : 'Novo curso para você',
    titulo: `${primeiroNome(nome)}, você tem um novo curso!`,
    subtitulo: 'Seu próximo passo de desenvolvimento já está disponível.',
    corpo,
    rodape: 'Você recebeu este e-mail porque um curso foi destinado a você. Esta é uma mensagem automática, por favor não responda.',
  })

  return { assunto, html }
}
