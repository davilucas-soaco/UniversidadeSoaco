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
  passwordHash: string | null
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
