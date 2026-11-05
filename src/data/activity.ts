import type { ActivityItem, NotificationItem, UpcomingTraining } from '@/types'

export const recentActivities: ActivityItem[] = [
  {
    id: 'act-01',
    title: 'Aula retomada',
    description: 'Você avançou em Segurança do Trabalho.',
    time: 'Há 2 horas',
    type: 'progress',
  },
  {
    id: 'act-02',
    title: 'Curso concluído',
    description: 'Boas Práticas Administrativas foi finalizado.',
    time: 'Há 2 dias',
    type: 'completion',
  },
  {
    id: 'act-03',
    title: 'Pontuação registrada',
    description: '10 pontos adicionados ao seu histórico.',
    time: 'Há 2 dias',
    type: 'points',
  },
  {
    id: 'act-04',
    title: 'Novo treinamento',
    description: 'Gestão de Processos foi atribuído a você.',
    time: 'Há 4 dias',
    type: 'assignment',
  },
]

export const upcomingTrainings: UpcomingTraining[] = [
  {
    id: 'up-01',
    courseId: 'curso-processos',
    title: 'Gestão de Processos',
    dueLabel: 'Prazo em 12 nov',
    status: 'pendente',
  },
  {
    id: 'up-02',
    courseId: 'curso-excel',
    title: 'Excel e Análise de Dados',
    dueLabel: 'Continuar aula 3',
    status: 'em_andamento',
  },
  {
    id: 'up-03',
    courseId: 'curso-lgpd',
    title: 'Privacidade e Proteção de Dados',
    dueLabel: 'Prazo em 20 nov',
    status: 'pendente',
  },
]

export const notifications: NotificationItem[] = [
  {
    id: 'ntf-01',
    title: 'Treinamento atribuído',
    description: 'Gestão de Processos foi disponibilizado para o seu perfil.',
    time: 'Há 4 dias',
    read: false,
    type: 'course',
  },
  {
    id: 'ntf-02',
    title: 'Prazo se aproximando',
    description: 'O curso Gestão de Processos vence em 12 de novembro.',
    time: 'Há 1 dia',
    read: false,
    type: 'deadline',
  },
  {
    id: 'ntf-03',
    title: 'Movimentação no ranking',
    description: 'Você está entre os cinco colaboradores com melhor pontuação.',
    time: 'Há 2 dias',
    read: true,
    type: 'ranking',
  },
]
