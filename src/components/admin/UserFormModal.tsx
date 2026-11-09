import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { UserInput } from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import type { AdminUser, ClassGroup, Sector } from '@/types'

type UserFormModalProps = {
  open: boolean
  /** Usuário em edição; ausente = cadastro novo. */
  user: AdminUser | null
  sectors: Sector[]
  classes: ClassGroup[]
  onClose: () => void
  onSubmit: (input: UserInput) => Promise<void>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="text-[11px] leading-4 text-muted">{hint}</span> : null}
    </label>
  )
}

function UserForm({ user, sectors, classes, onClose, onSubmit }: Omit<UserFormModalProps, 'open'>) {
  const editing = Boolean(user)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [sectorId, setSectorId] = useState<number | null>(user?.sectorId ?? null)
  const [classIds, setClassIds] = useState<number[]>(user?.classIds ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleClass = (id: number) =>
    setClassIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) return setError('Informe o nome do colaborador.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Informe um e-mail de login válido.')
    if (!editing && password.length < 8) return setError('A senha inicial precisa ter pelo menos 8 caracteres.')
    if (editing && password && password.length < 8) return setError('A nova senha precisa ter pelo menos 8 caracteres.')

    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password || undefined,
        sectorId,
        classIds,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4" noValidate>
      <Field label="Nome completo">
        <input value={name} onChange={(event) => setName(event.target.value)} className={profileFieldClass} autoFocus />
      </Field>
      <Field label="E-mail de login">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@soacoindustrial.com"
          className={profileFieldClass}
        />
      </Field>
      <Field
        label={editing ? 'Redefinir senha (opcional)' : 'Senha inicial'}
        hint={
          editing
            ? 'Preencha só se quiser trocar a senha. O colaborador terá que criar uma nova no próximo acesso.'
            : 'O colaborador será obrigado a trocar esta senha no primeiro acesso.'
        }
      >
        <input
          type="text"
          autoComplete="off"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo de 8 caracteres"
          className={profileFieldClass}
        />
      </Field>
      <Field label="Setor">
        <select
          value={sectorId ?? ''}
          onChange={(event) => setSectorId(event.target.value ? Number(event.target.value) : null)}
          className={profileFieldClass}
        >
          <option value="">Sem setor</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Classes</span>
        {classes.length === 0 ? (
          <p className="text-xs text-muted">
            Nenhuma classe cadastrada.{' '}
            <Link to="/admin/configuracoes" onClick={onClose} className="font-semibold text-accent hover:underline">
              Cadastrar em Configurações
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map((item) => {
              const selected = classIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleClass(item.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    selected
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-line bg-surface text-muted hover:border-accent/40 hover:text-ink',
                  )}
                >
                  {selected ? <Check size={13} /> : null}
                  {item.name}
                </button>
              )
            })}
          </div>
        )}
        <span className="text-[11px] text-muted">O colaborador pode participar de mais de uma classe.</span>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} icon={saving ? <Spinner className="h-4 w-4" /> : undefined}>
          {editing ? 'Salvar alterações' : 'Cadastrar colaborador'}
        </Button>
      </div>
    </form>
  )
}

export function UserFormModal({ open, user, ...props }: UserFormModalProps) {
  return (
    <Modal open={open} title={user ? 'Editar colaborador' : 'Novo colaborador'} onClose={props.onClose}>
      <UserForm key={user?.id ?? 'novo'} user={user} {...props} />
    </Modal>
  )
}
