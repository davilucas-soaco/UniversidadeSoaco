import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type OnboardingContextValue = {
  /** Incrementa a cada pedido manual de tutorial (botão "Ver tutorial"). */
  token: number
  start: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(0)

  const start = useCallback(() => {
    setToken((current) => current + 1)
  }, [])

  const value = useMemo(() => ({ token, start }), [token, start])

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding deve ser usado dentro de OnboardingProvider.')
  }
  return context
}
