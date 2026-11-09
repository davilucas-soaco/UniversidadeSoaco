import type { NavItem, UserRole } from '@/types'

const MANAGERS: UserRole[] = ['administrador', 'gestor_conteudo']
const ADMINS: UserRole[] = ['administrador']

export const collaboratorNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/conteudos', label: 'Meus Cursos', icon: 'contents' },
]

export const adminNav: NavItem[] = [
  { to: '/admin/conteudos', label: 'Gestão de conteúdos', icon: 'admin-courses', roles: MANAGERS },
  { to: '/admin/colaboradores', label: 'Colaboradores', icon: 'admin-users', roles: ADMINS },
  { to: '/admin/indicadores', label: 'Indicadores', icon: 'admin-metrics', reserved: true, roles: MANAGERS },
  { to: '/admin/configuracoes', label: 'Configurações', icon: 'settings', roles: ADMINS },
]

export function navForRole(items: NavItem[], role: UserRole) {
  return items.filter((item) => !item.roles || item.roles.includes(role))
}

export const mainNav: NavItem[] = [...collaboratorNav, ...adminNav]

export const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Acompanhe sua evolução na Universidade Corporativa.',
  },
  '/conteudos': {
    title: 'Meus Cursos',
    subtitle: 'Cursos e conteúdos destinados a você.',
  },
  '/aula/:courseId': {
    title: 'Aula',
    subtitle: 'Ambiente interativo de aprendizagem.',
  },
  '/desempenho': {
    title: 'Meu Desempenho',
    subtitle: 'Histórico de progresso, conclusões e pontuação.',
  },
  '/perfil': {
    title: 'Meu Perfil',
    subtitle: 'Dados pessoais, setor e preferências da conta.',
  },
  '/ajuda': {
    title: 'Ajuda',
    subtitle: 'Orientação de uso e suporte da plataforma.',
  },
  '/admin/conteudos': {
    title: 'Gestão de conteúdos',
    subtitle: 'Organize cursos e materiais da universidade.',
  },
  '/admin/conteudos/novo': {
    title: 'Novo curso',
    subtitle: 'Cadastre um vídeo ou documentos para a Universidade Corporativa.',
  },
  '/admin/colaboradores': {
    title: 'Colaboradores',
    subtitle: 'Cadastre alunos e defina setor e classes de cada um.',
  },
  '/admin/indicadores': {
    title: 'Indicadores',
    subtitle: 'Visão gerencial de progresso, pontuação e conclusão.',
  },
  '/admin/configuracoes': {
    title: 'Configurações',
    subtitle: 'Cadastre os setores e as classes usados na atribuição de cursos.',
  },
}
