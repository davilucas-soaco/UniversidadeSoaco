import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { CourseReviews } from '@/types'

/** unpublished = curso ainda não está no banco (ex.: cadastrado só neste navegador ou dados de demonstração). */
export type ReviewsStatus = 'loading' | 'ready' | 'unpublished' | 'error'

export function useCourseReviews(courseId: string) {
  const [data, setData] = useState<CourseReviews | null>(null)
  const [status, setStatus] = useState<ReviewsStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    api<{ reviews: CourseReviews }>(`/cursos/${encodeURIComponent(courseId)}/avaliacoes`, { signal: controller.signal })
      .then((result) => {
        setData(result.reviews)
        setStatus('ready')
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        if (caught instanceof ApiError && caught.status === 404) {
          setStatus('unpublished')
          return
        }
        setError(caught instanceof Error ? caught.message : 'Não foi possível carregar as avaliações.')
        setStatus('error')
      })
    return () => controller.abort()
  }, [courseId])

  const submit = useCallback(
    async (rating: number, comment: string) => {
      const result = await api<{ reviews: CourseReviews }>(`/cursos/${encodeURIComponent(courseId)}/avaliacoes`, {
        method: 'PUT',
        body: { rating, comment: comment.trim() || null },
      })
      setData(result.reviews)
    },
    [courseId],
  )

  return { data, status, error, submit }
}
