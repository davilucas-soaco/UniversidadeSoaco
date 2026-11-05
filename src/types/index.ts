export type UserRole = 'administrador' | 'gestor_conteudo' | 'colaborador'

export type CourseStatus = 'concluido' | 'em_andamento' | 'pendente'

export type CourseCategory =
  | 'Institucional'
  | 'Recursos Humanos'
  | 'Segurança do Trabalho'
  | 'Compras'
  | 'Desenvolvimento Profissional'
  | 'Produção'
  | 'Logística'
  | 'Financeiro'
  | 'Tecnologia'

export type CoverAccent = 'navy' | 'sand' | 'ocean' | 'steel' | 'gold'

export type CoverIcon =
  | 'building'
  | 'flag'
  | 'shield'
  | 'clipboard'
  | 'chart'
  | 'workflow'
  | 'heart'
  | 'book'

export type Collaborator = {
  id: string
  name: string
  firstName: string
  sector: string
  jobTitle: string
  role: UserRole
  avatarInitials: string
  points: number
  completedCourses: number
  isCurrentUser?: boolean
}

export type Course = {
  id: string
  title: string
  category: CourseCategory
  description: string
  durationHours: number
  points: number
  status: CourseStatus
  progress: number
  cover: {
    accent: CoverAccent
    icon: CoverIcon
  }
}

export type PerformancePoint = {
  label: string
  points: number
  average: number
}

export type PeriodKey = '30d' | '6m' | '12m'

export type NotificationItem = {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: 'course' | 'ranking' | 'deadline'
}

export type ActivityItem = {
  id: string
  title: string
  description: string
  time: string
  type: 'completion' | 'progress' | 'assignment' | 'points'
}

export type UpcomingTraining = {
  id: string
  courseId: string
  title: string
  dueLabel: string
  status: CourseStatus
}

export type NavItem = {
  to: string
  label: string
  icon: string
  reserved?: boolean
}
