import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { currentUser } from '@/data/collaborators'
import { currentUserPercentile, currentUserRank, rankingTop5 } from '@/data/dashboard'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'

const rankBadge: Record<number, string> = {
  1: 'bg-accent text-accent-ink',
  2: 'bg-[#cbd5e1] text-[#070e1b]',
  3: 'bg-accent-2 text-midnight',
}

export function RankingCard() {
  const navigate = useNavigate()

  return (
    <section
      id="tour-ranking"
      className="flex flex-col gap-4 rounded-2xl border border-line bg-elevated p-6 shadow-md"
    >
      <div className="flex items-center justify-between border-b border-line/80 pb-3">
        <div>
          <h2 className="font-display text-xl leading-7 font-semibold tracking-tight text-ink">Ranking</h2>
          <p className="text-xs text-muted">Top 5 do mês</p>
        </div>
        <span className="rounded-full border border-line bg-fill px-2.5 py-0.5 font-display text-[10px] font-semibold tracking-wider text-muted uppercase">
          Este mês
        </span>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-gradient-to-r from-accent/15 to-transparent p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-display text-base font-bold text-accent-ink">
            {currentUserRank}º
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold text-ink">Sua posição</span>
            <span className="text-xs text-accent">Top {currentUserPercentile}%</span>
          </div>
        </div>
        <span className="font-display text-sm font-bold text-accent">{formatNumber(currentUser.points)} pts</span>
      </div>

      <div className="flex flex-col gap-1">
        {rankingTop5.map((person) => {
          const me = Boolean(person.isCurrentUser)
          return (
            <div
              key={person.id}
              className={cn(
                'flex items-center justify-between rounded-xl p-2 transition-colors',
                me ? 'border border-accent/30 bg-accent/10' : 'hover:bg-fill',
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar
                    name={person.name}
                    initials={person.avatarInitials}
                    size="sm"
                    className={cn('h-9 w-9 ring-2', me ? 'ring-accent' : 'ring-line')}
                  />
                  <span
                    className={cn(
                      'absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                      rankBadge[person.position] ?? 'bg-fill text-muted',
                    )}
                  >
                    {person.position}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('truncate font-display text-xs font-semibold', me ? 'text-ink' : person.position <= 3 ? 'text-ink' : 'text-muted')}>
                      {person.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                    {me ? (
                      <span className="rounded bg-accent px-1 font-display text-[9px] font-bold text-accent-ink uppercase">
                        Você
                      </span>
                    ) : null}
                  </div>
                  <span className={cn('truncate text-[11px]', me ? 'text-accent' : 'text-muted/80')}>
                    {person.jobTitle}
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 font-display text-sm',
                  me || person.position === 1 ? 'font-bold text-accent' : person.position <= 3 ? 'font-semibold text-ink' : 'font-medium text-muted',
                )}
              >
                {formatNumber(person.points)} pts
              </span>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate('/ranking')}
        className="mt-1 w-full cursor-pointer rounded-xl border border-line bg-fill py-2 text-center font-display text-xs font-medium text-ink transition-colors hover:brightness-110"
      >
        Ver ranking completo
      </button>
    </section>
  )
}
