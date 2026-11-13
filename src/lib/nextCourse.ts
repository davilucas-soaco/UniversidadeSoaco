import type { Course, LearnerTrail } from '@/types'

export type NextStep = {
  /** Trilha do curso concluído (a que ainda tem curso pendente, se houver). */
  trail: LearnerTrail | null
  /** Próximo curso a fazer: o seguinte da trilha ou, fora de trilha, outro curso pendente. */
  course: { id: string; title: string } | null
}

/** O que o colaborador pode fazer depois de concluir `courseId`. */
export function nextStepAfter(courseId: string, trails: LearnerTrail[], courses: Course[]): NextStep {
  const withCourse = trails.filter((trail) => trail.courses.some((course) => course.id === courseId))
  for (const trail of withCourse) {
    const index = trail.courses.findIndex((course) => course.id === courseId)
    const pending = [...trail.courses.slice(index + 1), ...trail.courses.slice(0, index)].find(
      (course) => course.status !== 'concluido',
    )
    if (pending) return { trail, course: { id: pending.id, title: pending.title } }
  }

  const available = courses.filter((course) => course.id !== courseId && course.status !== 'concluido' && !course.lockedBy)
  const other = available.find((course) => course.status === 'em_andamento') ?? available[0]
  return { trail: withCourse[0] ?? null, course: other ? { id: other.id, title: other.title } : null }
}
