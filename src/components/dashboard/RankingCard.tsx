import { Crown, Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { useDashboardData } from '@/context/DashboardContext'
import { firstTwoNames, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { RankingEntry } from '@/types'

type Place = 1 | 2 | 3

/** Ouro, prata e bronze sobre a base azul-marinho da Só Aço (cores em index.css). */
const medal: Record<Place, { ring: string; text: string; pill: string; block: string; height: string }> = {
  1: {
    ring: 'ring-podium-gold',
    text: 'text-podium-gold',
    pill: 'border-podium-gold/40 bg-podium-gold/15 text-podium-gold',
    block: 'from-podium-gold/30 via-podium-gold/10 border-podium-gold/50',
    height: 'h-28',
  },
  2: {
    ring: 'ring-podium-silver',
    text: 'text-podium-silver',
    pill: 'border-podium-silver/40 bg-podium-silver/15 text-podium-silver',
    block: 'from-podium-silver/25 via-podium-silver/10 border-podium-silver/40',
    height: 'h-20',
  },
  3: {
    ring: 'ring-podium-bronze',
    text: 'text-podium-bronze',
    pill: 'border-podium-bronze/40 bg-podium-bronze/15 text-podium-bronze',
    block: 'from-podium-bronze/25 via-podium-bronze/10 border-podium-bronze/40',
    height: 'h-16',
  },
}

function PodiumStep({ place, person }: { place: Place; person?: RankingEntry }) {
  const style = medal[place]
  const first = place === 1

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="mb-2 flex min-h-[112px] w-full flex-col items-center justify-end gap-1.5 px-1 text-center">
        {first ? <Crown size={20} className="text-podium-gold" fill="currentColor" aria-hidden /> : null}
        {person ? (
          <>
            <Avatar
              name={person.name}
              initials={person.initials}
              size={first ? 'lg' : 'md'}
              className={cn('ring-2 ring-offset-2 ring-offset-elevated', style.ring, first && 'h-14 w-14')}
            />
            <p className="w-full truncate font-display text-xs font-semibold text-ink" title={person.name}>
              {firstTwoNames(person.name)}
              {person.isCurrentUser ? <span className="ml-1 text-[10px] font-bold text-accent uppercase">você</span> : null}
            </p>
            <span className={cn('rounded-full border px-2 py-0.5 font-display text-[11px] font-bold whitespace-nowrap', style.pill)}>
              {formatNumber(person.points)} pts
            </span>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-line text-muted">
              ?
            </div>
            <p className="text-[11px] text-muted">Vaga aberta</p>
          </>
        )}
      </div>
      <div
        className={cn(
          'relative flex w-full items-center justify-center rounded-t-xl border-x border-t bg-gradient-to-b to-transparent',
          style.block,
          style.height,
        )}
      >
        <span className={cn('font-display text-3xl font-bold opacity-90', style.text)}>{place}</span>
      </div>
    </div>
  )
}

const columns: DataTableColumn<RankingEntry>[] = [
  {
    key: 'position',
    header: 'Pos.',
    filterValues: (person) => [`${person.position}º`],
    sortValue: (person) => person.position,
    sortLabels: { asc: 'Melhor posição primeiro', desc: 'Pior posição primeiro' },
    optionOrder: 'sort-asc',
    className: 'w-px font-display font-bold whitespace-nowrap text-muted',
    render: (person) => `${person.position}º`,
  },
  {
    key: 'name',
    header: 'Nome',
    filterValues: (person) => [person.name],
    className: 'w-full max-w-0',
    render: (person) => (
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar name={person.name} initials={person.initials} size="sm" className="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate font-display text-xs font-semibold text-ink">
            {firstTwoNames(person.name)}
            {person.isCurrentUser ? (
              <span className="ml-1.5 rounded bg-accent px-1 text-[9px] font-bold text-accent-ink uppercase">Você</span>
            ) : null}
          </p>
          <p className="truncate text-[11px] text-muted">{person.jobTitle}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'points',
    header: 'Pts',
    align: 'right',
    filterValues: (person) => [`${formatNumber(person.points)} pts`],
    sortValue: (person) => person.points,
    sortLabels: { asc: 'Menor pontuação primeiro', desc: 'Maior pontuação primeiro' },
    optionOrder: 'sort-desc',
    className: 'w-px font-display text-xs font-semibold whitespace-nowrap text-ink',
    render: (person) => `${formatNumber(person.points)} pts`,
  },
]

export function RankingCard({ className }: { className?: string }) {
  const { ranking } = useDashboardData()
  const me = ranking.me
  const [first, second, third] = ranking.top
  const others = ranking.top.slice(3)

  return (
    <section
      id="tour-ranking"
      className={cn('flex flex-col gap-4 rounded-2xl border border-line bg-elevated p-6 shadow-md', className)}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-line/80 pb-3">
        <div>
          <h2 className="font-display text-xl leading-7 font-semibold tracking-tight text-ink">Ranking</h2>
          <p className="text-xs text-muted">Pontos conquistados neste mês</p>
        </div>
        {me ? (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-display text-[11px] font-semibold text-accent">
            Você: {me.position}º · Top {ranking.percentile}%
          </span>
        ) : (
          <span className="rounded-full border border-line bg-fill px-2.5 py-0.5 font-display text-[10px] font-semibold tracking-wider text-muted uppercase">
            Este mês
          </span>
        )}
      </div>

      {ranking.top.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Trophy size={28} className="text-podium-gold" />
          <p className="text-sm text-muted">Ninguém pontuou neste mês ainda. O pódio está esperando você!</p>
        </div>
      ) : (
        <>
          <div className="relative shrink-0 overflow-hidden rounded-xl border border-line bg-gradient-to-b from-accent/10 via-surface to-surface px-3 pt-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgb(255_173_0/0.18),transparent_70%)]" />
            <div className="relative flex items-end gap-2">
              <PodiumStep place={2} person={second} />
              <PodiumStep place={1} person={first} />
              <PodiumStep place={3} person={third} />
            </div>
          </div>

          {others.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DataTable
                variant="plain"
                dense
                rows={others}
                columns={columns}
                rowKey={(person) => person.id}
                initialSort={{ key: 'position', direction: 'asc' }}
                minWidth="0"
                rowClassName={(person) => (person.isCurrentUser ? 'bg-accent/10' : undefined)}
                emptyMessage="Ninguém corresponde aos filtros."
                itemLabel={{ singular: 'colocado', plural: 'colocados' }}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
