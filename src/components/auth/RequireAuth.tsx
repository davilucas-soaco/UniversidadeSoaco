import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

export const FIRST_ACCESS_PATH = '/primeiro-acesso'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (status === 'anonymous' || !user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (user.mustChangePassword && location.pathname !== FIRST_ACCESS_PATH) {
    return <Navigate to={FIRST_ACCESS_PATH} replace />
  }

  return <>{children}</>
}

/** Bloqueia telas de gestão para quem não tem o papel exigido. */
export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}
