import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { upcomingTrainings } from '@/data/activity'
import { useFeedback } from '@/context/FeedbackContext'

const statusTone = {
  pendente: 'bg-rose-500/15 text-rose-300',
  em_andamento: 'bg-amber-400/15 text-amber-300',
  concluido: 'bg-emerald-400/15 text-emerald-300',
}

const statusDot = {
  pendente: 'bg-rose-400',
  em_andamento: 'bg-amber-400',
  concluido: 'bg-emerald-400',
}

const statusLabel = {
  pendente: 'Alta',
  em_andamento: 'Média',
  concluido: 'Concluído',
}

export function UpcomingPanel() {
  const navigate = useNavigate()
  const { showComingSoon } = useFeedback()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Próximos treinamentos</CardTitle>
        <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />} onClick={() => navigate('/conteudos')}>
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcomingTrainings.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-3 text-left transition hover:bg-fill"
            onClick={() =>
              showComingSoon(
                item.title,
                'A abertura deste treinamento será possível quando a área de conteúdos estiver disponível.',
              )
            }
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot[item.status]}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
              <span className="text-xs text-muted">{item.dueLabel}</span>
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone[item.status]}`}>
              {statusLabel[item.status]}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
