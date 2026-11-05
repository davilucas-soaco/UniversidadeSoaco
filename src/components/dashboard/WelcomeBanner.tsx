import { currentUser } from '@/data/collaborators'
import { dashboardStats } from '@/data/dashboard'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function WelcomeBanner() {
  const inProgress = dashboardStats.inProgressCourses
  const caption =
    inProgress > 0
      ? `Você tem ${inProgress} cursos em andamento. Continue aprendendo hoje.`
      : `Você já concluiu ${dashboardStats.completedCourses} cursos. Continue evoluindo hoje.`

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-hero text-ivory shadow-card">
      <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-[#7aa2ff]/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 -bottom-24 h-56 w-56 rounded-full bg-golden/20 blur-3xl" />
      <div className="steel-grid absolute inset-0 opacity-15" />

      <div id="tour-welcome" className="relative grid items-center gap-6 px-7 py-7 md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] md:px-9 md:py-8">
        <div>
          <p className="text-sm text-ivory/70">
            {greeting()}, {currentUser.firstName} 👋
          </p>
          <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight md:text-[2.35rem] md:leading-tight">
            Vamos construir o próximo passo da sua jornada.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-ivory/75 md:text-[15px]">{caption}</p>
        </div>

        <div className="relative hidden h-36 md:block">
          <div className="absolute top-2 right-6 h-28 w-28 rotate-[18deg] rounded-[1.6rem] bg-gradient-to-br from-[#9ec5ff]/70 to-[#3d4ea8]/80 shadow-float" />
          <div className="absolute top-10 right-20 h-20 w-20 -rotate-12 rounded-[1.3rem] bg-gradient-to-br from-golden/80 to-[#8a6d3d]/70 shadow-panel" />
          <div className="absolute right-2 bottom-1 max-w-[150px] text-right text-xs leading-5 text-ivory/55 italic">
            “Conhecimento que transforma.”
          </div>
        </div>
      </div>
    </section>
  )
}
