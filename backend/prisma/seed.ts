/**
 * Popula o banco local com o catálogo inicial e um cenário de demonstração.
 * APAGA todos os dados antes de inserir — não rode na base de produção.
 *
 *   npm run seed            (dentro de backend/) — usuários, setores, classes e instrutores
 *   SEED_DEMO=true          inclui também os cursos de demonstração, atribuições e progresso
 *   SEED_FORCE=true         permite rodar com NODE_ENV=production
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

type AulaSeed = {
  id: string
  ordem: number
  titulo: string
  tipo: string
  duracaoMin: number | null
  paginas: number | null
  questoes: number | null
  pontos: number | null
  obrigatoria: boolean
}

type CursoSeed = {
  id: string
  titulo: string
  categoria: string
  descricao: string
  cargaHoraria: number
  pontos: number
  capaCor: string
  capaIcone: string
  capaImagem: string
  instrutorId: string
  objetivos: string[]
  modulos: { ordem: number; titulo: string; resumo: string; aulas: AulaSeed[] }[]
  progressoDemo: { status: string; progresso: number; aulasConcluidas: string[] }
}

type SeedData = {
  instrutores: { id: string; nome: string; titulo: string; iniciais: string; bio: string; resumo: string }[]
  cursos: CursoSeed[]
}

if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
  console.error('Seed bloqueado em produção (apaga todos os dados). Use SEED_FORCE=true se tiver certeza.')
  process.exit(1)
}

const prisma = new PrismaClient()
const data = JSON.parse(readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8')) as SeedData
const SENHA_PADRAO = process.env.SEED_SENHA_PADRAO || 'Soaco@2026'
const INCLUIR_DEMO = process.env.SEED_DEMO === 'true'
const DIA_MS = 24 * 60 * 60 * 1000
const agora = new Date()

const setores = ['Administrativo', 'Produção', 'Compras', 'Recursos Humanos', 'Logística', 'Financeiro', 'Tecnologia']

/** totalPontos distribui o histórico de pontos nos últimos 12 meses. */
const usuarios = [
  { chave: 'davi', nome: 'Davi Lucas Barros', email: 'davilucas@soacoindustrial.com', senha: 'soaco2020', cargo: 'Assistente Administrativo', setor: 'Administrativo', papel: 'administrador', telefone: '(11) 98800-2144', localizacao: 'Guarulhos, SP', totalPontos: 128 },
  { chave: 'mariana', nome: 'Mariana Alves Costa', email: 'mariana.costa@soaco.com.br', cargo: 'Supervisora de Produção', setor: 'Produção', papel: 'colaborador', totalPontos: 186 },
  { chave: 'rafael', nome: 'Rafael Mendes Oliveira', email: 'rafael.oliveira@soaco.com.br', cargo: 'Analista de Compras', setor: 'Compras', papel: 'colaborador', totalPontos: 154 },
  { chave: 'camila', nome: 'Camila Ferreira Santos', email: 'camila.santos@soaco.com.br', cargo: 'Analista de RH', setor: 'Recursos Humanos', papel: 'gestor_conteudo', totalPontos: 121 },
  { chave: 'thiago', nome: 'Thiago Rocha Lima', email: 'thiago.lima@soaco.com.br', cargo: 'Coordenador de Logística', setor: 'Logística', papel: 'colaborador', totalPontos: 109 },
  { chave: 'beatriz', nome: 'Beatriz Nunes Prado', email: 'beatriz.prado@soaco.com.br', cargo: 'Assistente Financeiro', setor: 'Financeiro', papel: 'colaborador', totalPontos: 97 },
  { chave: 'lucas', nome: 'Lucas Henrique Dias', email: 'lucas.dias@soaco.com.br', cargo: 'Analista de Sistemas', setor: 'Tecnologia', papel: 'colaborador', totalPontos: 88 },
  { chave: 'admin', nome: 'Administrador Universidade', email: 'admin@soaco.com.br', cargo: 'Gestão da Universidade', setor: 'Recursos Humanos', papel: 'administrador', totalPontos: 0 },
] as const

type ChaveUsuario = (typeof usuarios)[number]['chave']

const classes: { nome: string; descricao: string; membros: ChaveUsuario[] }[] = [
  { nome: 'Integração de novos colaboradores', descricao: 'Turma de quem entrou na Só Aço nos últimos meses.', membros: ['davi', 'beatriz', 'lucas'] },
  { nome: 'Segurança Industrial', descricao: 'Colaboradores com acesso à planta e brigadistas.', membros: ['davi', 'mariana', 'thiago'] },
]

const DATA_BASE_ATRIBUICAO = new Date('2026-07-01T09:00:00')

type AtribuicaoSeed = {
  curso: string
  obrigatorio?: boolean
  prazo?: string
  criadoEm?: Date
} & ({ setor: string } | { classe: string } | { usuario: ChaveUsuario })

const atribuicoes: AtribuicaoSeed[] = [
  // Por setor
  { setor: 'Administrativo', curso: 'curso-excel' },
  { setor: 'Administrativo', curso: 'curso-compras' },
  { setor: 'Administrativo', curso: 'curso-comunicacao' },
  { setor: 'Administrativo', curso: 'curso-atendimento' },
  { setor: 'Produção', curso: 'curso-processos', obrigatorio: true, prazo: '2026-11-12' },
  { setor: 'Compras', curso: 'curso-compras' },
  { setor: 'Recursos Humanos', curso: 'curso-atendimento' },
  { setor: 'Recursos Humanos', curso: 'curso-comunicacao' },
  { setor: 'Logística', curso: 'curso-logistica' },
  { setor: 'Financeiro', curso: 'curso-excel' },
  { setor: 'Tecnologia', curso: 'curso-lgpd', obrigatorio: true, prazo: '2026-11-20' },
  { setor: 'Tecnologia', curso: 'curso-excel' },
  // Por classe
  { classe: 'Integração de novos colaboradores', curso: 'curso-integracao' },
  { classe: 'Integração de novos colaboradores', curso: 'curso-cultura' },
  { classe: 'Integração de novos colaboradores', curso: 'curso-etica' },
  { classe: 'Segurança Industrial', curso: 'curso-seguranca', obrigatorio: true, prazo: '2026-11-21' },
  { classe: 'Segurança Industrial', curso: 'curso-primeiros-socorros' },
  { classe: 'Segurança Industrial', curso: 'curso-incendio' },
  // Individuais
  { usuario: 'davi', curso: 'curso-processos', obrigatorio: true, prazo: '2026-11-12', criadoEm: new Date(agora.getTime() - 4 * DIA_MS) },
  { usuario: 'davi', curso: 'curso-lgpd', obrigatorio: true, prazo: '2026-11-20' },
]

/** Início, último acesso e conclusão dos cursos do Davi. */
const linhaDoTempoDavi: Record<string, { inicio: string; ultimoAcessoHorasAtras?: number; conclusao?: string }> = {
  'curso-seguranca': { inicio: '2026-09-18', ultimoAcessoHorasAtras: 2 },
  'curso-excel': { inicio: '2026-10-02', ultimoAcessoHorasAtras: 26 },
  'curso-compras': { inicio: '2026-10-14', ultimoAcessoHorasAtras: 72 },
  'curso-integracao': { inicio: '2026-07-08', conclusao: '2026-07-15' },
  'curso-cultura': { inicio: '2026-07-22', conclusao: '2026-07-30' },
  'curso-etica': { inicio: '2026-08-04', conclusao: '2026-08-08' },
  'curso-comunicacao': { inicio: '2026-08-18', conclusao: '2026-08-29' },
  'curso-primeiros-socorros': { inicio: '2026-08-26', conclusao: '2026-09-09' },
}

/** Pontos do Davi por mês, do mais antigo (11 meses atrás) ao mês atual. */
const pontosMensaisDavi = [8, 10, 7, 14, 9, 12, 16, 8, 11, 15, 12, 6]

function noMeioDia(iso: string) {
  return new Date(`${iso}T12:00:00`)
}

function antesDeAgora(data: Date, horasAtras: number) {
  return data.getTime() < agora.getTime() ? data : new Date(agora.getTime() - horasAtras * 60 * 60 * 1000)
}

/** Divide os pontos do mês em lançamentos de até ~8 pts espalhados pelo mês. */
function lancamentosDoMes(pontos: number, deslocamentoMes: number) {
  if (pontos <= 0) return []
  const partes = Math.ceil(pontos / 8)
  const base = Math.floor(pontos / partes)
  const ano = agora.getFullYear()
  const mes = agora.getMonth() - deslocamentoMes
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  return Array.from({ length: partes }, (_, index) => {
    const dia = Math.min(diasNoMes, Math.round(((index + 1) * diasNoMes) / (partes + 1)))
    return {
      pontos: index === partes - 1 ? pontos - base * (partes - 1) : base,
      criadoEm: antesDeAgora(new Date(ano, mes, dia, 10 + index, 0, 0), index + 1),
    }
  })
}

async function limpar() {
  await prisma.atividade.deleteMany()
  await prisma.sessaoEstudo.deleteMany()
  await prisma.pontuacaoEvento.deleteMany()
  await prisma.certificado.deleteMany()
  await prisma.avaliacaoResultado.deleteMany()
  await prisma.aulaProgresso.deleteMany()
  await prisma.matricula.deleteMany()
  await prisma.atribuicao.deleteMany()
  await prisma.aula.deleteMany()
  await prisma.modulo.deleteMany()
  await prisma.curso.deleteMany()
  await prisma.instrutor.deleteMany()
  await prisma.classeMembro.deleteMany()
  await prisma.classe.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.setor.deleteMany()
}

async function main() {
  await limpar()

  const setorId = new Map<string, number>()
  for (const nome of setores) {
    const setor = await prisma.setor.create({ data: { nome } })
    setorId.set(nome, setor.id)
  }

  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10)
  const usuarioId = new Map<ChaveUsuario, string>()
  for (const pessoa of usuarios) {
    const criado = await prisma.usuario.create({
      data: {
        nome: pessoa.nome,
        email: pessoa.email,
        senhaHash: 'senha' in pessoa ? await bcrypt.hash(pessoa.senha, 10) : senhaHash,
        papel: pessoa.papel,
        cargo: pessoa.cargo,
        setorId: setorId.get(pessoa.setor),
        telefone: 'telefone' in pessoa ? pessoa.telefone : null,
        localizacao: 'localizacao' in pessoa ? pessoa.localizacao : null,
      },
    })
    usuarioId.set(pessoa.chave, criado.id)
  }

  const classeId = new Map<string, number>()
  for (const item of classes) {
    const classe = await prisma.classe.create({
      data: {
        nome: item.nome,
        descricao: item.descricao,
        membros: { create: item.membros.map((chave) => ({ usuarioId: usuarioId.get(chave)! })) },
      },
    })
    classeId.set(item.nome, classe.id)
  }

  await prisma.instrutor.createMany({ data: data.instrutores })

  if (!INCLUIR_DEMO) {
    console.log('Seed concluído sem cursos de demonstração (use SEED_DEMO=true para incluí-los).')
    logAcessos()
    return
  }

  for (const curso of data.cursos) {
    await prisma.curso.create({
      data: {
        id: curso.id,
        titulo: curso.titulo,
        categoria: curso.categoria,
        descricao: curso.descricao,
        cargaHoraria: curso.cargaHoraria,
        pontos: curso.pontos,
        capaCor: curso.capaCor,
        capaIcone: curso.capaIcone,
        capaImagem: curso.capaImagem || null,
        instrutorId: curso.instrutorId,
        objetivos: JSON.stringify(curso.objetivos),
        modulos: {
          create: curso.modulos.map((modulo) => ({
            ordem: modulo.ordem,
            titulo: modulo.titulo,
            resumo: modulo.resumo,
            aulas: { create: modulo.aulas },
          })),
        },
      },
    })
  }

  const adminId = usuarioId.get('admin')!
  for (const item of atribuicoes) {
    await prisma.atribuicao.create({
      data: {
        cursoId: item.curso,
        obrigatorio: item.obrigatorio ?? false,
        prazo: item.prazo,
        criadoEm: item.criadoEm ?? DATA_BASE_ATRIBUICAO,
        atribuidoPorId: adminId,
        ...('setor' in item
          ? { alvo: 'setor', setorId: setorId.get(item.setor)! }
          : 'classe' in item
            ? { alvo: 'classe', classeId: classeId.get(item.classe)! }
            : { alvo: 'usuario', usuarioId: usuarioId.get(item.usuario)! }),
      },
    })
  }

  // Progresso do Davi: mesmo estado que as telas exibiam antes do banco.
  const davi = usuarioId.get('davi')!
  const quizzesConcluidos: string[] = []
  for (const curso of data.cursos) {
    const linha = linhaDoTempoDavi[curso.id]
    if (!linha || curso.progressoDemo.status === 'pendente') continue

    const iniciadoEm = noMeioDia(linha.inicio)
    const concluidoEm = linha.conclusao ? noMeioDia(linha.conclusao) : null
    const ultimoAcessoEm = linha.ultimoAcessoHorasAtras
      ? new Date(agora.getTime() - linha.ultimoAcessoHorasAtras * 60 * 60 * 1000)
      : concluidoEm

    await prisma.matricula.create({
      data: {
        usuarioId: davi,
        cursoId: curso.id,
        status: curso.progressoDemo.status,
        progresso: curso.progressoDemo.progresso,
        iniciadoEm,
        concluidoEm,
        ultimoAcessoEm,
      },
    })

    const aulas = curso.modulos.flatMap((modulo) => modulo.aulas)
    const intervalo = ((ultimoAcessoEm ?? agora).getTime() - iniciadoEm.getTime()) / Math.max(1, curso.progressoDemo.aulasConcluidas.length)
    await prisma.aulaProgresso.createMany({
      data: curso.progressoDemo.aulasConcluidas.map((aulaId, index) => ({
        usuarioId: davi,
        aulaId,
        concluidaEm: new Date(iniciadoEm.getTime() + intervalo * (index + 1)),
      })),
    })
    for (const aulaId of curso.progressoDemo.aulasConcluidas) {
      if (aulas.find((aula) => aula.id === aulaId)?.tipo === 'quiz') quizzesConcluidos.push(aulaId)
    }

    if (concluidoEm) {
      await prisma.certificado.create({
        data: {
          usuarioId: davi,
          cursoId: curso.id,
          codigo: `USA-${concluidoEm.getFullYear()}-${curso.id.replace('curso-', '').toUpperCase()}`,
          emitidoEm: concluidoEm,
        },
      })
    }
  }

  const notas = [96, 90, 94, 88, 94]
  await prisma.avaliacaoResultado.createMany({
    data: quizzesConcluidos.slice(0, notas.length).map((aulaId, index) => ({
      usuarioId: davi,
      aulaId,
      nota: notas[index],
      respondidoEm: new Date(agora.getTime() - (index + 3) * DIA_MS),
    })),
  })

  await prisma.sessaoEstudo.createMany({
    data: [90, 75, 60, 120, 60].map((minutos, index) => ({
      usuarioId: davi,
      cursoId: index % 2 === 0 ? 'curso-seguranca' : 'curso-excel',
      minutos,
      iniciadoEm: new Date(agora.getTime() - (index + 1) * DIA_MS),
    })),
  })

  // Extrato de pontos: o Davi segue a série original; os demais, a mesma curva deslocada.
  const somaDavi = pontosMensaisDavi.reduce((total, valor) => total + valor, 0)
  for (const [ordem, pessoa] of usuarios.entries()) {
    if (pessoa.totalPontos === 0) continue
    const serie =
      pessoa.chave === 'davi'
        ? pontosMensaisDavi
        : pontosMensaisDavi.map((_, mes) =>
            Math.round((pessoa.totalPontos * pontosMensaisDavi[(mes + ordem) % 12]) / somaDavi),
          )
    const lancamentos = serie.flatMap((pontos, mes) => lancamentosDoMes(pontos, 11 - mes))
    await prisma.pontuacaoEvento.createMany({
      data: lancamentos.map((item) => ({
        usuarioId: usuarioId.get(pessoa.chave)!,
        pontos: item.pontos,
        motivo: 'Aulas e avaliações concluídas',
        criadoEm: item.criadoEm,
      })),
    })
  }

  // Colegas: cursos concluídos (desempate do ranking).
  for (const pessoa of usuarios) {
    if (pessoa.chave === 'davi' || pessoa.chave === 'admin') continue
    const id = usuarioId.get(pessoa.chave)!
    const doSetor = atribuicoes.filter((item) => 'setor' in item && item.setor === pessoa.setor).map((item) => item.curso)
    const daClasse = atribuicoes
      .filter((item) => 'classe' in item && classes.some((c) => c.nome === item.classe && c.membros.includes(pessoa.chave)))
      .map((item) => item.curso)
    for (const cursoId of [...new Set([...doSetor, ...daClasse])]) {
      await prisma.matricula.create({
        data: {
          usuarioId: id,
          cursoId,
          status: 'concluido',
          progresso: 100,
          iniciadoEm: noMeioDia('2026-08-01'),
          concluidoEm: noMeioDia('2026-09-15'),
          ultimoAcessoEm: noMeioDia('2026-09-15'),
        },
      })
    }
  }

  const horasAtras = (horas: number) => new Date(agora.getTime() - horas * 60 * 60 * 1000)
  await prisma.atividade.createMany({
    data: [
      { usuarioId: davi, tipo: 'progress', descricao: 'Você avançou em Segurança do Trabalho.', criadoEm: horasAtras(2) },
      { usuarioId: davi, tipo: 'points', descricao: '6 pontos adicionados ao seu histórico.', criadoEm: horasAtras(30) },
      { usuarioId: davi, tipo: 'assignment', descricao: 'Gestão de Processos foi atribuído a você.', criadoEm: horasAtras(96) },
      { usuarioId: davi, tipo: 'completion', descricao: 'Primeiros Socorros foi concluído.', criadoEm: noMeioDia('2026-09-09') },
    ],
  })

  const totais = {
    usuarios: await prisma.usuario.count(),
    cursos: await prisma.curso.count(),
    aulas: await prisma.aula.count(),
    atribuicoes: await prisma.atribuicao.count(),
    matriculas: await prisma.matricula.count(),
    pontuacoes: await prisma.pontuacaoEvento.count(),
  }
  console.log('Seed concluído com demonstração:', totais)
  logAcessos()
}

function logAcessos() {
  console.log('Login do Davi: davilucas@soacoindustrial.com / soaco2020')
  console.log(`Demais usuários (inclusive admin@soaco.com.br): senha ${SENHA_PADRAO}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
