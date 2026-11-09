import type { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'

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
  contentKind?: string
  videoUrl?: string
  videoProvider?: string
  embedUrl?: string
  assignedVia: AlvoAtribuicao[]
  assignedAt: string
  startedAt?: string
  completedAt?: string
  lastAccessAt?: string
}

const DIAS_CURSO_NOVO = 14
const DIA_MS = 24 * 60 * 60 * 1000

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

/**
 * Cursos destinados ao colaborador: atribuições diretas a ele, ao setor dele
 * ou a qualquer classe da qual ele participa. Um mesmo curso pode chegar por
 * mais de um caminho; nesse caso vale o prazo obrigatório mais próximo.
 */
export async function listarCursosDoUsuario(usuarioId: string, agora = new Date()): Promise<CursoDoUsuario[]> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { setorId: true, classes: { select: { classeId: true } } },
  })
  if (!usuario) return []

  const classeIds = usuario.classes.map((item) => item.classeId)
  const alvos: Prisma.AtribuicaoWhereInput[] = [{ alvo: 'usuario', usuarioId }]
  if (usuario.setorId != null) alvos.push({ alvo: 'setor', setorId: usuario.setorId })
  if (classeIds.length > 0) alvos.push({ alvo: 'classe', classeId: { in: classeIds } })

  const atribuicoes = await prisma.atribuicao.findMany({
    where: { OR: alvos, curso: { publicado: true } },
    select: { cursoId: true, alvo: true, obrigatorio: true, prazo: true, criadoEm: true },
  })
  if (atribuicoes.length === 0) return []

  const cursoIds = [...new Set(atribuicoes.map((item) => item.cursoId))]
  const [cursos, matriculas] = await Promise.all([
    prisma.curso.findMany({
      where: { id: { in: cursoIds } },
      include: {
        modulos: {
          orderBy: { ordem: 'asc' },
          select: { titulo: true, _count: { select: { aulas: { where: { tipo: 'video' } } } } },
        },
      },
    }),
    prisma.matricula.findMany({ where: { usuarioId, cursoId: { in: cursoIds } } }),
  ])

  const matriculaPorCurso = new Map(matriculas.map((item) => [item.cursoId, item]))

  const lista = cursos.map((curso) => {
    const doCurso = atribuicoes.filter((item) => item.cursoId === curso.id)
    const obrigatorias = doCurso.filter((item) => item.obrigatorio)
    const prazos = (obrigatorias.length > 0 ? obrigatorias : doCurso)
      .map((item) => item.prazo)
      .filter((prazo): prazo is string => Boolean(prazo))
      .sort()
    const atribuidoEm = new Date(Math.max(...doCurso.map((item) => item.criadoEm.getTime())))

    const matricula = matriculaPorCurso.get(curso.id)
    const status = (matricula?.status ?? 'pendente') as StatusCurso
    const progress = status === 'concluido' ? 100 : (matricula?.progresso ?? 0)

    const item: CursoDoUsuario = {
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
      lessonsCount: curso.modulos.reduce((total, modulo) => total + modulo._count.aulas, 0),
      moduleTitles: curso.modulos.map((modulo) => modulo.titulo),
      mandatory: obrigatorias.length > 0,
      dueDate: prazos[0],
      isNew: status === 'pendente' && agora.getTime() - atribuidoEm.getTime() < DIAS_CURSO_NOVO * DIA_MS,
      objectives: lerObjetivos(curso.objetivos),
      contentKind: curso.tipoConteudo ?? undefined,
      videoUrl: curso.videoUrl ?? undefined,
      videoProvider: curso.videoProvedor ?? undefined,
      embedUrl: curso.embedUrl ?? undefined,
      assignedVia: [...new Set(doCurso.map((item) => item.alvo as AlvoAtribuicao))],
      assignedAt: atribuidoEm.toISOString(),
      startedAt: dataIso(matricula?.iniciadoEm),
      completedAt: dataIso(matricula?.concluidoEm),
      lastAccessAt: dataIso(matricula?.ultimoAcessoEm),
    }
    return item
  })

  return lista.sort(
    (a, b) => b.assignedAt.localeCompare(a.assignedAt) || a.title.localeCompare(b.title, 'pt-BR'),
  )
}
