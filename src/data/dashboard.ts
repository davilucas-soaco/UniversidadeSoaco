import { collaborators, currentUser } from '@/data/collaborators'
import { completedCourses, continueLearningCourses, courses, mandatoryCourses, pendingCourses } from '@/data/courses'
import { performanceByPeriod } from '@/data/performance'
import { daysUntil } from '@/lib/format'

const averageProgress = Math.round(
  courses.reduce((sum, course) => sum + course.progress, 0) / Math.max(1, courses.length),
)

const monthPoints = performanceByPeriod['30d'].reduce((sum, point) => sum + point.points, 0)

/** Média das avaliações respondidas pelo colaborador (mock até integrar com o backend). */
const assessmentAverage = 92.4

export const dashboardStats = {
  points: currentUser.points,
  monthPoints,
  completedCourses: completedCourses.length,
  totalCourses: courses.length,
  inProgressCourses: continueLearningCourses.length,
  pendingTrainings: pendingCourses.length,
  mandatoryOpen: mandatoryCourses.length,
  completionRate: Math.round((completedCourses.length / Math.max(1, courses.length)) * 100),
  /** Progresso médio do plano trimestral (todos os cursos atribuídos). */
  quarterProgress: averageProgress,
  quarterRemaining: courses.filter((course) => course.status !== 'concluido').length,
  assessmentAverage,
}

export const quarterStatus =
  dashboardStats.quarterProgress >= 75
    ? 'Alto desempenho'
    : dashboardStats.quarterProgress >= 40
      ? 'No ritmo'
      : 'Atenção ao prazo'

export const rankingPreview = [...collaborators]
  .sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.completedCourses !== a.completedCourses) return b.completedCourses - a.completedCourses
    return a.name.localeCompare(b.name, 'pt-BR')
  })
  .map((collaborator, index) => ({
    ...collaborator,
    position: index + 1,
  }))

export const rankingTop5 = rankingPreview.slice(0, 5)

export const currentUserRank =
  rankingPreview.find((item) => item.isCurrentUser)?.position ??
  collaborators.findIndex((item) => item.id === currentUser.id) + 1

export const currentUserPercentile = Math.max(
  1,
  Math.round((currentUserRank / Math.max(1, collaborators.length)) * 100),
)

export const featuredCourses = [
  ...continueLearningCourses.slice(0, 2),
  ...pendingCourses.filter((course) => course.isNew).slice(0, 1),
]

export const studyWeek = {
  minutes: 405,
  goalMinutes: 330,
}

export const deadlines = courses
  .filter((course) => course.mandatory && course.dueDate && course.status !== 'concluido')
  .sort((a, b) => daysUntil(a.dueDate!) - daysUntil(b.dueDate!))

export const executiveTrail = {
  name: 'Trilha Executiva',
  focus: 'Gestão Administrativa',
  progress: dashboardStats.completionRate,
}

export const annualGoal = {
  doneHours: Math.round(
    courses.reduce((sum, course) => sum + (course.durationHours * course.progress) / 100, 0),
  ),
  targetHours: 80,
}

export const indicatorMetrics = [
  {
    key: 'points',
    label: 'Pontuação',
    value: dashboardStats.points,
    unit: 'pts',
    detail: `+${dashboardStats.monthPoints} pts no mês`,
    trend: 'up',
  },
  {
    key: 'completed',
    label: 'Cursos concluídos',
    value: dashboardStats.completedCourses,
    unit: 'cursos',
    detail: `Meta: ${dashboardStats.totalCourses}`,
    trend: 'neutral',
  },
  {
    key: 'progress',
    label: 'Em andamento',
    value: dashboardStats.inProgressCourses,
    unit: 'cursos',
    detail: `${dashboardStats.mandatoryOpen} obrigatórios em aberto`,
    trend: 'sync',
  },
  {
    key: 'score',
    label: 'Aproveitamento',
    value: dashboardStats.assessmentAverage,
    unit: '%',
    detail: `Top ${currentUserPercentile}%`,
    trend: 'neutral',
  },
] as const

export type IndicatorMetric = (typeof indicatorMetrics)[number]
