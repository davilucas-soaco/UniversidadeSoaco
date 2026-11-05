import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CourseCover } from '@/components/content/CourseCover'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useFeedback } from '@/context/FeedbackContext'
import { featuredCourses } from '@/data/dashboard'

export function ContinueLearning() {
  const navigate = useNavigate()
  const { showComingSoon } = useFeedback()

  return (
    <Card id="tour-courses" className="h-full">
      <CardHeader>
        <CardTitle>Continue aprendendo</CardTitle>
        <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />} onClick={() => navigate('/conteudos')}>
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {featuredCourses.map((course) => (
          <button
            key={course.id}
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-fill"
            onClick={() =>
              showComingSoon(
                course.title,
                'O player de aulas e o registro de progresso detalhado serão desenvolvidos na fase de conteúdos. O curso permanece atribuído ao seu perfil.',
              )
            }
          >
            <CourseCover
              compact
              accent={course.cover.accent}
              icon={course.cover.icon}
              title={course.title}
              className="h-12 w-12 shrink-0 rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink">{course.title}</p>
                <Badge className="hidden sm:inline-flex">{course.category}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <ProgressBar value={course.progress} className="max-w-[160px]" />
                <span className="text-xs font-semibold text-ink">{course.progress}%</span>
              </div>
            </div>
            <span className="hidden text-xs font-semibold text-muted sm:inline">{course.points} pts</span>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
