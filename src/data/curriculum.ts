import type { Course, CourseModule, Lesson } from '@/types'

const lessonTemplates = [
  'Introdução: {m}',
  'Conceitos de {m}',
  '{m} na prática',
  'Estudo de caso: {m}',
  'Erros comuns em {m}',
  'Checklist: {m}',
  'Revisão de {m}',
]

const moduleSummaries = [
  'Base conceitual para os módulos seguintes.',
  'Aplicação prática com exemplos da operação.',
  'Aprofundamento com estudos de caso reais.',
  'Consolidação e verificação de aprendizagem.',
  'Etapa final com avaliação prática.',
]

function hash(text: string) {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

function lowerFirst(text: string) {
  return text.charAt(0).toLocaleLowerCase('pt-BR') + text.slice(1)
}

/**
 * Gera o currículo de um curso de forma determinística a partir de
 * `moduleTitles`, `lessonsCount` e `progress`. Cada módulo recebe aulas em
 * vídeo, uma apostila e um quiz; o progresso define quais itens estão concluídos.
 */
export function buildCurriculum(course: Course): CourseModule[] {
  if (course.authored) {
    if (course.contentKind === 'video') {
      return [
        {
          id: `${course.id}-m1`,
          title: '1. Conteúdo em vídeo',
          summary: 'Vídeo principal do curso, exibido no player da plataforma.',
          lessons: [
            {
              id: `${course.id}-video`,
              title: course.title,
              kind: 'video',
              durationMin: 0,
              done: false,
            },
          ],
        },
      ]
    }

    const documents = course.documents ?? []
    return [
      {
        id: `${course.id}-m1`,
        title: '1. Materiais',
        summary: 'Documentos cadastrados para este curso.',
        lessons: documents.length
          ? documents.map((doc) => ({
              id: doc.id,
              title: doc.name,
              kind: 'pdf' as const,
              pages: 1,
              done: false,
            }))
          : [
              {
                id: `${course.id}-doc`,
                title: course.title,
                kind: 'pdf' as const,
                pages: 1,
                done: false,
              },
            ],
      },
    ]
  }

  const moduleCount = Math.max(1, course.moduleTitles.length)
  const base = Math.floor(course.lessonsCount / moduleCount)
  const extra = course.lessonsCount % moduleCount

  const modules: CourseModule[] = course.moduleTitles.map((title, moduleIndex) => {
    const videoCount = Math.max(1, base + (moduleIndex < extra ? 1 : 0))
    const lessons: Lesson[] = []

    for (let i = 0; i < videoCount; i += 1) {
      const template = lessonTemplates[(i + moduleIndex) % lessonTemplates.length]
      const id = `${course.id}-m${moduleIndex + 1}-a${i + 1}`
      const startsWithModule = template.startsWith('{m}')
      lessons.push({
        id,
        title: template.replace('{m}', startsWithModule || i === 0 ? title : lowerFirst(title)),
        kind: 'video',
        durationMin: 12 + (hash(id) % 21),
        done: false,
      })
    }

    lessons.push({
      id: `${course.id}-m${moduleIndex + 1}-pdf`,
      title: `Apostila: ${title}`,
      kind: 'pdf',
      pages: 8 + (hash(title) % 14),
      mandatory: true,
      done: false,
    })

    lessons.push({
      id: `${course.id}-m${moduleIndex + 1}-quiz`,
      title: 'Quiz de fixação',
      kind: 'quiz',
      questions: 8 + (hash(`${course.id}${moduleIndex}`) % 5),
      points: 50 + (moduleIndex % 3) * 25,
      done: false,
    })

    return {
      id: `${course.id}-m${moduleIndex + 1}`,
      title: `${moduleIndex + 1}. ${title}`,
      summary: moduleSummaries[Math.min(moduleIndex, moduleSummaries.length - 1)],
      lessons,
    }
  })

  const total = modules.reduce((sum, module) => sum + module.lessons.length, 0)
  let remainingDone = Math.round((course.progress / 100) * total)
  for (const module of modules) {
    for (const lesson of module.lessons) {
      if (remainingDone <= 0) break
      lesson.done = true
      remainingDone -= 1
    }
  }

  return modules
}

export type CurriculumStats = {
  total: number
  done: number
  remaining: number
  percent: number
  currentModuleIndex: number
  currentLesson: Lesson | null
  totalMinutes: number
}

export function curriculumStats(modules: CourseModule[]): CurriculumStats {
  const lessons = modules.flatMap((module) => module.lessons)
  const total = lessons.length
  const done = lessons.filter((lesson) => lesson.done).length
  const currentLesson = lessons.find((lesson) => !lesson.done) ?? lessons[lessons.length - 1] ?? null
  const currentModuleIndex = Math.max(
    0,
    modules.findIndex((module) => module.lessons.some((lesson) => lesson.id === currentLesson?.id)),
  )
  const totalMinutes = lessons.reduce((sum, lesson) => sum + (lesson.durationMin ?? 0), 0)

  return {
    total,
    done,
    remaining: total - done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    currentModuleIndex,
    currentLesson,
    totalMinutes,
  }
}

export function moduleMinutes(module: CourseModule) {
  return module.lessons.reduce((sum, lesson) => sum + (lesson.durationMin ?? 0), 0)
}

/** Índice (1-based) do módulo em que o colaborador está num curso. */
export function currentModuleOf(course: Course) {
  return curriculumStats(buildCurriculum(course)).currentModuleIndex + 1
}

/** Módulo é considerado bloqueado quando o anterior ainda não foi concluído. */
export function isModuleLocked(modules: CourseModule[], index: number) {
  if (index === 0) return false
  return modules[index - 1].lessons.some((lesson) => !lesson.done)
}
