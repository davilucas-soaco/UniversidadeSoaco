import type { NotificationItem } from '@/types'

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
