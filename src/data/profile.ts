import type { ProfileAccount } from '@/types'

export function profileStorageKey(userId: string) {
  return `universidade-soaco.profile.${userId}`
}

/** Preferências de notificação ainda não persistidas no banco. */
export const defaultPreferences: Pick<ProfileAccount, 'notifications' | 'dndEnabled' | 'dndFrom' | 'dndTo'> = {
  notifications: {
    courses: true,
    deadlines: true,
    ranking: false,
    digest: true,
  },
  dndEnabled: false,
  dndFrom: '22:00',
  dndTo: '07:00',
}
