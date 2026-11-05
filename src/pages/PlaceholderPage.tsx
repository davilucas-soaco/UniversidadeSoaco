import { useLocation, useNavigate } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { pageMeta } from '@/data/navigation'

export function PlaceholderPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const meta = pageMeta[location.pathname]

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <EmptyState
          icon={<Construction size={26} />}
          title={meta?.title ?? 'Área reservada'}
          description="Esta tela já faz parte da navegação da Universidade Corporativa e será desenvolvida em uma fase posterior. O padrão visual definido no Dashboard será mantido."
          action={
            <Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
          }
        />
      </Card>
    </div>
  )
}
