import { daysUntil } from '@/lib/format'
import type { Course } from '@/types'

function byRecentAccess(a: Course, b: Course) {
  return (b.lastAccessAt ?? '').localeCompare(a.lastAccessAt ?? '')
}

/** Indicadores derivados dos cursos destinados ao colaborador. */
export function summarizeCourses(courses: Course[]) {
  const inProgress = courses.filter((course) => course.status === 'em_andamento').sort(byRecentAccess)
  const completed = courses.filter((course) => course.status === 'concluido')
  const pending = courses.filter((course) => course.status === 'pendente')
  const mandatoryOpen = courses.filter((course) => course.mandatory && course.status !== 'concluido')
  const deadlines = mandatoryOpen
    .filter((course) => course.dueDate)
    .sort((a, b) => daysUntil(a.dueDate!) - daysUntil(b.dueDate!))

  const total = courses.length
  const averageProgress = Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / Math.max(1, total))

  return {
    total,
    inProgress,
    completed,
    pending,
    mandatoryOpen,
    deadlines,
    featured: [...inProgress.slice(0, 2), ...pending.filter((course) => course.isNew).slice(0, 1)],
    averageProgress,
    remaining: total - completed.length,
    completionRate: Math.round((completed.length / Math.max(1, total)) * 100),
    studiedHours: Math.round(courses.reduce((sum, course) => sum + (course.durationHours * course.progress) / 100, 0)),
  }
}

export type CourseSummary = ReturnType<typeof summarizeCourses>

export function progressStatusLabel(percent: number) {
  if (percent >= 75) return 'Alto desempenho'
  if (percent >= 40) return 'No ritmo'
  return 'Atenção ao prazo'
}
