import type { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { codigoCertificado } from '../utils/certificado.js'

/** Curso de trilha sequencial que só libera depois de outro. */
export type BloqueioTrilha = { trailId: string; trailTitle: string; courseId: string; courseTitle: string }

type StatusCurso = 'pendente' | 'em_andamento' | 'concluido'

export type CursoDaTrilha = {
  id: string
  title: string
  category: string
  durationHours: number
  cover: { accent: string; icon: string; image: string }
  status: StatusCurso
  progress: number
  lockedBy?: BloqueioTrilha
  /** Certificado do curso, quando já emitido. */
  certificate?: { code: string; issuedAt: string }
}

/** Trilha como o colaborador recebe, com o andamento dele. */
export type TrilhaDoUsuario = {
  id: string
  title: string
  description: string
  sequential: boolean
  mandatory: boolean
  dueDate?: string
  durationHours: number
  status: StatusCurso
  /** Média do progresso dos cursos (0–100). */
  progress: number
  completedCount: number
  certificate: { enabled: boolean; code?: string; issuedAt?: string }
  courses: CursoDaTrilha[]
}

type Usuario = { setorId: number | null; classes: { classeId: number }[] }

async function carregarUsuario(usuarioId: string): Promise<Usuario | null> {
  return prisma.usuario.findFirst({
    where: { id: usuarioId, ativo: true },
    select: { setorId: true, classes: { select: { classeId: true } } },
  })
}

/** Alvos (usuário, setor, classes) que alcançam o colaborador. */
function alvosDoUsuario(usuarioId: string, usuario: Usuario) {
  const classeIds = usuario.classes.map((item) => item.classeId)
  return [
    { alvo: 'usuario', usuarioId },
    ...(usuario.setorId != null ? [{ alvo: 'setor', setorId: usuario.setorId }] : []),
    ...(classeIds.length > 0 ? [{ alvo: 'classe', classeId: { in: classeIds } }] : []),
  ]
}

const trilhaDoUsuarioInclude = {
  cursos: {
    orderBy: { ordem: 'asc' },
    where: { curso: { publicado: true } },
    include: {
      curso: {
        select: {
          id: true,
          titulo: true,
          categoria: true,
          cargaHoraria: true,
          capaCor: true,
          capaIcone: true,
          capaImagem: true,
          geraCertificado: true,
        },
      },
    },
  },
} satisfies Prisma.TrilhaInclude

type TrilhaRecebida = Prisma.TrilhaGetPayload<{ include: typeof trilhaDoUsuarioInclude }>

async function trilhasRecebidas(usuarioId: string, usuario: Usuario, filtro: Prisma.TrilhaWhereInput = {}) {
  return prisma.trilha.findMany({
    where: { ...filtro, alvos: { some: { OR: alvosDoUsuario(usuarioId, usuario) } } },
    include: trilhaDoUsuarioInclude,
    orderBy: { criadoEm: 'desc' },
  })
}

/** Cursos que chegam ao colaborador fora de qualquer trilha (esses nunca ficam bloqueados). */
async function cursosDiretos(usuarioId: string, usuario: Usuario, cursoIds: string[]) {
  const diretas = await prisma.atribuicao.findMany({
    where: { trilhaId: null, cursoId: { in: cursoIds }, OR: alvosDoUsuario(usuarioId, usuario) },
    select: { cursoId: true },
  })
  return new Set(diretas.map((item) => item.cursoId))
}

async function andamentoDosCursos(usuarioId: string, cursoIds: string[]) {
  const matriculas = await prisma.matricula.findMany({
    where: { usuarioId, cursoId: { in: cursoIds } },
    select: { cursoId: true, status: true, progresso: true },
  })
  return new Map(
    matriculas.map((item) => [
      item.cursoId,
      { status: item.status as StatusCurso, progress: item.status === 'concluido' ? 100 : item.progresso },
    ]),
  )
}

type Andamento = Awaited<ReturnType<typeof andamentoDosCursos>>

/** Em trilha sequencial, cada curso não concluído depois do primeiro pendente fica bloqueado por ele. */
function calcularBloqueios(trilhas: TrilhaRecebida[], andamento: Andamento, diretos: Set<string>) {
  const bloqueios = new Map<string, BloqueioTrilha>()
  for (const trilha of trilhas) {
    if (!trilha.sequenciaObrigatoria) continue
    let pendente: TrilhaRecebida['cursos'][number]['curso'] | null = null
    for (const { curso } of trilha.cursos) {
      const concluido = andamento.get(curso.id)?.status === 'concluido'
      if (pendente && !concluido && !diretos.has(curso.id) && !bloqueios.has(curso.id)) {
        bloqueios.set(curso.id, { trailId: trilha.id, trailTitle: trilha.titulo, courseId: pendente.id, courseTitle: pendente.titulo })
      }
      if (!pendente && !concluido) pendente = curso
    }
  }
  return bloqueios
}

/** Bloqueios de sequência de trilha para os cursos do colaborador. */
export async function bloqueiosDoUsuario(usuarioId: string, diretos: Set<string>) {
  const usuario = await carregarUsuario(usuarioId)
  if (!usuario) return new Map<string, BloqueioTrilha>()
  const trilhas = await trilhasRecebidas(usuarioId, usuario, { sequenciaObrigatoria: true })
  if (trilhas.length === 0) return new Map<string, BloqueioTrilha>()
  const cursoIds = [...new Set(trilhas.flatMap((trilha) => trilha.cursos.map((item) => item.cursoId)))]
  return calcularBloqueios(trilhas, await andamentoDosCursos(usuarioId, cursoIds), diretos)
}

/** Bloqueio de um curso específico (null quando o colaborador pode fazê-lo). */
export async function bloqueioDoCurso(usuarioId: string, cursoId: string) {
  const usuario = await carregarUsuario(usuarioId)
  if (!usuario) return null
  const trilhas = await trilhasRecebidas(usuarioId, usuario, {
    sequenciaObrigatoria: true,
    cursos: { some: { cursoId } },
  })
  if (trilhas.length === 0) return null
  const cursoIds = [...new Set(trilhas.flatMap((trilha) => trilha.cursos.map((item) => item.cursoId)))]
  const [andamento, diretos] = await Promise.all([
    andamentoDosCursos(usuarioId, cursoIds),
    cursosDiretos(usuarioId, usuario, [cursoId]),
  ])
  return calcularBloqueios(trilhas, andamento, diretos).get(cursoId) ?? null
}

function trilhaConcluida(trilha: TrilhaRecebida, andamento: Andamento) {
  return trilha.cursos.length > 0 && trilha.cursos.every(({ cursoId }) => andamento.get(cursoId)?.status === 'concluido')
}

async function garantirCertificado(usuarioId: string, trilhaId: string) {
  return prisma.certificadoTrilha.upsert({
    where: { usuarioId_trilhaId: { usuarioId, trilhaId } },
    create: { usuarioId, trilhaId, codigo: codigoCertificado() },
    update: {},
  })
}

/** Chamado quando o colaborador conclui um curso: emite o certificado das trilhas que ele completou. */
export async function emitirCertificadosDeTrilha(usuarioId: string, cursoId: string) {
  const usuario = await carregarUsuario(usuarioId)
  if (!usuario) return
  const trilhas = await trilhasRecebidas(usuarioId, usuario, { geraCertificado: true, cursos: { some: { cursoId } } })
  if (trilhas.length === 0) return
  const cursoIds = [...new Set(trilhas.flatMap((trilha) => trilha.cursos.map((item) => item.cursoId)))]
  const andamento = await andamentoDosCursos(usuarioId, cursoIds)
  for (const trilha of trilhas) {
    if (trilhaConcluida(trilha, andamento)) await garantirCertificado(usuarioId, trilha.id)
  }
}

/** Trilhas destinadas ao colaborador, com o andamento de cada curso. */
export async function listarTrilhasDoUsuario(usuarioId: string): Promise<TrilhaDoUsuario[]> {
  const usuario = await carregarUsuario(usuarioId)
  if (!usuario) return []
  const trilhas = await trilhasRecebidas(usuarioId, usuario)
  if (trilhas.length === 0) return []

  const cursoIds = [...new Set(trilhas.flatMap((trilha) => trilha.cursos.map((item) => item.cursoId)))]
  const [andamento, diretos, certificados, certificadosCurso] = await Promise.all([
    andamentoDosCursos(usuarioId, cursoIds),
    cursosDiretos(usuarioId, usuario, cursoIds),
    prisma.certificadoTrilha.findMany({ where: { usuarioId, trilhaId: { in: trilhas.map((trilha) => trilha.id) } } }),
    prisma.certificado.findMany({ where: { usuarioId, cursoId: { in: cursoIds } } }),
  ])
  const bloqueios = calcularBloqueios(trilhas, andamento, diretos)
  const certificadoPorTrilha = new Map(certificados.map((item) => [item.trilhaId, item]))
  const certificadoPorCurso = new Map(certificadosCurso.map((item) => [item.cursoId, item]))

  const resultado: TrilhaDoUsuario[] = []
  for (const trilha of trilhas) {
    const concluida = trilhaConcluida(trilha, andamento)
    // A trilha pode ter passado a gerar certificado (ou sido criada) depois que o colaborador concluiu os cursos.
    let certificado = certificadoPorTrilha.get(trilha.id)
    if (concluida && trilha.geraCertificado && !certificado) certificado = await garantirCertificado(usuarioId, trilha.id)

    const cursos: CursoDaTrilha[] = trilha.cursos.map(({ curso }) => {
      const estado = andamento.get(curso.id)
      const emitido = curso.geraCertificado ? certificadoPorCurso.get(curso.id) : undefined
      return {
        id: curso.id,
        title: curso.titulo,
        category: curso.categoria,
        durationHours: curso.cargaHoraria,
        cover: { accent: curso.capaCor, icon: curso.capaIcone, image: curso.capaImagem ?? '' },
        status: estado?.status ?? 'pendente',
        progress: estado?.progress ?? 0,
        lockedBy: bloqueios.get(curso.id),
        certificate: emitido ? { code: emitido.codigo, issuedAt: emitido.emitidoEm.toISOString() } : undefined,
      }
    })
    const completedCount = cursos.filter((curso) => curso.status === 'concluido').length
    const progress = cursos.length ? Math.round(cursos.reduce((total, curso) => total + curso.progress, 0) / cursos.length) : 0

    resultado.push({
      id: trilha.id,
      title: trilha.titulo,
      description: trilha.descricao,
      sequential: trilha.sequenciaObrigatoria,
      mandatory: trilha.obrigatorio,
      dueDate: trilha.prazo ?? undefined,
      durationHours: cursos.reduce((total, curso) => total + curso.durationHours, 0),
      status: concluida ? 'concluido' : progress > 0 ? 'em_andamento' : 'pendente',
      progress: concluida ? 100 : progress,
      completedCount,
      certificate: {
        enabled: trilha.geraCertificado,
        ...(certificado && trilha.geraCertificado
          ? { code: certificado.codigo, issuedAt: certificado.emitidoEm.toISOString() }
          : {}),
      },
      courses: cursos,
    })
  }
  return resultado
}
