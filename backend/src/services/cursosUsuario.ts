import type { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { etapaInclude, montarArvore, type EtapaComDocumentos } from './etapasCurso.js'
import { provaParaAluno } from './provas.js'

type DocumentoDto = { id: string; name: string; mime: string; size: number; url: string }

/** Melhor resultado do colaborador na prova de uma etapa. */
export type ResultadoProva = { bestScore: number; approved: boolean; attempts: number; lastAttemptAt: string }

export type EtapaDoUsuario = {
  id: string
  title: string
  description: string
  kind: 'video' | 'document' | 'exam' | null
  videoUrl?: string
  videoProvider?: string
  embedUrl?: string
  documents: DocumentoDto[]
  /** Prova da etapa, sem o gabarito. */
  exam?: ReturnType<typeof provaParaAluno>
  examResult?: ResultadoProva
  done: boolean
  children: EtapaDoUsuario[]
}

export type StatusCurso = 'pendente' | 'em_andamento' | 'concluido'
export type AlvoAtribuicao = 'usuario' | 'setor' | 'classe'

/** Mesmo formato do tipo `Course` do frontend, já com o progresso do colaborador. */
export type CursoDoUsuario = {
  id: string
  title: string
  category: string
  description: string
  durationHours: number
  points: number
  status: StatusCurso
  progress: number
  cover: { accent: string; icon: string; image: string }
  instructorId: string
  /** Quantidade de aulas em vídeo (o player gera apostila e quiz por módulo). */
  lessonsCount: number
  moduleTitles: string[]
  mandatory: boolean
  dueDate?: string
  isNew: boolean
  objectives: string[]
  /** Curso cadastrado pela gestão (vídeo único ou documentos), sem módulos. */
  authored: boolean
  contentKind?: string
  videoUrl?: string
  videoProvider?: string
  embedUrl?: string
  documents: DocumentoDto[]
  /** Pipeline de etapas (cursos cadastrados pela gestão). */
  stages: EtapaDoUsuario[]
  /** true = as etapas devem ser concluídas na ordem. */
  sequential: boolean
  /** O curso gera certificado e, se já emitido, o código e a data. */
  certificate: { enabled: boolean; code?: string; issuedAt?: string }
  assignedVia: AlvoAtribuicao[]
  assignedAt: string
  startedAt?: string
  completedAt?: string
  lastAccessAt?: string
}

const DIAS_CURSO_NOVO = 14
const DIA_MS = 24 * 60 * 60 * 1000

const cursoInclude = {
  modulos: {
    orderBy: { ordem: 'asc' },
    select: { titulo: true, _count: { select: { aulas: { where: { tipo: 'video' } } } } },
  },
  documentos: { where: { etapaId: null }, orderBy: [{ ordem: 'asc' }, { criadoEm: 'asc' }] },
  etapas: { include: etapaInclude },
} satisfies Prisma.CursoInclude

function documentoDto(cursoId: string, doc: { id: string; nome: string; mime: string; tamanho: number }): DocumentoDto {
  return { id: doc.id, name: doc.nome, mime: doc.mime, size: doc.tamanho, url: `/api/cursos/${cursoId}/documentos/${doc.id}` }
}

type CertificadoDto = { code: string; issuedAt: string }

/** Etapas concluídas, resultados de prova e certificados do colaborador. */
export type ProgressoDoUsuario = {
  concluidas: Set<string>
  provas: Map<string, ResultadoProva>
  certificados: Map<string, CertificadoDto>
}

const progressoVazio = (): ProgressoDoUsuario => ({ concluidas: new Set(), provas: new Map(), certificados: new Map() })

async function carregarProgresso(usuarioId: string, cursoIds: string[]): Promise<ProgressoDoUsuario> {
  const [etapas, tentativas, certificados] = await Promise.all([
    prisma.etapaProgresso.findMany({ where: { usuarioId, etapa: { cursoId: { in: cursoIds } } }, select: { etapaId: true } }),
    prisma.provaTentativa.findMany({
      where: { usuarioId, etapa: { cursoId: { in: cursoIds } } },
      select: { etapaId: true, nota: true, aprovado: true, criadoEm: true },
      orderBy: { criadoEm: 'asc' },
    }),
    prisma.certificado.findMany({
      where: { usuarioId, cursoId: { in: cursoIds } },
      select: { cursoId: true, codigo: true, emitidoEm: true },
    }),
  ])
  const provas = new Map<string, ResultadoProva>()
  for (const tentativa of tentativas) {
    const atual = provas.get(tentativa.etapaId)
    provas.set(tentativa.etapaId, {
      bestScore: Math.max(atual?.bestScore ?? 0, tentativa.nota),
      approved: (atual?.approved ?? false) || tentativa.aprovado,
      attempts: (atual?.attempts ?? 0) + 1,
      lastAttemptAt: tentativa.criadoEm.toISOString(),
    })
  }
  return {
    concluidas: new Set(etapas.map((item) => item.etapaId)),
    provas,
    certificados: new Map(
      certificados.map((item) => [item.cursoId, { code: item.codigo, issuedAt: item.emitidoEm.toISOString() }]),
    ),
  }
}

function etapaDto(cursoId: string, etapa: EtapaComDocumentos, progresso: ProgressoDoUsuario, filhas: EtapaDoUsuario[]): EtapaDoUsuario {
  const prova = filhas.length === 0 && etapa.tipoConteudo === 'exam' && etapa.prova ? provaParaAluno(etapa.prova) : undefined
  return {
    id: etapa.id,
    title: etapa.titulo,
    description: etapa.descricao ?? '',
    kind: (etapa.tipoConteudo ?? null) as EtapaDoUsuario['kind'],
    videoUrl: etapa.videoUrl ?? undefined,
    videoProvider: etapa.videoProvedor ?? undefined,
    embedUrl: etapa.embedUrl ?? undefined,
    documents: etapa.documentos.map((doc) => documentoDto(cursoId, doc)),
    exam: prova,
    examResult: prova ? progresso.provas.get(etapa.id) : undefined,
    done: filhas.length > 0 ? filhas.every((filha) => filha.done) : progresso.concluidas.has(etapa.id),
    children: filhas,
  }
}

function montarEtapas(cursoId: string, etapas: EtapaComDocumentos[], progresso: ProgressoDoUsuario) {
  return montarArvore(etapas).map((etapa) =>
    etapaDto(
      cursoId,
      etapa,
      progresso,
      etapa.filhas.map((filha) => etapaDto(cursoId, filha, progresso, [])),
    ),
  )
}

type CursoCompleto = Prisma.CursoGetPayload<{ include: typeof cursoInclude }>
type AtribuicaoResumo = { alvo: string; obrigatorio: boolean; prazo: string | null; criadoEm: Date }
type MatriculaResumo = Prisma.MatriculaGetPayload<object>

function lerObjetivos(valor: string): string[] {
  try {
    const lista: unknown = JSON.parse(valor)
    return Array.isArray(lista) ? lista.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function dataIso(data: Date | null | undefined) {
  return data ? data.toISOString() : undefined
}

function montarCurso(
  curso: CursoCompleto,
  doCurso: AtribuicaoResumo[],
  matricula: MatriculaResumo | undefined,
  agora: Date,
  progresso: ProgressoDoUsuario = progressoVazio(),
): CursoDoUsuario {
  const obrigatorias = doCurso.filter((item) => item.obrigatorio)
  const prazos = (obrigatorias.length > 0 ? obrigatorias : doCurso)
    .map((item) => item.prazo)
    .filter((prazo): prazo is string => Boolean(prazo))
    .sort()
  const atribuidoEm = doCurso.length
    ? new Date(Math.max(...doCurso.map((item) => item.criadoEm.getTime())))
    : curso.criadoEm

  const status = (matricula?.status ?? 'pendente') as StatusCurso
  const progress = status === 'concluido' ? 100 : (matricula?.progresso ?? 0)
  const etapas = montarEtapas(curso.id, curso.etapas, progresso)
  const unidades = etapas.reduce((total, etapa) => total + Math.max(1, etapa.children.length), 0)

  return {
    id: curso.id,
    title: curso.titulo,
    category: curso.categoria,
    description: curso.descricao,
    durationHours: curso.cargaHoraria,
    points: curso.pontos,
    status,
    progress,
    cover: { accent: curso.capaCor, icon: curso.capaIcone, image: curso.capaImagem ?? '' },
    instructorId: curso.instrutorId ?? '',
    lessonsCount: etapas.length > 0 ? unidades : curso.modulos.reduce((total, modulo) => total + modulo._count.aulas, 0),
    moduleTitles: etapas.length > 0 ? etapas.map((etapa) => etapa.title) : curso.modulos.map((modulo) => modulo.titulo),
    mandatory: obrigatorias.length > 0,
    dueDate: prazos[0],
    isNew: status === 'pendente' && agora.getTime() - atribuidoEm.getTime() < DIAS_CURSO_NOVO * DIA_MS,
    objectives: lerObjetivos(curso.objetivos),
    authored: Boolean(curso.tipoConteudo),
    contentKind: curso.tipoConteudo ?? undefined,
    videoUrl: curso.videoUrl ?? undefined,
    videoProvider: curso.videoProvedor ?? undefined,
    embedUrl: curso.embedUrl ?? undefined,
    documents: curso.documentos.map((doc) => documentoDto(curso.id, doc)),
    stages: etapas,
    sequential: curso.sequenciaObrigatoria,
    certificate: { enabled: curso.geraCertificado, ...progresso.certificados.get(curso.id) },
    assignedVia: [...new Set(doCurso.map((item) => item.alvo as AlvoAtribuicao))],
    assignedAt: atribuidoEm.toISOString(),
    startedAt: dataIso(matricula?.iniciadoEm),
    completedAt: dataIso(matricula?.concluidoEm),
    lastAccessAt: dataIso(matricula?.ultimoAcessoEm),
  }
}

/** Atribuições que alcançam o colaborador: diretas, pelo setor ou pelas classes dele. */
async function atribuicoesDoUsuario(usuarioId: string, cursoId?: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { setorId: true, classes: { select: { classeId: true } } },
  })
  if (!usuario) return []

  const classeIds = usuario.classes.map((item) => item.classeId)
  const alvos: Prisma.AtribuicaoWhereInput[] = [{ alvo: 'usuario', usuarioId }]
  if (usuario.setorId != null) alvos.push({ alvo: 'setor', setorId: usuario.setorId })
  if (classeIds.length > 0) alvos.push({ alvo: 'classe', classeId: { in: classeIds } })

  return prisma.atribuicao.findMany({
    where: { OR: alvos, curso: { publicado: true }, ...(cursoId ? { cursoId } : {}) },
    select: { cursoId: true, alvo: true, obrigatorio: true, prazo: true, criadoEm: true },
  })
}

/**
 * Cursos destinados ao colaborador. Um mesmo curso pode chegar por mais de um
 * caminho; nesse caso vale o prazo obrigatório mais próximo.
 */
export async function listarCursosDoUsuario(usuarioId: string, agora = new Date()): Promise<CursoDoUsuario[]> {
  const atribuicoes = await atribuicoesDoUsuario(usuarioId)
  if (atribuicoes.length === 0) return []

  const cursoIds = [...new Set(atribuicoes.map((item) => item.cursoId))]
  const [cursos, matriculas, progresso] = await Promise.all([
    prisma.curso.findMany({ where: { id: { in: cursoIds } }, include: cursoInclude }),
    prisma.matricula.findMany({ where: { usuarioId, cursoId: { in: cursoIds } } }),
    carregarProgresso(usuarioId, cursoIds),
  ])
  const matriculaPorCurso = new Map(matriculas.map((item) => [item.cursoId, item]))

  return cursos
    .map((curso) =>
      montarCurso(
        curso,
        atribuicoes.filter((item) => item.cursoId === curso.id),
        matriculaPorCurso.get(curso.id),
        agora,
        progresso,
      ),
    )
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt) || a.title.localeCompare(b.title, 'pt-BR'))
}

/** Um curso para a tela de aula: destinado ao colaborador ou, para a gestão, qualquer curso (pré-visualização). */
export async function obterCursoParaUsuario(
  cursoId: string,
  usuarioId: string,
  podeVerTodos: boolean,
  agora = new Date(),
): Promise<CursoDoUsuario | null> {
  const [curso, atribuicoes, matricula, progresso] = await Promise.all([
    prisma.curso.findUnique({ where: { id: cursoId }, include: cursoInclude }),
    atribuicoesDoUsuario(usuarioId, cursoId),
    prisma.matricula.findUnique({ where: { usuarioId_cursoId: { usuarioId, cursoId } } }),
    carregarProgresso(usuarioId, [cursoId]),
  ])
  if (!curso || (atribuicoes.length === 0 && !podeVerTodos)) return null
  return montarCurso(curso, atribuicoes, matricula ?? undefined, agora, progresso)
}

export async function cursoDestinadoAoUsuario(cursoId: string, usuarioId: string) {
  return (await atribuicoesDoUsuario(usuarioId, cursoId)).length > 0
}
