import type { Prisma } from '@prisma/client'
import { z } from 'zod'

export const provaInclude = {
  perguntas: {
    orderBy: { ordem: 'asc' },
    include: { opcoes: { orderBy: { ordem: 'asc' } } },
  },
} satisfies Prisma.ProvaInclude

export type ProvaCompleta = Prisma.ProvaGetPayload<{ include: typeof provaInclude }>

const texto = (mensagem: string, max: number) => z.string().trim().min(1, mensagem).max(max)

export const provaSchema = z.object({
  title: z.string().trim().min(2, 'Informe o nome da prova.').max(160),
  description: z.string().trim().max(1000).default(''),
  passingScore: z.number().int().min(1, 'A nota mínima vai de 1% a 100%.').max(100, 'A nota mínima vai de 1% a 100%.'),
  questions: z
    .array(
      z
        .object({
          text: texto('Toda pergunta precisa de um enunciado.', 2000),
          options: z
            .array(z.object({ text: texto('Toda opção precisa de um texto.', 500), correct: z.boolean() }))
            .min(2, 'Cada pergunta precisa de pelo menos 2 opções.')
            .max(10, 'Cada pergunta pode ter até 10 opções.'),
        })
        .refine((pergunta) => pergunta.options.filter((opcao) => opcao.correct).length === 1, {
          message: 'Marque exatamente uma opção correta em cada pergunta.',
        }),
    )
    .min(1, 'Cadastre pelo menos uma pergunta.')
    .max(100, 'A prova pode ter até 100 perguntas.'),
})

export type ProvaInput = z.infer<typeof provaSchema>

/** Perguntas e opções na ordem do formulário (substitui as anteriores). */
export function perguntasParaCriar(input: ProvaInput) {
  return input.questions.map((pergunta, indice) => ({
    ordem: indice,
    enunciado: pergunta.text,
    opcoes: {
      create: pergunta.options.map((opcao, ordem) => ({ ordem, texto: opcao.text, correta: opcao.correct })),
    },
  }))
}

/** Prova completa para a gestão (com o gabarito). */
export function provaParaGestao(prova: ProvaCompleta) {
  return {
    id: prova.id,
    title: prova.titulo,
    description: prova.descricao ?? '',
    passingScore: prova.notaMinima,
    questions: prova.perguntas.map((pergunta) => ({
      id: pergunta.id,
      text: pergunta.enunciado,
      options: pergunta.opcoes.map((opcao) => ({ id: opcao.id, text: opcao.texto, correct: opcao.correta })),
    })),
    updatedAt: prova.atualizadoEm.toISOString(),
  }
}

/** Prova para o colaborador responder: sem indicar qual opção é a correta. */
export function provaParaAluno(prova: ProvaCompleta) {
  return {
    id: prova.id,
    title: prova.titulo,
    description: prova.descricao ?? '',
    passingScore: prova.notaMinima,
    questions: prova.perguntas.map((pergunta) => ({
      id: pergunta.id,
      text: pergunta.enunciado,
      options: pergunta.opcoes.map((opcao) => ({ id: opcao.id, text: opcao.texto })),
    })),
  }
}

/** Corrige as respostas ({ perguntaId: opcaoId }) contra o gabarito. */
export function corrigirProva(prova: ProvaCompleta, respostas: Record<string, string>) {
  const revisao = prova.perguntas.map((pergunta) => {
    const marcada = respostas[pergunta.id] ?? null
    const correta = pergunta.opcoes.find((opcao) => opcao.correta)?.id ?? null
    return { questionId: pergunta.id, selectedOptionId: marcada, correctOptionId: correta, correct: marcada !== null && marcada === correta }
  })
  const acertos = revisao.filter((item) => item.correct).length
  const total = prova.perguntas.length
  const nota = total === 0 ? 0 : Math.round((acertos / total) * 100)
  return { acertos, total, nota, aprovado: nota >= prova.notaMinima, revisao }
}
