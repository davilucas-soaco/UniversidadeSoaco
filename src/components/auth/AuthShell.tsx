import type { ReactNode } from 'react'
import { BrandMark } from '@/components/layout/Brand'
import { useTheme } from '@/context/ThemeContext'

const AUTH_BACKGROUND = '/login/fundo-login.jpg?v=2'

export const authFieldClass =
  'w-full rounded-xl border border-line bg-fill py-3 pr-4 pl-11 text-sm text-ink shadow-inner transition-colors placeholder:text-muted/60 focus:border-accent/60 focus:outline-none'

/** Fundo e card das telas de login e de primeiro acesso. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { isDark } = useTheme()

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#041e42] px-4 py-10 lg:justify-end lg:pr-[7vw]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={AUTH_BACKGROUND}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-[30%_center] select-none lg:object-center"
        />
        <div className="absolute inset-0 bg-[#041e42]/55 lg:bg-transparent lg:bg-gradient-to-l lg:from-[#041e42]/80 lg:via-[#041e42]/25 lg:to-transparent" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-line/70 bg-elevated/85 p-8 shadow-card backdrop-blur-xl sm:p-10">
        <BrandMark onDark={isDark} className="mb-6 lg:hidden" />
        <h1 className="text-center font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs font-medium text-danger">
      {message}
    </p>
  )
}
