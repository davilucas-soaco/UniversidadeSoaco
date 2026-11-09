import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Spinner } from './Spinner'

type ConfirmDialogProps = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  confirmIcon?: ReactNode
  /** danger = ação destrutiva (botão vermelho). */
  tone?: 'danger' | 'primary'
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}

/** Modal de confirmação padrão do sistema. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  confirmIcon,
  tone = 'danger',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={title} onClose={busy ? () => undefined : onCancel}>
      <div className="text-sm leading-6 text-muted">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button
          onClick={() => void confirm()}
          disabled={busy}
          icon={busy ? <Spinner className="h-4 w-4" /> : confirmIcon}
          className={tone === 'danger' ? 'bg-danger text-white hover:bg-danger/90' : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
