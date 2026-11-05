import { Award, BookOpen, ClipboardPlus, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { recentActivities } from '@/data/activity'
import type { ActivityItem } from '@/types'

const activityIcon: Record<ActivityItem['type'], typeof Play> = {
  progress: Play,
  completion: BookOpen,
  points: Award,
  assignment: ClipboardPlus,
}

export function SideActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades recentes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {recentActivities.map((item) => {
          const Icon = activityIcon[item.type]
          return (
            <div key={item.id} className="flex gap-3 rounded-2xl bg-fill px-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevated text-golden">
                <Icon size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-xs leading-5 text-muted">{item.description}</p>
                <p className="mt-0.5 text-[11px] text-muted/80">{item.time}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
