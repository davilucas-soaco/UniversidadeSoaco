/** TEMPORÁRIO — liga/desliga os dados de demonstração (ver src/demo). */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'

const STORAGE_KEY = 'universidade-soaco.demo-mode'

type DemoModeContextValue = {
  enabled: boolean
  toggle: () => void
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null)

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useLocalStorageState<boolean>(STORAGE_KEY, false)
  const toggle = useCallback(() => setEnabled((value) => !value), [setEnabled])
  const value = useMemo(() => ({ enabled, toggle }), [enabled, toggle])
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
}

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (!context) {
    throw new Error('useDemoMode deve ser usado dentro de DemoModeProvider.')
  }
  return context
}
