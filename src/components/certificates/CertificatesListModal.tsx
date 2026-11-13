import { useState } from 'react'
import { BadgeCheck, Eye } from 'lucide-react'
import { CertificateModal } from '@/components/certificates/CertificateModal'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSessionUser } from '@/context/AuthContext'
import { certificateFor, hoursLabel, type CertificateData } from '@/lib/certificate'
import { formatDate } from '@/lib/format'
import type { Course } from '@/types'

/** Lista dos certificados emitidos para o colaborador. */
export function CertificatesListModal({ open, courses, onClose }: { open: boolean; courses: Course[]; onClose: () => void }) {
  const user = useSessionUser()
  const [viewing, setViewing] = useState<CertificateData | null>(null)
  const certificates = courses
    .map((course) => certificateFor(course, user.name))
    .filter((item): item is CertificateData => item !== null)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))

  return (
    <>
      <Modal open={open && viewing === null} title="Meus certificados" onClose={onClose} width="max-w-2xl">
        {certificates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BadgeCheck size={28} className="text-muted" />
            <p className="text-sm text-muted">Você ainda não tem certificados. Conclua um curso para receber o seu.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
            {certificates.map((item) => (
              <li key={item.code} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-2/15 text-accent-2">
                  <BadgeCheck size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-ink">{item.course}</p>
                  <p className="truncate text-[11px] text-muted">
                    Concluído em {formatDate(item.issuedAt)} · {hoursLabel(item.hours)} · {item.code}
                  </p>
                </div>
                <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setViewing(item)}>
                  Ver
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
      <CertificateModal data={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
