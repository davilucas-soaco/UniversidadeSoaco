import { DeadlinesCard } from '@/components/dashboard/DeadlinesCard'
import { HeroBanner } from '@/components/dashboard/HeroBanner'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { LearningEvolution } from '@/components/dashboard/LearningEvolution'
import { MyCoursesSection } from '@/components/dashboard/MyCoursesSection'
import { RankingCard } from '@/components/dashboard/RankingCard'

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <HeroBanner />
      <KpiCards />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <LearningEvolution />
        </div>
        {/* No desktop o ranking não define a altura da linha: ocupa a altura da Evolução e rola por dentro. */}
        <div className="relative lg:col-span-4">
          <RankingCard className="lg:absolute lg:inset-0" />
        </div>
        <div className="lg:col-span-8">
          <MyCoursesSection />
        </div>
        <div className="lg:col-span-4">
          <DeadlinesCard />
        </div>
      </div>
    </div>
  )
}
