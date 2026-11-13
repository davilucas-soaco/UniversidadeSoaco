export type UserRole = 'administrador' | 'gestor_conteudo' | 'colaborador'

export type CourseStatus = 'concluido' | 'em_andamento' | 'pendente'

/** Nome de uma categoria cadastrada em Configurações. */
export type CourseCategory = string

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

export type ProfileAccount = {
  name: string
  email: string
  phone: string
  location: string
  photoUrl: string | null
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
  /** Usuário master do .env: não pode ser desativado, excluído nem ter login alterado. */
  isMaster: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

export type Sector = {
  id: number
  name: string
  usersCount: number
}

export type EmailSettings = {
  configured: boolean
  provider: string
  fromEmail: string
  fromName: string
  clientId: string
  hasClientSecret: boolean
  hasRefreshToken: boolean
  lastTestedAt: string | null
  lastError: string | null
  credentialBlockedAt: string | null
  credentialBlockSummary: string | null
  updatedAt: string | null
  /** NOTIFICACOES_ENVIO_HABILITADO=true no backend/.env (produção). */
  sendingEnabled: boolean
}

export type EmailSettingsInput = {
  fromEmail: string
  fromName: string
  clientId: string
  clientSecret?: string
  refreshToken?: string
}

export type CourseCategoryItem = {
  id: number
  name: string
  coursesCount: number
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

export type ContentKind = 'document' | 'video' | 'exam'

/** Prova do banco de provas, como aparece nas listas da gestão. */
export type ExamSummary = {
  id: string
  title: string
  description: string
  passingScore: number
  questionsCount: number
  usedIn: { courseId: string; courseTitle: string; stageTitle: string }[]
  updatedAt: string
}

/** Prova completa para edição (com o gabarito). */
export type ExamDetail = {
  id: string
  title: string
  description: string
  passingScore: number
  questions: { id: string; text: string; options: { id: string; text: string; correct: boolean }[] }[]
  updatedAt: string
}

export type ExamInput = {
  title: string
  description: string
  passingScore: number
  questions: { text: string; options: { text: string; correct: boolean }[] }[]
}

/** Prova como o colaborador recebe: sem indicar a opção correta. */
export type LearnerExam = {
  id: string
  title: string
  description: string
  passingScore: number
  questions: { id: string; text: string; options: { id: string; text: string }[] }[]
}

export type ExamAttemptSummary = { bestScore: number; approved: boolean; attempts: number; lastAttemptAt: string }

export type ExamSubmitResult = {
  correct: number
  total: number
  score: number
  passingScore: number
  approved: boolean
  review: { questionId: string; selectedOptionId: string | null; correct: boolean; correctOptionId?: string | null }[]
}

export type VideoProvider = 'youtube' | 'vimeo' | 'loom'

export type AuthoredDocument = {
  id: string
  name: string
  mime: string
  size: number
  /** Endereço do arquivo na API (cursos gravados no banco). */
  url?: string
}

/** Etapa do pipeline na gestão de cursos. Etapa com subetapas é um grupo (sem conteúdo próprio). */
export type AdminStage = {
  id: string
  title: string
  description: string
  kind: ContentKind | null
  videoUrl: string | null
  videoProvider: VideoProvider | null
  documents: AuthoredDocument[]
  examId: string | null
  examTitle: string | null
}

export type AdminCourse = {
  id: string
  title: string
  category: string
  description: string
  durationHours: number
  points: number
  sequential: boolean
  /** Ao concluir, o colaborador recebe o certificado. */
  certificate: boolean
  coverImage: string | null
  stages: (AdminStage & { children: AdminStage[] })[]
  unitsCount: number
  audience: {
    users: { id: string; name: string }[]
    sectors: { id: number; name: string }[]
    classes: { id: number; name: string }[]
  }
  mandatory: boolean
  dueDate: string | null
  /** Trilhas de que o curso faz parte. */
  trails: { id: string; title: string }[]
  createdAt: string
  updatedAt: string
}

export type AdminTrail = {
  id: string
  title: string
  description: string
  sequential: boolean
  certificate: boolean
  courses: { id: string; title: string; category: string; durationHours: number; coverImage: string | null }[]
  durationHours: number
  audience: AdminCourse['audience']
  mandatory: boolean
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type AdminTrailInput = {
  title: string
  description: string
  sequential: boolean
  certificate: boolean
  courseIds: string[]
  audience: { userIds: string[]; sectorIds: number[]; classIds: number[] }
  mandatory: boolean
  dueDate: string | null
}

/** Curso de trilha sequencial que espera a conclusão de outro. */
export type TrailLock = { trailId: string; trailTitle: string; courseId: string; courseTitle: string }

/** Trilha como o colaborador recebe, com o andamento dele. */
export type LearnerTrail = {
  id: string
  title: string
  description: string
  sequential: boolean
  mandatory: boolean
  dueDate?: string
  durationHours: number
  status: CourseStatus
  progress: number
  completedCount: number
  certificate: { enabled: boolean; code?: string; issuedAt?: string }
  courses: {
    id: string
    title: string
    category: string
    durationHours: number
    cover: Course['cover']
    status: CourseStatus
    progress: number
    lockedBy?: TrailLock
    /** Certificado do curso, quando já emitido. */
    certificate?: { code: string; issuedAt: string }
  }[]
}

export type AdminStageInput = {
  key: string
  id: string | null
  title: string
  description: string
  kind: ContentKind | null
  videoUrl: string | null
  examId: string | null
}

export type AdminCourseInput = {
  title: string
  category: string
  description: string
  durationHours: number
  points: number
  sequential: boolean
  certificate: boolean
  stages: (AdminStageInput & { children: AdminStageInput[] })[]
  audience: { userIds: string[]; sectorIds: number[]; classIds: number[] }
  mandatory: boolean
  dueDate: string | null
}

export type CourseAudienceOptions = {
  users: {
    id: string
    name: string
    email: string
    sectorId: number | null
    sectorName: string | null
    classIds: number[]
  }[]
  sectors: Sector[]
  classes: ClassGroup[]
  categories: CourseCategory[]
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
  /** Conteúdo próprio (aulas que vêm de etapas cadastradas pela gestão). */
  videoUrl?: string
  embedUrl?: string
  documents?: AuthoredDocument[]
  /** Etapa gravada no banco: a conclusão é registrada na API. */
  stageId?: string
  /** Etapa de prova: concluída ao ser aprovado. */
  exam?: LearnerExam
  examResult?: ExamAttemptSummary
}

/** Etapa do curso como o colaborador recebe (com conclusão). */
export type CourseStage = {
  id: string
  title: string
  description: string
  kind: ContentKind | null
  videoUrl?: string
  videoProvider?: VideoProvider
  embedUrl?: string
  documents: AuthoredDocument[]
  exam?: LearnerExam
  examResult?: ExamAttemptSummary
  done: boolean
  children: CourseStage[]
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
  /** Pipeline de etapas (cursos cadastrados pela gestão). */
  stages?: CourseStage[]
  /** true = as etapas devem ser concluídas na ordem. */
  sequential?: boolean
  /** O curso gera certificado e, se já emitido para o colaborador, o código e a data. */
  certificate?: { enabled: boolean; code?: string; issuedAt?: string }
  authored?: boolean
  contentKind?: ContentKind
  videoUrl?: string
  videoProvider?: VideoProvider
  embedUrl?: string
  documents?: AuthoredDocument[]
  /** Por onde o curso chegou ao colaborador. */
  assignedVia?: AssignmentTarget[]
  /** Trilha sequencial em que o curso ainda espera a conclusão de outro. */
  lockedBy?: TrailLock
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
