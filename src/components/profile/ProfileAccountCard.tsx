import { useState, type FormEvent } from 'react'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useFeedback } from '@/context/FeedbackContext'
import { useProfile } from '@/context/ProfileContext'
import { profileFieldClass } from './fields'

function passwordError(next: string, confirm: string) {
  if (next.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.'
  if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return 'Use letras e números na nova senha.'
  if (next !== confirm) return 'A confirmação não confere com a nova senha.'
  return null
}

export function ProfileAccountCard() {
  const { profile, updateProfile, changePassword } = useProfile()
  const { showToast } = useFeedback()

  const [emailDraft, setEmailDraft] = useState<string | null>(null)
  const email = emailDraft ?? profile.email
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const saveEmail = (event: FormEvent) => {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showToast('Informe um e-mail válido.')
      return
    }
    setSavingEmail(true)
    updateProfile({ email: value })
    setEmailDraft(null)
    setSavingEmail(false)
    showToast('E-mail atualizado.')
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    const error = passwordError(nextPassword, confirmPassword)
    if (error) {
      showToast(error)
      return
    }
    if (!currentPassword) {
      showToast('Informe a senha atual.')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, nextPassword)
      setCurrentPassword('')
      setNextPassword('')
      setConfirmPassword('')
      showToast('Senha atualizada.')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível alterar a senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <h2 className="font-display text-lg font-semibold text-ink">Conta e segurança</h2>
          </div>

          <form onSubmit={saveEmail} className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
              <Mail size={15} className="text-muted" />
              E-mail de acesso
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmailDraft(event.target.value)}
                className={profileFieldClass}
              />
              <Button type="submit" variant="secondary" disabled={savingEmail || email.trim().toLowerCase() === profile.email}>
                Salvar
              </Button>
            </div>
          </form>

          <form onSubmit={(event) => void savePassword(event)}>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
              <KeyRound size={15} className="text-muted" />
              Trocar senha
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={profileFieldClass}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Nova senha"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                className={profileFieldClass}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={profileFieldClass}
              />
              <Button type="submit" disabled={savingPassword} className="self-start">
                Atualizar senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
