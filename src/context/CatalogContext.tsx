import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useDemoMode } from '@/context/DemoModeContext'
import { buildDemoCourses } from '@/demo'
import { api } from '@/lib/api'
import { summarizeCourses } from '@/lib/courseStats'
import type { Course } from '@/types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

type CatalogContextValue = {
  /** Cursos destinados ao usuário logado (por ele, pelo setor ou pelas classes). */
  courses: Course[]
  status: LoadStatus
  error: string | null
  reload: () => void
  getCourse: (id: string) => Course | undefined
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [remote, setRemote] = useState<{ userId: string; courses: Course[] } | null>(null)
  const [failure, setFailure] = useState<{ userId: string; message: string } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    api<{ courses: Course[] }>('/me/cursos', { signal: controller.signal })
      .then((data) => {
        setRemote({ userId, courses: data.courses })
        setFailure(null)
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        setFailure({ userId, message: caught instanceof Error ? caught.message : 'Erro ao carregar os cursos.' })
      })
    return () => controller.abort()
  }, [userId, attempt])

  const { enabled: demo } = useDemoMode()
  const courses = useMemo(
    () => (demo ? buildDemoCourses() : remote && remote.userId === userId ? remote.courses : []),
    [demo, remote, userId],
  )

  const status: LoadStatus = !userId
    ? 'idle'
    : demo
      ? 'ready'
      : failure?.userId === userId
        ? 'error'
        : remote?.userId === userId
          ? 'ready'
          : 'loading'

  const reload = useCallback(() => {
    setFailure(null)
    setAttempt((value) => value + 1)
  }, [])

  const getCourse = useCallback((id: string) => courses.find((course) => course.id === id), [courses])

  const value = useMemo(
    () => ({
      courses,
      status,
      error: !demo && failure?.userId === userId ? failure.message : null,
      reload,
      getCourse,
    }),
    [courses, status, demo, failure, userId, reload, getCourse],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error('useCatalog deve ser usado dentro de CatalogProvider.')
  }
  return context
}

export function useCourseSummary() {
  const { courses } = useCatalog()
  return useMemo(() => summarizeCourses(courses), [courses])
}
