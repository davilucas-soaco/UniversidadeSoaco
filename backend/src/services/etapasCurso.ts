import { randomBytes } from 'node:crypto'
import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { provaInclude } from './provas.js'

type Cliente = PrismaClient | Prisma.TransactionClient

export const etapaInclude = {
  documentos: { orderBy: [{ ordem: 'asc' }, { criadoEm: 'asc' }] },
  prova: { include: provaInclude },
} satisfies Prisma.CursoEtapaInclude

export type EtapaComDocumentos = Prisma.CursoEtapaGetPayload<{ include: typeof etapaInclude }>

export type EtapaArvore = EtapaComDocumentos & { filhas: EtapaComDocumentos[] }

/** Monta a árvore (etapas principais com subetapas) a partir da lista plana, na ordem cadastrada. */
export function montarArvore(etapas: EtapaComDocumentos[]): EtapaArvore[] {
  const porOrdem = [...etapas].sort((a, b) => a.ordem - b.ordem)
  return porOrdem
    .filter((etapa) => !etapa.paiId)
    .map((etapa) => ({ ...etapa, filhas: porOrdem.filter((filha) => filha.paiId === etapa.id) }))
}

/** Etapas que o colaborador conclui: subetapas e etapas principais sem subetapas, na ordem do pipeline. */
export function unidadesDoCurso(arvore: EtapaArvore[]) {
  return arvore.flatMap((etapa) => (etapa.filhas.length > 0 ? etapa.filhas : [etapa]))
}

export async function carregarArvore(cursoId: string, client: Cliente = prisma) {
  const etapas = await client.cursoEtapa.findMany({ where: { cursoId }, include: etapaInclude })
  return montarArvore(etapas)
}

function codigoCertificado() {
  return `USA-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`
}

/**
 * Recalcula a matrícula a partir das etapas concluídas. Na primeira conclusão do curso lança os
 * pontos e registra a atividade; se o curso gera certificado, garante o certificado do colaborador.
 */
export async function recalcularMatricula(usuarioId: string, cursoId: string) {
  const [curso, arvore] = await Promise.all([
    prisma.curso.findUniqueOrThrow({ where: { id: cursoId }, select: { titulo: true, pontos: true, geraCertificado: true } }),
    carregarArvore(cursoId),
  ])
  const unidades = unidadesDoCurso(arvore).map((etapa) => etapa.id)
  const concluidas = unidades.length
    ? await prisma.etapaProgresso.count({ where: { usuarioId, etapaId: { in: unidades } } })
    : 0

  const progresso = unidades.length ? Math.round((concluidas / unidades.length) * 100) : 0
  const status = concluidas === 0 ? 'pendente' : concluidas >= unidades.length ? 'concluido' : 'em_andamento'
  const agora = new Date()
  const anterior = await prisma.matricula.findUnique({ where: { usuarioId_cursoId: { usuarioId, cursoId } } })
  const primeiraConclusao = status === 'concluido' && !anterior?.primeiraConclusaoEm

  await prisma.matricula.upsert({
    where: { usuarioId_cursoId: { usuarioId, cursoId } },
    create: {
      usuarioId,
      cursoId,
      status,
      progresso,
      iniciadoEm: concluidas > 0 ? agora : null,
      concluidoEm: status === 'concluido' ? agora : null,
      primeiraConclusaoEm: status === 'concluido' ? agora : null,
      ultimoAcessoEm: agora,
    },
    update: {
      status,
      progresso,
      iniciadoEm: anterior?.iniciadoEm ?? (concluidas > 0 ? agora : null),
      concluidoEm: status === 'concluido' ? (anterior?.concluidoEm ?? agora) : null,
      primeiraConclusaoEm: anterior?.primeiraConclusaoEm ?? (status === 'concluido' ? agora : null),
      ultimoAcessoEm: agora,
    },
  })

  if (primeiraConclusao) {
    await prisma.$transaction([
      ...(curso.pontos > 0
        ? [prisma.pontuacaoEvento.create({ data: { usuarioId, cursoId, pontos: curso.pontos, motivo: 'Conclusão de curso' } })]
        : []),
      prisma.atividade.create({ data: { usuarioId, tipo: 'completion', descricao: `${curso.titulo} foi concluído.` } }),
    ])
  }
  // O certificado não depende da primeira conclusão: um curso pode passar a gerar certificado depois.
  if (status === 'concluido' && curso.geraCertificado) {
    await prisma.certificado.upsert({
      where: { usuarioId_cursoId: { usuarioId, cursoId } },
      create: { usuarioId, cursoId, codigo: codigoCertificado() },
      update: {},
    })
  }

  return { status, progresso }
}
