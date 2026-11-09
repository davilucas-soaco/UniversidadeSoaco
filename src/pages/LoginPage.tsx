import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, LogIn, Mail } from 'lucide-react'
import { AuthError, AuthShell, authFieldClass } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { status, error: sessionError, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'authenticated') return <Navigate to={from} replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Acesse sua conta" subtitle="Entre com o e-mail corporativo e a sua senha.">
      <form onSubmit={(event) => void onSubmit(event)} className="mt-8 flex flex-col gap-4" noValidate>
        <label className="relative block">
          <span className="sr-only">E-mail</span>
          <Mail size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            type="email"
            autoComplete="username"
            placeholder="nome@soaco.com.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authFieldClass}
            autoFocus
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Senha</span>
          <KeyRound size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={authFieldClass}
          />
        </label>

        <AuthError message={error ?? sessionError} />

        <Button
          type="submit"
          size="lg"
          disabled={submitting || status === 'loading'}
          icon={submitting ? <Spinner className="h-4 w-4" /> : <LogIn size={18} />}
          className="mt-2 w-full justify-center"
        >
          Entrar
        </Button>
      </form>
    </AuthShell>
  )
}
