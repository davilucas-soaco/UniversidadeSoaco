import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { LoadStatus } from '@/context/CatalogContext'
import { useDemoMode } from '@/context/DemoModeContext'
import { buildDemoDashboard } from '@/demo'
import { api } from '@/lib/api'
import type { DashboardData } from '@/types'

type DashboardContextValue = {
  dashboard: DashboardData | null
  status: LoadStatus
  error: string | null
  reload: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [remote, setRemote] = useState<{ userId: string; dashboard: DashboardData } | null>(null)
  const [failure, setFailure] = useState<{ userId: string; message: string } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    api<{ dashboard: DashboardData }>('/me/dashboard', { signal: controller.signal })
      .then((data) => {
        setRemote({ userId, dashboard: data.dashboard })
        setFailure(null)
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        setFailure({ userId, message: caught instanceof Error ? caught.message : 'Erro ao carregar o painel.' })
      })
    return () => controller.abort()
  }, [userId, attempt])

  const reload = useCallback(() => {
    setFailure(null)
    setAttempt((value) => value + 1)
  }, [])

  const { enabled: demo } = useDemoMode()
  const demoDashboard = useMemo(() => (demo && user ? buildDemoDashboard(user) : null), [demo, user])
  const dashboard = demoDashboard ?? (remote && remote.userId === userId ? remote.dashboard : null)
  const failed = !demo && failure?.userId === userId
  const status: LoadStatus = !userId ? 'idle' : failed ? 'error' : dashboard ? 'ready' : 'loading'

  const value = useMemo(
    () => ({ dashboard, status, error: failed ? failure!.message : null, reload }),
    [dashboard, status, failed, failure, reload],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard deve ser usado dentro de DashboardProvider.')
  }
  return context
}

/** Dados do painel já carregados; o AppLayout só renderiza as telas depois disso. */
export function useDashboardData() {
  const { dashboard } = useDashboard()
  if (!dashboard) {
    throw new Error('useDashboardData exige o painel carregado.')
  }
  return dashboard
}
