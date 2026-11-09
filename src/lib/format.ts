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
  const date = dateIso.length === 10 ? new Date(`${dateIso}T12:00:00`) : new Date(dateIso)
  return date.toLocaleDateString('pt-BR')
}

/** Tempo relativo curto: "Agora", "Há 2 horas", "Há 3 dias", "Em 12/08/2026". */
export function timeAgo(dateIso: string, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(dateIso).getTime()) / 60000)
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `Há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? 'Há 1 hora' : `Há ${hours} horas`
  const days = Math.floor(hours / 24)
  if (days < 30) return days === 1 ? 'Ontem' : `Há ${days} dias`
  return `Em ${formatDate(dateIso)}`
}
