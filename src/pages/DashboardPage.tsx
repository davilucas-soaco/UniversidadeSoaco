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
        <div className="flex flex-col gap-8 lg:col-span-8">
          <LearningEvolution />
          <MyCoursesSection />
        </div>
        <div className="flex flex-col gap-8 lg:col-span-4">
          <RankingCard />
          <DeadlinesCard />
        </div>
      </div>
    </div>
  )
}
