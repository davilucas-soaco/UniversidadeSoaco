import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { ExamEditorModal } from '@/components/admin/ExamEditorModal'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import { useFeedback } from '@/context/FeedbackContext'
import { adminApi } from '@/lib/adminApi'
import { formatDate } from '@/lib/format'
import type { ExamSummary } from '@/types'

const NOT_USED = '(Não usada)'

function usageValues(exam: ExamSummary) {
  const courses = [...new Set(exam.usedIn.map((use) => use.courseTitle))]
  return courses.length > 0 ? courses : [NOT_USED]
}

/** Banco de provas: cadastradas uma vez e escolhidas nas etapas de qualquer curso. */
export function ExamsCard() {
  const { showToast } = useFeedback()
  const [exams, setExams] = useState<ExamSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string | null } | null>(null)
  const [removing, setRemoving] = useState<ExamSummary | null>(null)

  const load = useCallback(async () => {
    try {
      setExams(await adminApi.listExams())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar as provas.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async () => {
    if (!removing) return
    try {
      await adminApi.deleteExam(removing.id)
      setExams((current) => current?.filter((exam) => exam.id !== removing.id) ?? current)
      showToast(`Prova "${removing.title}" excluída.`)
      setRemoving(null)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível excluir a prova.')
    }
  }

  const columns = useMemo<DataTableColumn<ExamSummary>[]>(
    () => [
      {
        key: 'title',
        header: 'Prova',
        filterValues: (exam) => [exam.title],
        className: 'w-full max-w-0',
        render: (exam) => (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-ink">{exam.title}</p>
            {exam.description ? <p className="truncate text-[11px] text-muted">{exam.description}</p> : null}
          </div>
        ),
      },
      {
        key: 'questions',
        header: 'Perguntas',
        filterValues: (exam) => [String(exam.questionsCount)],
        sortValue: (exam) => exam.questionsCount,
        sortLabels: { asc: 'Menos perguntas primeiro', desc: 'Mais perguntas primeiro' },
        optionOrder: 'sort-asc',
        className: 'whitespace-nowrap text-muted',
        render: (exam) => exam.questionsCount,
      },
      {
        key: 'passing',
        header: 'Nota mínima',
        filterValues: (exam) => [`${exam.passingScore}%`],
        sortValue: (exam) => exam.passingScore,
        sortLabels: { asc: 'Menor nota primeiro', desc: 'Maior nota primeiro' },
        optionOrder: 'sort-asc',
        className: 'whitespace-nowrap text-muted',
        render: (exam) => `${exam.passingScore}%`,
      },
      {
        key: 'usage',
        header: 'Usada em',
        filterValues: usageValues,
        emptyValues: [NOT_USED],
        render: (exam) =>
          exam.usedIn.length === 0 ? (
            <span className="rounded-full border border-line bg-fill px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-muted">
              Não usada
            </span>
          ) : (
            <span className="text-xs whitespace-nowrap text-ink" title={exam.usedIn.map((use) => `${use.courseTitle} · ${use.stageTitle}`).join('\n')}>
              {exam.usedIn.length} {exam.usedIn.length === 1 ? 'etapa' : 'etapas'} · {usageValues(exam).length}{' '}
              {usageValues(exam).length === 1 ? 'curso' : 'cursos'}
            </span>
          ),
      },
      {
        key: 'updatedAt',
        header: 'Atualizada em',
        filterValues: (exam) => [formatDate(exam.updatedAt)],
        sortValue: (exam) => new Date(exam.updatedAt).getTime(),
        sortLabels: { asc: 'Mais antiga primeiro', desc: 'Mais recente primeiro' },
        optionOrder: 'sort-desc',
        className: 'whitespace-nowrap text-muted',
        render: (exam) => formatDate(exam.updatedAt),
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        render: (exam) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Editar"
              aria-label={`Editar ${exam.title}`}
              onClick={() => setEditing({ id: exam.id })}
              className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              title="Excluir"
              aria-label={`Excluir ${exam.title}`}
              onClick={() => setRemoving(exam)}
              className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-fill text-accent">
            <ClipboardCheck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-ink">Provas</h2>
            <p className="text-xs text-muted">
              Cadastre a prova uma vez e escolha-a nas etapas de qualquer curso. O colaborador conclui a etapa ao ser aprovado.
            </p>
          </div>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setEditing({ id: null })} className="shrink-0">
            Nova prova
          </Button>
        </div>

        {error ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</p>
        ) : !exams ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line p-8 text-center">
            <p className="text-sm text-muted">Nenhuma prova cadastrada ainda.</p>
            <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setEditing({ id: null })}>
              Cadastrar a primeira
            </Button>
          </div>
        ) : (
          <DataTable
            rows={exams}
            columns={columns}
            rowKey={(exam) => exam.id}
            search={{ placeholder: 'Buscar prova...', text: (exam) => `${exam.title} ${exam.description}` }}
            initialSort={{ key: 'updatedAt', direction: 'desc' }}
            itemLabel={{ singular: 'prova', plural: 'provas' }}
            minWidth="760px"
            variant="plain"
          />
        )}
      </CardContent>

      <ExamEditorModal
        open={editing !== null}
        examId={editing?.id ?? null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          void load()
        }}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir prova"
        confirmLabel="Excluir"
        confirmIcon={<Trash2 size={16} />}
        onCancel={() => setRemoving(null)}
        onConfirm={remove}
      >
        <p>
          Tem certeza que deseja excluir <strong className="text-ink">{removing?.title}</strong>?{' '}
          {removing && removing.usedIn.length > 0
            ? 'Ela está em uso em etapas de cursos: troque a prova dessas etapas antes de excluir.'
            : 'As perguntas e o histórico de tentativas dela serão removidos.'}
        </p>
      </ConfirmDialog>
    </Card>
  )
}
