import { useEffect, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useFeedback } from '@/context/FeedbackContext'
import { certificateFileName, renderCertificate, type CertificateData } from '@/lib/certificate'

/** Prévia do certificado com download (PNG) e impressão/PDF. `preview` = exemplo da gestão. */
export function CertificateModal({
  data,
  onClose,
  preview = false,
}: {
  data: CertificateData | null
  onClose: () => void
  preview?: boolean
}) {
  const { showToast } = useFeedback()
  const [image, setImage] = useState<{ code: string; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    let active = true
    renderCertificate(data)
      .then((canvas) => {
        if (active) setImage({ code: data.code, url: canvas.toDataURL('image/png') })
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Não foi possível gerar o certificado.')
      })
    return () => {
      active = false
    }
  }, [data])

  const current = data && image?.code === data.code ? image.url : null

  const download = () => {
    if (!data || !current) return
    const link = document.createElement('a')
    link.href = current
    link.download = certificateFileName(data)
    link.click()
  }

  const print = () => {
    if (!current) return
    const popup = window.open('', '_blank', 'width=1100,height=760')
    if (!popup) {
      showToast('Permita pop-ups para imprimir o certificado.')
      return
    }
    popup.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Certificado</title>
      <style>@page{size:A4 landscape;margin:0}html,body{margin:0;height:100%;background:#fff}
      img{display:block;width:100%;height:100%;object-fit:contain}</style></head>
      <body><img src="${current}" alt="Certificado"></body></html>`)
    popup.document.close()
    popup.onload = () => {
      popup.focus()
      popup.print()
    }
  }

  return (
    <Modal
      open={data !== null}
      title={preview ? 'Prévia do certificado' : 'Certificado de conclusão'}
      onClose={onClose}
      width="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {error ? (
            <p className="px-6 py-16 text-center text-sm text-danger">{error}</p>
          ) : current ? (
            <img src={current} alt={`Certificado de ${data?.name ?? ''}`} className="block h-auto w-full" />
          ) : (
            <div className="flex aspect-[3/2] items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {preview
              ? 'Exemplo com os dados do formulário. O nome do colaborador e o código entram na conclusão do curso.'
              : `Código de verificação: ${data?.code ?? ''}`}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Printer size={16} />} disabled={!current} onClick={print}>
              Imprimir / Salvar PDF
            </Button>
            <Button icon={<Download size={16} />} disabled={!current} onClick={download}>
              Baixar imagem
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
