import { useRef, useState } from 'react'
import { FileSpreadsheet, FileText, FileType2, Trash2, Upload } from 'lucide-react'
import {
  documentAccept,
  documentKindLabel,
  formatBytes,
  isAllowedDocument,
  isPdf,
  isSpreadsheet,
} from '@/lib/documents'
import { cn } from '@/lib/cn'

export type PendingDocument = {
  id: string
  file: File
}

function FileGlyph({ file }: { file: File }) {
  if (isSpreadsheet(file.type, file.name)) return <FileSpreadsheet size={18} />
  if (isPdf(file.type, file.name)) return <FileText size={18} />
  return <FileType2 size={18} />
}

export function DocumentDropzone({
  files,
  onChange,
}: {
  files: PendingDocument[]
  onChange: (files: PendingDocument[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list)
    const rejected = incoming.filter((file) => !isAllowedDocument(file))
    const accepted = incoming.filter(isAllowedDocument)
    if (rejected.length) {
      setError('Use apenas PDF, Word ou Excel.')
    } else {
      setError(null)
    }
    if (!accepted.length) return
    const next = accepted.map((file) => ({ id: `local-${crypto.randomUUID()}`, file }))
    onChange([...files, ...next])
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files)
        }}
        className={cn(
          'soaco-press flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition',
          dragging ? 'border-accent bg-accent/8' : 'border-line bg-surface hover:border-accent/40 hover:bg-fill',
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-fill text-accent">
          <Upload size={22} />
        </span>
        <p className="font-display text-sm font-semibold text-ink">Arraste o arquivo ou clique para enviar</p>
        <p className="text-xs text-muted">PDF, Word (.doc, .docx) e Excel (.xls, .xlsx)</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={documentAccept}
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) addFiles(event.target.files)
          event.target.value = ''
        }}
      />
      {error ? <p className="text-xs text-[var(--soaco-danger)]">{error}</p> : null}

      {files.length ? (
        <ul className="flex flex-col gap-2">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-elevated px-3 py-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fill text-accent">
                <FileGlyph file={item.file} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-ink">{item.file.name}</p>
                <p className="text-[11px] text-muted">
                  {documentKindLabel(item.file.type, item.file.name)} · {formatBytes(item.file.size)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remover ${item.file.name}`}
                onClick={() => onChange(files.filter((file) => file.id !== item.id))}
                className="soaco-press rounded-lg p-2 text-muted hover:bg-fill hover:text-ink"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
