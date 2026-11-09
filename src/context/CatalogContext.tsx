import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { courseById as seedById, courses as seedCourses } from '@/data/courses'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { rememberDocument } from '@/lib/documents'
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

type CatalogContextValue = {
  authored: AuthoredCourse[]
  courses: Course[]
  createCourse: (input: CreateCourseInput) => Course
  getCourse: (id: string) => Course | undefined
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

function toCourse(item: AuthoredCourse): Course {
  const isVideo = item.kind === 'video'
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
      image: '',
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
  const [authored, setAuthored] = useLocalStorageState<AuthoredCourse[]>(STORAGE_KEY, [])

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

  const courses = useMemo(() => [...authored.map(toCourse), ...seedCourses], [authored])

  const getCourse = useCallback(
    (id: string) => {
      const authoredItem = authored.find((item) => item.id === id)
      if (authoredItem) return toCourse(authoredItem)
      return seedById[id]
    },
    [authored],
  )

  const value = useMemo(
    () => ({ authored, courses, createCourse, getCourse }),
    [authored, courses, createCourse, getCourse],
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
