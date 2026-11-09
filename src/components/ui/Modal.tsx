import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './IconButton'

type ModalProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  width?: string
}

export function Modal({ open, title, children, onClose, width = 'max-w-lg' }: ModalProps) {
  const [present, setPresent] = useState(open)
  const [entered, setEntered] = useState(false)
  const [cache, setCache] = useState({ title, children })

  useEffect(() => {
    if (open) {
      setCache({ title, children })
      setPresent(true)
      return
    }
    setEntered(false)
    const timer = window.setTimeout(() => setPresent(false), 320)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!present || !open) return
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, present])

  useEffect(() => {
    if (!present) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('soaco-modal-open')

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      document.documentElement.classList.remove('soaco-modal-open')
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, present])

  if (!present) return null

  return (
    <div className={cn('soaco-modal', entered && 'is-open')} role="presentation">
      <button type="button" aria-label="Fechar" className="soaco-modal-scrim" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'soaco-modal-panel w-full rounded-[28px] border border-line bg-elevated p-6 shadow-float',
          width,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-bold tracking-tight text-ink">
            {open ? title : cache.title}
          </h2>
          <IconButton label="Fechar" onClick={onClose} className="-mr-1 -mt-1">
            <X size={18} />
          </IconButton>
        </div>
        {open ? children : cache.children}
      </div>
    </div>
  )
}
