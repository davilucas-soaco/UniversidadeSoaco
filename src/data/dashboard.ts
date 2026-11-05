import { collaborators, currentUser } from '@/data/collaborators'
import { continueLearningCourses, courses } from '@/data/courses'

const inProgress = courses.filter((course) => course.status === 'em_andamento')
const pending = courses.filter((course) => course.status === 'pendente')

export const dashboardStats = {
  points: currentUser.points,
  completedCourses: currentUser.completedCourses,
  inProgressCourses: inProgress.length,
  pendingTrainings: pending.length,
  completionRate: Math.round(
    (currentUser.completedCourses / (currentUser.completedCourses + inProgress.length + pending.length)) *
      100,
  ),
}

export const rankingPreview = [...collaborators]
  .sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.completedCourses !== a.completedCourses) return b.completedCourses - a.completedCourses
    return a.name.localeCompare(b.name, 'pt-BR')
  })
  .slice(0, 5)
  .map((collaborator, index) => ({
    ...collaborator,
    position: index + 1,
  }))

export const currentUserRank =
  rankingPreview.find((item) => item.isCurrentUser)?.position ??
  collaborators.findIndex((item) => item.id === currentUser.id) + 1

export const featuredCourses = continueLearningCourses.slice(0, 3)

export const indicatorMetrics = [
  {
    key: 'points',
    label: 'Pontuação acumulada',
    value: `${dashboardStats.points}`,
    suffix: 'pontos',
    trend: 12,
    sparkline: [18, 22, 19, 28, 24, 30, 34],
  },
  {
    key: 'completed',
    label: 'Cursos concluídos',
    value: `${dashboardStats.completedCourses}`,
    suffix: 'cursos',
    trend: 8,
    sparkline: [8, 9, 9, 10, 11, 11, 12],
  },
  {
    key: 'progress',
    label: 'Em andamento',
    value: `${dashboardStats.inProgressCourses}`,
    suffix: 'cursos',
    trend: -4,
    sparkline: [6, 5, 5, 4, 4, 3, 3],
  },
  {
    key: 'pending',
    label: 'Pendentes',
    value: `${dashboardStats.pendingTrainings}`,
    suffix: 'treinamentos',
    trend: -2,
    sparkline: [8, 7, 7, 6, 6, 5, 5],
  },
] as const
