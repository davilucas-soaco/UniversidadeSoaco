import {
  BookOpen,
  Building2,
  ClipboardList,
  Flag,
  Heart,
  LineChart,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import type { CoverIcon as CoverIconName } from '@/types'

const icons = {
  building: Building2,
  flag: Flag,
  shield: ShieldCheck,
  clipboard: ClipboardList,
  chart: LineChart,
  workflow: Waypoints,
  heart: Heart,
  book: BookOpen,
}

export function CoverIcon({ name, size = 22 }: { name: CoverIconName; size?: number }) {
  const Icon = icons[name]
  return <Icon size={size} strokeWidth={1.7} />
}
