import { useNavigate } from 'react-router-dom'
import { Bell, CircleHelp, GraduationCap, LogOut, Menu, Moon, Sun, UserRound } from 'lucide-react'
import { currentUser } from '@/data/collaborators'
import { notifications } from '@/data/activity'
import { useFeedback } from '@/context/FeedbackContext'
import { useLayout } from '@/context/LayoutContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/IconButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { cn } from '@/lib/cn'

const toolButtonClass =
  'soaco-glass relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:text-ink'

export function Header() {
  const { openMobile } = useLayout()
  const { showComingSoon, showToast } = useFeedback()
  const { start } = useOnboarding()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const unread = notifications.filter((item) => !item.read).length

  return (
    <header className="relative z-40 shrink-0 bg-transparent">
      <div className="flex items-center gap-3 px-3 py-3 lg:px-6 lg:pt-4 lg:pb-2">
        <IconButton label="Abrir menu" className="lg:hidden" onClick={openMobile}>
          <Menu size={18} />
        </IconButton>

        <HeaderSearch className="hidden min-w-0 flex-1 md:block" />

        <div id="tour-header-tools" className="ml-auto flex items-center gap-2">
          <div className="min-w-0 flex-1 md:hidden">
            <HeaderSearch />
          </div>

          <Tooltip label={isDark ? 'Usar tema claro' : 'Usar tema escuro'} side="top">
            <button
              type="button"
              className={toolButtonClass}
              aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
              onClick={toggleTheme}
            >
              {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
            </button>
          </Tooltip>

          <Tooltip label="Ver tutorial" side="top">
            <button
              id="tour-tutorial"
              type="button"
              className={toolButtonClass}
              aria-label="Ver tutorial"
              onClick={() => {
                start()
                showToast('Tutorial reaberto.')
              }}
            >
              <GraduationCap size={16} strokeWidth={1.8} />
            </button>
          </Tooltip>

          <Dropdown
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} className={toolButtonClass} aria-label="Notificações">
                <Bell size={16} strokeWidth={1.8} />
                {unread > 0 ? (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-warm-sand" />
                ) : null}
              </button>
            )}
          >
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-ink">Notificações</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((item) => (
                <div key={item.id} className="border-b border-line/70 px-4 py-3 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    {!item.read ? <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warm-sand" /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  <p className="mt-1 text-[11px] text-muted/80">{item.time}</p>
                </div>
              ))}
            </div>
          </Dropdown>

          <Dropdown
            width="w-72"
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                className={cn(
                  'soaco-glass flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-left transition',
                  open && 'bg-[var(--soaco-glass-hover)]',
                )}
                aria-label="Menu da conta"
                aria-expanded={open}
              >
                <Avatar name={currentUser.name} initials={currentUser.avatarInitials} size="sm" />
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm leading-4 font-semibold text-ink">
                    {currentUser.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{currentUser.sector}</span>
                </span>
              </button>
            )}
          >
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-ink">{currentUser.name}</p>
              <p className="text-xs text-muted">
                {currentUser.sector} · {currentUser.jobTitle}
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
                onClick={() =>
                  showComingSoon(
                    'Sair da plataforma',
                    'A autenticação e o encerramento de sessão serão implementados na próxima fase.',
                  )
                }
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
