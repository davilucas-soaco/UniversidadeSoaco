import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, ExternalLink, KeyRound, Mail, Send, ShieldCheck, ShieldOff } from 'lucide-react'
import { profileFieldClass } from '@/components/profile/fields'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useFeedback } from '@/context/FeedbackContext'
import { adminApi } from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { EmailSettings } from '@/types'

type FormState = { fromEmail: string; fromName: string; clientId: string; clientSecret: string; refreshToken: string }

const DEFAULT_FROM_NAME = 'Universidade Só Aço'

function formFrom(settings: EmailSettings): FormState {
  return {
    fromEmail: settings.fromEmail,
    fromName: settings.fromName || DEFAULT_FROM_NAME,
    clientId: settings.clientId,
    clientSecret: '',
    refreshToken: '',
  }
}

function StatusPill({ tone, icon, children }: { tone: 'ok' | 'warn' | 'off'; icon: ReactNode; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        tone === 'ok' && 'border-success/40 bg-success/10 text-success',
        tone === 'warn' && 'border-amber-500/40 bg-amber-500/10 text-amber-500',
        tone === 'off' && 'border-line bg-fill text-muted',
      )}
    >
      {icon}
      {children}
    </span>
  )
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  )
}

/** Credencial de envio (Gmail API) e testes do e-mail de "novo curso". */
export function EmailSettingsCard() {
  const { showToast } = useFeedback()
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getEmailSettings()
      setSettings(data.settings)
      setForm(formFrom(data.settings))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar a configuração de e-mail.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const update = (key: keyof FormState, value: string) => setForm((current) => (current ? { ...current, [key]: value } : current))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      const saved = await adminApi.saveEmailSettings({
        fromEmail: form.fromEmail,
        fromName: form.fromName,
        clientId: form.clientId,
        clientSecret: form.clientSecret || undefined,
        refreshToken: form.refreshToken || undefined,
      })
      setSettings(saved)
      setForm(formFrom(saved))
      showToast('Credencial de e-mail salva. Envie um teste para confirmar.')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível salvar a credencial.')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    setTesting(true)
    try {
      const result = await adminApi.sendTestEmail()
      setSettings(result.settings)
      showToast(`E-mail de teste enviado para ${result.sentTo}.`)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível enviar o teste.')
      void load()
    } finally {
      setTesting(false)
    }
  }

  const problem = settings?.credentialBlockSummary ?? settings?.lastError ?? null

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-fill text-accent">
              <Mail size={20} />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">E-mail de notificações</h2>
              <p className="max-w-2xl text-xs text-muted">
                Avisa o colaborador, com um e-mail do Amigaço, sempre que um curso passa a ser destinado a ele. Envio pela
                Gmail API, no mesmo padrão do Gestão Smart.
              </p>
            </div>
          </div>
          {settings ? (
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {!settings.configured ? (
                <StatusPill tone="off" icon={<KeyRound size={12} />}>Credencial não configurada</StatusPill>
              ) : problem ? (
                <StatusPill tone="warn" icon={<CircleAlert size={12} />}>Credencial com erro</StatusPill>
              ) : (
                <StatusPill tone="ok" icon={<CircleCheck size={12} />}>
                  {settings.lastTestedAt ? `Testada em ${formatDate(settings.lastTestedAt)}` : 'Credencial salva'}
                </StatusPill>
              )}
              {settings.sendingEnabled ? (
                <StatusPill tone="ok" icon={<ShieldCheck size={12} />}>Envio automático ligado</StatusPill>
              ) : (
                <StatusPill tone="off" icon={<ShieldOff size={12} />}>Envio automático desligado</StatusPill>
              )}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</p>
        ) : !settings || !form ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <form onSubmit={(event) => void save(event)} className="flex flex-col gap-5" noValidate>
            {!settings.sendingEnabled ? (
              <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
                Nesta máquina os avisos automáticos ficam só no terminal da API (modo de segurança). Na máquina de produção,
                defina <code className="rounded bg-fill px-1 text-ink">NOTIFICACOES_ENVIO_HABILITADO=true</code> no
                backend/.env. O botão “Enviar teste” funciona mesmo assim.
              </p>
            ) : null}
            {problem ? (
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-ink">
                <strong className="text-amber-500">Último erro:</strong> {problem}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="E-mail remetente" hint="Conta Gmail/Workspace autorizada no OAuth.">
                <input
                  value={form.fromEmail}
                  onChange={(event) => update('fromEmail', event.target.value)}
                  placeholder="universidade@soacoindustrial.com"
                  className={profileFieldClass}
                  inputMode="email"
                  autoComplete="off"
                />
              </Field>
              <Field label="Nome do remetente">
                <input
                  value={form.fromName}
                  onChange={(event) => update('fromName', event.target.value)}
                  className={profileFieldClass}
                  autoComplete="off"
                />
              </Field>
              <Field label="Client ID" className="md:col-span-2">
                <input
                  value={form.clientId}
                  onChange={(event) => update('clientId', event.target.value)}
                  placeholder="000000000000-xxxx.apps.googleusercontent.com"
                  className={profileFieldClass}
                  autoComplete="off"
                />
              </Field>
              <Field label="Client Secret" hint={settings.hasClientSecret ? 'Já salvo. Deixe em branco para manter.' : undefined}>
                <input
                  type="password"
                  value={form.clientSecret}
                  onChange={(event) => update('clientSecret', event.target.value)}
                  placeholder={settings.hasClientSecret ? '•••••••• (salvo)' : 'GOCSPX-…'}
                  className={profileFieldClass}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Refresh Token" hint={settings.hasRefreshToken ? 'Já salvo. Deixe em branco para manter.' : undefined}>
                <input
                  type="password"
                  value={form.refreshToken}
                  onChange={(event) => update('refreshToken', event.target.value)}
                  placeholder={settings.hasRefreshToken ? '•••••••• (salvo)' : '1//0…'}
                  className={profileFieldClass}
                  autoComplete="new-password"
                />
              </Field>
            </div>

            <details className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-ink">Como obter as credenciais do Gmail</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-4 leading-relaxed">
                <li>No Google Cloud Console, ative a Gmail API e crie um ID do cliente OAuth do tipo “Aplicativo da Web”.</li>
                <li>
                  Em “URIs de redirecionamento autorizados”, adicione https://developers.google.com/oauthplayground.
                </li>
                <li>
                  No OAuth Playground (engrenagem → “Use your own OAuth credentials”), autorize o escopo
                  https://mail.google.com/ com a conta remetente e troque o código pelo Refresh Token.
                </li>
                <li>Cole aqui o Client ID, o Client Secret e o Refresh Token, salve e envie um teste.</li>
              </ol>
            </details>

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="ghost"
                icon={<ExternalLink size={15} />}
                onClick={() => window.open(adminApi.emailPreviewUrl, '_blank', 'noopener')}
              >
                Ver prévia do e-mail
              </Button>
              <Button
                variant="secondary"
                icon={testing ? <Spinner className="h-4 w-4" /> : <Send size={15} />}
                disabled={!settings.configured || testing}
                onClick={() => void sendTest()}
                title={settings.configured ? 'Envia o e-mail de novo curso para o seu e-mail' : 'Salve a credencial primeiro'}
              >
                Enviar teste para mim
              </Button>
              <Button type="submit" disabled={saving} icon={saving ? <Spinner className="h-4 w-4" /> : undefined}>
                {settings.configured ? 'Salvar alterações' : 'Salvar credencial'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
