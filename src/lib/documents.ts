export const documentAccept =
  '.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function isPdf(mime: string, name: string) {
  return mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf')
}

export function isSpreadsheet(mime: string, name: string) {
  return (
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    /\.xlsx?$/i.test(name)
  )
}

export function isWord(mime: string, name: string) {
  return mime.includes('word') || /\.docx?$/i.test(name)
}

export function documentKindLabel(mime: string, name: string) {
  if (isPdf(mime, name)) return 'PDF'
  if (isSpreadsheet(mime, name)) return 'Excel'
  if (isWord(mime, name)) return 'Word'
  return 'Documento'
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isAllowedDocument(file: File) {
  return isPdf(file.type, file.name) || isSpreadsheet(file.type, file.name) || isWord(file.type, file.name)
}
