export type TourPosition = 'top' | 'bottom' | 'left' | 'right'

export type OnboardingStep = {
  id: string
  title: string
  description: string
  element: string
  position: TourPosition
}

export type OnboardingTourDefinition = {
  id: string
  label: string
  /** Rota(s) da tela; `:param` casa com qualquer segmento. */
  paths: string[]
  /** Elemento que indica que a tela terminou de carregar. */
  ready: string
  steps: OnboardingStep[]
}

const tour = (id: string) => `[data-tour="${id}"]`

const replayStep: OnboardingStep = {
  id: 'replay',
  title: 'Reveja quando quiser',
  description: 'Cada tela tem o próprio tutorial. Clique aqui para rever as orientações da tela em que você estiver.',
  element: '#tour-tutorial',
  position: 'bottom',
}

const dashboardTour: OnboardingTourDefinition = {
  id: 'dashboard',
  label: 'Dashboard',
  paths: ['/'],
  ready: '#tour-welcome',
  steps: [
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
        'Pelo menu à esquerda você acessa Dashboard, Meus Cursos e as áreas de administração. Perfil, ajuda e saída ficam no menu da sua conta, no topo.',
      element: '#tour-collaborator-nav',
      position: 'right',
    },
    {
      id: 'contents-tab',
      title: 'Meus Cursos',
      description:
        'Aqui ficam os cursos atribuídos a você. É o caminho principal para iniciar ou continuar um treinamento.',
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
  ],
}

const coursesTour: OnboardingTourDefinition = {
  id: 'meus-cursos',
  label: 'Meus Cursos',
  paths: ['/conteudos'],
  ready: tour('courses-kpis'),
  steps: [
    {
      id: 'kpis',
      title: 'Resumo dos seus cursos',
      description:
        'Cursos em andamento e o tempo que falta, certificados emitidos (clique em "Ver todos" para baixá-los), prazos e a sua meta anual de horas.',
      element: tour('courses-kpis'),
      position: 'bottom',
    },
    {
      id: 'trails',
      title: 'Minhas trilhas',
      description:
        'Trilhas são sequências de cursos. Abra uma trilha para ver a ordem, o seu andamento e, ao concluir todos os cursos, o certificado.',
      element: tour('courses-trails'),
      position: 'bottom',
    },
    {
      id: 'filters',
      title: 'Encontre um curso',
      description:
        'Pesquise pelo nome, categoria ou instrutor, filtre por categoria, ordene a lista e alterne entre a visualização em grade ou em lista.',
      element: tour('courses-filters'),
      position: 'bottom',
    },
    {
      id: 'tabs',
      title: 'Situação do curso',
      description: 'Separe os cursos em andamento dos já concluídos. O número mostra quantos há em cada situação.',
      element: tour('courses-tabs'),
      position: 'bottom',
    },
    {
      id: 'grid',
      title: 'Seus cursos',
      description:
        'Clique em um curso para abrir. Nos concluídos, você escolhe entre ver o certificado ou revisar o conteúdo. A barra mostra o seu progresso.',
      element: tour('courses-grid'),
      position: 'top',
    },
    {
      id: 'actions',
      title: 'Atalhos',
      description: '"Certificados" mostra os cursos concluídos e "Catálogo" reunirá os cursos abertos para inscrição.',
      element: tour('courses-actions'),
      position: 'left',
    },
    replayStep,
  ],
}

const lessonTour: OnboardingTourDefinition = {
  id: 'aula',
  label: 'Aula',
  paths: ['/aula/:courseId'],
  ready: tour('lesson-media'),
  steps: [
    {
      id: 'breadcrumb',
      title: 'Onde você está',
      description: 'Mostra o curso e a etapa atual. Clique em "Meus Cursos" para voltar à lista.',
      element: tour('lesson-breadcrumb'),
      position: 'bottom',
    },
    {
      id: 'media',
      title: 'Conteúdo da etapa',
      description:
        'Aqui passa o vídeo, o documento ou a prova da etapa. No vídeo, use as configurações para mudar a qualidade, a velocidade e as legendas.',
      element: tour('lesson-media'),
      position: 'bottom',
    },
    {
      id: 'info',
      title: 'Concluir a etapa',
      description:
        'Depois de assistir ou ler, marque a etapa como concluída. Nas provas, a etapa é concluída quando você atinge a nota mínima.',
      element: tour('lesson-info'),
      position: 'top',
    },
    {
      id: 'tools',
      title: 'Notas e compartilhamento',
      description: 'Abra as suas anotações ou copie o link da aula. O seu progresso é salvo automaticamente.',
      element: tour('lesson-tools'),
      position: 'top',
    },
    {
      id: 'workspace',
      title: 'Visão geral, avaliações, discussão e anotações',
      description:
        'Leia a descrição do curso, avalie o conteúdo, converse com a turma e faça anotações marcadas com o tempo do vídeo.',
      element: tour('lesson-workspace'),
      position: 'top',
    },
    {
      id: 'trail',
      title: 'Sua trilha',
      description:
        'Quando o curso faz parte de uma trilha, aqui você vê todos os cursos dela, em qual está e pode avançar para o próximo.',
      element: tour('lesson-trail'),
      position: 'left',
    },
    {
      id: 'curriculum',
      title: 'Etapas do curso',
      description:
        'Acompanhe o caminho do curso e a sua evolução. Quando a sequência é obrigatória, cada etapa libera ao concluir a anterior.',
      element: tour('lesson-curriculum'),
      position: 'left',
    },
    replayStep,
  ],
}

const profileTour: OnboardingTourDefinition = {
  id: 'perfil',
  label: 'Perfil',
  paths: ['/perfil'],
  ready: tour('profile-hero'),
  steps: [
    {
      id: 'hero',
      title: 'Seu perfil',
      description: 'Seus dados e o seu setor. Por aqui você troca a foto e edita nome, telefone e localidade.',
      element: tour('profile-hero'),
      position: 'bottom',
    },
    {
      id: 'courses',
      title: 'Seus cursos',
      description: 'O histórico dos cursos que você faz e já concluiu, com o progresso de cada um.',
      element: tour('profile-courses'),
      position: 'top',
    },
    {
      id: 'account',
      title: 'Conta e segurança',
      description: 'Altere o e-mail de acesso e troque a sua senha.',
      element: tour('profile-account'),
      position: 'left',
    },
    replayStep,
  ],
}

const adminCoursesTour: OnboardingTourDefinition = {
  id: 'gestao-conteudos',
  label: 'Gestão de conteúdos',
  paths: ['/admin/conteudos'],
  ready: tour('admin-courses-new'),
  steps: [
    {
      id: 'new-trail',
      title: 'Cadastrar uma trilha',
      description: 'Junte cursos em uma sequência, defina para quem a trilha vai e se ela gera certificado.',
      element: tour('admin-trails-new'),
      position: 'left',
    },
    {
      id: 'new',
      title: 'Cadastrar um curso',
      description: 'Crie um curso com as informações, o público e as etapas de vídeo, documento ou prova.',
      element: tour('admin-courses-new'),
      position: 'left',
    },
    {
      id: 'table',
      title: 'Cursos cadastrados',
      description:
        'Pesquise na busca acima e filtre ou ordene clicando no cabeçalho das colunas. Nas ações de cada linha você edita, abre a aula como aluno ou exclui o curso.',
      element: `${tour('admin-courses-table')} thead`,
      position: 'bottom',
    },
    replayStep,
  ],
}

const courseFormTour: OnboardingTourDefinition = {
  id: 'cadastro-curso',
  label: 'Cadastro de curso',
  paths: ['/admin/conteudos/novo', '/admin/conteudos/:courseId/editar'],
  ready: tour('course-info'),
  steps: [
    {
      id: 'info',
      title: '1 · Informações',
      description: 'Nome, categoria, carga horária, pontos e a descrição que o colaborador vê na aula.',
      element: tour('course-info'),
      position: 'bottom',
    },
    {
      id: 'certificate',
      title: 'Certificado',
      description:
        'Defina se o curso emite certificado ao ser concluído. Em "Ver prévia" você confere como ele fica com os dados do curso.',
      element: tour('course-certificate'),
      position: 'top',
    },
    {
      id: 'audience',
      title: '2 · Destinado a',
      description:
        'Escolha se o curso vai para setores ou classes e acrescente colaboradores individualmente. Quem for incluído recebe um e-mail avisando.',
      element: tour('course-audience'),
      position: 'top',
    },
    {
      id: 'mandatory',
      title: 'Obrigatório e prazo',
      description: 'Cursos obrigatórios aparecem nos prazos do colaborador até a data definida.',
      element: tour('course-mandatory'),
      position: 'top',
    },
    {
      id: 'sequence',
      title: 'Sequência das etapas',
      description: 'Ligada, cada etapa só libera depois que a anterior for concluída.',
      element: tour('course-sequence'),
      position: 'bottom',
    },
    {
      id: 'pipeline',
      title: '3 · Etapas',
      description: 'Adicione etapas, arraste para reordenar e clique em uma etapa para editar o conteúdo dela.',
      element: tour('course-pipeline'),
      position: 'top',
    },
    {
      id: 'stage-editor',
      title: 'Conteúdo da etapa',
      description:
        'Escolha o tipo (vídeo, documento ou prova) e preencha o conteúdo. As provas ficam salvas em Configurações e podem ser reaproveitadas.',
      element: tour('course-stage-editor'),
      position: 'top',
    },
    {
      id: 'footer',
      title: 'Salvar',
      description: 'Revise e salve. O sistema avisa se faltar alguma informação nas etapas.',
      element: tour('course-footer'),
      position: 'top',
    },
  ],
}

const trailFormTour: OnboardingTourDefinition = {
  id: 'cadastro-trilha',
  label: 'Cadastro de trilha',
  paths: ['/admin/trilhas/nova', '/admin/trilhas/:trailId/editar'],
  ready: tour('trail-info'),
  steps: [
    {
      id: 'info',
      title: '1 · Informações',
      description: 'Nome e descrição da trilha, como o colaborador vai ver.',
      element: tour('trail-info'),
      position: 'bottom',
    },
    {
      id: 'certificate',
      title: 'Certificado da trilha',
      description:
        'Ligado, o colaborador recebe o certificado da trilha ao concluir todos os cursos, com a carga horária total. Use "Ver prévia" para conferir.',
      element: tour('trail-certificate'),
      position: 'top',
    },
    {
      id: 'audience',
      title: '2 · Destinado a',
      description: 'Quem recebe a trilha passa a ter todos os cursos dela, sem precisar destinar curso por curso.',
      element: tour('trail-audience'),
      position: 'top',
    },
    {
      id: 'courses',
      title: '3 · Cursos',
      description:
        'Busque e adicione os cursos e arraste para definir a ordem. Com a sequência obrigatória, cada curso libera ao concluir o anterior.',
      element: tour('trail-courses'),
      position: 'top',
    },
  ],
}

const learnerTrailTour: OnboardingTourDefinition = {
  id: 'trilha',
  label: 'Trilha',
  paths: ['/trilha/:trailId'],
  ready: tour('trail-hero'),
  steps: [
    {
      id: 'hero',
      title: 'Sua trilha',
      description: 'Andamento da trilha e o atalho para o próximo curso. Ao concluir todos, o certificado aparece aqui.',
      element: tour('trail-hero'),
      position: 'bottom',
    },
    {
      id: 'list',
      title: 'Cursos em ordem',
      description: 'Os cursos com cadeado liberam quando você conclui o anterior. Clique em um curso para abrir.',
      element: tour('trail-courses-list'),
      position: 'top',
    },
    replayStep,
  ],
}

const usersTour: OnboardingTourDefinition = {
  id: 'colaboradores',
  label: 'Colaboradores',
  paths: ['/admin/colaboradores'],
  ready: tour('users-kpis'),
  steps: [
    {
      id: 'new',
      title: 'Cadastrar colaborador',
      description: 'Informe nome, e-mail de login, senha inicial, setor e classes. Os cursos chegam ao aluno por essas informações.',
      element: tour('users-new'),
      position: 'left',
    },
    {
      id: 'kpis',
      title: 'Resumo',
      description: 'Total de cadastrados, ativos e quem ainda não fez o primeiro acesso.',
      element: tour('users-kpis'),
      position: 'bottom',
    },
    {
      id: 'table',
      title: 'Lista de colaboradores',
      description:
        'Pesquise por nome ou e-mail na busca acima e filtre ou ordene clicando no cabeçalho das colunas. Nas ações de cada linha você edita ou exclui o colaborador.',
      element: `${tour('users-table')} thead`,
      position: 'bottom',
    },
    replayStep,
  ],
}

const settingsTour: OnboardingTourDefinition = {
  id: 'configuracoes',
  label: 'Configurações',
  paths: ['/admin/configuracoes'],
  ready: tour('settings-nav'),
  steps: [
    {
      id: 'nav',
      title: 'Seções',
      description:
        'Setores e classes organizam os colaboradores e definem para quem os cursos vão; as categorias organizam os cursos. Em Provas você cria as avaliações reutilizáveis e em E-mail configura o envio dos avisos.',
      element: tour('settings-nav'),
      position: 'right',
    },
    {
      id: 'panel',
      title: 'Cadastro da seção',
      description:
        'Adicione itens pelo botão do topo. Passe o mouse sobre um item para editar ou excluir; com muitos itens, use a busca.',
      element: tour('settings-panel'),
      position: 'left',
    },
    replayStep,
  ],
}

const generalTour: OnboardingTourDefinition = {
  id: 'geral',
  label: 'Navegação',
  paths: [],
  ready: '#tour-header-tools',
  steps: [
    {
      id: 'placeholder',
      title: 'Em construção',
      description: 'Esta área ainda será desenvolvida. Enquanto isso, use o menu para navegar pela Universidade.',
      element: tour('placeholder'),
      position: 'bottom',
    },
    {
      id: 'tabs',
      title: 'Menu lateral',
      description: 'Pelo menu à esquerda você acessa Dashboard, Meus Cursos e as áreas de administração.',
      element: '#tour-collaborator-nav',
      position: 'right',
    },
    {
      id: 'header',
      title: 'Busca, avisos e conta',
      description: 'No topo você pesquisa as telas, troca o tema, acompanha notificações e acessa o menu da sua conta.',
      element: '#tour-header-tools',
      position: 'bottom',
    },
  ],
}

export const onboardingTours: OnboardingTourDefinition[] = [
  dashboardTour,
  coursesTour,
  lessonTour,
  profileTour,
  adminCoursesTour,
  courseFormTour,
  trailFormTour,
  learnerTrailTour,
  usersTour,
  settingsTour,
]

function matchesPath(pattern: string, pathname: string) {
  const expected = pattern.split('/').filter(Boolean)
  const actual = pathname.split('/').filter(Boolean)
  return expected.length === actual.length && expected.every((part, index) => part.startsWith(':') || part === actual[index])
}

export function tourForPath(pathname: string) {
  return onboardingTours.find((item) => item.paths.some((path) => matchesPath(path, pathname))) ?? generalTour
}

const LEGACY_DASHBOARD_KEY = 'universidade-soaco.onboarding.completed'

function storageKey(tourId: string) {
  return tourId === dashboardTour.id ? LEGACY_DASHBOARD_KEY : `universidade-soaco.onboarding.${tourId}`
}

export function hasSeenTour(tourId: string) {
  return localStorage.getItem(storageKey(tourId)) === 'true'
}

export function markTourSeen(tourId: string) {
  localStorage.setItem(storageKey(tourId), 'true')
}
