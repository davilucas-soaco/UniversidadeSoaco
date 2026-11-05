import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Award, BookCheck, PlayCircle } from 'lucide-react'
import { currentUser } from '@/data/collaborators'
import { dashboardStats } from '@/data/dashboard'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function WelcomeBanner() {
  const navigate = useNavigate()

  const scrollToPerformance = () => {
    const el = document.getElementById('tour-performance')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
      {/* Lado esquerdo: Saudação e Nome do usuário */}
      <div
        id="tour-welcome"
        className="flex min-w-[200px] flex-col justify-between py-1 lg:min-w-[220px] xl:min-w-[250px]"
      >
        <div>
          <p className="text-xs font-medium text-muted">{greeting()},</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink md:text-4xl md:leading-tight">
            {currentUser.firstName}
            <br />
            {currentUser.name.split(' ')[1] || 'Lucas'}
          </h1>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-[#7c5cfc]/30 bg-[#7c5cfc]/20 px-3 py-0.5 text-xs font-semibold text-[#c4b5fd]">
            {currentUser.sector}
          </span>
        </div>
      </div>

      {/* Lado direito: Cards de indicadores maiores no padrão de referência */}
      <div id="tour-indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Pontuação */}
        <div
          className="flex min-h-[145px] flex-col justify-between rounded-[24px] border border-line/70 bg-elevated p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-fill text-muted">
                <Award size={16} strokeWidth={1.8} />
              </div>
              <span className="text-xs font-semibold text-muted">Pontuação acumulada</span>
            </div>
            <button
              type="button"
              onClick={scrollToPerformance}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-fill text-ink transition hover:bg-white/15"
              aria-label="Ver desempenho"
            >
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {dashboardStats.points}
              </span>
              <span className="text-sm font-medium text-muted">pts</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <span className="font-bold text-emerald-400">+12%</span>
              <span>em relação ao mês anterior</span>
            </p>
          </div>
        </div>

        {/* Card 2: Cursos Concluídos */}
        <div
          className="flex min-h-[145px] flex-col justify-between rounded-[24px] border border-line/70 bg-elevated p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-fill text-muted">
                <BookCheck size={16} strokeWidth={1.8} />
              </div>
              <span className="text-xs font-semibold text-muted">Cursos concluídos</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/conteudos')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-fill text-ink transition hover:bg-white/15"
              aria-label="Ver cursos concluídos"
            >
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {dashboardStats.completedCourses}
              </span>
              <span className="text-sm font-medium text-muted">cursos</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <span className="font-bold text-emerald-400">+8%</span>
              <span>em relação ao mês anterior</span>
            </p>
          </div>
        </div>

        {/* Card 3: Em Andamento — Card destacado em verde-limão conforme inspiração */}
        <div
          className="flex min-h-[145px] flex-col justify-between rounded-[24px] bg-[#d2fc38] p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 sm:col-span-2 sm:p-6 lg:col-span-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black">
                <PlayCircle size={17} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-bold text-black/85">Em andamento</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/conteudos')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:bg-black/80"
              aria-label="Ver cursos em andamento"
            >
              <ArrowUpRight size={15} strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
                {dashboardStats.inProgressCourses}
              </span>
              <span className="text-sm font-bold text-black/75">cursos ativos</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-black/70">
              <span className="font-extrabold text-black">{dashboardStats.pendingTrainings}</span>
              <span>treinamentos pendentes</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
