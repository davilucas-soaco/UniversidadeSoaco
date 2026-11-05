import { NavLink, useNavigate } from 'react-router-dom'
import { adminNav, collaboratorNav } from '@/data/navigation'
import { dashboardStats } from '@/data/dashboard'
import { useLayout } from '@/context/LayoutContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { BrandMark } from './Brand'
import { navIcons } from './navIcons'
import type { NavItem } from '@/types'

const navTourIds: Record<string, string> = {
  '/': 'tour-nav-dashboard',
  '/conteudos': 'tour-nav-contents',
}

const menuLabel: Record<string, string> = {
  '/': 'Dashboard',
  '/conteudos': 'Conteúdos',
  '/admin/conteudos': 'Gestão',
  '/admin/colaboradores': 'Equipe',
  '/admin/indicadores': 'Indicadores',
}

function NavButton({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = navIcons[item.icon] ?? navIcons.dashboard
  const label = menuLabel[item.to] ?? item.label

  return (
    <NavLink
      id={navTourIds[item.to]}
      to={item.to}
      end={item.to === '/'}
      title={item.label}
      onClick={onNavigate}
      className={({ isActive }) => cn('soaco-nav-item', isActive && 'is-active')}
    >
      <Icon size={18} strokeWidth={1.7} className="soaco-nav-glyph shrink-0" />
      <span className="soaco-nav-label">{label}</span>
      {item.reserved ? <span className="sr-only">Área reservada para a próxima fase</span> : null}
    </NavLink>
  )
}

export function Sidebar() {
  const { mobileOpen, closeMobile } = useLayout()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  return (
    <>
      <div
        className={cn('fixed inset-0 z-30 bg-midnight/40 backdrop-blur-sm lg:hidden', mobileOpen ? 'block' : 'hidden')}
        onClick={closeMobile}
      />

      <aside
        data-expanded="true"
        className={cn(
          'soaco-sidebar flex h-full shrink-0 flex-col overflow-hidden',
          'max-lg:absolute max-lg:inset-y-3 max-lg:left-3 max-lg:z-40',
          mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-[120%]',
        )}
      >
        <div className="soaco-brand-slot">
          <BrandMark onDark={isDark} />
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
          <p className="soaco-section-title">Geral</p>
          <div id="tour-collaborator-nav" className="soaco-nav-group">
            {collaboratorNav.map((item) => (
              <NavButton key={item.to} item={item} onNavigate={closeMobile} />
            ))}
          </div>

          <div className="soaco-admin-block">
            <p className="soaco-section-title">Admin</p>
            <div className="soaco-nav-group">
              {adminNav.map((item) => (
                <NavButton key={item.to} item={item} onNavigate={closeMobile} />
              ))}
            </div>
          </div>
        </nav>

        <div className="soaco-side-card">
          <p className="text-sm font-bold text-ink">Seu progresso</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {dashboardStats.completedCourses} cursos concluídos · {dashboardStats.points} pontos
          </p>
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              navigate('/conteudos')
              closeMobile()
            }}
          >
            Continuar
          </Button>
        </div>
      </aside>
    </>
  )
}
