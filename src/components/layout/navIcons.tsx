import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart3,
  BookOpen,
  CircleHelp,
  FolderKanban,
  LayoutGrid,
  LineChart,
  LogOut,
  Settings,
  UserRound,
  Users,
} from 'lucide-react'

export const navIcons: Record<string, LucideIcon> = {
  dashboard: LayoutGrid,
  contents: BookOpen,
  performance: LineChart,
  ranking: Award,
  profile: UserRound,
  help: CircleHelp,
  settings: Settings,
  logout: LogOut,
  'admin-courses': FolderKanban,
  'admin-users': Users,
  'admin-metrics': BarChart3,
}
