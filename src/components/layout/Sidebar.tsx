import { useEffect, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react'
import { adminNav, collaboratorNav, navForRole } from '@/data/navigation'
import { useSessionUser } from '@/context/AuthContext'
import { useLayout } from '@/context/LayoutContext'
import { useDrawerGesture } from '@/hooks/useDrawerGesture'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import { FloatingDockVertical, type FloatingDockItem } from '@/components/ui/floating-dock'
import { BrandMark } from './Brand'
import { navIcons } from './navIcons'
import type { NavItem } from '@/types'

const navTourIds: Record<string, string> = {
  '/': 'tour-nav-dashboard',
  '/conteudos': 'tour-nav-contents',
}

const DRAWER_WIDTH = 288

function toDockItem(item: NavItem, onSelect?: () => void): FloatingDockItem {
  const Icon = navIcons[item.icon] ?? navIcons.dashboard
  return {
    title: item.label,
    href: item.to,
    id: navTourIds[item.to],
    end: item.to === '/',
    onSelect,
    icon: <Icon strokeWidth={1.7} />,
  }
}

function NavButton({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = navIcons[item.icon] ?? navIcons.dashboard

  return (
    <NavLink
      id={navTourIds[item.to]}
      to={item.to}
      end={item.to === '/'}
      title={item.label}
      onClick={onNavigate}
      className={({ isActive }) => cn('soaco-nav-item', isActive && 'is-active')}
    >
      <Icon size={20} strokeWidth={1.7} className="soaco-nav-glyph shrink-0" />
      <span className="soaco-nav-label">{item.label}</span>
      {item.reserved ? <span className="sr-only">Área reservada para a próxima fase</span> : null}
    </NavLink>
  )
}

export function Sidebar() {
  const { mobileOpen, closeMobile, openMobile, collapsed, toggleCollapsed } = useLayout()
  const { role } = useSessionUser()
  const managementNav = useMemo(() => navForRole(adminNav, role), [role])
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const expanded = isMobile ? true : !collapsed
  const drawer = useDrawerGesture({
    open: mobileOpen,
    onOpenChange: (next) => (next ? openMobile() : closeMobile()),
    width: DRAWER_WIDTH,
    enabled: isMobile,
  })

  const dockItems = useMemo<FloatingDockItem[]>(
    () => [
      ...collaboratorNav.map((item) => toDockItem(item, closeMobile)),
      ...(managementNav.length > 0
        ? [{ title: 'Governança', href: '', icon: null, separator: true }]
        : []),
      ...managementNav.map((item) => toDockItem(item, closeMobile)),
    ],
    [closeMobile, managementNav],
  )

  useEffect(() => {
    if (!isMobile || !mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [closeMobile, isMobile, mobileOpen])

  return (
    <>
      <div
        className={cn(
          'soaco-drawer-scrim fixed inset-0 z-30 lg:hidden',
          drawer.progress < 0.02 && 'pointer-events-none',
        )}
        style={{ opacity: drawer.progress }}
        onClick={closeMobile}
        aria-hidden={drawer.progress < 0.02}
      />

      <aside
        data-expanded={expanded}
        className={cn(
          'soaco-sidebar flex h-full shrink-0 flex-col',
          'lg:transition-[width] lg:duration-300 lg:ease-out',
          'max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:overflow-hidden',
          expanded ? 'overflow-hidden' : 'overflow-visible',
          drawer.dragging && 'max-lg:cursor-grabbing',
        )}
        style={isMobile ? { transform: `translate3d(${drawer.x}px, 0, 0)`, touchAction: 'pan-y' } : undefined}
        onPointerDown={drawer.onPointerDown}
        onPointerMove={drawer.onPointerMove}
        onPointerUp={drawer.onPointerUp}
        onPointerCancel={drawer.onPointerCancel}
      >
        <div className="soaco-brand-slot">
          <BrandMark onDark compact={!expanded} className="w-full justify-center" />
        </div>

        {expanded ? (
          <nav className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto py-5">
            <p className="soaco-section-title">Plataforma</p>
            <div id="tour-collaborator-nav" className="soaco-nav-group">
              {collaboratorNav.map((item) => (
                <NavButton key={item.to} item={item} onNavigate={closeMobile} />
              ))}
            </div>

            {managementNav.length > 0 ? (
              <div className="soaco-admin-block">
                <p className="soaco-section-title">Governança</p>
                <div className="soaco-nav-group">
                  {managementNav.map((item) => (
                    <NavButton key={item.to} item={item} onNavigate={closeMobile} />
                  ))}
                </div>
                <p className="mx-6 mt-3 inline-flex items-center gap-1.5 text-[11px] text-[#64748b]">
                  <ShieldCheck size={12} /> Acesso de gestão
                </p>
              </div>
            ) : null}
          </nav>
        ) : (
          <nav
            id="tour-collaborator-nav"
            className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-visible py-4"
          >
            <FloatingDockVertical items={dockItems} />
          </nav>
        )}

        <div className="hidden border-t border-[var(--soaco-sidebar-line)] p-3 lg:block">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={expanded ? 'Recolher menu' : 'Expandir menu'}
            aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
            className={cn('soaco-nav-item w-full', !expanded && 'justify-center')}
          >
            {expanded ? (
              <PanelLeftClose size={20} strokeWidth={1.7} className="shrink-0" />
            ) : (
              <PanelLeftOpen size={20} strokeWidth={1.7} className="shrink-0" />
            )}
            <span className="soaco-nav-label">Recolher menu</span>
          </button>
        </div>
      </aside>
    </>
  )
}
