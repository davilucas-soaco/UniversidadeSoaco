import { useState } from 'react'
import { Star } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useFeedback } from '@/context/FeedbackContext'
import { useCourseReviews } from '@/hooks/useCourseReviews'
import { formatNumber, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-accent" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} fill={star <= Math.round(value) ? 'currentColor' : 'transparent'} />
      ))}
    </div>
  )
}

/** Aba "Avaliações" da aula: nota média, distribuição e comentários reais dos colaboradores. */
export function CourseReviewsPanel({ courseId }: { courseId: string }) {
  const { showToast } = useFeedback()
  const { data, status, error, submit } = useCourseReviews(courseId)
  const [draft, setDraft] = useState<{ rating: number; comment: string } | null>(null)
  const [saving, setSaving] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (status === 'unpublished') {
    return (
      <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
        As avaliações ficam disponíveis quando o curso estiver publicado e destinado aos colaboradores.
      </div>
    )
  }

  if (status === 'error' || !data) {
    return <div className="rounded-xl border border-line p-8 text-center text-sm text-muted">{error}</div>
  }

  const rating = draft?.rating ?? data.mine?.rating ?? 0
  const comment = draft?.comment ?? data.mine?.comment ?? ''
  const changed = Boolean(draft) && (draft!.rating !== data.mine?.rating || draft!.comment !== (data.mine?.comment ?? ''))

  const send = async () => {
    if (!rating) return showToast('Escolha de 1 a 5 estrelas.')
    setSaving(true)
    try {
      await submit(rating, comment)
      setDraft(null)
      showToast(data.mine ? 'Avaliação atualizada.' : 'Obrigado pela sua avaliação!')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível enviar a avaliação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-xl border border-line bg-elevated/70 p-5 md:flex-row md:items-center">
        <div className="flex flex-col items-center gap-1 md:min-w-[160px]">
          <span className="font-display text-5xl font-bold text-ink">
            {data.average == null ? '—' : data.average.toFixed(1).replace('.', ',')}
          </span>
          <Stars value={data.average ?? 0} size={18} />
          <span className="text-xs text-muted">
            {data.count === 0
              ? 'Nenhuma avaliação ainda'
              : `${formatNumber(data.count)} ${data.count === 1 ? 'avaliação' : 'avaliações'}`}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {data.distribution.map((item) => {
            const percent = data.count ? Math.round((item.count / data.count) * 100) : 0
            return (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-16 text-muted">
                  {item.stars} {item.stars === 1 ? 'estrela' : 'estrelas'}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-8 text-right font-semibold text-ink">{percent}%</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-elevated p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-sm font-semibold text-ink">
            Sua avaliação{data.mine && !draft ? <span className="ml-2 text-xs font-normal text-muted">enviada</span> : null}
          </span>
          <div className="flex items-center gap-1 text-accent">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                onClick={() => setDraft({ rating: star, comment })}
                className="transition-transform hover:scale-110"
              >
                <Star size={22} fill={star <= rating ? 'currentColor' : 'transparent'} />
              </button>
            ))}
          </div>
        </div>
        {rating > 0 ? (
          <>
            <textarea
              value={comment}
              onChange={(event) => setDraft({ rating, comment: event.target.value })}
              rows={3}
              maxLength={1000}
              placeholder="Conte o que achou do curso (opcional)"
              className="w-full resize-y rounded-lg border border-line bg-surface p-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              {draft ? (
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={saving}>
                  Cancelar
                </Button>
              ) : null}
              <Button
                size="sm"
                onClick={() => void send()}
                disabled={saving || !changed}
                icon={saving ? <Spinner className="h-4 w-4" /> : undefined}
              >
                {data.mine ? 'Atualizar avaliação' : 'Enviar avaliação'}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {data.reviews.length === 0 ? (
        <p className="text-center text-sm text-muted">Ainda não há comentários sobre este curso.</p>
      ) : (
        data.reviews.map((review) => (
          <div
            key={review.id}
            className={cn(
              'flex flex-col gap-3 rounded-xl border bg-elevated p-4',
              review.isMine ? 'border-accent/30' : 'border-line',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={review.author} initials={review.initials} size="md" />
                <div className="flex flex-col">
                  <span className="font-display text-sm font-semibold text-ink">
                    {review.author}
                    {review.isMine ? <span className="ml-1.5 text-[11px] font-semibold text-accent">(você)</span> : null}
                  </span>
                  <span className="text-xs text-muted">{review.role}</span>
                </div>
              </div>
              <Stars value={review.rating} />
            </div>
            <p className="text-sm leading-relaxed text-ink/90">“{review.comment}”</p>
            <span className="text-[11px] text-muted">{timeAgo(review.createdAt)}</span>
          </div>
        ))
      )}
    </div>
  )
}
