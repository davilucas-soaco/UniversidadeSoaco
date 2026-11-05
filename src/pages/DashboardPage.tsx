import { ContinueLearning } from '@/components/dashboard/ContinueLearning'
import { IndicatorCards } from '@/components/dashboard/IndicatorCards'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { RankingPreview } from '@/components/dashboard/RankingPreview'
import { SideActivity } from '@/components/dashboard/SideActivity'
import { UpcomingPanel } from '@/components/dashboard/UpcomingPanel'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { Button } from '@/components/ui/Button'
import { useOnboarding } from '@/context/OnboardingContext'
import { GraduationCap } from 'lucide-react'

export function DashboardPage() {
  const { start } = useOnboarding()

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
      <WelcomeBanner />
      <IndicatorCards />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <PerformanceChart />
        <UpcomingPanel />
      </div>

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
