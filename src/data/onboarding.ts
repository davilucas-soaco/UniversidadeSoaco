export type TourPosition = 'top' | 'bottom' | 'left' | 'right'

export type OnboardingStep = {
  id: string
  title: string
  description: string
  element: string
  position: TourPosition
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo à Universidade Corporativa',
    description:
      'Este é o seu ponto de partida no Dashboard. Abaixo você acompanha indicadores, conteúdos e o seu desempenho.',
    element: '#tour-welcome',
    position: 'bottom',
  },
  {
    id: 'tabs',
    title: 'Menu lateral',
    description:
      'Pelo menu à esquerda você acessa Dashboard, Meus Conteúdos e as áreas de administração. Perfil, ajuda e saída ficam no menu da sua conta, no topo.',
    element: '#tour-collaborator-nav',
    position: 'right',
  },
  {
    id: 'contents-tab',
    title: 'Meus Conteúdos',
    description:
      'Aqui ficam os cursos e trilhas atribuídos a você. É o caminho principal para iniciar ou continuar um treinamento.',
    element: '#tour-nav-contents',
    position: 'right',
  },
  {
    id: 'indicators',
    title: 'Seus indicadores',
    description:
      'Pontuação acumulada, cursos concluídos, treinamentos em andamento e pendentes resumem o seu desempenho neste painel.',
    element: '#tour-indicators',
    position: 'bottom',
  },
  {
    id: 'courses',
    title: 'Continuar um curso',
    description:
      'Aqui você retoma os treinamentos em andamento, vê o progresso e abre o curso no ponto em que parou.',
    element: '#tour-courses',
    position: 'top',
  },
  {
    id: 'ranking',
    title: 'Destaques e pontuação',
    description:
      'Os primeiros colocados aparecem aqui. Ao concluir um curso, a pontuação entra no ranking automaticamente.',
    element: '#tour-ranking',
    position: 'left',
  },
  {
    id: 'header',
    title: 'Busca, avisos e conta',
    description:
      'No topo você pesquisa as telas, troca o tema, reabre o tutorial, acompanha notificações e acessa o menu da sua conta.',
    element: '#tour-header-tools',
    position: 'bottom',
  },
]

export const ONBOARDING_STORAGE_KEY = 'universidade-soaco.onboarding.completed'
