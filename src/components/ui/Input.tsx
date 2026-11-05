import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-full border-0 bg-fill px-4 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:bg-elevated focus:ring-4 focus:ring-ocean/10',
        className,
      )}
      {...props}
    />
  )
}
