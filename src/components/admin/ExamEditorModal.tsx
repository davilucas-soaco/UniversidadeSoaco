import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Check, CircleAlert, Plus, Trash2, X } from 'lucide-react'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useFeedback } from '@/context/FeedbackContext'
import { adminApi } from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import type { ExamDetail, ExamInput } from '@/types'

type DraftOption = { key: string; text: string; correct: boolean }
type DraftQuestion = { key: string; text: string; options: DraftOption[] }
type Draft = { title: string; description: string; passingScore: string; questions: DraftQuestion[] }

const MAX_OPTIONS = 10

let sequence = 0
const newKey = () => `q-${Date.now().toString(36)}-${(sequence += 1)}`

const newOption = (): DraftOption => ({ key: newKey(), text: '', correct: false })
const newQuestion = (): DraftQuestion => ({ key: newKey(), text: '', options: [newOption(), newOption()] })

const emptyDraft = (): Draft => ({ title: '', description: '', passingScore: '70', questions: [newQuestion()] })

function draftFrom(exam: ExamDetail): Draft {
  return {
    title: exam.title,
    description: exam.description,
    passingScore: String(exam.passingScore),
    questions: exam.questions.map((question) => ({
      key: question.id,
      text: question.text,
      options: question.options.map((option) => ({ key: option.id, text: option.text, correct: option.correct })),
    })),
  }
}

/** Primeira pendência da prova, com a pergunta onde ela está (para rolar até lá). */
function firstProblem(draft: Draft): { message: string; questionKey?: string } | null {
  if (draft.title.trim().length < 2) return { message: 'Informe o nome da prova.' }
  const score = Number(draft.passingScore)
  if (!Number.isInteger(score) || score < 1 || score > 100) return { message: 'A nota mínima vai de 1% a 100%.' }
  for (const [index, question] of draft.questions.entries()) {
    const label = `Pergunta ${index + 1}`
    if (!question.text.trim()) return { message: `${label}: escreva o enunciado.`, questionKey: question.key }
    if (question.options.length < 2) return { message: `${label}: cadastre pelo menos 2 opções.`, questionKey: question.key }
    if (question.options.some((option) => !option.text.trim())) {
      return { message: `${label}: preencha o texto de todas as opções.`, questionKey: question.key }
    }
    if (question.options.filter((option) => option.correct).length !== 1) {
      return { message: `${label}: marque a opção correta.`, questionKey: question.key }
    }
  }
  return null
}

function toInput(draft: Draft): ExamInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    passingScore: Number(draft.passingScore),
    questions: draft.questions.map((question) => ({
      text: question.text.trim(),
      options: question.options.map((option) => ({ text: option.text.trim(), correct: option.correct })),
    })),
  }
}

/** Cadastro e edição de uma prova do banco de provas (perguntas e opções com a correta marcada). */
export function ExamEditorModal({
  open,
  examId,
  onClose,
  onSaved,
}: {
  open: boolean
  /** null = nova prova. */
  examId: string | null
  onClose: () => void
  onSaved: (exam: ExamDetail) => void
}) {
  const { showToast } = useFeedback()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [problem, setProblem] = useState<{ message: string; questionKey?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const questionRefs = useRef(new Map<string, HTMLDivElement>())

  useEffect(() => {
    if (!open) return
    let active = true
    setProblem(null)
    setLoadError(null)
    setSaving(false)
    if (!examId) {
      setDraft(emptyDraft())
      return
    }
    setDraft(null)
    adminApi
      .getExam(examId)
      .then((exam) => {
        if (active) setDraft(draftFrom(exam))
      })
      .catch((caught: unknown) => {
        if (active) setLoadError(caught instanceof Error ? caught.message : 'Não foi possível carregar a prova.')
      })
    return () => {
      active = false
    }
  }, [examId, open])

  const updateQuestion = (key: string, change: (question: DraftQuestion) => DraftQuestion) =>
    setDraft((current) =>
      current ? { ...current, questions: current.questions.map((question) => (question.key === key ? change(question) : question)) } : current,
    )

  const moveQuestion = (index: number, direction: -1 | 1) =>
    setDraft((current) => {
      if (!current) return current
      const questions = [...current.questions]
      const target = index + direction
      if (target < 0 || target >= questions.length) return current
      ;[questions[index], questions[target]] = [questions[target], questions[index]]
      return { ...current, questions }
    })

  const addQuestion = () => {
    const question = newQuestion()
    setDraft((current) => (current ? { ...current, questions: [...current.questions, question] } : current))
    window.requestAnimationFrame(() =>
      questionRefs.current.get(question.key)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    const found = firstProblem(draft)
    setProblem(found)
    if (found) {
      if (found.questionKey) questionRefs.current.get(found.questionKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    try {
      const input = toInput(draft)
      const saved = examId ? await adminApi.updateExam(examId, input) : await adminApi.createExam(input)
      showToast(examId ? 'Prova atualizada.' : 'Prova cadastrada.')
      onSaved(saved)
    } catch (caught) {
      setProblem({ message: caught instanceof Error ? caught.message : 'Não foi possível salvar a prova.' })
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={examId ? 'Editar prova' : 'Nova prova'} onClose={saving ? () => undefined : onClose} width="max-w-3xl">
      {loadError ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{loadError}</p>
      ) : !draft ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col gap-4" noValidate>
          <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1">
            <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">Nome da prova</span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="Ex.: Avaliação de Segurança do Trabalho"
                  className={profileFieldClass}
                  maxLength={160}
                  autoFocus={!examId}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">Nota mínima (%)</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={5}
                  value={draft.passingScore}
                  onChange={(event) => setDraft({ ...draft, passingScore: event.target.value })}
                  className={profileFieldClass}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink">Orientações (opcional)</span>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                rows={2}
                maxLength={1000}
                placeholder="Aparece para o colaborador antes de começar a prova"
                className={cn(profileFieldClass, 'h-auto resize-y py-2.5')}
              />
            </label>

            <div className="flex items-center justify-between">
              <p className="font-display text-xs font-semibold tracking-widest text-muted uppercase">
                Perguntas · {draft.questions.length}
              </p>
              <p className="text-[11px] text-muted">Clique no círculo para marcar a resposta correta.</p>
            </div>

            {draft.questions.map((question, index) => {
              const flagged = problem?.questionKey === question.key
              return (
                <div
                  key={question.key}
                  ref={(element) => {
                    if (element) questionRefs.current.set(question.key, element)
                    else questionRefs.current.delete(question.key)
                  }}
                  className={cn(
                    'flex flex-col gap-3 rounded-2xl border bg-surface p-4',
                    flagged ? 'border-amber-500/60 ring-2 ring-amber-500/20' : 'border-line',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">
                      Pergunta {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'Subir pergunta', icon: <ArrowUp size={14} />, onClick: () => moveQuestion(index, -1), disabled: index === 0 },
                        {
                          label: 'Descer pergunta',
                          icon: <ArrowDown size={14} />,
                          onClick: () => moveQuestion(index, 1),
                          disabled: index === draft.questions.length - 1,
                        },
                        {
                          label: 'Excluir pergunta',
                          icon: <Trash2 size={14} />,
                          onClick: () =>
                            setDraft({ ...draft, questions: draft.questions.filter((item) => item.key !== question.key) }),
                          disabled: draft.questions.length === 1,
                        },
                      ].map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          title={action.label}
                          aria-label={`${action.label} ${index + 1}`}
                          onClick={action.onClick}
                          disabled={action.disabled}
                          className="rounded-lg p-1.5 text-muted transition hover:bg-fill hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={question.text}
                    onChange={(event) => updateQuestion(question.key, (item) => ({ ...item, text: event.target.value }))}
                    rows={2}
                    maxLength={2000}
                    placeholder="Escreva a pergunta"
                    aria-label={`Enunciado da pergunta ${index + 1}`}
                    className={cn(profileFieldClass, 'h-auto resize-y py-2.5')}
                  />

                  <div role="radiogroup" aria-label={`Opções da pergunta ${index + 1}`} className="flex flex-col gap-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.key}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-2 py-1.5 transition',
                          option.correct ? 'border-success/50 bg-success/5' : 'border-line bg-elevated',
                        )}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={option.correct}
                          aria-label={`Marcar opção ${optionIndex + 1} como correta`}
                          title="Marcar como correta"
                          onClick={() =>
                            updateQuestion(question.key, (item) => ({
                              ...item,
                              options: item.options.map((entry) => ({ ...entry, correct: entry.key === option.key })),
                            }))
                          }
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
                            option.correct ? 'border-success bg-success text-white' : 'border-line hover:border-success/60',
                          )}
                        >
                          {option.correct ? <Check size={13} strokeWidth={3} /> : null}
                        </button>
                        <input
                          value={option.text}
                          onChange={(event) =>
                            updateQuestion(question.key, (item) => ({
                              ...item,
                              options: item.options.map((entry) =>
                                entry.key === option.key ? { ...entry, text: event.target.value } : entry,
                              ),
                            }))
                          }
                          onKeyDown={(event) => {
                            // Enter numa opção cria a próxima (em vez de enviar o formulário).
                            if (event.key !== 'Enter') return
                            event.preventDefault()
                            if (question.options.length < MAX_OPTIONS && optionIndex === question.options.length - 1) {
                              updateQuestion(question.key, (item) => ({ ...item, options: [...item.options, newOption()] }))
                            }
                          }}
                          placeholder={`Opção ${optionIndex + 1}`}
                          aria-label={`Texto da opção ${optionIndex + 1} da pergunta ${index + 1}`}
                          maxLength={500}
                          className="min-w-0 flex-1 bg-transparent py-1 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
                        />
                        {option.correct ? (
                          <span className="hidden shrink-0 text-[11px] font-semibold text-success sm:inline">Correta</span>
                        ) : null}
                        <button
                          type="button"
                          aria-label={`Remover opção ${optionIndex + 1}`}
                          title="Remover opção"
                          disabled={question.options.length <= 2}
                          onClick={() =>
                            updateQuestion(question.key, (item) => ({
                              ...item,
                              options: item.options.filter((entry) => entry.key !== option.key),
                            }))
                          }
                          className="rounded-lg p-1 text-muted transition hover:bg-fill hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {question.options.length < MAX_OPTIONS ? (
                    <button
                      type="button"
                      onClick={() => updateQuestion(question.key, (item) => ({ ...item, options: [...item.options, newOption()] }))}
                      className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                    >
                      <Plus size={14} /> Adicionar opção
                    </button>
                  ) : null}
                </div>
              )
            })}

            <button
              type="button"
              onClick={addQuestion}
              className="soaco-press flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-4 text-sm font-semibold text-muted transition hover:border-accent/60 hover:text-accent"
            >
              <Plus size={16} /> Adicionar pergunta
            </button>
          </div>

          {problem ? (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-ink">
              <CircleAlert size={15} className="shrink-0 text-amber-500" /> {problem.message}
            </p>
          ) : null}

          <div className="flex shrink-0 justify-end gap-2 border-t border-line pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} icon={saving ? <Spinner className="h-4 w-4" /> : undefined}>
              {examId ? 'Salvar prova' : 'Cadastrar prova'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
