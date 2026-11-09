import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useDemoMode } from '@/context/DemoModeContext'
import { buildDemoCourses } from '@/demo'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { api } from '@/lib/api'
import { summarizeCourses } from '@/lib/courseStats'
import { rememberDocument } from '@/lib/documents'
import { parseVideoUrl, videoThumbnailUrl } from '@/lib/videoEmbed'
import type { AuthoredCourse, AuthoredDocument, ContentKind, Course, VideoProvider } from '@/types'

const STORAGE_KEY = 'universidade-soaco.authored-courses'

type CreateCourseInput = {
  title: string
  kind: ContentKind
  videoUrl?: string
  videoProvider?: VideoProvider
  embedUrl?: string
  files?: File[]
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

type CatalogContextValue = {
  authored: AuthoredCourse[]
  /** Cursos destinados ao usuário logado (por ele, pelo setor ou pelas classes). */
  courses: Course[]
  status: LoadStatus
  error: string | null
  reload: () => void
  createCourse: (input: CreateCourseInput) => Course
  getCourse: (id: string) => Course | undefined
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

function toCourse(item: AuthoredCourse): Course {
  const isVideo = item.kind === 'video'
  const video = isVideo && item.videoUrl ? parseVideoUrl(item.videoUrl) : null
  return {
    id: item.id,
    title: item.title,
    category: 'Institucional',
    description: isVideo
      ? 'Curso em vídeo cadastrado na gestão de conteúdos.'
      : 'Materiais de apoio cadastrados na gestão de conteúdos.',
    durationHours: 1,
    points: 5,
    status: 'pendente',
    progress: 0,
    cover: {
      accent: 'navy',
      icon: isVideo ? 'book' : 'clipboard',
      image: video ? videoThumbnailUrl(video) : '',
    },
    instructorId: 'ins-vasconcelos',
    lessonsCount: isVideo ? 1 : Math.max(1, item.documents.length),
    moduleTitles: [isVideo ? 'Conteúdo em vídeo' : 'Materiais'],
    objectives: ['Acompanhar o conteúdo cadastrado pela gestão.'],
    isNew: true,
    authored: true,
    contentKind: item.kind,
    videoUrl: item.videoUrl,
    videoProvider: item.videoProvider,
    embedUrl: item.embedUrl,
    documents: item.documents,
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [authored, setAuthored] = useLocalStorageState<AuthoredCourse[]>(STORAGE_KEY, [])
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

  const createCourse = useCallback(
    (input: CreateCourseInput) => {
      const documents: AuthoredDocument[] = (input.files ?? []).map((file) => {
        const id = `doc-${crypto.randomUUID()}`
        rememberDocument(id, file)
        return { id, name: file.name, mime: file.type || 'application/octet-stream', size: file.size }
      })

      const item: AuthoredCourse = {
        id: `curso-${crypto.randomUUID()}`,
        title: input.title.trim(),
        kind: input.kind,
        videoUrl: input.videoUrl,
        videoProvider: input.videoProvider,
        embedUrl: input.embedUrl,
        documents,
        createdAt: new Date().toISOString(),
      }

      setAuthored((current) => [item, ...current])
      return toCourse(item)
    },
    [setAuthored],
  )

  const getCourse = useCallback(
    (id: string) => {
      const assigned = courses.find((course) => course.id === id)
      if (assigned) return assigned
      const authoredItem = authored.find((item) => item.id === id)
      return authoredItem ? toCourse(authoredItem) : undefined
    },
    [authored, courses],
  )

  const value = useMemo(
    () => ({
      authored,
      courses,
      status,
      error: !demo && failure?.userId === userId ? failure.message : null,
      reload,
      createCourse,
      getCourse,
    }),
    [authored, courses, status, demo, failure, userId, reload, createCourse, getCourse],
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
