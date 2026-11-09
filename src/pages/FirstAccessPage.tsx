import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
import { AuthError, AuthShell, authFieldClass } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSessionUser, useAuth } from '@/context/AuthContext'

function passwordError(current: string, next: string, confirm: string) {
  if (!current) return 'Informe a senha inicial recebida.'
  if (next.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.'
  if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return 'Use letras e números na nova senha.'
  if (next === current) return 'A nova senha precisa ser diferente da senha inicial.'
  if (next !== confirm) return 'A confirmação não confere com a nova senha.'
  return null
}

/** Troca obrigatória da senha inicial definida pelo administrador. */
export function FirstAccessPage() {
  const user = useSessionUser()
  const { changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user.mustChangePassword) return <Navigate to="/" replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const problem = passwordError(current, next, confirm)
    if (problem) {
      setError(problem)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await changePassword(current, next)
      navigate('/', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível alterar a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={`Bem-vindo, ${user.firstName}!`}
      subtitle="Este é o seu primeiro acesso. Crie uma senha pessoal para continuar."
    >
      <form onSubmit={(event) => void onSubmit(event)} className="mt-8 flex flex-col gap-4" noValidate>
        <label className="relative block">
          <span className="sr-only">Senha inicial</span>
          <KeyRound size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Senha inicial"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            className={authFieldClass}
            autoFocus
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Nova senha</span>
          <LockKeyhole size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Nova senha (mín. 8, letras e números)"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            className={authFieldClass}
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Confirmar nova senha</span>
          <LockKeyhole size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={authFieldClass}
          />
        </label>

        <AuthError message={error} />

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          icon={submitting ? <Spinner className="h-4 w-4" /> : <ShieldCheck size={18} />}
          className="mt-2 w-full justify-center"
        >
          Salvar e entrar
        </Button>
        <button
          type="button"
          onClick={() => void logout().then(() => navigate('/login', { replace: true }))}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
        >
          <LogOut size={14} /> Sair
        </button>
      </form>
    </AuthShell>
  )
}
