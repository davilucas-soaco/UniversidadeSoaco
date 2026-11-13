import type { CourseAudienceOptions } from '@/types'

export type AudienceSelection = { userIds: string[]; sectorIds: number[]; classIds: number[] }

type AudienceUser = CourseAudienceOptions['users'][number]

/** O colaborador já recebe o curso por um dos setores ou das classes escolhidos. */
export function coveredByGroup(user: AudienceUser, value: AudienceSelection) {
  if (user.sectorId !== null && value.sectorIds.includes(user.sectorId)) return true
  return user.classIds.some((classId) => value.classIds.includes(classId))
}

/** Quantos colaboradores recebem o curso (grupo escolhido + avulsos). */
export function audienceReach(options: CourseAudienceOptions, value: AudienceSelection) {
  return options.users.filter((user) => coveredByGroup(user, value) || value.userIds.includes(user.id)).length
}
