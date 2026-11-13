import { prisma } from '../config/prisma.js'

type Periodo = '30d' | '6m' | '12m'

type PontoGrafico = { label: string; points: number; average: number }

export type ItemRanking = {
  id: string
  name: string
  initials: string
  jobTitle: string
  points: number
  completedCourses: number
  position: number
  isCurrentUser: boolean
}

export type DashboardUsuario = {
  /** Pontuação acumulada (soma do extrato). */
  points: number
  /** Pontos lançados no mês corrente. */
  monthPoints: number
  /** Média das notas das avaliações (0–100); null se ainda não respondeu nenhuma. */
  assessmentAverage: number | null
  studyWeek: { minutes: number; goalMinutes: number }
  performance: Record<Periodo, PontoGrafico[]>
  ranking: {
    top: ItemRanking[]
    me: ItemRanking | null
    total: number
    percentile: number | null
  }
  activities: { id: string; type: string; description: string; createdAt: string }[]
}

type Faixa = { label: string; inicio: Date; fim: Date }

const DIA_MS = 24 * 60 * 60 * 1000
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
/** Papéis que participam do ranking e da média da equipe. */
const PAPEIS_RANKING = ['colaborador', 'gestor_conteudo']
/** Pódio (3 primeiros) + tabela dos demais no card do dashboard. */
const RANKING_LIMITE = 50

function inicioDoDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

function diaMes(data: Date) {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`
}

/** 11 janelas de 3 dias terminando hoje. */
function faixas30Dias(agora: Date): Faixa[] {
  const fim = inicioDoDia(agora).getTime() + DIA_MS
  return Array.from({ length: 11 }, (_, index) => {
    const inicio = new Date(fim - (11 - index) * 3 * DIA_MS)
    return { label: diaMes(inicio), inicio, fim: new Date(inicio.getTime() + 3 * DIA_MS) }
  })
}

function faixasMensais(agora: Date, quantidade: number): Faixa[] {
  return Array.from({ length: quantidade }, (_, index) => {
    const deslocamento = quantidade - 1 - index
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - deslocamento, 1)
    const fim = new Date(agora.getFullYear(), agora.getMonth() - deslocamento + 1, 1)
    return { label: MESES[inicio.getMonth()], inicio, fim }
  })
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export async function montarDashboard(usuarioId: string, agora = new Date()): Promise<DashboardUsuario> {
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const inicio12Meses = new Date(agora.getFullYear(), agora.getMonth() - 11, 1)
  const inicioSemana = new Date(agora.getTime() - 7 * DIA_MS)

  const [usuario, totalPontos, mediaAvaliacoes, estudoSemana, participantes, eventos, concluidos, atividades] =
    await Promise.all([
      prisma.usuario.findUniqueOrThrow({
        where: { id: usuarioId },
        select: { metaMinutosSemana: true },
      }),
      prisma.pontuacaoEvento.aggregate({ where: { usuarioId }, _sum: { pontos: true } }),
      prisma.avaliacaoResultado.aggregate({ where: { usuarioId }, _avg: { nota: true } }),
      prisma.sessaoEstudo.aggregate({
        where: { usuarioId, iniciadoEm: { gte: inicioSemana } },
        _sum: { minutos: true },
      }),
      prisma.usuario.findMany({
        where: { ativo: true, papel: { in: PAPEIS_RANKING } },
        select: { id: true, nome: true, cargo: true },
      }),
      prisma.pontuacaoEvento.findMany({
        where: { criadoEm: { gte: inicio12Meses }, usuario: { ativo: true } },
        select: { usuarioId: true, pontos: true, criadoEm: true },
      }),
      prisma.matricula.groupBy({ by: ['usuarioId'], where: { status: 'concluido' }, _count: { _all: true } }),
      prisma.atividade.findMany({
        where: { usuarioId },
        orderBy: { criadoEm: 'desc' },
        take: 5,
      }),
    ])

  const idsEquipe = new Set(participantes.map((item) => item.id))
  const tamanhoEquipe = Math.max(1, participantes.length)

  const serie = (faixas: Faixa[]): PontoGrafico[] =>
    faixas.map((faixa) => {
      let meus = 0
      let equipe = 0
      for (const evento of eventos) {
        if (evento.criadoEm < faixa.inicio || evento.criadoEm >= faixa.fim) continue
        if (evento.usuarioId === usuarioId) meus += evento.pontos
        if (idsEquipe.has(evento.usuarioId)) equipe += evento.pontos
      }
      return { label: faixa.label, points: meus, average: Math.round(equipe / tamanhoEquipe) }
    })

  const pontosNoMes = new Map<string, number>()
  for (const evento of eventos) {
    if (evento.criadoEm < inicioMes) continue
    pontosNoMes.set(evento.usuarioId, (pontosNoMes.get(evento.usuarioId) ?? 0) + evento.pontos)
  }
  const concluidosPorUsuario = new Map(concluidos.map((item) => [item.usuarioId, item._count._all]))

  const ranking: ItemRanking[] = participantes
    .map((pessoa) => ({
      id: pessoa.id,
      name: pessoa.nome,
      initials: iniciais(pessoa.nome),
      jobTitle: pessoa.cargo,
      points: pontosNoMes.get(pessoa.id) ?? 0,
      completedCourses: concluidosPorUsuario.get(pessoa.id) ?? 0,
      position: 0,
      isCurrentUser: pessoa.id === usuarioId,
    }))
    .filter((item) => item.points > 0)
    .sort(
      (a, b) =>
        b.points - a.points || b.completedCourses - a.completedCourses || a.name.localeCompare(b.name, 'pt-BR'),
    )
    .map((item, index) => ({ ...item, position: index + 1 }))

  const eu = ranking.find((item) => item.isCurrentUser) ?? null

  return {
    points: totalPontos._sum.pontos ?? 0,
    monthPoints: pontosNoMes.get(usuarioId) ?? 0,
    assessmentAverage:
      mediaAvaliacoes._avg.nota == null ? null : Math.round(mediaAvaliacoes._avg.nota * 10) / 10,
    studyWeek: { minutes: estudoSemana._sum.minutos ?? 0, goalMinutes: usuario.metaMinutosSemana },
    performance: {
      '30d': serie(faixas30Dias(agora)),
      '6m': serie(faixasMensais(agora, 6)),
      '12m': serie(faixasMensais(agora, 12)),
    },
    ranking: {
      top: ranking.slice(0, RANKING_LIMITE),
      me: eu,
      total: ranking.length,
      percentile: eu ? Math.max(1, Math.round((eu.position / ranking.length) * 100)) : null,
    },
    activities: atividades.map((item) => ({
      id: item.id,
      type: item.tipo,
      description: item.descricao,
      createdAt: item.criadoEm.toISOString(),
    })),
  }
}
