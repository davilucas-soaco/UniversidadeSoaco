import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'
import { LayoutProvider } from '@/context/LayoutContext'

export function AppLayout() {
  return (
    <LayoutProvider>
      <div className="soaco-shell">
        <div className="soaco-ambient" aria-hidden />
        <div className="soaco-frame">
          <Sidebar />
          <section className="soaco-main">
            <div data-soaco-scroll className="relative min-h-0 flex-1 overflow-y-auto">
              <Header />
              <main className="relative z-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Outlet />
              </main>
            </div>
          </section>
        </div>
      </div>
      <OnboardingTour />
    </LayoutProvider>
  )
}
