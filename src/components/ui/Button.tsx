import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--soaco-accent)] text-[var(--soaco-accent-ink)] shadow-[0_8px_20px_-10px_rgb(229_184_120/0.6)] hover:bg-[var(--soaco-accent-strong)] focus-visible:ring-[var(--soaco-accent)]/30',
  secondary:
    'bg-fill text-ink ring-1 ring-line hover:bg-elevated hover:ring-[var(--soaco-accent)]/40 focus-visible:ring-[var(--soaco-accent)]/30',
  outline:
    'bg-transparent text-ink ring-1 ring-line hover:bg-fill focus-visible:ring-muted/20',
  ghost: 'text-muted hover:bg-fill hover:text-ink focus-visible:ring-muted/20',
  gold: 'bg-golden text-midnight hover:brightness-105 focus-visible:ring-golden/40',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 gap-2 px-3.5 text-xs',
  md: 'h-10 gap-2 px-5 text-sm',
  lg: 'h-11 gap-2.5 px-6 text-sm',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  icon,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'soaco-press inline-flex items-center justify-center rounded-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
