/**
 * TEMPORÁRIO — dados de demonstração usados pelo botão "Dados demo" do cabeçalho.
 * Para remover: apague esta pasta, o DemoModeContext e o botão no Header.
 */
import type { ActivityItem, Course, DashboardData, RankingEntry, SessionUser } from '@/types'
import { collaborators, currentUser } from './demoCollaborators'
import { courses } from './demoCourses'
import { performanceByPeriod } from './demoPerformance'

const HOUR_MS = 60 * 60 * 1000

const startedAt: Record<string, string> = {
  'curso-seguranca': '2026-09-18',
  'curso-excel': '2026-10-02',
  'curso-compras': '2026-10-14',
  'curso-integracao': '2026-07-08',
  'curso-cultura': '2026-07-22',
  'curso-etica': '2026-08-04',
  'curso-comunicacao': '2026-08-18',
  'curso-primeiros-socorros': '2026-08-26',
}

/** Último acesso, em horas atrás. */
const lastAccessHoursAgo: Record<string, number> = {
  'curso-seguranca': 2,
  'curso-excel': 26,
  'curso-compras': 72,
}

export function buildDemoCourses(now = new Date()): Course[] {
  return courses.map((course) => ({
    ...course,
    assignedVia: ['usuario'],
    startedAt: startedAt[course.id],
    lastAccessAt: lastAccessHoursAgo[course.id]
      ? new Date(now.getTime() - lastAccessHoursAgo[course.id] * HOUR_MS).toISOString()
      : undefined,
  }))
}

export function buildDemoDashboard(user: SessionUser, now = new Date()): DashboardData {
  const ranking: RankingEntry[] = [...collaborators]
    .sort((a, b) => b.points - a.points || b.completedCourses - a.completedCourses || a.name.localeCompare(b.name, 'pt-BR'))
    .map((person, index) => {
      const isCurrentUser = person.id === currentUser.id
      return {
        id: isCurrentUser ? user.id : person.id,
        name: isCurrentUser ? user.name : person.name,
        initials: isCurrentUser ? user.initials : person.avatarInitials,
        jobTitle: isCurrentUser ? user.jobTitle : person.jobTitle,
        points: person.points,
        completedCourses: person.completedCourses,
        position: index + 1,
        isCurrentUser,
      }
    })
  const me = ranking.find((item) => item.isCurrentUser) ?? null

  const activities: ActivityItem[] = [
    { id: 'demo-1', type: 'progress', description: 'Você avançou em Segurança do Trabalho.', createdAt: new Date(now.getTime() - 2 * HOUR_MS).toISOString() },
    { id: 'demo-2', type: 'completion', description: 'Comunicação Empresarial foi concluído.', createdAt: new Date(now.getTime() - 48 * HOUR_MS).toISOString() },
    { id: 'demo-3', type: 'points', description: '10 pontos adicionados ao seu histórico.', createdAt: new Date(now.getTime() - 50 * HOUR_MS).toISOString() },
    { id: 'demo-4', type: 'assignment', description: 'Gestão de Processos foi atribuído a você.', createdAt: new Date(now.getTime() - 96 * HOUR_MS).toISOString() },
  ]

  return {
    points: currentUser.points,
    monthPoints: performanceByPeriod['30d'].reduce((sum, point) => sum + point.points, 0),
    assessmentAverage: 92.4,
    annualTargetHours: 80,
    studyWeek: { minutes: 405, goalMinutes: 330 },
    performance: performanceByPeriod,
    ranking: {
      top: ranking,
      me,
      total: ranking.length,
      percentile: me ? Math.max(1, Math.round((me.position / ranking.length) * 100)) : null,
    },
    activities,
  }
}
