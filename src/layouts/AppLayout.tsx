import { Outlet } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useCatalog } from '@/context/CatalogContext'
import { useDashboard } from '@/context/DashboardContext'
import { LayoutProvider } from '@/context/LayoutContext'

function DataGate() {
  const catalog = useCatalog()
  const dashboard = useDashboard()

  if (catalog.status === 'error' || dashboard.status === 'error') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-line bg-elevated p-8 text-center shadow-md">
        <p className="font-display text-base font-semibold text-ink">Não foi possível carregar seus dados</p>
        <p className="text-sm text-muted">{catalog.error ?? dashboard.error}</p>
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} />}
          onClick={() => {
            catalog.reload()
            dashboard.reload()
          }}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (catalog.status !== 'ready' || dashboard.status !== 'ready') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return <Outlet />
}

export function AppLayout() {
  const catalogStatus = useCatalog().status
  const dashboardStatus = useDashboard().status
  const ready = catalogStatus === 'ready' && dashboardStatus === 'ready'

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
                <DataGate />
              </main>
            </div>
          </section>
        </div>
      </div>
      {ready ? <OnboardingTour /> : null}
    </LayoutProvider>
  )
}
