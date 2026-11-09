import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { currentUser } from '@/data/collaborators'
import { defaultProfile, PROFILE_STORAGE_KEY } from '@/data/profile'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { sha256Hex } from '@/lib/hash'
import { initialsFrom } from '@/lib/format'
import type { ProfileAccount, ProfileNotifications } from '@/types'

type ProfilePatch = Partial<Omit<ProfileAccount, 'notifications' | 'passwordHash'>>

type ProfileContextValue = {
  profile: ProfileAccount
  initials: string
  firstName: string
  jobTitle: string
  sector: string
  updateProfile: (patch: ProfilePatch) => void
  setPhoto: (photoUrl: string | null) => void
  setNotification: (key: keyof ProfileNotifications, value: boolean) => void
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

function mergeProfile(stored: ProfileAccount): ProfileAccount {
  return {
    ...defaultProfile,
    ...stored,
    notifications: { ...defaultProfile.notifications, ...stored.notifications },
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [stored, setProfile] = useLocalStorageState<ProfileAccount>(PROFILE_STORAGE_KEY, defaultProfile)
  const profile = useMemo(() => mergeProfile(stored), [stored])

  const updateProfile = useCallback(
    (patch: ProfilePatch) => {
      setProfile((current) => ({ ...current, ...patch }))
    },
    [setProfile],
  )

  const setPhoto = useCallback(
    (photoUrl: string | null) => {
      setProfile((current) => ({ ...current, photoUrl }))
    },
    [setProfile],
  )

  const setNotification = useCallback(
    (key: keyof ProfileNotifications, value: boolean) => {
      setProfile((current) => ({
        ...current,
        notifications: { ...current.notifications, [key]: value },
      }))
    },
    [setProfile],
  )

  const changePassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      if (profile.passwordHash) {
        const currentHash = await sha256Hex(currentPassword)
        if (currentHash !== profile.passwordHash) {
          throw new Error('A senha atual não confere.')
        }
      }
      const nextHash = await sha256Hex(nextPassword)
      setProfile((current) => ({ ...current, passwordHash: nextHash }))
    },
    [profile.passwordHash, setProfile],
  )

  const initials = initialsFrom(profile.name) || currentUser.avatarInitials
  const firstName = profile.name.split(' ').filter(Boolean)[0] ?? currentUser.firstName

  const value = useMemo(
    () => ({
      profile,
      initials,
      firstName,
      jobTitle: currentUser.jobTitle,
      sector: currentUser.sector,
      updateProfile,
      setPhoto,
      setNotification,
      changePassword,
    }),
    [profile, initials, firstName, updateProfile, setPhoto, setNotification, changePassword],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de ProfileProvider.')
  }
  return context
}
