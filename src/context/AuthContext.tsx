import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, UNAUTHORIZED_EVENT } from '@/lib/api'
import type { SessionUser } from '@/types'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  user: SessionUser | null
  /** Erro ao verificar a sessão (ex.: backend fora do ar). */
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>
  retry: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api<{ user: SessionUser }>('/auth/me', { signal: controller.signal })
      .then((data) => {
        setUser(data.user)
        setError(null)
        setStatus('authenticated')
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        setUser(null)
        setError(caught instanceof ApiError && caught.status !== 401 ? caught.message : null)
        setStatus('anonymous')
      })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: { email, senha: password },
    })
    setUser(data.user)
    setError(null)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const changePassword = useCallback(async (currentPassword: string, nextPassword: string) => {
    const data = await api<{ user: SessionUser }>('/auth/senha', {
      method: 'POST',
      body: { senhaAtual: currentPassword, novaSenha: nextPassword },
    })
    setUser(data.user)
  }, [])

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((value) => value + 1)
  }, [])

  const value = useMemo(
    () => ({ status, user, error, login, logout, changePassword, retry }),
    [status, user, error, login, logout, changePassword, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }
  return context
}

/** Usuário logado; só use em telas protegidas por RequireAuth. */
export function useSessionUser() {
  const { user } = useAuth()
  if (!user) {
    throw new Error('useSessionUser exige um usuário autenticado.')
  }
  return user
}
