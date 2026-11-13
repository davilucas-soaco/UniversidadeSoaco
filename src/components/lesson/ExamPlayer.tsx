import { useState } from 'react'
import { ArrowLeft, ArrowRight, Award, Check, ClipboardCheck, RotateCcw, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useFeedback } from '@/context/FeedbackContext'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { Course, ExamAttemptSummary, ExamSubmitResult, LearnerExam } from '@/types'

type Phase = 'intro' | 'answering' | 'result'

const LETTERS = 'ABCDEFGHIJ'

/** Prova de uma etapa: o colaborador responde, a API corrige e, se aprovado, conclui a etapa. */
export function ExamPlayer({
  courseId,
  stageId,
  exam,
  summary,
  done,
  onSubmitted,
}: {
  courseId: string
  stageId: string
  exam: LearnerExam
  summary?: ExamAttemptSummary
  done: boolean
  onSubmitted: (course: Course, result: ExamSubmitResult) => void
}) {
  const { showToast } = useFeedback()
  const [phase, setPhase] = useState<Phase>('intro')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [index, setIndex] = useState(0)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ExamSubmitResult | null>(null)

  const total = exam.questions.length
  const question = exam.questions[index]
  const answered = exam.questions.filter((item) => answers[item.id]).length
  const allAnswered = answered === total

  const start = () => {
    setAnswers({})
    setIndex(0)
    setResult(null)
    setPhase('answering')
  }

  const submit = async () => {
    if (!allAnswered) {
      const firstOpen = exam.questions.findIndex((item) => !answers[item.id])
      setIndex(Math.max(0, firstOpen))
      showToast('Responda todas as perguntas antes de enviar.')
      return
    }
    setSending(true)
    try {
      const data = await api<{ result: ExamSubmitResult; course: Course }>(
        `/cursos/${encodeURIComponent(courseId)}/etapas/${encodeURIComponent(stageId)}/prova`,
        { method: 'POST', body: { answers } },
      )
      setResult(data.result)
      setPhase('result')
      onSubmitted(data.course, data.result)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível enviar a prova.')
    } finally {
      setSending(false)
    }
  }

  if (phase === 'intro') {
    return (
      <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-5 bg-canvas px-6 py-10 text-center">
        <span
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg',
            done ? 'bg-success text-white' : 'bg-accent text-accent-ink',
          )}
        >
          {done ? <Award size={30} /> : <ClipboardCheck size={30} />}
        </span>
        <div className="max-w-lg">
          <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">Prova</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">{exam.title}</h2>
          {exam.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{exam.description}</p> : null}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-semibold text-ink">
            {total} {total === 1 ? 'pergunta' : 'perguntas'}
          </span>
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-semibold text-ink">
            Aprovação com {exam.passingScore}%
          </span>
          {summary ? (
            <span
              className={cn(
                'rounded-full border px-3 py-1.5 font-semibold',
                summary.approved ? 'border-success/40 bg-success/10 text-success' : 'border-amber-500/40 bg-amber-500/10 text-amber-500',
              )}
            >
              Melhor nota: {summary.bestScore}% · {summary.attempts} {summary.attempts === 1 ? 'tentativa' : 'tentativas'}
            </span>
          ) : null}
        </div>
        {done ? (
          <p className="text-sm font-medium text-success">Você já foi aprovado nesta prova. A etapa está concluída.</p>
        ) : null}
        <Button size="lg" icon={done ? <RotateCcw size={16} /> : <ArrowRight size={16} />} onClick={start} variant={done ? 'secondary' : 'primary'}>
          {done ? 'Refazer a prova' : summary ? 'Tentar novamente' : 'Começar a prova'}
        </Button>
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <div className="flex w-full flex-col gap-6 bg-canvas px-6 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              'flex h-24 w-24 flex-col items-center justify-center rounded-full border-4',
              result.approved ? 'border-success text-success' : 'border-amber-500 text-amber-500',
            )}
          >
            <span className="font-display text-3xl font-extrabold">{result.score}%</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">
            {result.approved ? 'Parabéns, você foi aprovado!' : 'Não foi dessa vez'}
          </h2>
          <p className="max-w-md text-sm text-muted">
            Você acertou {result.correct} de {result.total} {result.total === 1 ? 'pergunta' : 'perguntas'}.{' '}
            {result.approved
              ? 'A etapa foi concluída.'
              : `É preciso ${result.passingScore}% para ser aprovado. Revise o conteúdo e tente de novo.`}
          </p>
          {!result.approved ? (
            <Button icon={<RotateCcw size={16} />} onClick={start}>
              Tentar novamente
            </Button>
          ) : (
            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => setPhase('intro')}>
              Voltar ao início da prova
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-display text-[11px] font-semibold tracking-widest text-muted uppercase">Revisão</p>
          {exam.questions.map((item, position) => {
            const review = result.review.find((entry) => entry.questionId === item.id)
            const chosen = item.options.find((option) => option.id === review?.selectedOptionId)
            const right = review?.correctOptionId ? item.options.find((option) => option.id === review.correctOptionId) : undefined
            return (
              <div key={item.id} className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    review?.correct ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
                  )}
                >
                  {review?.correct ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-ink">
                    {position + 1}. {item.text}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Sua resposta: {chosen?.text ?? '—'}</p>
                  {!review?.correct && right ? <p className="text-xs text-success">Correta: {right.text}</p> : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[420px] w-full flex-col gap-5 bg-canvas px-6 py-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between font-display text-xs">
          <span className="font-semibold text-ink">
            Pergunta {index + 1} de {total}
          </span>
          <span className="text-muted">
            {answered} de {total} {answered === 1 ? 'respondida' : 'respondidas'}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-fill">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>

      <h3 className="font-display text-lg leading-snug font-semibold text-ink">{question.text}</h3>

      <div role="radiogroup" aria-label={`Opções da pergunta ${index + 1}`} className="flex flex-col gap-2">
        {question.options.map((option, optionIndex) => {
          const selected = answers[question.id] === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
              className={cn(
                'soaco-press flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition',
                selected ? 'border-accent bg-accent/10 text-ink ring-2 ring-accent/20' : 'border-line bg-surface text-ink hover:border-accent/40',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold',
                  selected ? 'bg-accent text-accent-ink' : 'bg-fill text-muted',
                )}
              >
                {LETTERS[optionIndex]}
              </span>
              <span className="min-w-0 flex-1">{option.text}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col gap-4 border-t border-line pt-4">
        <div className="flex flex-wrap justify-center gap-1.5" aria-label="Ir para a pergunta">
          {exam.questions.map((item, position) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Pergunta ${position + 1}${answers[item.id] ? ' (respondida)' : ''}`}
              aria-current={position === index}
              onClick={() => setIndex(position)}
              className={cn(
                'h-7 w-7 rounded-lg text-[11px] font-semibold transition',
                position === index
                  ? 'bg-accent text-accent-ink'
                  : answers[item.id]
                    ? 'bg-accent/15 text-accent'
                    : 'bg-fill text-muted hover:text-ink',
              )}
            >
              {position + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" icon={<ArrowLeft size={16} />} disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Anterior
          </Button>
          {index < total - 1 ? (
            <Button variant="secondary" onClick={() => setIndex(index + 1)}>
              Próxima <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              disabled={sending}
              icon={sending ? <Spinner className="h-4 w-4" /> : <Send size={16} />}
              onClick={() => void submit()}
            >
              Enviar respostas
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
