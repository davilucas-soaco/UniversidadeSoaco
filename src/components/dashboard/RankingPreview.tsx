import { ArrowRight, Medal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { rankingPreview } from '@/data/dashboard'
import { cn } from '@/lib/cn'

const podium: Record<number, string> = {
  1: 'bg-[#C6A15B]/18 text-[#C6A15B]',
  2: 'bg-[#9AA4B2]/20 text-[#7C8794]',
  3: 'bg-[#B08A62]/18 text-[#A0744C]',
}

const podiumRing: Record<number, string> = {
  1: 'ring-2 ring-[#C6A15B]/70',
  2: 'ring-2 ring-[#9AA4B2]/70',
  3: 'ring-2 ring-[#B08A62]/70',
}

export function RankingPreview() {
  const navigate = useNavigate()

  return (
    <Card id="tour-ranking" className="h-full">
      <CardHeader>
        <CardTitle>Destaques da Universidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rankingPreview.map((person) => (
          <div
            key={person.id}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-2.5 py-2.5',
              person.isCurrentUser && 'bg-fill',
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                podium[person.position] ?? 'text-muted',
              )}
            >
              {person.position <= 3 ? (
                <Medal size={16} strokeWidth={1.8} />
              ) : (
                <span className="text-sm font-bold">{person.position}</span>
              )}
            </div>
            <Avatar
              name={person.name}
              initials={person.avatarInitials}
              size="sm"
              className={podiumRing[person.position]}
              highlighted={person.isCurrentUser}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
                {person.isCurrentUser ? <Badge tone="gold">Você</Badge> : null}
              </div>
              <p className="text-xs text-muted">{person.sector}</p>
            </div>
            <p className="text-sm font-bold text-ink">{person.points}</p>
          </div>
        ))}
        <Button
          variant="outline"
          className="mt-2 w-full"
          icon={<ArrowRight size={16} />}
          onClick={() => navigate('/ranking')}
        >
          Ver ranking completo
        </Button>
      </CardContent>
    </Card>
  )
}
