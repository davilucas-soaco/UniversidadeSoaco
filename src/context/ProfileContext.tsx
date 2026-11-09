import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { defaultPreferences, profileStorageKey } from '@/data/profile'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { initialsFrom } from '@/lib/format'
import type { ProfileAccount, ProfileNotifications, SessionUser } from '@/types'

type ProfilePatch = Partial<Omit<ProfileAccount, 'notifications'>>

/** Ajustes locais do perfil; o que não foi editado vem do cadastro no banco. */
type StoredProfile = ProfilePatch & { notifications?: Partial<ProfileNotifications> }

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

function buildProfile(user: SessionUser, stored: StoredProfile): ProfileAccount {
  return {
    name: stored.name ?? user.name,
    email: stored.email ?? user.email,
    phone: stored.phone ?? user.phone ?? '',
    location: stored.location ?? user.location ?? '',
    photoUrl: stored.photoUrl !== undefined ? stored.photoUrl : user.photoUrl,
    notifications: { ...defaultPreferences.notifications, ...stored.notifications },
    dndEnabled: stored.dndEnabled ?? defaultPreferences.dndEnabled,
    dndFrom: stored.dndFrom ?? defaultPreferences.dndFrom,
    dndTo: stored.dndTo ?? defaultPreferences.dndTo,
  }
}

function ProfileStore({ user, children }: { user: SessionUser; children: ReactNode }) {
  const { changePassword } = useAuth()
  const [stored, setStored] = useLocalStorageState<StoredProfile>(profileStorageKey(user.id), {})
  const profile = useMemo(() => buildProfile(user, stored), [user, stored])

  const updateProfile = useCallback(
    (patch: ProfilePatch) => {
      setStored((current) => ({ ...current, ...patch }))
    },
    [setStored],
  )

  const setPhoto = useCallback(
    (photoUrl: string | null) => {
      setStored((current) => ({ ...current, photoUrl }))
    },
    [setStored],
  )

  const setNotification = useCallback(
    (key: keyof ProfileNotifications, value: boolean) => {
      setStored((current) => ({
        ...current,
        notifications: { ...current.notifications, [key]: value },
      }))
    },
    [setStored],
  )

  const initials = initialsFrom(profile.name) || user.initials
  const firstName = profile.name.split(' ').filter(Boolean)[0] ?? user.firstName

  const value = useMemo(
    () => ({
      profile,
      initials,
      firstName,
      jobTitle: user.jobTitle,
      sector: user.sector,
      updateProfile,
      setPhoto,
      setNotification,
      changePassword,
    }),
    [profile, initials, firstName, user.jobTitle, user.sector, updateProfile, setPhoto, setNotification, changePassword],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <>{children}</>
  return (
    <ProfileStore key={user.id} user={user}>
      {children}
    </ProfileStore>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de ProfileProvider, com usuário logado.')
  }
  return context
}
