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

export type ProfileNotifications = {
  courses: boolean
  deadlines: boolean
  ranking: boolean
  digest: boolean
}

export type ProfileAccount = {
  name: string
  email: string
  phone: string
  location: string
  photoUrl: string | null
  notifications: ProfileNotifications
  dndEnabled: boolean
  dndFrom: string
  dndTo: string
}

export type SessionUser = {
  id: string
  name: string
  firstName: string
  email: string
  role: UserRole
  jobTitle: string
  sector: string
  initials: string
  phone: string | null
  location: string | null
  photoUrl: string | null
  classes: string[]
  /** Senha inicial definida pelo administrador ainda não foi trocada. */
  mustChangePassword: boolean
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: UserRole
  sectorId: number | null
  sectorName: string | null
  classIds: number[]
  classNames: string[]
  active: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

export type Sector = {
  id: number
  name: string
  usersCount: number
}

export type ClassGroup = {
  id: number
  name: string
  description: string | null
  membersCount: number
}

export type Instructor = {
  id: string
  name: string
  title: string
  initials: string
  bio: string
  stats: string
}

export type LessonKind = 'video' | 'pdf' | 'quiz'

export type ContentKind = 'document' | 'video'

export type VideoProvider = 'youtube' | 'vimeo' | 'loom'

export type AuthoredDocument = {
  id: string
  name: string
  mime: string
  size: number
}

export type AuthoredCourse = {
  id: string
  title: string
  kind: ContentKind
  videoUrl?: string
  videoProvider?: VideoProvider
  embedUrl?: string
  documents: AuthoredDocument[]
  createdAt: string
}

export type Lesson = {
  id: string
  title: string
  kind: LessonKind
  /** Duração em minutos (vídeo) */
  durationMin?: number
  /** Páginas (apostila) */
  pages?: number
  /** Questões (quiz) */
  questions?: number
  points?: number
  mandatory?: boolean
  done: boolean
}

export type CourseModule = {
  id: string
  title: string
  summary: string
  lessons: Lesson[]
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
    image: string
  }
  instructorId: string
  lessonsCount: number
  moduleTitles: string[]
  mandatory?: boolean
  /** Data limite (ISO yyyy-mm-dd) para cursos obrigatórios */
  dueDate?: string
  isNew?: boolean
  objectives: string[]
  authored?: boolean
  contentKind?: ContentKind
  videoUrl?: string
  videoProvider?: VideoProvider
  embedUrl?: string
  documents?: AuthoredDocument[]
  /** Por onde o curso chegou ao colaborador. */
  assignedVia?: AssignmentTarget[]
  assignedAt?: string
  startedAt?: string
  completedAt?: string
  lastAccessAt?: string
}

export type AssignmentTarget = 'usuario' | 'setor' | 'classe'

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
  description: string
  createdAt: string
  type: 'completion' | 'progress' | 'assignment' | 'points'
}

export type CourseReview = {
  id: string
  author: string
  initials: string
  role: string
  rating: number
  comment: string
  createdAt: string
  isMine: boolean
}

export type CourseReviews = {
  average: number | null
  count: number
  distribution: { stars: number; count: number }[]
  mine: { rating: number; comment: string | null } | null
  reviews: CourseReview[]
}

export type RankingEntry = {
  id: string
  name: string
  initials: string
  jobTitle: string
  points: number
  completedCourses: number
  position: number
  isCurrentUser: boolean
}

export type DashboardData = {
  points: number
  monthPoints: number
  assessmentAverage: number | null
  annualTargetHours: number
  studyWeek: { minutes: number; goalMinutes: number }
  performance: Record<PeriodKey, PerformancePoint[]>
  ranking: {
    top: RankingEntry[]
    me: RankingEntry | null
    total: number
    percentile: number | null
  }
  activities: ActivityItem[]
}

export type NavItem = {
  to: string
  label: string
  icon: string
  reserved?: boolean
  /** Papéis que enxergam o item; ausente = todos. */
  roles?: UserRole[]
}
