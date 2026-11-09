import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

type ComingSoonState = {
  title: string
  description: string
}

type ToastState = {
  message: string
}

type FeedbackContextValue = {
  showComingSoon: (title: string, description?: string) => void
  showToast: (message: string) => void
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

const defaultDescription =
  'Esta funcionalidade está reservada e será construída nas próximas fases da Universidade Corporativa.'

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showComingSoon = useCallback((title: string, description = defaultDescription) => {
    setComingSoon({ title, description })
  }, [])

  const showToast = useCallback((message: string) => {
    setToast({ message })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const value = useMemo(
    () => ({ showComingSoon, showToast }),
    [showComingSoon, showToast],
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Modal
        open={Boolean(comingSoon)}
        onClose={() => setComingSoon(null)}
        title={comingSoon?.title ?? 'Em breve'}
      >
        <p className="text-sm leading-6 text-muted">{comingSoon?.description}</p>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setComingSoon(null)}>Entendi</Button>
        </div>
      </Modal>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 px-4">
          <div className="soaco-toast pointer-events-auto rounded-full border border-line bg-[var(--soaco-popover-glass)] px-5 py-3 text-sm font-medium text-ink shadow-float backdrop-blur-xl">
            {toast.message}
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback deve ser usado dentro de FeedbackProvider.')
  }
  return context
}
