import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function IconButton({
  className,
  children,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-fill hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/15',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
