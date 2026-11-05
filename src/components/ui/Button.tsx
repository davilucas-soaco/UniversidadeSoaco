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
    'bg-midnight text-ivory shadow-[0_10px_22px_-14px_rgb(17_27_45/0.85)] hover:bg-navy-ink focus-visible:ring-midnight/30',
  secondary:
    'bg-warm-sand text-midnight hover:bg-golden focus-visible:ring-warm-sand/40',
  outline:
    'bg-fill text-ink hover:bg-elevated focus-visible:ring-muted/20',
  ghost:
    'text-muted hover:bg-fill hover:text-ink focus-visible:ring-muted/20',
  gold: 'bg-golden text-midnight hover:bg-[#e3e08a] focus-visible:ring-golden/40',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 gap-2 px-3.5 text-xs',
  md: 'h-10 gap-2 px-5 text-sm',
  lg: 'h-11 gap-2.5 px-5 text-sm',
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
        'inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
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
