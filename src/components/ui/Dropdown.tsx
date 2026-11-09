import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/cn'

type DropdownProps = {
  trigger: (args: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  width?: string
}

export function Dropdown({ trigger, children, align = 'right', width = 'w-80' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false), open)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setLeaving(false)
      return
    }
    if (!visible) return
    setLeaving(true)
    const timer = window.setTimeout(() => {
      setVisible(false)
      setLeaving(false)
    }, 220)
    return () => window.clearTimeout(timer)
  }, [open, visible])

  const origin = align === 'right' ? 'top right' : 'top left'

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {visible ? (
        <div
          className={cn(
            'soaco-popover absolute top-[calc(100%+0.6rem)] z-[80] overflow-hidden rounded-xl',
            leaving && 'is-leaving',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
          style={{ '--soaco-popover-origin': origin } as CSSProperties}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  danger = false,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'soaco-press flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-fill',
        danger ? 'text-red-400' : 'text-ink',
      )}
    >
      {children}
    </button>
  )
}
