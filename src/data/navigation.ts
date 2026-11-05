import type { NavItem } from '@/types'

export const collaboratorNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/conteudos', label: 'Meus Conteúdos', icon: 'contents', reserved: true },
]

export const adminNav: NavItem[] = [
  { to: '/admin/conteudos', label: 'Gestão de conteúdos', icon: 'admin-courses', reserved: true },
  { to: '/admin/colaboradores', label: 'Colaboradores', icon: 'admin-users', reserved: true },
  { to: '/admin/indicadores', label: 'Indicadores', icon: 'admin-metrics', reserved: true },
]

export const mainNav: NavItem[] = [...collaboratorNav, ...adminNav]

export const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Acompanhe sua evolução na Universidade Corporativa.',
  },
  '/conteudos': {
    title: 'Meus Conteúdos',
    subtitle: 'Cursos e trilhas atribuídos ao seu perfil.',
  },
  '/desempenho': {
    title: 'Meu Desempenho',
    subtitle: 'Histórico de progresso, conclusões e pontuação.',
  },
  '/ranking': {
    title: 'Ranking',
    subtitle: 'Desempenho dos colaboradores da Só Aço.',
  },
  '/perfil': {
    title: 'Meu Perfil',
    subtitle: 'Dados pessoais, setor e preferências da conta.',
  },
  '/ajuda': {
    title: 'Ajuda',
    subtitle: 'Orientação de uso e suporte da plataforma.',
  },
  '/configuracoes': {
    title: 'Configurações',
    subtitle: 'Preferências da conta e da interface.',
  },
  '/admin/conteudos': {
    title: 'Gestão de conteúdos',
    subtitle: 'Organize cursos, trilhas e materiais da universidade.',
  },
  '/admin/colaboradores': {
    title: 'Colaboradores',
    subtitle: 'Acompanhe pessoas, setores e acessos da plataforma.',
  },
  '/admin/indicadores': {
    title: 'Indicadores',
    subtitle: 'Visão gerencial de progresso, pontuação e conclusão.',
  },
}
