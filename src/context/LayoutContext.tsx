import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'

type LayoutContextValue = {
  mobileOpen: boolean
  openMobile: () => void
  closeMobile: () => void
  toggleMobile: () => void
  collapsed: boolean
  toggleCollapsed: () => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorageState('universidade-soaco.sidebar.dock', true)

  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const toggleMobile = useCallback(() => setMobileOpen((value) => !value), [])
  const toggleCollapsed = useCallback(() => setCollapsed((value) => !value), [setCollapsed])

  const value = useMemo(
    () => ({ mobileOpen, openMobile, closeMobile, toggleMobile, collapsed, toggleCollapsed }),
    [mobileOpen, openMobile, closeMobile, toggleMobile, collapsed, toggleCollapsed],
  )

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout deve ser usado dentro de LayoutProvider.')
  }
  return context
}
