import { ContinueLearning } from '@/components/dashboard/ContinueLearning'
import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { RankingPreview } from '@/components/dashboard/RankingPreview'
import { RecentProjects } from '@/components/dashboard/RecentProjects'
import { SideActivity } from '@/components/dashboard/SideActivity'
import { UpcomingPanel } from '@/components/dashboard/UpcomingPanel'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { Button } from '@/components/ui/Button'
import { useOnboarding } from '@/context/OnboardingContext'
import { GraduationCap } from 'lucide-react'

export function DashboardPage() {
  const { start } = useOnboarding()

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <WelcomeBanner />

      {/* Seção principal: Gráfico + Próximos + Calendário — 3 colunas */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.85fr)_minmax(240px,0.7fr)]">
        <PerformanceChart />
        <UpcomingPanel />
        <MiniCalendar />
      </div>

      {/* Cursos Recentes — largura total */}
      <RecentProjects />

      {/* Seção inferior: Continuar Aprendendo + Ranking */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <ContinueLearning />
        <RankingPreview />
      </div>

      <SideActivity />

      <div className="flex justify-center md:hidden">
        <Button variant="outline" icon={<GraduationCap size={16} />} onClick={start}>
          Ver tutorial novamente
        </Button>
      </div>
    </div>
  )
}
