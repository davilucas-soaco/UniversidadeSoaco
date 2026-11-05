import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ONBOARDING_STORAGE_KEY } from '@/data/onboarding'

type OnboardingContextValue = {
  token: number
  start: () => void
  complete: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
    if (completed) return

    const timeoutId = window.setTimeout(() => setToken(1), 800)
    return () => window.clearTimeout(timeoutId)
  }, [])

  const start = useCallback(() => {
    setToken((current) => current + 1)
  }, [])

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
  }, [])

  const value = useMemo(() => ({ token, start, complete }), [token, start, complete])

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding deve ser usado dentro de OnboardingProvider.')
  }
  return context
}
