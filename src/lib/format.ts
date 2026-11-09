const numberFormatter = new Intl.NumberFormat('pt-BR')

export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function formatPoints(value: number) {
  return `${formatNumber(value)} pts`
}

/** Converte minutos em texto curto: 95 → "1h35", 40 → "40 min". */
export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours}h`
  return `${hours}h${String(rest).padStart(2, '0')}`
}

/** Converte segundos em mm:ss. */
export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

const DAY_MS = 24 * 60 * 60 * 1000

export function daysUntil(dateIso: string, from = new Date()) {
  const target = new Date(`${dateIso}T23:59:59`)
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.ceil((target.getTime() - start.getTime()) / DAY_MS)
}

export function dueLabel(dateIso: string) {
  const days = daysUntil(dateIso)
  if (days < 0) return 'Prazo vencido'
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `Vence em ${days} dias`
}

export function shortDate(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function firstTwoNames(fullName: string) {
  return fullName.split(' ').slice(0, 2).join(' ')
}

export function initialsFrom(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatDate(dateIso: string) {
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString('pt-BR')
}
