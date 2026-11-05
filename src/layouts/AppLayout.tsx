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
            <div className="relative z-40">
              <Header />
            </div>
            <main
              data-soaco-scroll
              className="relative z-0 min-h-0 flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-4"
            >
              <Outlet />
            </main>
          </section>
        </div>
      </div>
      <OnboardingTour />
    </LayoutProvider>
  )
}
