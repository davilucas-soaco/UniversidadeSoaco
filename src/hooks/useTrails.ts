import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCatalog } from '@/context/CatalogContext'
import { useDemoMode } from '@/context/DemoModeContext'
import { api } from '@/lib/api'
import type { LearnerTrail } from '@/types'

/** Trilhas destinadas ao colaborador; recarrega junto com o catálogo de cursos. */
export function useTrails() {
  const { user } = useAuth()
  const { courses } = useCatalog()
  const { enabled: demo } = useDemoMode()
  const userId = user?.id ?? null
  const [loaded, setLoaded] = useState<{ userId: string; trails: LearnerTrail[] } | null>(null)

  useEffect(() => {
    if (!userId || demo) return
    const controller = new AbortController()
    api<{ trails: LearnerTrail[] }>('/me/trilhas', { signal: controller.signal })
      .then((data) => setLoaded({ userId, trails: data.trails }))
      .catch(() => undefined)
    return () => controller.abort()
  }, [userId, demo, courses])

  const ready = demo || (loaded !== null && loaded.userId === userId)
  return { trails: !demo && loaded && loaded.userId === userId ? loaded.trails : [], ready }
}
