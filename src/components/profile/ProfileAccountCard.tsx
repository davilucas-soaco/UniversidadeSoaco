import { useRef, useState, type FormEvent } from 'react'
import { Camera, ImagePlus, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { useFeedback } from '@/context/FeedbackContext'
import { useProfile } from '@/context/ProfileContext'
import { readProfilePhoto } from '@/lib/photo'
import type { ProfileNotifications } from '@/types'
import { profileFieldClass } from './fields'

const notificationItems: { key: keyof ProfileNotifications; label: string; hint: string }[] = [
  { key: 'courses', label: 'Novos cursos', hint: 'Avisos quando um conteúdo for atribuído a você.' },
  { key: 'deadlines', label: 'Prazos e obrigatórios', hint: 'Lembretes de treinamentos com data limite.' },
  { key: 'ranking', label: 'Ranking', hint: 'Atualizações de pontuação e posição.' },
  { key: 'digest', label: 'Resumo por e-mail', hint: 'Um consolidado semanal da sua evolução.' },
]

function passwordError(next: string, confirm: string) {
  if (next.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.'
  if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return 'Use letras e números na nova senha.'
  if (next !== confirm) return 'A confirmação não confere com a nova senha.'
  return null
}

export function ProfileAccountCard() {
  const { profile, updateProfile, setPhoto, setNotification, changePassword } = useProfile()
  const { showToast } = useFeedback()
  const photoRef = useRef<HTMLInputElement>(null)

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

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      setPhoto(await readProfilePhoto(file))
      showToast('Foto de perfil atualizada.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Não foi possível atualizar a foto.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Notificações</h2>
            <span className="text-[11px] font-medium tracking-wider text-muted uppercase">Canais</span>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {notificationItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-muted">{item.hint}</p>
                </div>
                <Switch
                  checked={profile.notifications[item.key]}
                  onChange={(value) => {
                    setNotification(item.key, value)
                    showToast(value ? `${item.label} ativado.` : `${item.label} desativado.`)
                  }}
                  label={item.label}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">Não perturbe</p>
                <p className="text-xs text-muted">Silencia avisos no horário escolhido.</p>
              </div>
              <Switch
                checked={profile.dndEnabled}
                onChange={(value) => updateProfile({ dndEnabled: value })}
                label="Não perturbe"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted">Das</span>
                <input
                  type="time"
                  value={profile.dndFrom}
                  onChange={(event) => updateProfile({ dndFrom: event.target.value })}
                  className={profileFieldClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted">Até</span>
                <input
                  type="time"
                  value={profile.dndTo}
                  onChange={(event) => updateProfile({ dndTo: event.target.value })}
                  className={profileFieldClass}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

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

          <form onSubmit={(event) => void savePassword(event)} className="mb-6">
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

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
              <Camera size={15} className="text-muted" />
              Foto de perfil
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" icon={<ImagePlus size={15} />} onClick={() => photoRef.current?.click()}>
                Enviar foto
              </Button>
              {profile.photoUrl ? (
                <Button variant="ghost" onClick={() => { setPhoto(null); showToast('Foto removida.') }}>
                  Remover
                </Button>
              ) : null}
              <input
                ref={photoRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  void onPickPhoto(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">JPG, PNG ou WEBP até 4 MB. A imagem é recortada em quadrado.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
