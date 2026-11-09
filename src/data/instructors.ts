import type { Instructor } from '@/types'

export const instructors: Instructor[] = [
  {
    id: 'ins-vasconcelos',
    name: 'Dra. Mariana Vasconcelos',
    title: 'Instrutora · Segurança e Processos',
    initials: 'MV',
    bio: 'Engenheira de segurança · 12 anos na Só Aço',
    stats: '18 turmas · 1.420 colaboradores treinados',
  },
  {
    id: 'ins-siqueira',
    name: 'Eng. Carlos Siqueira',
    title: 'Instrutor · Normas Regulamentadoras',
    initials: 'CS',
    bio: 'Auditor de NRs · 9 anos na Só Aço',
    stats: '11 turmas · 860 colaboradores treinados',
  },
  {
    id: 'ins-valente',
    name: 'Prof. Ricardo Valente',
    title: 'Instrutor · Gestão Industrial',
    initials: 'RV',
    bio: 'Consultor em operações · Lean Six Sigma Black Belt',
    stats: '14 turmas · 1.100 colaboradores treinados',
  },
  {
    id: 'ins-brandao',
    name: 'Dra. Helena Brandão',
    title: 'Instrutora · Pessoas e Cultura',
    initials: 'HB',
    bio: 'Psicóloga organizacional · 7 anos na Só Aço',
    stats: '22 turmas · 1.900 colaboradores treinados',
  },
  {
    id: 'ins-nogueira',
    name: 'Dra. Camila Nogueira',
    title: 'Instrutora · Dados e Tecnologia',
    initials: 'CN',
    bio: 'Analista de dados sênior · Especialista em LGPD',
    stats: '9 turmas · 640 colaboradores treinados',
  },
  {
    id: 'ins-prado',
    name: 'Eng. Marcelo Prado',
    title: 'Instrutor · Logística e Suprimentos',
    initials: 'MP',
    bio: 'Coordenador de suprimentos · 10 anos na Só Aço',
    stats: '8 turmas · 520 colaboradores treinados',
  },
]

export const instructorById = Object.fromEntries(instructors.map((item) => [item.id, item])) as Record<
  string,
  Instructor
>

export const classMonitor = {
  name: 'Eng. Lucas Brandão',
  online: true,
}
