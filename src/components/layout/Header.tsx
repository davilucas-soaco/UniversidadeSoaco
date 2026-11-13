import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  GraduationCap,
  LogOut,
  Menu,
  UserRound,
} from 'lucide-react'
import { notifications } from '@/data/activity'
import { tourForPath } from '@/data/onboarding'
import { useAuth } from '@/context/AuthContext'
import { useDemoMode } from '@/context/DemoModeContext'
import { useFeedback } from '@/context/FeedbackContext'
import { useLayout } from '@/context/LayoutContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { useProfile } from '@/context/ProfileContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/IconButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import SwitchButton from '@/components/kokonutui/switch-button'
import { firstTwoNames } from '@/lib/format'
import { cn } from '@/lib/cn'

const toolButtonClass =
  'soaco-press relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-fill hover:text-ink'

export function Header() {
  const { openMobile } = useLayout()
  const { showToast } = useFeedback()
  const { logout } = useAuth()
  const { enabled: demo, toggle: toggleDemo } = useDemoMode()
  const { start } = useOnboarding()
  const { profile, initials, jobTitle, sector } = useProfile()
  const { isDark, setTheme } = useTheme()
  const navigate = useNavigate()
  const screenTour = tourForPath(useLocation().pathname)
  const unread = notifications.filter((item) => !item.read).length

  return (
    <header className="soaco-header-glass z-40 shrink-0">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <IconButton label="Abrir menu" className="lg:hidden" onClick={openMobile}>
          <Menu size={18} />
        </IconButton>

        <HeaderSearch className="hidden min-w-0 flex-1 md:block" />

        <div id="tour-header-tools" className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1 md:hidden">
            <HeaderSearch />
          </div>

          <Tooltip label={isDark ? 'Usar tema claro' : 'Usar tema escuro'} side="bottom-end">
            <SwitchButton
              showLabel={false}
              size="lg"
              theme={isDark ? 'dark' : 'light'}
              onThemeChange={setTheme}
              aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
            />
          </Tooltip>

          {/* TEMPORÁRIO: alterna os dados de demonstração (src/demo). */}
          <Tooltip label={demo ? 'Desligar dados de demonstração' : 'Ver com dados de demonstração'} side="bottom-end">
            <button
              type="button"
              aria-pressed={demo}
              aria-label={demo ? 'Desligar dados de demonstração' : 'Ver com dados de demonstração'}
              onClick={() => {
                toggleDemo()
                showToast(demo ? 'Mostrando os dados reais do banco.' : 'Mostrando dados de demonstração.')
              }}
              className={cn(
                'soaco-press inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 font-display text-[11px] font-semibold tracking-wide uppercase',
                demo
                  ? 'bg-[var(--soaco-accent)] text-[var(--soaco-accent-ink)] shadow-sm'
                  : 'border border-line text-muted hover:bg-fill hover:text-ink',
              )}
            >
              <FlaskConical size={16} strokeWidth={1.8} />
              <span className="hidden sm:inline">Demo</span>
            </button>
          </Tooltip>

          <Tooltip label={`Ver tutorial · ${screenTour.label}`} side="bottom-end">
            <button
              id="tour-tutorial"
              type="button"
              className={toolButtonClass}
              aria-label={`Ver tutorial da tela ${screenTour.label}`}
              onClick={start}
            >
              <GraduationCap size={18} strokeWidth={1.8} />
            </button>
          </Tooltip>

          <Dropdown
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} className={toolButtonClass} aria-label="Notificações">
                <Bell size={18} strokeWidth={1.8} />
                {unread > 0 ? (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--soaco-accent)] ring-2 ring-canvas" />
                ) : null}
              </button>
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-display text-sm font-semibold text-ink">Notificações</p>
              {unread > 0 ? (
                <span className="rounded-full bg-[var(--soaco-accent)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--soaco-accent)]">
                  {unread} novas
                </span>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((item) => (
                <div key={item.id} className="border-b border-line/70 px-4 py-3 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    {!item.read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--soaco-accent)]" /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  <p className="mt-1 text-[11px] text-muted/80">{item.time}</p>
                </div>
              ))}
            </div>
          </Dropdown>

          <div className="mx-1 hidden h-8 w-px bg-line sm:block" />

          <Dropdown
            width="w-72"
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                className={cn(
                  'soaco-press flex items-center gap-3 rounded-lg py-1 pr-2 pl-2 text-left hover:bg-fill',
                  open && 'bg-fill',
                )}
                aria-label="Menu da conta"
                aria-expanded={open}
              >
                <span className="hidden min-w-0 text-right sm:block">
                  <span className="block truncate text-sm leading-4 font-semibold text-ink">
                    {firstTwoNames(profile.name)}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{jobTitle}</span>
                </span>
                <Avatar
                  name={profile.name}
                  initials={initials}
                  src={profile.photoUrl}
                  size="md"
                  className="ring-2 ring-[var(--soaco-accent)]/40"
                />
                <ChevronDown size={16} className={cn('text-muted transition', open && 'rotate-180')} />
              </button>
            )}
          >
            <div className="border-b border-line px-4 py-3">
              <p className="font-display text-sm font-semibold text-ink">{profile.name}</p>
              <p className="text-xs text-muted">
                {sector} · {jobTitle}
              </p>
            </div>
            <DropdownItem onClick={() => navigate('/perfil')}>
              <UserRound size={16} />
              Meu perfil
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/ajuda')}>
              <CircleHelp size={16} />
              Ajuda
            </DropdownItem>
            <div className="border-t border-line">
              <DropdownItem
                danger
                onClick={() => {
                  void logout().then(() => navigate('/login', { replace: true }))
                }}
              >
                <LogOut size={16} />
                Sair
              </DropdownItem>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  )
}
