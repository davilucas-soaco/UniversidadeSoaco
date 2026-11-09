import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpDown,
  Award,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  LayoutGrid,
  List,
  Search,
  Timer,
  TrendingUp,
  X,
} from 'lucide-react'
import { CourseCard } from '@/components/content/CourseCard'
import { useCatalog, useCourseSummary } from '@/context/CatalogContext'
import { useDashboardData } from '@/context/DashboardContext'
import { useFeedback } from '@/context/FeedbackContext'
import { instructorById } from '@/data/instructors'
import { dueLabel, formatMinutes } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CourseStatus } from '@/types'

type Filter = 'todos' | CourseStatus | 'obrigatorios'
type SortKey = 'recentes' | 'progresso' | 'duracao' | 'pontuacao'
type ViewMode = 'grid' | 'list'

const PAGE_SIZE = 16

const sortLabels: Record<SortKey, string> = {
  recentes: 'Mais recentes',
  progresso: 'Progresso',
  duracao: 'Duração',
  pontuacao: 'Pontuação',
}

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function CoursesPage() {
  const navigate = useNavigate()
  const { showComingSoon } = useFeedback()
  const { courses } = useCatalog()
  const summary = useCourseSummary()
  const { annualTargetHours } = useDashboardData()
  const courseCategories = useMemo(
    () => Array.from(new Set(courses.map((course) => course.category))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [courses],
  )
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [category, setCategory] = useState('Todas')
  const [sort, setSort] = useState<SortKey>('recentes')
  const [view, setView] = useState<ViewMode>('grid')
  const [requestedPage, setPage] = useState(1)

  const counts = useMemo(
    () => ({
      todos: courses.length,
      em_andamento: courses.filter((c) => c.status === 'em_andamento').length,
      concluido: courses.filter((c) => c.status === 'concluido').length,
      pendente: courses.filter((c) => c.status === 'pendente').length,
      obrigatorios: courses.filter((c) => c.mandatory && c.status !== 'concluido').length,
    }),
    [courses],
  )

  const filtered = useMemo(() => {
    const value = normalize(query.trim())
    const list = courses.filter((course) => {
      const matchesFilter =
        filter === 'todos'
          ? true
          : filter === 'obrigatorios'
            ? Boolean(course.mandatory) && course.status !== 'concluido'
            : course.status === filter
      const matchesCategory = category === 'Todas' || course.category === category
      const matchesQuery =
        !value ||
        normalize(course.title).includes(value) ||
        normalize(course.category).includes(value) ||
        normalize(instructorById[course.instructorId]?.name ?? '').includes(value)
      return matchesFilter && matchesCategory && matchesQuery
    })

    const sorted = [...list]
    if (sort === 'progresso') sorted.sort((a, b) => b.progress - a.progress)
    if (sort === 'duracao') sorted.sort((a, b) => b.durationHours - a.durationHours)
    if (sort === 'pontuacao') sorted.sort((a, b) => b.points - a.points)
    return sorted
  }, [category, courses, filter, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(filtered.length, page * PAGE_SIZE)

  // Qualquer mudança de filtro volta para a primeira página.
  const changeQuery = (value: string) => {
    setQuery(value)
    setPage(1)
  }
  const changeFilter = (value: Filter) => {
    setFilter(value)
    setPage(1)
  }
  const changeCategory = (value: string) => {
    setCategory(value)
    setPage(1)
  }
  const changeSort = (value: SortKey) => {
    setSort(value)
    setPage(1)
  }

  const inProgress = summary.inProgress
  const remainingMinutes = Math.round(
    inProgress.reduce((sum, c) => sum + c.durationHours * 60 * (1 - c.progress / 100), 0),
  )
  const inProgressAverage = Math.round(
    inProgress.reduce((sum, c) => sum + c.progress, 0) / Math.max(1, inProgress.length),
  )
  const nextDeadline = summary.deadlines[0]
  const annualPercent = Math.min(100, Math.round((summary.studiedHours / Math.max(1, annualTargetHours)) * 100))

  const tabs: { value: Filter; label: string; dot?: boolean }[] = [
    { value: 'todos', label: `Todos (${counts.todos})` },
    { value: 'em_andamento', label: `Em andamento (${counts.em_andamento})` },
    { value: 'concluido', label: `Concluídos (${counts.concluido})` },
    { value: 'pendente', label: `Pendentes (${counts.pendente})` },
    { value: 'obrigatorios', label: `Obrigatórios (${counts.obrigatorios})`, dot: true },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col pb-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex max-w-3xl flex-col">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
              Universidade Só Aço
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-display text-[11px] font-medium tracking-wider text-muted uppercase">
              Trimestre atual
            </span>
          </div>
          <h1 className="font-display text-[32px] leading-10 font-bold tracking-tight text-ink">Meus cursos</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Continue seus cursos, conclua os obrigatórios e explore novos conteúdos.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => changeFilter('concluido')}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-elevated px-4 py-2.5 font-display text-xs font-medium text-ink shadow-sm transition-colors hover:border-accent/40 hover:bg-fill"
          >
            <Award size={18} className="text-accent" />
            Certificados
          </button>
          <button
            type="button"
            onClick={() => showComingSoon('Catálogo de cursos', 'O catálogo aberto para inscrição será liberado na próxima fase.')}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-display text-xs font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-all hover:bg-accent-strong"
          >
            <Compass size={18} />
            Catálogo
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-elevated p-4 shadow-lg transition-all hover:border-accent/40">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-[11px] font-semibold tracking-wider text-muted uppercase">Em andamento</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-fill text-accent">
              <Timer size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl leading-8 font-bold text-ink">{inProgress.length}</span>
              <span className="text-xs text-muted">ativos</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-accent">
              <Clock3 size={14} />~{formatMinutes(remainingMinutes)} restantes
            </p>
          </div>
          <div className="absolute right-0 bottom-0 left-0 h-1 bg-canvas">
            <div className="h-full rounded-full bg-accent" style={{ width: `${inProgressAverage}%` }} />
          </div>
        </div>

        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-elevated p-4 shadow-lg transition-all hover:border-accent-2/40">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-[11px] font-semibold tracking-wider text-muted uppercase">Certificados</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent-2/30 bg-accent-2/15 text-accent-2">
              <BadgeCheck size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl leading-8 font-bold text-ink">{counts.concluido}</span>
              <span className="text-xs text-muted">emitidos</span>
            </div>
            <button
              type="button"
              onClick={() => changeFilter('concluido')}
              className="mt-1 flex items-center gap-1 font-display text-xs font-medium text-accent-2 hover:underline"
            >
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          <div className="absolute right-0 bottom-0 left-0 h-1 bg-canvas">
            <div className="h-full w-full rounded-full bg-accent-2" />
          </div>
        </div>

        {nextDeadline ? (
          <button
            type="button"
            onClick={() => navigate(`/aula/${nextDeadline.id}`)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-danger/25 bg-danger/5 p-4 text-left shadow-lg transition-all hover:border-danger/50"
          >
            <div className="mb-3 flex w-full items-center justify-between">
              <span className="font-display text-[11px] font-bold tracking-wider text-[#ff6b6b] uppercase">Urgente</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#ff6b6b]/40 bg-[#401115] text-[#ff6b6b]">
                <CalendarClock size={18} />
              </div>
            </div>
            <div>
              <span className="line-clamp-1 font-display text-xl leading-7 font-bold text-[#ff6b6b]">{nextDeadline.title}</span>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-accent">
                <Timer size={14} className="text-[#ff6b6b]" />
                {dueLabel(nextDeadline.dueDate!)}
              </p>
            </div>
            <div className="absolute right-0 bottom-0 left-0 h-1 bg-canvas">
              <div className="h-full w-11/12 rounded-full bg-gradient-to-r from-[#ff6b6b] to-accent" />
            </div>
          </button>
        ) : (
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-elevated p-4 shadow-lg">
            <span className="font-display text-[11px] font-semibold tracking-wider text-muted uppercase">Prazos</span>
            <span className="font-display text-xl font-bold text-ink">Tudo em dia</span>
          </div>
        )}

        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-elevated p-4 shadow-lg transition-all hover:border-accent/40">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-[11px] font-semibold tracking-wider text-muted uppercase">Meta anual</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-fill text-accent">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl leading-8 font-bold text-ink">{annualPercent}%</span>
              <span className="font-display text-xs font-medium text-muted">
                {summary.studiedHours}h / {annualTargetHours}h
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-line/60 bg-canvas">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong" style={{ width: `${annualPercent}%` }} />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 left-0 h-1 bg-canvas">
            <div className="h-full rounded-full bg-accent" style={{ width: `${annualPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-line bg-elevated p-4 shadow-lg">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <label className="flex max-w-xl flex-1 items-center rounded-xl border border-line bg-fill px-4 py-2 shadow-inner transition-colors focus-within:border-accent/60">
            <Search size={20} className="mr-2 text-muted" />
            <input
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Buscar curso, categoria ou instrutor..."
              className="w-full bg-transparent text-xs text-ink placeholder:text-muted/60 focus:outline-none"
            />
            {query ? (
              <button type="button" aria-label="Limpar busca" onClick={() => changeQuery('')} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            ) : null}
          </label>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative inline-block text-left">
              <select
                value={category}
                onChange={(event) => changeCategory(event.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-line bg-fill py-2.5 pr-9 pl-4 font-display text-xs font-semibold text-ink shadow-sm transition-colors hover:border-accent/40 focus:outline-none"
              >
                <option value="Todas">Todas</option>
                {courseCategories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
            </div>
            <div className="relative inline-block text-left">
              <select
                value={sort}
                onChange={(event) => changeSort(event.target.value as SortKey)}
                className="cursor-pointer appearance-none rounded-xl border border-line bg-fill py-2.5 pr-9 pl-4 font-display text-xs font-semibold text-ink shadow-sm transition-colors hover:border-accent/40 focus:outline-none"
              >
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <option key={key} value={key}>{sortLabels[key]}</option>
                ))}
              </select>
              <ArrowUpDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
            </div>
            <div className="hidden h-6 w-px bg-line sm:block" />
            <div className="flex items-center rounded-xl border border-line bg-fill p-1 shadow-inner">
              <button
                type="button"
                title="Visualização em grade"
                onClick={() => setView('grid')}
                className={cn('flex items-center justify-center rounded-lg p-1.5 transition-all', view === 'grid' ? 'bg-elevated text-accent shadow-sm' : 'text-muted hover:text-ink')}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                title="Visualização em lista"
                onClick={() => setView('list')}
                className={cn('flex items-center justify-center rounded-lg p-1.5 transition-all', view === 'list' ? 'bg-elevated text-accent shadow-sm' : 'text-muted hover:text-ink')}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeFilter(tab.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-display text-xs whitespace-nowrap transition-colors',
                filter === tab.value
                  ? 'border-accent bg-accent font-semibold text-accent-ink shadow-sm'
                  : 'border-transparent text-muted hover:border-line hover:bg-fill hover:text-ink',
              )}
            >
              {tab.dot ? <span className="h-2 w-2 rounded-full bg-[#ff6b6b]" /> : null}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {pageItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">
          {courses.length === 0
            ? 'Nenhum curso foi destinado a você ainda.'
            : 'Nenhum curso encontrado com esses filtros.'}
        </div>
      ) : (
        <div className={cn(view === 'grid' ? 'grid grid-cols-1 gap-3 overflow-visible px-1 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-1')}>
          {pageItems.map((course) => (
            <CourseCard key={course.id} course={course} view={view} onOpen={() => navigate(`/aula/${course.id}`)} />
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-elevated p-4 shadow-lg sm:flex-row">
        <div className="text-xs text-muted">
          Exibindo <span className="font-bold text-ink">{rangeStart}-{rangeEnd}</span> de{' '}
          <span className="font-bold text-ink">{filtered.length}</span> cursos
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-xl border border-line bg-fill p-2 text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => setPage(number)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl font-display text-xs transition-colors',
                number === page
                  ? 'bg-accent font-bold text-accent-ink shadow-md'
                  : 'border border-line bg-fill text-ink hover:border-accent/40',
              )}
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            aria-label="Próxima página"
            disabled={page === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="rounded-xl border border-line bg-fill p-2 text-ink transition-colors hover:border-accent/40 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
