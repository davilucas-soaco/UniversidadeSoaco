import { useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useFeedback } from '@/context/FeedbackContext'

export type NamedItem = { id: number; name: string; description?: string | null; count: number }

type NamedListCardProps = {
  icon: ReactNode
  title: string
  subtitle: string
  /** Rótulo do item no singular, em minúsculas (ex.: "setor"). */
  noun: string
  /** Gênero do rótulo, para "do/da", "cadastrado/cadastrada". */
  gender: 'm' | 'f'
  countLabel: (count: number) => string
  deleteWarning: (item: NamedItem) => string
  withDescription?: boolean
  items: NamedItem[]
  onCreate: (name: string, description: string | null) => Promise<void>
  onUpdate: (id: number, name: string, description: string | null) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

type FormState = { mode: 'create' } | { mode: 'edit'; item: NamedItem }

/** A busca só aparece quando a lista passa disso. */
const SEARCH_THRESHOLD = 6

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback
}

function NamedItemForm({
  initial,
  noun,
  article,
  ofNoun,
  withDescription,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial: NamedItem | null
  noun: string
  article: 'o' | 'a'
  ofNoun: string
  withDescription: boolean
  submitLabel: string
  onCancel: () => void
  onSubmit: (name: string, description: string | null) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) return setError(`Informe o nome ${ofNoun}.`)
    setSaving(true)
    setError(null)
    try {
      await onSubmit(name.trim(), description.trim() || null)
    } catch (caught) {
      setError(errorMessage(caught, `Não foi possível salvar ${article} ${noun}.`))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Nome</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`Nome ${ofNoun}`}
          className={profileFieldClass}
          autoFocus
        />
      </label>
      {withDescription ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Para que serve este grupo?"
            className={`${profileFieldClass} h-auto resize-none py-2.5`}
          />
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} icon={saving ? <Spinner className="h-4 w-4" /> : undefined}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

/** Lista com cadastro e edição em modal, e exclusão com confirmação (setores e classes). */
export function NamedListCard({
  icon,
  title,
  subtitle,
  noun,
  gender,
  countLabel,
  deleteWarning,
  withDescription = false,
  items,
  onCreate,
  onUpdate,
  onDelete,
}: NamedListCardProps) {
  const { showToast } = useFeedback()
  const [form, setForm] = useState<FormState | null>(null)
  const [removing, setRemoving] = useState<NamedItem | null>(null)
  const [query, setQuery] = useState('')
  const term = normalize(query.trim())
  const visible = term
    ? items.filter((item) => normalize(`${item.name} ${item.description ?? ''}`).includes(term))
    : items
  const f = gender === 'f'
  const ofNoun = `${f ? 'da' : 'do'} ${noun}`
  const Noun = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`

  const closeForm = () => setForm(null)

  const save = async (name: string, description: string | null) => {
    if (!form) return
    if (form.mode === 'create') {
      await onCreate(name, description)
      showToast(`${Noun} ${f ? 'cadastrada' : 'cadastrado'}.`)
    } else {
      await onUpdate(form.item.id, name, description)
      showToast('Alteração salva.')
    }
    closeForm()
  }

  const confirmDelete = async () => {
    if (!removing) return
    try {
      await onDelete(removing.id)
      showToast(`${Noun} "${removing.name}" ${f ? 'excluída' : 'excluído'}.`)
      setRemoving(null)
    } catch (caught) {
      showToast(errorMessage(caught, 'Não foi possível excluir.'))
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-fill text-accent">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setForm({ mode: 'create' })} className="shrink-0">
            Adicionar
          </Button>
        </div>

        {items.length > SEARCH_THRESHOLD ? (
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-fill px-3 py-2 transition-colors focus-within:border-accent/60">
            <Search size={16} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Buscar ${noun}...`}
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
            />
            {query ? (
              <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')} className="text-muted hover:text-ink">
                <X size={15} />
              </button>
            ) : null}
          </label>
        ) : null}

        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
          {items.length > 0 && visible.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">Nada encontrado para "{query}".</p>
          ) : null}
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-muted">
                {f ? 'Nenhuma' : 'Nenhum'} {noun} {f ? 'cadastrada' : 'cadastrado'} ainda.
              </p>
              <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setForm({ mode: 'create' })}>
                Cadastrar {f ? 'a primeira' : 'o primeiro'}
              </Button>
            </div>
          ) : null}
          {visible.map((item) => (
            <div key={item.id} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-fill/50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                {item.description ? <p className="truncate text-xs text-muted">{item.description}</p> : null}
                <p className="text-xs text-muted sm:hidden">{countLabel(item.count)}</p>
              </div>
              <span className="hidden shrink-0 text-xs whitespace-nowrap text-muted tabular-nums sm:inline">
                {countLabel(item.count)}
              </span>
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                <button
                  type="button"
                  title="Editar"
                  aria-label={`Editar ${item.name}`}
                  onClick={() => setForm({ mode: 'edit', item })}
                  className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  title="Excluir"
                  aria-label={`Excluir ${item.name}`}
                  onClick={() => setRemoving(item)}
                  className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Modal
        open={Boolean(form)}
        title={form?.mode === 'edit' ? `Editar ${noun}` : `${f ? 'Nova' : 'Novo'} ${noun}`}
        onClose={closeForm}
      >
        <NamedItemForm
          key={form?.mode === 'edit' ? `edit-${form.item.id}` : 'create'}
          initial={form?.mode === 'edit' ? form.item : null}
          noun={noun}
          article={f ? 'a' : 'o'}
          ofNoun={ofNoun}
          withDescription={withDescription}
          submitLabel={form?.mode === 'edit' ? 'Salvar alterações' : `Cadastrar ${noun}`}
          onCancel={closeForm}
          onSubmit={save}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title={`Excluir ${noun}`}
        confirmLabel="Excluir"
        confirmIcon={<Trash2 size={16} />}
        onCancel={() => setRemoving(null)}
        onConfirm={confirmDelete}
      >
        <p>
          Tem certeza que deseja excluir <strong className="text-ink">{removing?.name}</strong>?{' '}
          {removing ? deleteWarning(removing) : ''}
        </p>
      </ConfirmDialog>
    </Card>
  )
}
